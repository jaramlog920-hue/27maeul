// 브라우저 저장. 저장소가 없거나 막혀 있어도 게임은 돌아야 하므로 모든 접근을 try/catch로 감싼다.
import { IDLE_RESET } from './autonomy'
import { emptyProgress, type Progress } from './books'
import { newGame, settle, type GameState } from './game'
import { placement, type Furniture } from './room'
import { addGift } from './items'
import { BOOKS, type GameContent } from './types'

export const SAVE_KEY = 'twenty-seven/save'
export const SAVE_VERSION = 1

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

const isStrArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * 콘텐츠가 바뀐 뒤의 저장도 안전하게: 없는 조각 id를 걸러 내고, 책상 위 순서를 모은 조각과 맞춘다.
 * (없는 id가 남으면 도감·일지에서 오류가 나고, 책상 순서가 영원히 "틀림"이 될 수 있다)
 */
export function sanitize(s: GameState, content: GameContent): GameState {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  const progress: Progress = emptyProgress()
  const extra: string[] = []
  for (const b of BOOKS) {
    const chapters = new Set(content.pieces.filter((p) => p.book === b).map((p) => p.chapter))
    progress[b].completed = [...new Set(s.progress?.[b]?.completed ?? [])].filter((c) => chapters.has(c))
    // 이미 끝낸 장에 (콘텐츠가 바뀌어) 새 조각이 생겼다면 모은 것으로 친다
    extra.push(...content.pieces.filter((p) => p.book === b && progress[b].completed.includes(p.chapter)).map((p) => p.id))
  }
  const collected = [...new Set([...s.collected, ...extra])].filter((id) => known.has(id))
  for (const b of BOOKS) {
    const old = s.progress?.[b]?.arrangement ?? {}
    const mine = collected.filter((id) => known.get(id)!.book === b)
    const chapters = [...new Set(mine.map((id) => known.get(id)!.chapter))].filter((c) => !progress[b].completed.includes(c))
    for (const ch of chapters) {
      const kept = [...new Set((old[ch] ?? []).filter((id) => mine.includes(id) && known.get(id)!.chapter === ch))]
      const missing = mine.filter((id) => known.get(id)!.chapter === ch && !kept.includes(id)).sort()
      // 빠진 조각은 끝이 아니라 본문 순서의 자리에 끼운다 (id 순서 = 본문 순서)
      const list = [...kept]
      for (const m of missing) {
        const at = list.findIndex((id) => id > m)
        if (at < 0) list.push(m)
        else list.splice(at, 0, m)
      }
      progress[b].arrangement[ch] = list
    }
  }
  const offers = Object.fromEntries(Object.entries(s.offers).filter(([, id]) => known.has(id) && !collected.includes(id)))
  const myLines = Object.fromEntries(Object.entries(s.myLines ?? {}).filter(([id]) => known.has(id)))
  // 가구 규칙이 바뀐 뒤의 저장: 지금 규칙으로 놓을 수 없는 것은 가방으로 (길이 막히지 않게)
  const room: Furniture[] = []
  let inv = s.inv
  for (const f of s.room ?? []) {
    const ok = placement(room, f.item, f)
    if (ok && ok.x === f.x && ok.y === f.y && !!ok.on === !!f.on) room.push(ok)
    else inv = addGift(inv, { [f.item]: 1 })
  }
  const activeBook = s.activeBook && content.pieces.some((p) => p.book === s.activeBook) ? s.activeBook : null
  return {
    ...s,
    room,
    inv,
    collected,
    progress,
    activeBook,
    offers,
    myLines,
    todayHeard: s.todayHeard.filter((id) => known.has(id)),
    journal: s.journal.map((e) => ({ ...e, heard: (e.heard ?? []).filter((id) => known.has(id)) })),
  }
}

export function deserialize(raw: string | null, content: GameContent): GameState | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw)
    if (!isObj(o) || o.version !== SAVE_VERSION) return null
    const ok =
      typeof o.clock?.day === 'number' &&
      typeof o.clock?.minute === 'number' &&
      typeof o.player?.x === 'number' &&
      typeof o.player?.y === 'number' &&
      isStrArray(o.collected) &&
      isStrArray(o.todayHeard) &&
      Array.isArray(o.journal) &&
      isObj(o.offers) &&
      isObj(o.progress) &&
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
