// 브라우저 저장. 저장소가 없거나 막혀 있어도 게임은 돌아야 하므로 모든 접근을 try/catch로 감싼다.
import { IDLE_RESET } from './autonomy'
import { newGame, settle, type GameState } from './game'
import { OWN_WORDS } from './offers'
import { placement, type Furniture } from './room'
import { addGift } from './items'
import type { GameContent } from './types'

export const SAVE_KEY = 'twenty-seven/save'
export const SAVE_VERSION = 2

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function serialize(s: GameState): string {
  // 걷던 길·자율 동작·이웃 위치는 저장하지 않는다 (doze의 Infinity는 JSON이 못 담는다)
  return JSON.stringify({ ...s, player: { ...s.player, path: [] }, target: null, idle: IDLE_RESET, npcs: {} })
}

const isNumArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'number')
const isStrArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)

/** 버전 1(하루 세로 조각) 저장을 버전 2로: 진행(모은 조각·순서·쓴 장·일지·날짜)만 옮긴다 */
function migrateV1(o: Record<string, unknown>, content: GameContent): GameState | null {
  const clock = o.clock as { day?: unknown; minute?: unknown } | undefined
  if (typeof clock?.day !== 'number' || typeof clock?.minute !== 'number') return null
  if (!isStrArray(o.collected) || !isNumArray(o.completed) || !isObj(o.arrangement) || !Array.isArray(o.journal)) return null
  const fresh = newGame(content)
  return {
    ...fresh,
    clock: { day: clock.day, minute: clock.minute },
    collected: o.collected as string[],
    completed: o.completed as number[],
    arrangement: o.arrangement as GameState['arrangement'],
    journal: o.journal as GameState['journal'],
    todayHeard: isStrArray(o.todayHeard) ? (o.todayHeard as string[]) : [],
    offers: isObj(o.offers) ? (o.offers as Record<string, string>) : fresh.offers,
    scenes: [],
  }
}

/**
 * 콘텐츠가 바뀐 뒤의 저장도 안전하게: 없는 조각 id를 걸러 내고, 책상 위 순서를 모은 조각과 맞춘다.
 * (없는 id가 남으면 도감·일지에서 오류가 나고, 책상 순서가 영원히 "틀림"이 될 수 있다)
 */
export function sanitize(s: GameState, content: GameContent): GameState {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  const done = new Set(s.completed)
  // 이미 끝낸 장에 (콘텐츠가 바뀌어) 새 조각이 생겼다면 모은 것으로 친다 — 지난 장의 조각은 다시 제안되지 않으므로
  const finishedExtra = content.pieces.filter((p) => done.has(p.chapter)).map((p) => p.id)
  const collected = [...new Set([...OWN_WORDS, ...s.collected, ...finishedExtra])].filter((id) => known.has(id))
  const arrangement: Record<number, string[]> = {}
  for (const id of collected) {
    const ch = known.get(id)!.chapter
    if (s.completed.includes(ch)) continue
    arrangement[ch] ??= []
  }
  for (const ch of Object.keys(arrangement).map(Number)) {
    const kept = (s.arrangement[ch] ?? []).filter((id) => collected.includes(id) && known.get(id)!.chapter === ch)
    const missing = collected.filter((id) => known.get(id)!.chapter === ch && !kept.includes(id)).sort()
    // 빠진 조각은 끝이 아니라 본문 순서의 자리에 끼운다 (id 순서 = 본문 순서)
    const list = [...new Set(kept)]
    for (const m of missing) {
      const at = list.findIndex((id) => id > m)
      if (at < 0) list.push(m)
      else list.splice(at, 0, m)
    }
    arrangement[ch] = list
  }
  const offers = Object.fromEntries(Object.entries(s.offers).filter(([, id]) => known.has(id) && !collected.includes(id)))
  const myLines = Object.fromEntries(Object.entries(s.myLines ?? {}).filter(([id]) => known.has(id)))
  // 2026-09-26 이전 저장은 hearts에 하트 수(0~10)가 들어 있다 → 점수로 바꾼다
  const hearts = s.flags?.heartPoints ? s.hearts : Object.fromEntries(Object.entries(s.hearts ?? {}).map(([k, v]) => [k, Math.min(100, v * 10)]))
  // 가구 규칙이 바뀐 뒤의 저장: 지금 규칙으로 놓을 수 없는 것은 가방으로 (길이 막히지 않게)
  const room: Furniture[] = []
  let inv = s.inv
  for (const f of s.room ?? []) {
    const ok = placement(room, f.item, f)
    if (ok && ok.x === f.x && ok.y === f.y && !!ok.on === !!f.on) room.push(ok)
    else inv = addGift(inv, { [f.item]: 1 })
  }
  return {
    ...s,
    room,
    inv,
    hearts,
    flags: { ...s.flags, heartPoints: 1 },
    collected,
    arrangement,
    offers,
    myLines,
    completed: [...new Set(s.completed)].filter((c) => content.pieces.some((p) => p.chapter === c)),
    todayHeard: s.todayHeard.filter((id) => known.has(id)),
    journal: s.journal.map((e) => ({ ...e, heard: (e.heard ?? []).filter((id) => known.has(id)) })),
  }
}

export function deserialize(raw: string | null, content: GameContent): GameState | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw)
    if (!isObj(o)) return null
    if (o.version === 1) {
      const m = migrateV1(o, content)
      return m ? settle(sanitize(m, content), content) : null
    }
    if (o.version !== SAVE_VERSION) return null
    const ok =
      typeof o.clock?.day === 'number' &&
      typeof o.clock?.minute === 'number' &&
      typeof o.player?.x === 'number' &&
      typeof o.player?.y === 'number' &&
      isStrArray(o.collected) &&
      isStrArray(o.todayHeard) &&
      isNumArray(o.completed) &&
      Array.isArray(o.journal) &&
      isObj(o.offers) &&
      isObj(o.arrangement) &&
      isObj(o.inv) &&
      isObj(o.needs) &&
      isObj(o.hearts) &&
      isObj(o.flags) &&
      Array.isArray(o.scenes) &&
      Array.isArray(o.room)
    if (!ok) return null
    // 나중에 더한 칸이 빠진 저장도 받아 준다
    const fresh = newGame(content)
    return settle(sanitize({ ...fresh, ...o, version: SAVE_VERSION } as GameState, content), content)
  } catch {
    return null
  }
}

export function saveGame(s: GameState, store: Storage | null | undefined = storage()): boolean {
  try {
    if (!store) return false
    store.setItem(SAVE_KEY, serialize(s))
    return true
  } catch {
    return false
  }
}

export function loadGame(content: GameContent, store: Storage | null | undefined = storage()): GameState | null {
  try {
    return deserialize(store?.getItem(SAVE_KEY) ?? null, content)
  } catch {
    return null
  }
}
