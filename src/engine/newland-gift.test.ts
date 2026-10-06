// 계획 20 작업 4: 신약 완필 보상(새 터와 작은 서고)과 첫 방문(서고 문 아침빛·창 1:3·땅 드러내기)
import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import gen from '../content/ot/gen.json'
import { SCENES, T } from '../content/text'
import { firstChapterDesk } from '../features/newland/first-desk'
import { useGame } from '../store/game-store'
import { chaptersOf } from './books'
import { goToSleep, newGame, playerTile, settle, syncHome, tick, travel, walkDirection, type GameEvent, type GameState } from './game'
import { setActiveMap } from './maps'
import { findPath } from './movement'
import { claimNewland, grantNewland, newlandBounds, newlandStatus, newlandTileAt, portalAt, revealNewland, setNewlandOpen, setNewlandRevealed } from './newland'
import { ARCHIVE, BUILD_RECT, NEWLAND_PORTAL_FRONT, NEWLAND_VISIBLE_H, PREVIEW_LAST_ROW, VILLAGE_PORTAL } from './newland-config'
import { deserialize, serialize } from './save'
import { BOOKS } from './types'
import { tileAt } from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
  setNewlandRevealed(true)
})

const zero = () => 0
const ALL = Object.fromEntries(BOOKS.map((b) => [b, 1])) as GameState['shelved']
const OPEN = { gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1, 'room:rev': 1 }

/** 27권이 꽂힌 밤 */
function night(day: number, flags: Record<string, number> = {}, shelved = ALL): GameState {
  const s = newGame(CONTENT)
  // 꽂힌 책은 다 쓴 책이어야 저장을 거쳐도 남는다 (save.ts: 끝나지 않은 책의 서고 칸은 없앤다)
  const progress = { ...s.progress }
  for (const b of Object.keys(shelved) as (keyof typeof shelved)[]) progress[b] = { ...progress[b], completed: chaptersOf(b, CONTENT) }
  return { ...s, scenes: [], clock: { day, minute: 22 * 60 }, shelved, progress, flags: { ...s.flags, ...OPEN, ...flags } }
}
const sleep = (s: GameState) => goToSleep({ ...s, scenes: [], clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
const gifts = (s: GameState) => s.scenes.filter((x) => x === 'newlandGift').length

describe('완필 보상 — 조건과 한 번뿐', () => {
  it('27권 + 잔치 날(allFeast 1)에는 아직 없다 (locked), 잔치가 지난 뒤(allFeast 2)에야 gift', () => {
    expect(newlandStatus(night(2, { churchesDone: 1 }))).toBe('locked')
    expect(newlandStatus({ shelved: ALL, flags: { allFeast: 1 } })).toBe('locked')
    expect(newlandStatus({ shelved: ALL, flags: { allFeast: 2 } })).toBe('gift')
    expect(newlandStatus({ shelved: ALL, flags: { allFeast: 2, newlandGift: 1 } })).toBe('open')
    // 한 권이 빠지면 잔치가 지났어도 gift가 아니다
    const missing = { ...ALL }
    delete missing.rev
    expect(newlandStatus({ shelved: missing, flags: { allFeast: 2 } })).toBe('locked')
  })

  it('잔치 날 아침에는 보상이 없고, 그다음 잠에서 한 번 받는다. 세 번째 잠에는 다시 없다', () => {
    const feast = goToSleep(night(2, { churchesDone: 1 }), CONTENT)
    expect(feast.flags.allFeast).toBe(1)
    expect(feast.flags.newlandGift).toBeUndefined()
    expect(gifts(feast)).toBe(0)
    const first = sleep(feast)
    expect(first.flags.allFeast).toBe(2)
    expect(first.flags.newlandGift).toBe(1)
    expect(gifts(first)).toBe(1)
    const again = sleep(first)
    expect(gifts(again)).toBe(0)
    expect(again.flags.newlandGift).toBe(1)
    expect(gifts(sleep(again))).toBe(0)
  })

  it('보상이 없는 동안 입구 표식이 없고, 받은 뒤에는 있다', () => {
    const before = night(5, { allFeast: 1 })
    syncHome(before)
    expect(portalAt(VILLAGE_PORTAL)).toBeNull()
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe(',')
    const after = sleep(sleep(night(2, { churchesDone: 1 })))
    syncHome(after)
    expect(portalAt(VILLAGE_PORTAL)).toBe('newland')
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe('>')
  })

  it('저장·재접속에도, 두 번째 잠에도 한 번뿐 (장면이 다시 생기지 않는다)', () => {
    const got = sleep(sleep(night(2, { churchesDone: 1 })))
    expect(gifts(got)).toBe(1)
    const back = deserialize(serialize(got), CONTENT)!
    expect(back.flags.newlandGift).toBe(1)
    expect(gifts(back)).toBe(1) // 아직 보지 않은 장면 하나가 그대로 (저장이 둘로 늘리지 않는다)
    // 장면을 보고 난 뒤 다시 불러와도 없다
    const seen = { ...back, scenes: [] }
    const again = deserialize(serialize(seen), CONTENT)!
    expect(gifts(again)).toBe(0)
    expect(gifts(settle(again, CONTENT))).toBe(0)
  })

  it('옛 완필 저장(allFeast 2, 보상 표식 없음)을 불러오면 받는다', () => {
    const old = night(9, { allFeast: 2, churchesDone: 1 })
    const loaded = deserialize(serialize(old), CONTENT)!
    expect(loaded.flags.newlandGift).toBe(1)
    expect(gifts(loaded)).toBe(1)
    syncHome(loaded)
    expect(portalAt(VILLAGE_PORTAL)).toBe('newland')
    // 같은 저장을 settle로 다시 거쳐도 하나뿐
    expect(gifts(settle(loaded, CONTENT))).toBe(1)
  })

  it('미완필 저장은 받지 않는다 (잔치 전·한 권 부족)', () => {
    const before = deserialize(serialize(night(9, { churchesDone: 1 })), CONTENT)!
    expect(before.flags.newlandGift).toBeUndefined()
    expect(gifts(before)).toBe(0)
    const part = { ...ALL }
    delete part.mt
    const partial = deserialize(serialize(night(9, { allFeast: 2 }, part)), CONTENT)!
    expect(partial.flags.newlandGift).toBeUndefined()
    expect(gifts(partial)).toBe(0)
    const none = deserialize(serialize({ ...newGame(CONTENT), scenes: [] }), CONTENT)!
    expect(none.flags.newlandGift).toBeUndefined()
  })

  it('claimNewland·grantNewland: 이미 받았으면 아무것도 바꾸지 않는다', () => {
    const flags: Record<string, number> = { allFeast: 2 }
    const scenes: string[] = []
    expect(claimNewland(ALL, flags, scenes)).toBe(true)
    expect(claimNewland(ALL, flags, scenes)).toBe(false)
    expect(scenes).toEqual(['newlandGift'])
    const g = grantNewland(night(3, { allFeast: 2 }))
    expect(grantNewland(g)).toBe(g)
  })

  it('보상은 필수 비용·기한이 없다: 받는 것은 장면과 표식뿐 (닢·소지품 그대로), 미뤄도 입구는 그대로', () => {
    const base = night(2, { allFeast: 1 })
    const after = sleep(base)
    expect(after.flags.newlandGift).toBe(1)
    expect(after.coins).toBe(base.coins)
    expect(after.inv).toEqual(base.inv)
    let s = after
    for (let i = 0; i < 10; i++) s = sleep(s)
    syncHome(s)
    expect(s.flags.newlandGift).toBe(1)
    expect(portalAt(VILLAGE_PORTAL)).toBe('newland')
  })
})

describe('첫 방문 — 보이는 땅과 땅 드러내기', () => {
  it('드러나기 전에는 서고·길·빈 땅 첫머리만 보이고 바깥 칸은 숲(T), 드러나면 그대로', () => {
    for (const y of [PREVIEW_LAST_ROW + 1, 15, NEWLAND_VISIBLE_H - 2]) expect(newlandBounds(false, y, '.')).toBe('T')
    for (const y of [0, 8, PREVIEW_LAST_ROW]) expect(newlandBounds(false, y, '.')).toBe('.')
    expect(newlandBounds(true, 15, '.')).toBe('.')
    setNewlandRevealed(false)
    setActiveMap('newland')
    expect(newlandTileAt(BUILD_RECT.x0 + 3, BUILD_RECT.y1)).toBe('T')
    expect(newlandTileAt(ARCHIVE.door.x, ARCHIVE.door.y)).toBe('D')
    setNewlandRevealed(true)
    expect(newlandTileAt(BUILD_RECT.x0 + 3, BUILD_RECT.y1)).toBe('.')
  })

  it('드러나기 전에도 입구에서 서고 문 앞까지 길이 있고, 아래 빈 땅으로는 갈 수 없다', () => {
    setNewlandRevealed(false)
    setActiveMap('newland')
    expect(findPath(NEWLAND_PORTAL_FRONT, ARCHIVE.front)).not.toBeNull()
    expect(findPath(NEWLAND_PORTAL_FRONT, { x: BUILD_RECT.x0, y: BUILD_RECT.y1 })).toBeNull()
  })

  it('땅 드러내기 ① 첫 구약 절 기록 경로: 플래그를 세우면 드러난다 (플래그 쪽은 작업 5)', () => {
    const open = night(5, { newlandGift: 1 })
    setActiveMap('newland')
    syncHome({ ...open, map: 'newland' })
    expect(newlandTileAt(BUILD_RECT.x0, BUILD_RECT.y1)).toBe('T')
    syncHome({ ...open, map: 'newland', flags: { ...open.flags, newlandRevealed: 1 } })
    expect(newlandTileAt(BUILD_RECT.x0, BUILD_RECT.y1)).toBe('.')
  })

  it('땅 드러내기 ② 땅 둘러보기: 비용 없이, 이미 드러났으면 그대로', () => {
    const open = { ...night(5, { newlandGift: 1 }), coins: 5 }
    const looked = revealNewland(open)
    expect(looked.flags.newlandRevealed).toBe(1)
    expect(looked.coins).toBe(5)
    expect(looked.inv).toEqual(open.inv)
    expect(revealNewland(looked)).toBe(looked)
    useGame.setState({ game: open, modal: { kind: 'lookAround' }, rng: zero })
    useGame.getState().lookAround()
    expect(useGame.getState().game.flags.newlandRevealed).toBe(1)
    expect(useGame.getState().modal).toBeNull()
  })

  it('저장·불러오기 뒤에도 드러난 땅이 그대로 (드러난 칸에 선 채 저장해도 입구로 쫓겨나지 않는다)', () => {
    const open = night(5, { newlandGift: 1, newlandRevealed: 1 })
    const there = travel({ ...open, scenes: [], clock: { day: 5, minute: 10 * 60 } }, 'newland', CONTENT)
    const back = deserialize(serialize({ ...there, player: { ...there.player, x: BUILD_RECT.x0, y: BUILD_RECT.y1, path: [] } }), CONTENT)!
    expect(playerTile(back)).toEqual({ x: BUILD_RECT.x0, y: BUILD_RECT.y1 })
    expect(back.flags.newlandRevealed).toBe(1)
  })
})

describe('서고 문 첫 밟기 — 아침빛 · 창 1:3 · 건너뛰기', () => {
  /** 새 터 서고 문 앞에 서 있다 */
  function atDoor(extra: Record<string, number> = {}): GameState {
    const open = night(5, { newlandGift: 1, ...extra })
    const there = travel({ ...open, scenes: [], clock: { day: 5, minute: 10 * 60 } }, 'newland', CONTENT)
    syncHome(there)
    return { ...there, player: { ...there.player, x: ARCHIVE.front.x, y: ARCHIVE.front.y, path: [], facing: 'up' } }
  }
  function stepIn(s: GameState): { s: GameState; events: GameEvent[] } {
    const events: GameEvent[] = []
    let g = walkDirection(s, 0, -1)
    for (let i = 0; i < 40; i++) {
      const r = tick(g, 0.05, zero, CONTENT)
      g = r.state
      events.push(...r.events)
    }
    return { s: g, events }
  }
  const lights = (events: GameEvent[]) => events.filter((e) => e.type === 'firstLight').length

  it('서고 문을 처음 밟으면 firstLight 한 번 — 안으로 들어가 있고 표식이 남는다', () => {
    const { s, events } = stepIn(atDoor())
    expect(lights(events)).toBe(1)
    expect(s.flags.newlandLight).toBe(1)
    expect(s.flags.newlandVisited).toBe(1)
    expect(playerTile(s).y).toBeGreaterThan(NEWLAND_VISIBLE_H - 1) // 서고 안 방 (보이지 않는 줄)
  })

  it('두 번째로 밟으면 연출 없이 그냥 드나든다', () => {
    const first = stepIn(atDoor()).s
    const out = { ...first, player: { ...first.player, x: ARCHIVE.front.x, y: ARCHIVE.front.y, path: [] } }
    expect(lights(stepIn(out).events)).toBe(0)
  })

  it('이미 본 표식이 있으면 다시 나오지 않는다', () => {
    expect(lights(stepIn(atDoor({ newlandLight: 1 })).events)).toBe(0)
  })

  it('화면: 문을 밟으면 연출 창이 열리고, 건너뛰어도(닫아도) 서고는 그대로 쓸 수 있다', () => {
    useGame.setState({ game: atDoor(), modal: null, rng: zero, decorating: null, decorSel: null, toast: null })
    useGame.getState().tap({ x: ARCHIVE.door.x, y: ARCHIVE.door.y })
    for (let i = 0; i < 40 && useGame.getState().modal?.kind !== 'firstLight'; i++) useGame.getState().frame(0.1)
    expect(useGame.getState().modal).toEqual({ kind: 'firstLight' })
    // 건너뛰기 = 연출만 건너뛴다: 위치·진행은 그대로, 서고 안에서 걷고 책상 창도 열 수 있다
    useGame.getState().closeModal()
    const g = useGame.getState().game
    expect(g.flags.newlandLight).toBe(1)
    expect(playerTile(g).y).toBeGreaterThan(NEWLAND_VISIBLE_H - 1)
    for (let i = 0; i < 10; i++) useGame.getState().frame(0.1)
    expect(useGame.getState().modal).toBeNull()
    expect(firstChapterDesk(g)).toEqual({ kind: 'copy', view: 'pick', tab: 'ot' })
    const out = walkDirection(g, 0, 1)
    expect(out.player.path.length + (out.player.facing === 'down' ? 1 : 0)).toBeGreaterThan(0)
  })

  it('"첫 장을 써 본다"가 여는 창은 한 함수로 모여 있고, 새 터 책상의 구약 칸이다 (작업 5)', () => {
    const g = night(5, { newlandGift: 1 })
    expect(firstChapterDesk(g)).toEqual({ kind: 'copy', view: 'pick', tab: 'ot' })
    // 신약 책을 쓰던 중이어도 구약 칸의 책 고르기, 구약 책을 고른 적이 있으면 그 책의 메뉴
    expect(firstChapterDesk({ ...g, copy: { ...g.copy, book: 'mt' } })).toEqual({ kind: 'copy', view: 'pick', tab: 'ot' })
    expect(firstChapterDesk({ ...g, copy: { ...g.copy, book: 'gen' } })).toEqual({ kind: 'copy', view: 'menu', tab: 'ot' })
  })
})

describe('글 — 새 터 절과 보상 장면', () => {
  const norm = (t: string) => t.replace(/[\s,.!?'"·]+/g, '')
  const verses = (gen as string[][]).flat().map(norm)
  const scene = SCENES.newlandGift
  const texts = [...Object.values(T.newland), ...Object.values(T.travel), scene.title, scene.album ?? '', ...scene.lines.map((l) => l.text)]

  it('모든 문장이 창세기 어느 절과도 8글자 이상 겹치지 않는다', () => {
    for (const text of texts) {
      const n = norm(text)
      for (let i = 0; i + 8 <= n.length; i++) {
        const gram = n.slice(i, i + 8)
        expect(
          verses.some((v) => v.includes(gram)),
          `${text} / ${gram}`,
        ).toBe(false)
      }
    }
  })

  it('금지어를 통과하고 영어·내부 id가 없다', () => {
    for (const text of texts) {
      expect(forbiddenIn(text), text).toBeNull()
      expect(/[A-Za-z]/.test(text), text).toBe(false)
    }
  })

  it('보상 장면: 3줄 이내, 기록하는 글만(대사·고르기 없음)', () => {
    expect(scene.lines.length).toBeLessThanOrEqual(3)
    expect(scene.lines.every((l) => l.speaker === 'narration')).toBe(true)
    expect(scene.choices).toBeUndefined()
  })
})
