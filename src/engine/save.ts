import { sanitizeYard } from './yard'
import { sanitizeGearOff } from './gear'
import { sanitizeTips } from './tip-letters'
import { sanitizeHomeWalls, setHomeWalls } from './home-walls'
import { CLUB_PLACES, sanitizeClubs, sanitizeClubSessions } from './clubs'
import { sanitizeVillage } from './projects'
import { sanitizeFests } from './fest'
import { sanitizeCooking } from './cooking'
import { sanitizeGen } from './gen'
import { repairHouseholdHomes } from './gen-settle'
import { sanitizeSpaces } from './spaces'
import { sanitizePlans } from './plans'
import { sanitizeCompanion } from './companion'
import { sanitizeWorkDay } from './work-day'
import { sanitizeStall, sanitizeStallLook } from './stall'
import { sanitizeSkills, sanitizeSkillLesson } from './skills'
// 브라우저 저장. 저장소가 없거나 막혀 있어도 게임은 돌아야 하므로 모든 접근을 try/catch로 감싼다.
import { sanitizeLife } from './people'
import { sanitizeNotebook } from './notebook'
import { repairSpouseInheritance, sanitizeChild } from './child'
import { sanitizeSiblings } from './siblings'
import { sanitizeRomance } from './romance'
import { sanitizeHeartDay } from './hearts'
import { sanitizeStats } from './stats'
import { sanitizeCopy, sanitizeCopyStats } from './copying'
import { backfillGodRecords, sanitizeGodRecords } from './god-records'
import { sanitizeBindings, sanitizeBookDesigns, withBookDesigns } from './binding'
import { isFinished, sanitizeHomeShelf } from './finished-books'
import { sanitizePieceLog } from './fragments'
import { migratePieceLayout } from './piece-migration'
import { GIFT_ITEMS } from './collection-gifts'
import { GUESTS } from './newland-life'
import { sanitizeDayLog } from './daybook'
import { IDLE_RESET } from './autonomy'
import { bookDone, bookRoomOpen, chaptersOf, emptyProgress, sanitizeOtProgress, type Progress } from './books'
import { isOtBook } from './ot-books'
import { newGame, settle, type Farewell, type GameState } from './game'
import { GARDEN_TILES } from './garden'
import type { Avatar } from './avatar'
import { cardsForChapters, placeNewCards } from './journey'
import { initialHomeFurniture, isFacing, refitRoom, upgradeAdultBed, footprint } from './room'
import { HOME_ENTRY, HOME_FRONT, PLACES, setHomeLevel, setHomeFurniture, setSpouseRoom, walkableOn } from './world'
import { MAP_IDS, isMapId, setActiveMap, type MapId } from './maps'
import { sanitizeOtCollected } from './ot-pieces'
import { entryFront, roomSlotAt, setArchiveRooms, setNewlandOverlay, setNewlandRevealed, setNewlandWarps } from './newland'
import { overlayFor, sanitizeNewlandBuild, warpsFor } from './newland-build'
import { homeAtSlot, sanitizeRooms } from './newland-rooms'
import { BOOKS, type Book, type GameContent, type ItemId } from './types'
import { commitStorageBatch, flushGameStorage, gameStorage, reportGameStorageError, withStorageBatch } from './game-storage'

export const SAVE_KEY = 'twenty-seven/save'
export const SAVE_VERSION = 1

function storage(): Storage | null { return gameStorage() }

/** 제거된 물 긷는 아이 글자 공부의 옛 저장 흔적만 정리한다. */
function retireWaterChildLessons(s:GameState):GameState {
  const removed=new Set(['childAsks','firstLetter','childLearned'])
  const flags={...s.flags}
  for(const key of ['childAsked','childLetters','taughtDay'])delete flags[key]
  return {...s,flags,scenes:(Array.isArray(s.scenes)?s.scenes:[]).filter(id=>!removed.has(id)),
    album:(Array.isArray(s.album)?s.album:[]).filter(a=>!removed.has(a?.id)),
    todayNotes:(Array.isArray(s.todayNotes)?s.todayNotes:[]).filter(id=>!removed.has(id)),
    journal:(Array.isArray(s.journal)?s.journal:[]).map(entry=>({...entry,notes:Array.isArray(entry?.notes)?entry.notes.filter(id=>!removed.has(id)):entry?.notes}))}
}

export function serialize(s: GameState): string {
  s = retireWaterChildLessons(s)
  // 걷던 길·자율 동작·이웃 위치는 저장하지 않는다 (doze의 Infinity는 JSON이 못 담는다)
  // 가구 쓰는 동작(act)도 그림만이라 저장하지 않는다
  return JSON.stringify({ ...s, player: { ...s.player, path: [] }, target: null, idle: IDLE_RESET, act: undefined, furnitureAuto: undefined, npcs: {}, emotes: undefined })
}

/**
 * 두 지도 (계획 20 작업 3): 열리지 않은 새 터거나 모르는 값이면 첫 마을로 (위치는 첫 마을에서 마지막으로 서 있던 칸, 없으면 집 앞),
 * mapAt의 칸이 그 지도에서 걸을 수 없거나 범위 밖이면 그 지도의 입구 앞으로 — 지워진 건물·잘못된 좌표에서 시작하지 않는다.
 * 옛 저장(map 없음)은 그대로 첫 마을
 */
function sanitizeMaps(s: GameState): Pick<GameState, 'player' | 'map' | 'mapAt'> {
  // 땅이 드러나기 전 저장은 드러나지 않은 칸 기준으로 위치를 살핀다 (계획 20 작업 4)
  setNewlandRevealed(!!s.flags.newlandRevealed)
  setNewlandOverlay(overlayFor(s.newland))
  setNewlandWarps(warpsFor(s.newland))
  setArchiveRooms(s.flags.otExpand ?? 0)
  const raw = s as unknown as { map?: unknown; mapAt?: unknown }
  const valid = (id: MapId, t: unknown): t is { x: number; y: number } =>
    isObj(t) && Number.isInteger((t as { x: unknown }).x) && Number.isInteger((t as { y: unknown }).y) && walkableOn(id, t as { x: number; y: number })
  const rawAt: Record<string, unknown> = isObj(raw.mapAt) ? (raw.mapAt as Record<string, unknown>) : {}
  const mapAt: Partial<Record<MapId, { x: number; y: number }>> = {}
  for (const id of MAP_IDS) {
    const t = rawAt[id]
    if (t === undefined) continue
    mapAt[id] = valid(id, t) ? { x: (t as { x: number }).x, y: (t as { y: number }).y } : entryFront(id)
  }
  const open = !!s.flags.newlandGift
  const wantsNewland = raw.map === 'newland'
  const map: MapId | undefined = wantsNewland && open ? 'newland' : isMapId(raw.map) ? 'village' : undefined
  let player = s.player
  if (map === 'newland') {
    const here = { x: Math.round(player.x), y: Math.round(player.y) }
    // 주인 없는 방 칸(지워진 건물의 방)에서 시작하지 않는다
    const orphanRoom = (() => { const i = roomSlotAt(here); return i >= 0 && !homeAtSlot(s, i) })()
    if (orphanRoom || !valid('newland', here)) {
      const at = entryFront('newland')
      player = { ...player, x: at.x, y: at.y, path: [] }
    }
  } else if (wantsNewland) {
    // 열리지 않은 새 터 저장 — 위치는 새 터의 칸이니 첫 마을 자리로 옮긴다
    const at = valid('village', rawAt.village) ? (rawAt.village as { x: number; y: number }) : HOME_FRONT
    player = { ...player, x: at.x, y: at.y, path: [] }
  }
  return { player, ...(map ? { map } : {}), ...(Object.keys(mapAt).length ? { mapAt } : {}) }
}

const isStrArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
/** 이사 편지 모양 (2026-10-07) */
const okFarewell = (f: unknown): f is Farewell => {
  if (!isObj(f)) return false
  const o = f as Record<string, unknown>
  return typeof o.npc === 'string' && Number.isInteger(o.day) && Number.isInteger(o.letter) && isObj(o.gift) && (o.pieceId === undefined || typeof o.pieceId === 'string')
}

/**
 * 콘텐츠가 바뀐 뒤의 저장도 안전하게: 없는 조각 id를 걸러 내고, 책상 위 순서를 모은 조각과 맞춘다.
 * (없는 id가 남으면 도감·일지에서 오류가 나고, 책상 순서가 영원히 "틀림"이 될 수 있다)
 */
/**
 * 모양 맞추기 (2026-10-18 감사 M-19·M-20·L-1·L-6·L-59·L-61): 가져온 파일·깨진 저장의 값이 아래 정리와 게임 루프를
 * 멈추지 않게, 수는 유한한 수로, 목록은 글자 목록으로 먼저 맞춘다. 게임이 쓴 정상 저장은 그대로 지나간다.
 * 무한대(1e999)는 JSON에 null로 써지므로 남겨 두면 다음 불러오기에서 칸을 못 연다 — 여기서 걸러 낸다
 */
function normalizeShapes(s: GameState): GameState {
  const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  const strs = <T extends string>(v: unknown): T[] => (Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as T[]) : [])
  const nums = (v: unknown, lo = -Infinity, hi = Infinity) =>
    Object.fromEntries(Object.entries(isObj(v) ? (v as Record<string, unknown>) : {}).filter((e): e is [string, number] => fin(e[1])).map(([k, n]) => [k, Math.max(lo, Math.min(hi, n))]))
  const needs = isObj(s.needs) ? (s.needs as unknown as Record<string, unknown>) : {}
  const need = (k: string) => (fin(needs[k]) ? Math.max(0, Math.min(100, needs[k] as number)) : 0)
  return {
    ...s,
    coins: fin(s.coins) ? Math.max(0, Math.floor(s.coins)) : 0,
    clock: { ...s.clock, day: Math.max(1, Math.floor(s.clock.day)), minute: Math.max(0, s.clock.minute) },
    hearts: nums(s.hearts, 0, 100),
    flags: nums(s.flags),
    needs: { ...(needs as object), hunger: need('hunger'), fatigue: need('fatigue'), cold: need('cold'), heat: need('heat') } as GameState['needs'],
    scenes: strs(s.scenes),
    achieved: Array.isArray(s.achieved) ? s.achieved.filter((a) => isObj(a) && typeof a.id === 'string' && fin(a.day)) : [],
    gifted: strs(s.gifted),
    giftsGot: strs(s.giftsGot),
    recipesKnown: strs(s.recipesKnown),
    helped: strs(s.helped),
    talked: strs(s.talked),
    listened: strs(s.listened),
    todayNotes: strs(s.todayNotes),
    todayHeard: strs(s.todayHeard),
    rereads: strs(s.rereads),
    collected: strs(s.collected),
    journal: Array.isArray(s.journal) ? s.journal.filter(isObj) : [],
    room: Array.isArray(s.room) ? s.room.filter((f) => isObj(f) && typeof f.item === 'string' && fin(f.x) && fin(f.y)) : [],
  }
}

export function sanitize(s: GameState, content: GameContent): GameState {
  s = retireWaterChildLessons(migratePieceLayout(normalizeShapes(s), content))
  // 아래 정리들은 모두 첫 마을 지도로 한다 (새 터로 맞추는 것은 불러온 뒤 settle의 syncHome)
  setActiveMap('village')
  // 제거한 설비의 주문·장면은 옛 저장에서도 다시 등장하지 않는다.
  const canceledCosts: Record<string, readonly number[]> = { desk: [0, 80, 300], lamp: [0, 60, 250], shelf: [0, 200, 500], inkStand: [0, 120] }
  let refundedCoins = 0
  const refundedInv = { ...s.inv }
  for (const [line, costs] of Object.entries(canceledCosts)) {
    const tier = s.flags?.[`fixOrder:${line}`]
    if (!Number.isInteger(tier) || !costs[tier]) continue
    refundedCoins += costs[tier]
    if (tier === 2 && ['desk','lamp','shelf'].includes(line)) refundedInv.bronzeOrnament = (refundedInv.bronzeOrnament ?? 0) + 1
    if (tier === 2 && line === 'shelf') refundedInv.purpleCloth = (refundedInv.purpleCloth ?? 0) + 1
  }
  const retiredFlags = Object.fromEntries(Object.entries(s.flags ?? {}).filter(([k]) => !k.startsWith('fix:') && !k.startsWith('fixOrder:')))
  s = { ...s, coins: s.coins + refundedCoins, inv: refundedInv, flags: retiredFlags, scenes: (s.scenes ?? []).filter(id => !id.startsWith('fixed:')),
    achieved: (s.achieved ?? []).filter(a => a.id !== 'fixture') }
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  const progress: Progress = emptyProgress()
  for (const b of BOOKS) {
    const chapters = new Set(chaptersOf(b, content))
    const done = s.progress?.[b]?.completed
    progress[b].completed = [...new Set(Array.isArray(done) ? done : [])].filter((c) => chapters.has(c))
  }
  // 필사 (계획 14): 옛 저장(칸이 없던 때 — deserialize가 null로 넘긴다)은 이미 마친 장을 "예전에 엮은 장"으로 남긴다
  // 구약 (계획 20 작업 5): 옛 저장·구약을 안 쓴 저장은 없다 — 새 칸은 모두 선택 필드, 없으면 빈 진행으로 읽는다
  const otProgress = sanitizeOtProgress(s.otProgress)
  const rawCopy = sanitizeCopy(s.copy, progress, otProgress)
  // 구약 책은 새 터를 받은 뒤에만 고른다 — 받기 전 저장에 구약 책이 골라져 있으면 비운다 (자리·진행은 그대로)
  const copy = isOtBook(rawCopy.book) && !s.flags?.newlandGift ? { ...rawCopy, book: null } : rawCopy
  // 예전에 엮은 장(조각을 모아 엮던 때)에 (콘텐츠가 바뀌어) 새 조각이 생겼다면 모은 것으로 친다.
  // 필사로 마친 장은 조각과 상관없다 — 말씀 조각은 필사에서 떼어 냈다 (계획 14 작업 5)
  const extra: string[] = []
  for (const b of BOOKS) extra.push(...content.pieces.filter((p) => p.book === b && (copy.legacy[b] ?? []).includes(p.chapter)).map((p) => p.id))
  const collected = [...new Set([...s.collected, ...extra])].filter((id) => known.has(id))
  for (const b of BOOKS) {
    const old = s.progress?.[b]?.arrangement ?? {}
    const mine = collected.filter((id) => known.get(id)!.book === b)
    const chapters = [...new Set(mine.map((id) => known.get(id)!.chapter))].filter((c) => !progress[b].completed.includes(c))
    for (const ch of chapters) {
      const kept = [...new Set((Array.isArray(old[ch]) ? old[ch] : []).filter((id) => mine.includes(id) && known.get(id)!.chapter === ch))]
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
  // 조각 키(옛 저장 그대로)와 책 키('book:mk')만 남긴다
  const bookKeys = new Set(BOOKS.map((b) => `book:${b}`))
  // 필사 길잡이의 한 줄은 'guide:mt:1' (책·장)
  // 구약 책 길잡이의 한 줄도 남긴다 (2026-10-08 버그: 불러오면 지워졌다)
  const guideKey = (id: string) => { const m = /^guide:([a-z0-9]+):(\d+)$/.exec(id); return !!m && ((BOOKS as readonly string[]).includes(m[1]) || isOtBook(m[1])) }
  const myLines = Object.fromEntries(Object.entries(isObj(s.myLines) ? s.myLines : {}).filter(([id, t]) => (known.has(id) || bookKeys.has(id) || guideKey(id)) && typeof t === 'string'))
  // 집 단계 (옛 저장은 0 — 넓히기 전). 부탁해 둔 단계는 바로 다음 단계일 때만 남긴다
  let homeLevel: GameState['homeLevel'] = s.homeLevel === 1 || s.homeLevel === 2 || s.homeLevel === 3 ? s.homeLevel : 0
  // 지도(모듈 전역 집 단계)를 이 저장에 맞춘 뒤 가구를 맞춘다 — newGame이 0으로 되돌려 둔 상태라서
  const romance = sanitizeRomance(s.romance)
  if (romance.stage === 'dating' && romance.since === null) romance.since = s.clock.day
  setHomeLevel(homeLevel)
  // 세우거나 허문 집 안 벽 (2026-10-12): 넓힌 집에서만, 가구를 맞추기 전에 지도에 덧씌운다
  const homeWalls = homeLevel >= 1 ? sanitizeHomeWalls(s.homeWalls) : undefined
  setHomeWalls(homeWalls)
  setSpouseRoom(romance.stage === 'married' ? romance.partner : null)
  const flags = { ...s.flags }
  // 기존 저장의 가구·관계·이용 권한은 유지하고 과거 성장 선물은 다시 지급하지 않는다.
  if (!flags.growthVersion) {
    flags.growthVersion = 1
    flags.growthLegacy = 1
  }
  if (flags.homeOrder !== undefined && (flags.homeOrder !== homeLevel + 1 || flags.homeOrder > 3)) delete flags.homeOrder
  // 지금 집 배치(homeLayout 2) 전 저장: 옮기지 않고 붙박이만 새로 놓고 집 안 문 앞에서 시작한다 (옛 가구는 아래 refitRoom이 가방으로)
  const fresh = !flags.homeLayout
  let player = fresh ? { ...s.player, ...HOME_ENTRY, path: [] } : s.player
  const migrated = upgradeAdultBed(fresh ? [...initialHomeFurniture(), ...(s.room ?? [])] : (s.room ?? []))
  flags.homeLayout = 2
  // 가구 규칙이 바뀐 뒤의 저장: 지금 규칙으로 놓을 수 없는 것은 가방으로 (길이 막히지 않게)
  // 가구 방향 (계획 17 작업 2): 옛 저장은 칸이 없다(옛 그림 쪽). 잘못된 값은 버린다
  setHomeFurniture(migrated)
  const facedRoom = migrated.map((f) => {
    if (f.facing === undefined || isFacing(f.facing)) return f
    const { facing: _bad, ...rest } = f
    void _bad
    return rest
  })
  const { room, inv } = refitRoom(facedRoom, s.inv)
  const bedShifted=(s.room??[]).some(f=>f.item==='homeBed'&&f.x===18&&f.y===112)&&migrated.some(f=>f.item==='homeBed'&&f.x===17&&f.y===111)
  if(bedShifted&&PLACES.bed.stand&&room.some(f=>f.item==='homeBed'&&footprint(f).some(t=>t.x===player.x&&t.y===player.y)))player={...player,...PLACES.bed.stand,path:[]}
  // 책상을 벽으로 옮긴 저장: 그 칸에 서 있었으면 책상 앞으로
  if(PLACES.desk.stand&&room.some(f=>f.item==='homeDesk'&&footprint(f).some(t=>t.x===Math.round(player.x)&&t.y===Math.round(player.y))))player={...player,...PLACES.desk.stand,path:[]}
  // 고른 책: 조각이 있어야 하고, 그 책의 서고 방이 열려 있어야 한다 (chooseBook과 같은 규칙 — 사도행전·편지)
  const activeBook =
    s.activeBook && (BOOKS as readonly string[]).includes(s.activeBook) && content.pieces.some((p) => p.book === s.activeBook) && bookRoomOpen(s.activeBook, flags)
      ? s.activeBook
      : null
  // 오늘 온 편지(말씀 조각): 옛 저장(칸이 없던 때)은 빈 값. 있는 조각 중 아직 받지 않은 것만 남긴다 (고른 책과 상관없이 — 계획 14 작업 5)
  const post = isStrArray(s.post) ? [...new Set(s.post)].filter((id) => known.has(id) && !collected.includes(id)) : []
  // 여정 판: 옛 저장(판이 없던 때)은 빈 판에서, 엮은 사도행전 장의 카드만 남기고 빠진 카드는 채운다
  const board = Array.isArray(s.journey) ? s.journey.filter((n) => Number.isInteger(n)) : []
  const journey = placeNewCards(board, cardsForChapters(content.journey ?? [], progress.ac.completed))
  // 일곱 교회 판도 같게: 옛 저장(계획 7·8, 칸이 없던 때)은 빈 판, 옮겨 적은 요한계시록 장의 카드만 남기고 빠진 카드는 채운다
  const churchBoard = Array.isArray(s.churches) ? s.churches.filter((n) => Number.isInteger(n)) : []
  const churches = placeNewCards(churchBoard, cardsForChapters(content.churches ?? [], progress.rev.completed))
  // 구약 칸은 원본을 펼치지 않는다 — 정리한 결과가 있을 때만 아래에서 넣는다 (깨진 값이 남지 않게)
  const { otProgress: _rawOtProgress, otCopyStats: _rawOtStats, newland: _rawNewland, otCollected: _rawOtCollected, rooms: _rawRooms, gen: _rawGen, inv: _inv, ...sRest } = { ...s, rooms: (s as { rooms?: unknown }).rooms } as typeof s & { rooms?: unknown }
  // 새 터 건축 (계획 20 작업 6): 옛 저장은 없음, 깨진 기록은 걸러 낸다
  const newland = sanitizeNewlandBuild(_rawNewland, s.clock.day)
  const savedGen = sanitizeGen(_rawGen, s.clock.day)
  // 고정 주민의 모습(성별)은 늘 지금 내용(neighbors.json)을 따른다 — 2026-10-13 웬델·파피 모습을 맞바꿨다
  const looked = savedGen && {
    ...savedGen,
    persons: Object.fromEntries(Object.entries(savedGen.persons).map(([id, p]) => {
      const def = p.origin === 'fixed' ? content.neighbors.find((d) => d.id === (p.npc ?? id)) : undefined
      return [id, def?.look && p.look !== def.look ? { ...p, look: def.look } : p]
    })),
  }
  const gen = looked ? repairHouseholdHomes(looked, content) : undefined
  // 건물 안 가구 (작업 7): 옛 저장은 없음. 주인 없는 방·맞지 않는 가구는 가방으로
  const fitted = sanitizeRooms(_rawRooms, { newland }, inv)
  void _inv
  // 아이: 정리한 첫째를 기준으로 동생을 남긴다. 첫째 기록이 깨졌으면 첫 동생이 첫째 자리로 (2026-10-18 감사 L-58 — 두 번째 불러오기에서 동생이 사라졌다)
  const kids = (() => {
    const first = sanitizeChild(s.child)
    const sibs = s.child ? sanitizeSiblings((s as { siblings?: unknown }).siblings, sanitizeChild) : undefined
    const child = first ?? sibs?.[0] ?? null
    const siblings = first ? sibs : sibs?.slice(1)
    return { child: repairSpouseInheritance(child, romance.partner, content.neighbors.find(n => n.id === romance.partner)?.stat), siblings: siblings?.length ? siblings : undefined }
  })()
  const out: GameState = {
    ...sRest,
    furnitureAuto: undefined,
    player,
    companion: sanitizeCompanion(fresh && s.companion ? { ...s.companion, ...HOME_ENTRY, path: [] } : s.companion),
    homeLevel,
    homeWalls,
    flags,
    journey,
    churches,
    room,
    inv: fitted.inv,
    // 재료 궤짝 (계획 11): 옛 저장(칸이 없던 때)은 빈 궤짝. 수가 아닌 값은 버린다
    chest: Object.fromEntries(Object.entries(isObj(s.chest) ? s.chest : {}).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)),
    pantry: Object.fromEntries(Object.entries(isObj(s.pantry) ? (s.pantry as object) : {}).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)),
    // 능력치 (계획 11 작업 4): 옛 저장(칸이 없던 때)은 모두 1단계, 타고난 값 0
    stats: sanitizeStats(s.stats),
    // 연애와 결혼 (계획 6): 옛 저장은 빈 연애
    romance,
    heartDay: sanitizeHeartDay(s.heartDay, s.clock.day, content.neighbors.map(n => n.id)),
    // 가족 옷장: 모습(look이 f·m인 것)만 남긴다 — 옛 저장은 빈 옷장
    looks: Object.fromEntries(Object.entries((isObj(s.looks) ? s.looks : {}) as Record<string, unknown>).filter(([, v]) => isObj(v) && ((v as { look?: unknown }).look === 'f' || (v as { look?: unknown }).look === 'm'))) as GameState['looks'],
    // 살아 움직이는 사람들 (계획 6b): 옛 저장은 빈 기억
    life: sanitizeLife(s.life),
    workDay: sanitizeWorkDay(s.workDay),
    stall: sanitizeStall(s.stall),
    stallLook: s.stallLook === undefined ? undefined : sanitizeStallLook(s.stallLook),
    village: sanitizeVillage(s.village, flags, s.clock.day),
    skills: sanitizeSkills(s.skills),
    skillLesson: sanitizeSkillLesson(s.skillLesson),
    plans: sanitizePlans(s.plans, s.clock.day),
    clubs: sanitizeClubs(s.clubs),
    clubSessions: sanitizeClubSessions(s.clubSessions),
    fests: sanitizeFests(s.fests),
    // 직접 요리 (계획 16 작업 25): 옛 저장은 없음 — 처음부터 아는 요리로 시작
    cooking: sanitizeCooking(s.cooking),
    // 집 안 공간별 쓰임 (계획 16 작업 23): 옛 저장은 빈 목록, 없는 가구는 빼고 방마다 셋까지
    spaces: (setHomeFurniture(room), sanitizeSpaces(s.spaces, room)),
    clubWorks: Object.fromEntries(Object.entries(s.clubWorks ?? {}).filter(([, w]) => w && w.item === 'cushion' && CLUB_PLACES.includes(w.place))),
    // 살림과 서고 (계획 13): 옛 저장은 정성 들인 장 없음, 봉인 없음
    careful: Object.fromEntries(Object.entries(isObj(s.careful) ? s.careful : {}).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, (v as unknown[]).filter((n): n is number => Number.isInteger(n))])),
    sealed: isStrArray(s.sealed) ? s.sealed : [],
    notebook: sanitizeNotebook(s.notebook),
    ...kids,
    found: isStrArray(s.found) ? (s.found as ItemId[]) : [],
    // 필사 (계획 14): 마친 장(progress)은 그대로 마친 장이고, 글자 수 통계는 0에서 시작한다
    copy,
    copyStats: sanitizeCopyStats(s.copyStats),
    ...(Object.keys(otProgress).length ? { otProgress } : {}),
    ...(isObj(s.otCopyStats) ? { otCopyStats: sanitizeCopyStats(s.otCopyStats) } : {}),
    ...(newland ? { newland } : {}),
    // 주민의 자율 가족 (작업 10): 옛 저장은 없음, 깨진 항목만 버리고 계보는 복구
    ...(gen ? { gen } : {}),
    // 정성 필사 (계획 21 R2): 모양이 맞을 때만, 도장은 '책:장' 글자만
    // 마치지 않은 다른 장들의 기록 (08-A): 모양이 맞는 것만, 열쇠와 at이 같을 때
    copyCareOther: isObj(s.copyCareOther)
      ? Object.fromEntries(Object.entries(s.copyCareOther as Record<string, unknown>).flatMap(([k, v]) => {
          if (!isObj(v)) return []
          const c = v as Record<string, unknown>
          if (c.at !== k || !Number.isInteger(c.typos) || (c.typos as number) < 0) return []
          const puzzled = Number.isInteger(c.puzzled) && (c.puzzled as number) > 0 ? (c.puzzled as number) : undefined
          return [[k, { at: k, typos: c.typos as number, puzzle: c.puzzle === true, ...(puzzled ? { puzzled } : {}) }]]
        }))
      : undefined,
    copyCare: (() => {
      if (!isObj(s.copyCare)) return undefined
      const c = s.copyCare as unknown as Record<string, unknown>
      if (typeof c.at !== 'string' || !Number.isInteger(c.typos) || (c.typos as number) < 0) return undefined
      // 퍼즐로 마친 절 수도 남긴다 (시간·피로 60% 규칙 — 2026-10-08)
      const puzzled = Number.isInteger(c.puzzled) && (c.puzzled as number) > 0 ? (c.puzzled as number) : undefined
      return { at: c.at, typos: c.typos as number, puzzle: c.puzzle === true, ...(puzzled ? { puzzled } : {}) }
    })(),
    // 서고 순위 기록 (계획 21 R8): 날·순위가 정수인 것만. 보여 주지 못한 창은 모양이 맞을 때만 남긴다
    ranks: Array.isArray(s.ranks) ? s.ranks.filter((r) => isObj(r) && Number.isInteger(r.day) && Number.isInteger(r.place) && r.place >= 1 && r.place <= 20).slice(-24) : undefined,
    rankPopup: (() => {
      const p = s.rankPopup
      return p && isObj(p) && Number.isInteger(p.day) && Number.isInteger(p.place) && Array.isArray(p.table) && Array.isArray(p.pieces) ? p : undefined
    })(),
    // 서고 방명록 (계획 21 R10): 모양이 맞는 줄만
    guestbook: Array.isArray(s.guestbook)
      ? s.guestbook.filter((g) => isObj(g) && Number.isInteger(g.day) && ['wanderer', 'learner', 'kid', 'scribe'].includes(g.kind as string)).slice(-30)
      : undefined,
    // 이사 간 이웃의 편지: 모양이 맞는 것만
    farewells: Array.isArray(s.farewells) ? s.farewells.filter(okFarewell).slice(-30) : undefined,
    farewellPopup: okFarewell(s.farewellPopup) ? s.farewellPopup : undefined,
    moveInGifts: isObj(s.moveInGifts) ? Object.fromEntries(Object.entries(s.moveInGifts ?? {}).filter(([npc, item]) => (content.neighbors.some(n => n.id === npc) || GUESTS.some(g => g.id === npc) || !!gen?.persons[npc]) && GIFT_ITEMS.includes(item as ItemId))) as Record<string, ItemId> : undefined,
    careDone: isStrArray(s.careDone) ? [...new Set(s.careDone.filter((k) => /^[a-z0-9]+:\d+$/.test(k)))] : undefined,
    ...(fitted.rooms ? { rooms: fitted.rooms } : {}),
    // 구약 말씀 조각: 새 터를 받은 뒤에만 있다 — 모르는 id·중복은 버리고, 옛 저장(없음)은 칸을 만들지 않는다
    ...(s.flags?.newlandGift && sanitizeOtCollected(_rawOtCollected).length ? { otCollected: sanitizeOtCollected(_rawOtCollected) } : {}),
    // 하나님 기록 (계획 14): 모양이 맞는 줄만, 같은 줄은 한 번만. 필사 전에 마친 장(옛 저장·예전에 엮은 장)의 줄은
    // 불러올 때 지금 날짜로 채운다 — 이미 있는 줄은 그대로라 몇 번 불러와도 같다
    godRecords: backfillGodRecords(
      content.godRecords ?? [],
      sanitizeGodRecords(s.godRecords),
      Object.fromEntries(BOOKS.map((b) => [b, progress[b].completed])) as Record<Book, number[]>,
      s.clock.day,
    ),
    // 제본 (계획 14 작업 4): 옛 저장(칸이 없던 때)은 빈 목록 — 이미 꽂은 책은 아래 shelved에 등급 그대로 남는다
    bound: sanitizeBindings(s.bound, (b) => bookDone({ progress }, b, content)),
    bookDesigns: sanitizeBookDesigns(s.bookDesigns),
    // 오늘의 기록 (계획 14 작업 6): 옛 저장(칸이 없던 때)은 오늘의 빈 기록
    dayLog: sanitizeDayLog(s.dayLog, s.clock.day),
    achieved: s.achieved,
    needs: { ...s.needs, heat: s.needs?.heat ?? 0 },
    collected,
    // 받은 말씀 조각의 기록 (계획 14 작업 5): 옛 저장은 빈 기록 — 화면은 "언제 받았는지 남아 있지 않은 조각"
    pieceLog: sanitizePieceLog(s.pieceLog, collected),
    progress,
    activeBook,
    offers,
    post,
    myLines,
    ...(sanitizeYard(s.yard) ? { yard: sanitizeYard(s.yard) } : {}),
    gearOff: sanitizeGearOff(s.gearOff),
    tips: sanitizeTips((s as { tips?: unknown }).tips),
    // 서고 잔치에서 낭독한 줄 (2026-10-13): 잔치 id마다 글 한 줄만, 옛 저장은 없음
    ...(isObj(s.feastLines) ? { feastLines: Object.fromEntries(Object.entries(s.feastLines as Record<string, unknown>).filter((e): e is [string, string] => (e[0] === 'gospelFeast' || e[0] === 'allFeast') && typeof e[1] === 'string' && e[1].length <= 400)) } : {}),
    todayHeard: s.todayHeard.filter((id) => known.has(id)),
    // 끝나지 않은 책의 서고 칸은 없앤다 (시험판 저장이 3장만 읽은 책을 꽂았을 수 있다)
    shelved: Object.fromEntries(
      Object.entries(isObj(s.shelved) ? s.shelved : {}).filter(
        ([b, g]) => (BOOKS as readonly string[]).includes(b) && (g === 0 || g === 1 || g === 2) && bookDone({ progress }, b as Book, content),
      ),
    ),
    garden: moveGardenPlots(s.garden ?? {}),
    rereads: (s.rereads ?? []).filter((id) => known.has(id)),
    journal: s.journal.map((e) => ({ ...e, heard: (Array.isArray(e.heard) ? e.heard : []).filter((id) => known.has(id)) })),
  }
  // 집 책장 (계획 14 작업 8): 옛 저장(칸이 없던 때)은 빈 책장. 다 쓴 책(제본했거나 꽂은 책)만, 몇 권까지
  const { map: _map, mapAt: _mapAt, ...rest } = out
  void _map
  void _mapAt
  return { ...rest, bookDesigns: withBookDesigns(out.bookDesigns ?? [], out.bound, out.shelved), homeShelf: sanitizeHomeShelf(s.homeShelf, (b) => isFinished(out, b)), ...sanitizeMaps(out) }
}

/** 옛 id → 새 id (주막→약방 2026-09-30, 양 이야기 2026-10-05) */
const ID_MOVES: readonly [RegExp, string][] = [
  [/innkeeper/g, 'apothecary'],
  [/lamb:found/g, 'lamb:clover'],
  [/lambFound/g, 'lambClover'],
  [/lamb:splint/g, 'lamb:firstBite'],
  [/lambSplint/g, 'lambFirstBite'],
]
const moveId = (v: string): string => ID_MOVES.reduce((s, [re, to]) => s.replace(re, to), v)
/** 저장 안의 열쇠와 식별자 글(띄어쓰기 없음)만 옮긴다 — 띄어쓰기가 있는 글은 사람이 쓴 글로 보고 그대로 */
function migrateIds(v: unknown): unknown {
  if (typeof v === 'string') return /\s/.test(v) ? v : moveId(v)
  if (Array.isArray(v)) return v.map(migrateIds)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [moveId(k), migrateIds(x)]))
  return v
}

/**
 * 텃밭 칸이 지도 텃밭(GARDEN_TILES)과 어긋나 있던 때의 작물을 지도 텃밭 안으로 옮긴다.
 * 이미 텃밭 칸에 있는 작물은 그대로, 밖에 있는 것은 빈 텃밭 칸에 순서대로 (빈 칸이 없으면 버린다)
 */
function moveGardenPlots(garden: GameState['garden']): GameState['garden'] {
  const keys = GARDEN_TILES.map((t) => `${t.x},${t.y}`)
  const out: GameState['garden'] = {}
  const stray: GameState['garden'][string][] = []
  for (const [k, v] of Object.entries(garden)) {
    if (keys.includes(k)) out[k] = v
    else stray.push(v)
  }
  for (const v of stray) {
    const free = keys.find((k) => !out[k])
    if (free) out[free] = v
  }
  return out
}

export function deserialize(raw: string | null, content: GameContent): GameState | null {
  if (!raw) return null
  try {
    // 주막이 약방으로 바뀌었다 (2026-09-30): 옛 저장의 이웃 id(마음·표식·장면·일지)를 함께 옮긴다
    // 양 이야기가 '잃고 찾기'에서 '토끼풀 첫 입'으로 바뀌었다 (2026-10-05): 옛 목격 id·기억 표식·장면을 새 id로 옮긴다
    // 바꾸기는 파싱한 뒤 열쇠와 띄어쓰기 없는 식별자 글에만 — 사용자가 쓴 글(메모·이름)은 그대로 둔다 (2026-10-08 버그 01-B)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = migrateIds(JSON.parse(raw)) as any
    if (!isObj(o) || o.version !== SAVE_VERSION) return null
    const ok =
      Number.isFinite(o.clock?.day) &&
      Number.isFinite(o.clock?.minute) &&
      Number.isFinite(o.player?.x) &&
      Number.isFinite(o.player?.y) &&
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
    // 필사 칸(계획 14)이 없는 옛 저장은 새 게임 기본값으로 덮지 않고 null로 넘긴다 — sanitize가 옛 저장임을 알아보게
    return settle(sanitize({ ...fresh, ...o, furnitureAuto: undefined, pieceLayout: o.pieceLayout, copy: isObj(o.copy) ? o.copy : null, version: SAVE_VERSION } as GameState, content), content)
  } catch {
    return null
  }
}

/** 초기화한 뒤 새로고침되는 사이에 창 닫힘 저장이 옛 기록을 되살리지 않게 막는다 */
let erased = false

// ── 저장 칸 여러 개 (2026-10-07 사용자: 스타듀밸리처럼 새로 시작·불러오기·저장하기) ──
// 칸 '1'은 예전 저장 자리(SAVE_KEY) 그대로라 옛 저장은 옮길 것 없이 첫 칸이 된다. 다른 칸은 SAVE_KEY/<칸>.
// 지금 쓰는 칸은 이 모듈이 기억하고(ACTIVE_KEY에도 남김), saveGame·loadGame·앨범 그림이 그 칸을 쓴다.
export const ACTIVE_KEY = 'twenty-seven/active-slot'
const META_KEY = (slot: string) => `twenty-seven/save-meta/${slot}`
export const slotKey = (slot: string): string => (slot === '1' ? SAVE_KEY : `${SAVE_KEY}/${slot}`)
let active: string | null = null

export function activeSlot(store: Storage | null | undefined = storage()): string {
  if (active) return active
  try {
    const v = store?.getItem(ACTIVE_KEY)
    active = v && /^\d{1,4}$/.test(v) ? v : '1'
  } catch {
    active = '1'
  }
  return active
}
export function setActiveSlot(slot: string, store: Storage | null | undefined = storage()): void {
  active = slot
  erased = false
  try {
    store?.setItem(ACTIVE_KEY, slot)
  } catch (error) {
    reportGameStorageError(error)
  }
}

export async function selectSaveAsync(slot: string): Promise<boolean> {
  const store = storage()
  if (!store) return false
  try {
    await commitStorageBatch(store, () => store.setItem(ACTIVE_KEY, slot))
    active = slot
    erased = false
    return true
  } catch (error) { reportGameStorageError(error); return false }
}

/** 불러오기 목록에 보일 한 칸 */
export interface SaveSlot {
  slot: string
  name: string
  look: 'f' | 'm' | null
  /** 주인공 모습 (칸 그림용, 모양이 맞을 때만) */
  avatar?: Avatar
  day: number
  coins: number
  books: number
  /** 마지막으로 저장한 때 (ms, 모르면 0) */
  savedAt: number
}

function slotIds(store: Storage): string[] {
  const out: string[] = []
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i)
    if (k === SAVE_KEY) out.push('1')
    else if (k?.startsWith(SAVE_KEY + '/')) {
      const id = k.slice(SAVE_KEY.length + 1)
      if (/^\d{1,4}$/.test(id)) out.push(id)
    }
  }
  return out
}

/** 저장 칸 목록 (최근 저장 먼저). 본문 전체를 되살리지 않고 이름·날·닢·꽂은 책 수만 읽는다 */
export function listSaves(store: Storage | null | undefined = storage()): SaveSlot[] {
  if (!store) return []
  const out: SaveSlot[] = []
  try {
    for (const slot of slotIds(store)) {
      try {
        const o = JSON.parse(store.getItem(slotKey(slot)) ?? 'null') as Record<string, unknown> | null
        if (!o || !isObj(o) || !isObj(o.clock)) continue
        const av = isObj(o.avatar) ? (o.avatar as Record<string, unknown>) : {}
        const meta = JSON.parse(store.getItem(META_KEY(slot)) ?? '{}') as { savedAt?: number }
        out.push({
          slot,
          name: typeof av.name === 'string' && av.name.trim() ? av.name : '',
          look: av.look === 'f' || av.look === 'm' ? av.look : null,
          ...(av.look === 'f' || av.look === 'm' ? { avatar: av as unknown as Avatar } : {}),
          day: Number((o.clock as Record<string, unknown>).day) || 1,
          coins: Number(o.coins) || 0,
          books: isObj(o.shelved) ? Object.keys(o.shelved as object).length : 0,
          savedAt: Number(meta.savedAt) || 0,
        })
      } catch {
        /* 깨진 칸은 목록에서 뺀다 */
      }
    }
  } catch {
    return out
  }
  return out.sort((a, b) => b.savedAt - a.savedAt || Number(a.slot) - Number(b.slot))
}

/** 새 칸 번호 (쓰지 않은 가장 작은 번호) */
export function newSlot(store: Storage | null | undefined = storage()): string {
  const used = new Set(store ? slotIds(store) : [])
  for (let i = 1; i < 10000; i++) if (!used.has(String(i))) return String(i)
  throw new Error('저장 칸이 모두 찼어요. 오래된 저장을 백업한 뒤 지워 주세요.')
}

export function saveGame(s: GameState, store: Storage | null | undefined = storage(), sourceSlot?: string): boolean {
  if (erased) return true
  try {
    if (!store) return false
    const slot = sourceSlot ?? activeSlot(store)
    const text = serialize(s)
    if (store.getItem(slotKey(slot)) === text) return true
    withStorageBatch(store, () => {
      store.setItem(slotKey(slot), text)
      store.setItem(META_KEY(slot), JSON.stringify({ savedAt: Date.now() }))
    })
    return true
  } catch (error) {
    reportGameStorageError(error)
    return false
  }
}

/** 화면 이동은 메모리 반영이 아니라 실제 저장 완료를 기다린다. */
export async function saveGameAsync(s: GameState): Promise<boolean> {
  if (!saveGame(s)) return false
  try { await flushGameStorage(); return true } catch { return false }
}

/**
 * 내보내기·가져오기 (2026-10-14 사용자): 저장 하나를 파일로 꺼내고, 그 파일을 새 칸으로 들인다.
 * 빠지는 것이 없게 — 저장 글뿐 아니라 그 칸의 앨범 사진(따로 보관)과 기기 설정(소리·화면·조작)까지 담는다.
 * 가져온 뒤에는 무엇이 몇 개 들어왔는지 돌려준다 (화면에 알려 빠진 것이 있으면 바로 보이게)
 */
const EXPORT_APP = 'twenty-seven'
const SETTING_SKIP = (k: string) => k === SAVE_KEY || k.startsWith(SAVE_KEY + '/') || k.startsWith('twenty-seven/save-meta/') || k.startsWith('twenty-seven/album/') || k === ACTIVE_KEY
/** 이 칸의 앨범 사진: 칸 '1'은 다른 칸 사진 칸(album/<번호>/…)을 빼고 */
function albumPics(store: Storage, slot: string): [string, string][] {
  const prefix = albumPrefix(slot)
  const out: [string, string][] = []
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i)
    if (!k?.startsWith(prefix)) continue
    if (slot === '1' && /^twenty-seven\/album\/\d{1,4}\//.test(k)) continue
    const v = store.getItem(k)
    if (v !== null) out.push([k.slice(prefix.length), v])
  }
  return out
}
function deviceSettings(store: Storage): [string, string][] {
  const out: [string, string][] = []
  try {
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i)
    if (!k || !isDeviceSetting(k)) continue
    const v = store.getItem(k)
    if (v !== null) out.push([k, v])
  }
  } catch { /* 기기 설정을 읽지 못해도 진행·사진 백업은 가능해야 한다. */ }
  return out
}
export function exportSave(s: GameState, store: Storage | null | undefined = storage(), slot?: string): string {
  const album = store ? Object.fromEntries(albumPics(store, slot ?? activeSlot(store))) : {}
  // 진행·사진은 IndexedDB, 작은 기기 설정은 원래 localStorage에 둔다.
  const settings = Object.fromEntries(deviceSettings(settingsStorage(store)))
  return JSON.stringify({ app: EXPORT_APP, v: 2, at: Date.now(), save: serialize(s), album, settings })
}
const isDeviceSetting = (k: string) => k === 'twenty-seven-zoom' || (k.startsWith('twenty-seven/') && !SETTING_SKIP(k))
function settingsStorage(store: Storage | null | undefined): Storage {
  // 명시적으로 넘긴 메모리 저장소는 테스트·기존 도구와 호환한다.
  try { if (store === gameStorage()) return globalThis.localStorage } catch { /* 설정 읽기 불가 */ }
  return store ?? { length: 0, key: () => null, getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} }
}
export type ImportResult = { slot: string; pics: number; picsMissed: number; settings: number; settingsMissed?: number } | { error: 'format' | 'space' }
/** 파일 형식은 기존 v1·v2와 호환한다. 잘못된 사진을 조용히 빼지 않는다. */
function readImport(text: string, content: GameContent) {
  try {
    const raw = JSON.parse(text.replace(/^\uFEFF/, '').trim())
    if (!isObj(raw) || raw.app !== EXPORT_APP || typeof raw.save !== 'string' || !deserialize(raw.save, content)) return null
    if (raw.album !== undefined && (!isObj(raw.album) || Object.entries(raw.album).some(([id, value]) => !id || id.includes('/') || typeof value !== 'string'))) return null
    return { save: raw.save as string, album: Object.entries(raw.album ?? {}) as [string, string][],
      settings: Object.entries(isObj(raw.settings) ? raw.settings : {}).filter(([k, v]) => isDeviceSetting(k) && typeof v === 'string') as [string, string][] }
  } catch { return null }
}
function putImported(store: Storage, slot: string, raw: NonNullable<ReturnType<typeof readImport>>) {
  store.setItem(slotKey(slot), raw.save)
  store.setItem(META_KEY(slot), JSON.stringify({ savedAt: Date.now() }))
  for (const [id, value] of raw.album) store.setItem(albumPrefix(slot) + id, value)
  store.setItem(ACTIVE_KEY, slot)
}
function applyImportedSettings(store: Storage, entries: [string, string][]) {
  let settings = 0
  for (const [key, value] of entries) {
    try { store.setItem(key, value); settings++ } catch { /* 적용하지 못한 설정은 개수로 알린다 */ }
  }
  const settingsMissed = entries.length - settings
  return { settings, ...(settingsMissed ? { settingsMissed } : {}) }
}
/** 동기 도구와 예전 검사 호환용. 실제 화면은 importSaveAsync로 완료를 확인한다. */
export function importSave(text: string, content: GameContent, store: Storage | null | undefined = storage()): ImportResult {
  const raw = readImport(text, content)
  if (!raw) return { error: 'format' }
  if (!store) return { error: 'space' }
  try {
    const slot = newSlot(store)
    withStorageBatch(store, () => putImported(store, slot, raw))
    active = slot
    erased = false
    return { slot, pics: raw.album.length, picsMissed: 0, ...applyImportedSettings(settingsStorage(store), raw.settings) }
  } catch (error) { reportGameStorageError(error); return { error: 'space' } }
}
/** 진행·사진·시각·이어 할 칸을 하나의 트랜잭션으로 저장한다. 실패 시 전부 원복한다. */
export async function importSaveAsync(text: string, content: GameContent): Promise<ImportResult> {
  const raw = readImport(text, content)
  if (!raw) return { error: 'format' }
  const store = storage()
  if (!store) return { error: 'space' }
  try {
    const slot = await commitStorageBatch(store, () => {
      const id = newSlot(store)
      putImported(store, id, raw)
      return id
    })
    active = slot
    erased = false
    return { slot, pics: raw.album.length, picsMissed: 0, ...applyImportedSettings(settingsStorage(store), raw.settings) }
  } catch (error) { reportGameStorageError(error); return { error: 'space' } }
}

function copyToNewSlot(s: GameState, store: Storage): string {
  const from = activeSlot(store)
  const slot = newSlot(store)
  store.setItem(slotKey(slot), serialize(s))
  store.setItem(META_KEY(slot), JSON.stringify({ savedAt: Date.now() }))
  for (const [id, value] of albumPics(store, from)) store.setItem(albumPrefix(slot) + id, value)
  return slot
}
/** 사진까지 모두 복사한다. 공간이 모자라면 일부만 남기지 않는다. */
export function saveAsNew(s: GameState, store: Storage | null | undefined = storage()): string | null {
  if (!store) return null
  try { return withStorageBatch(store, () => copyToNewSlot(s, store)) }
  catch (error) { reportGameStorageError(error); return null }
}
export async function saveAsNewAsync(s: GameState): Promise<string | null> {
  const store = storage()
  if (!store) return null
  try { return await commitStorageBatch(store, () => copyToNewSlot(s, store)) }
  catch (error) { reportGameStorageError(error); return null }
}
/** 새 게임의 칸과 이어 할 칸도 저장이 끝난 뒤에만 바꾼다. */
export async function createSaveAsync(s: GameState): Promise<string | null> {
  const store = storage()
  if (!store) return null
  try {
    const slot = await commitStorageBatch(store, () => {
      const id = newSlot(store)
      store.setItem(slotKey(id), serialize(s))
      store.setItem(META_KEY(id), JSON.stringify({ savedAt: Date.now() }))
      store.setItem(ACTIVE_KEY, id)
      return id
    })
    active = slot
    erased = false
    return slot
  } catch (error) { reportGameStorageError(error); return null }
}

export function loadGame(content: GameContent, store: Storage | null | undefined = storage(), slot?: string): GameState | null {
  try {
    return deserialize(store?.getItem(slotKey(slot ?? activeSlot(store))) ?? null, content)
  } catch {
    return null
  }
}

/** 앨범 그림 키의 앞부분 (칸 1은 예전 그대로) */
export const albumPrefix = (slot: string = activeSlot()): string => (slot === '1' ? 'twenty-seven/album/' : `twenty-seven/album/${slot}/`)

/** 한 칸을 지운다 (그 칸의 앨범 그림까지). 칸 1의 앨범은 다른 칸 앨범(album/<n>/)과 섞이지 않게 고른다 */
function removeSave(slot: string, store: Storage): void {
    const keys: string[] = [slotKey(slot), META_KEY(slot)]
    const prefix = albumPrefix(slot)
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (!k?.startsWith(prefix)) continue
      if (slot === '1' && /^twenty-seven\/album\/\d{1,4}\//.test(k)) continue
      keys.push(k)
    }
    withStorageBatch(store, () => { for (const k of keys) store.removeItem(k) })
}
export function deleteSave(slot: string, store: Storage | null | undefined = storage()): void {
  try {
    if (store) removeSave(slot, store)
  } catch (error) {
    reportGameStorageError(error)
  }
}

export async function deleteSaveAsync(slot: string): Promise<boolean> {
  const store = storage()
  if (!store) return false
  try {
    await commitStorageBatch(store, () => removeSave(slot, store))
    return true
  } catch (error) { reportGameStorageError(error); return false }
}

/** 기록 초기화: 지금 칸의 저장된 날들과 일지 그림을 지운다 (다른 칸·소리·화면 크기 같은 설정은 남긴다) */
export function eraseSave(store: Storage | null | undefined = storage()): void {
  erased = true
  deleteSave(activeSlot(store), store)
}

export async function eraseSaveAsync(): Promise<boolean> {
  erased = true
  if (await deleteSaveAsync(activeSlot())) return true
  erased = false
  return false
}
