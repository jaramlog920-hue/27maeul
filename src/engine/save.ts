import { CLUB_PLACES, sanitizeClubs, sanitizeClubSessions } from './clubs'
import { sanitizeVillage } from './projects'
import { sanitizeFests } from './fest'
import { sanitizeCooking } from './cooking'
import { sanitizeGen } from './gen'
import { sanitizeSpaces } from './spaces'
import { sanitizePlans } from './plans'
import { sanitizeCompanion } from './companion'
import { sanitizeWorkDay } from './work-day'
import { sanitizeStall, sanitizeStallLook } from './stall'
import { sanitizeSkills, sanitizeSkillLesson } from './skills'
// 브라우저 저장. 저장소가 없거나 막혀 있어도 게임은 돌아야 하므로 모든 접근을 try/catch로 감싼다.
import { sanitizeLife } from './people'
import { sanitizeNotebook } from './notebook'
import { sanitizeChild } from './child'
import { sanitizeRomance } from './romance'
import { sanitizeStats } from './stats'
import { sanitizeCopy, sanitizeCopyStats } from './copying'
import { backfillGodRecords, sanitizeGodRecords } from './god-records'
import { sanitizeBindings } from './binding'
import { isFinished, sanitizeHomeShelf } from './finished-books'
import { sanitizePieceLog } from './fragments'
import { sanitizeDayLog } from './daybook'
import { IDLE_RESET } from './autonomy'
import { bookDone, bookRoomOpen, emptyProgress, sanitizeOtProgress, type Progress } from './books'
import { isOtBook } from './ot-books'
import { newGame, settle, type Farewell, type GameState } from './game'
import type { Avatar } from './avatar'
import { cardsForChapters, placeNewCards } from './journey'
import { initialHomeFurniture, isFacing, refitRoom } from './room'
import { HOME_ENTRY, HOME_FRONT, setHomeLevel, setHomeFurniture, setSpouseRoom, walkableOn } from './world'
import { MAP_IDS, isMapId, setActiveMap, type MapId } from './maps'
import { sanitizeOtCollected } from './ot-pieces'
import { entryFront, roomSlotAt, setArchiveRooms, setNewlandOverlay, setNewlandRevealed, setNewlandWarps } from './newland'
import { overlayFor, sanitizeNewlandBuild, warpsFor } from './newland-build'
import { homeAtSlot, sanitizeRooms } from './newland-rooms'
import { BOOKS, type Book, type GameContent, type ItemId } from './types'

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
  // 가구 쓰는 동작(act)도 그림만이라 저장하지 않는다
  return JSON.stringify({ ...s, player: { ...s.player, path: [] }, target: null, idle: IDLE_RESET, act: undefined, npcs: {}, emotes: undefined })
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
export function sanitize(s: GameState, content: GameContent): GameState {
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
    const chapters = new Set(content.pieces.filter((p) => p.book === b).map((p) => p.chapter))
    progress[b].completed = [...new Set(s.progress?.[b]?.completed ?? [])].filter((c) => chapters.has(c))
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
  // 조각 키(옛 저장 그대로)와 책 키('book:mk')만 남긴다
  const bookKeys = new Set(BOOKS.map((b) => `book:${b}`))
  // 필사 길잡이의 한 줄은 'guide:mt:1' (책·장)
  const guideKey = (id: string) => { const m = /^guide:([a-z0-9]+):(\d+)$/.exec(id); return !!m && (BOOKS as readonly string[]).includes(m[1]) }
  const myLines = Object.fromEntries(Object.entries(isObj(s.myLines) ? s.myLines : {}).filter(([id, t]) => (known.has(id) || bookKeys.has(id) || guideKey(id)) && typeof t === 'string'))
  // 집 단계 (옛 저장은 0 — 넓히기 전). 부탁해 둔 단계는 바로 다음 단계일 때만 남긴다
  let homeLevel: GameState['homeLevel'] = s.homeLevel === 1 || s.homeLevel === 2 || s.homeLevel === 3 ? s.homeLevel : 0
  // 지도(모듈 전역 집 단계)를 이 저장에 맞춘 뒤 가구를 맞춘다 — newGame이 0으로 되돌려 둔 상태라서
  const romance = sanitizeRomance(s.romance)
  setHomeLevel(homeLevel)
  setSpouseRoom(romance.stage === 'married' ? romance.partner : null)
  const flags = { ...s.flags }
  if (flags.homeOrder !== undefined && (flags.homeOrder !== homeLevel + 1 || flags.homeOrder > 3)) delete flags.homeOrder
  // 지금 집 배치(homeLayout 2) 전 저장: 옮기지 않고 붙박이만 새로 놓고 집 안 문 앞에서 시작한다 (옛 가구는 아래 refitRoom이 가방으로)
  const fresh = !flags.homeLayout
  const player = fresh ? { ...s.player, ...HOME_ENTRY, path: [] } : s.player
  const migrated = fresh ? [...initialHomeFurniture(), ...(s.room ?? [])] : (s.room ?? [])
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
  const gen = sanitizeGen(_rawGen, s.clock.day)
  // 건물 안 가구 (작업 7): 옛 저장은 없음. 주인 없는 방·맞지 않는 가구는 가방으로
  const fitted = sanitizeRooms(_rawRooms, { newland }, inv)
  void _inv
  const out: GameState = {
    ...sRest,
    player,
    companion: sanitizeCompanion(fresh && s.companion ? { ...s.companion, ...HOME_ENTRY, path: [] } : s.companion),
    homeLevel,
    flags,
    journey,
    churches,
    room,
    inv: fitted.inv,
    // 재료 궤짝 (계획 11): 옛 저장(칸이 없던 때)은 빈 궤짝. 수가 아닌 값은 버린다
    chest: Object.fromEntries(Object.entries(isObj(s.chest) ? s.chest : {}).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)),
    // 능력치 (계획 11 작업 4): 옛 저장(칸이 없던 때)은 모두 1단계, 타고난 값 0
    stats: sanitizeStats(s.stats),
    // 연애와 결혼 (계획 6): 옛 저장은 빈 연애
    romance,
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
    child: sanitizeChild(s.child),
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
    copyCare: (() => {
      if (!isObj(s.copyCare)) return undefined
      const c = s.copyCare as unknown as Record<string, unknown>
      if (typeof c.at !== 'string' || !Number.isInteger(c.typos) || (c.typos as number) < 0) return undefined
      return { at: c.at, typos: c.typos as number, puzzle: c.puzzle === true }
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
    // 오늘의 기록 (계획 14 작업 6): 옛 저장(칸이 없던 때)은 오늘의 빈 기록
    dayLog: sanitizeDayLog(s.dayLog, s.clock.day),
    achieved: Array.isArray(s.achieved) ? s.achieved.filter((a) => a && typeof a.id === 'string' && typeof a.day === 'number') : [],
    needs: { ...s.needs, heat: s.needs?.heat ?? 0 },
    collected,
    // 받은 말씀 조각의 기록 (계획 14 작업 5): 옛 저장은 빈 기록 — 화면은 "언제 받았는지 남아 있지 않은 조각"
    pieceLog: sanitizePieceLog(s.pieceLog, collected),
    progress,
    activeBook,
    offers,
    post,
    myLines,
    todayHeard: s.todayHeard.filter((id) => known.has(id)),
    // 끝나지 않은 책의 서고 칸은 없앤다 (시험판 저장이 3장만 읽은 책을 꽂았을 수 있다)
    shelved: Object.fromEntries(
      Object.entries(isObj(s.shelved) ? s.shelved : {}).filter(
        ([b, g]) => (BOOKS as readonly string[]).includes(b) && (g === 0 || g === 1 || g === 2) && bookDone({ progress }, b as Book, content),
      ),
    ),
    // 텃밭은 집 앞(1~4, 8~9)에서 집 오른쪽 위(14~17, 3~5)로 옮겼다 — 옛 저장의 작물도 같은 자리 순서로 옮긴다
    garden: Object.fromEntries(
      Object.entries(s.garden ?? {}).map(([k, v]) => {
        const [x, y] = k.split(',').map(Number)
        return [x >= 1 && x <= 4 && (y === 8 || y === 9) ? `${x + 13},${y - 5}` : k, v]
      }),
    ),
    rereads: (s.rereads ?? []).filter((id) => known.has(id)),
    journal: s.journal.map((e) => ({ ...e, heard: (e.heard ?? []).filter((id) => known.has(id)) })),
  }
  // 집 책장 (계획 14 작업 8): 옛 저장(칸이 없던 때)은 빈 책장. 다 쓴 책(제본했거나 꽂은 책)만, 몇 권까지
  const { map: _map, mapAt: _mapAt, ...rest } = out
  void _map
  void _mapAt
  return { ...rest, homeShelf: sanitizeHomeShelf(s.homeShelf, (b) => isFinished(out, b)), ...sanitizeMaps(out) }
}

export function deserialize(raw: string | null, content: GameContent): GameState | null {
  if (!raw) return null
  try {
    // 주막이 약방으로 바뀌었다 (2026-09-30): 옛 저장의 이웃 id(마음·표식·장면·일지)를 함께 옮긴다
    // 양 이야기가 '잃고 찾기'에서 '토끼풀 첫 입'으로 바뀌었다 (2026-10-05): 옛 목격 id·기억 표식·장면을 새 id로 옮긴다
    const o = JSON.parse(
      raw
        .replace(/innkeeper/g, 'apothecary')
        .replace(/lamb:found/g, 'lamb:clover')
        .replace(/lambFound/g, 'lambClover')
        .replace(/lamb:splint/g, 'lamb:firstBite')
        .replace(/lambSplint/g, 'lambFirstBite'),
    )
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
    // 필사 칸(계획 14)이 없는 옛 저장은 새 게임 기본값으로 덮지 않고 null로 넘긴다 — sanitize가 옛 저장임을 알아보게
    return settle(sanitize({ ...fresh, ...o, copy: isObj(o.copy) ? o.copy : null, version: SAVE_VERSION } as GameState, content), content)
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
  } catch {
    /* 저장소를 못 쓰는 환경 */
  }
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
  return String(Date.now() % 10000)
}

export function saveGame(s: GameState, store: Storage | null | undefined = storage()): boolean {
  if (erased) return true
  try {
    if (!store) return false
    const slot = activeSlot(store)
    store.setItem(slotKey(slot), serialize(s))
    try {
      store.setItem(META_KEY(slot), JSON.stringify({ savedAt: Date.now() }))
    } catch {
      /* 저장 시각만 못 남김 */
    }
    return true
  } catch {
    return false
  }
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
export function deleteSave(slot: string, store: Storage | null | undefined = storage()): void {
  try {
    if (!store) return
    const keys: string[] = [slotKey(slot), META_KEY(slot)]
    const prefix = albumPrefix(slot)
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (!k?.startsWith(prefix)) continue
      if (slot === '1' && /^twenty-seven\/album\/\d{1,4}\//.test(k)) continue
      keys.push(k)
    }
    for (const k of keys) store.removeItem(k)
  } catch {
    /* 저장소를 못 쓰는 환경 */
  }
}

/** 기록 초기화: 지금 칸의 저장된 날들과 일지 그림을 지운다 (다른 칸·소리·화면 크기 같은 설정은 남긴다) */
export function eraseSave(store: Storage | null | undefined = storage()): void {
  erased = true
  deleteSave(activeSlot(store), store)
}
