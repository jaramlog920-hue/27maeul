import {
  adoptStray,
  bookLineKey,
  canCraft,
  canHelp,
  chooseBook,
  coverWithBlanket,
  eatBread,
  finishCraft,
  finishGather,
  finishHelp,
  gatherInfo,
  giveGift,
  goToSleep,
  greetNeighbor,
  lessonTime,
  lightLamp,
  listen,
  newGame,
  peaceful,
  placeFurniture,
  removeFurniture,
  reviewPick,
  sceneSeen,
  setArrangement,
  setMyLine,
  stargaze,
  straysToday,
  submitChapter,
  tapTile,
  walkDirection,
  teach,
  tick,
  trade,
  TRADES,
  readScripture,
  inGathering,
  type GameState, neighborBeside } from './game'
import { BABY_PARTY_SPOTS, HILL_SPOTS } from './bonds'
import { REQUESTS as REQUESTS_T } from './bonds'
import { fulfillRequest as fulfillRequestT, interactTile as interactTileT, pressTile as pressTileT, walkDirection as walkDirectionT } from './game'
import { placeAt as placeAtT } from './world'
import { deserialize, loadGame, saveGame, serialize as serializeForTest, SAVE_KEY } from './save'
import { HOME_ENTRY, HOME_FRONT, OLD_HOME, PLACES, START } from './world'

/** 예전 지도 위 집의 칸 → 지금 집 안 방의 같은 칸 */
const h = (x: number, y: number) => ({ x: x + OLD_HOME.dx, y: y + OLD_HOME.dy })
/** 집 문 앞(마을)에 선 새 게임 */
const outside = (s: GameState = newGame(CONTENT)): GameState => ({ ...s, player: { ...s.player, ...HOME_FRONT, path: [] } })
import { heartsOf } from './hearts'
import { STRAY_SPOTS } from './companion'
import { CONTENT, piecesOf } from '../content/catalog'
import type { NeighborDef } from './types'
import { dayOf, FESTIVAL_FROM, FESTIVAL_TO, festivalOf, isWet, weatherOf } from './calendar'
import { scheduledEvents } from './events'
import { FESTIVAL_SPOTS } from './neighbors'
import { actsDoorGlows } from './library'
import { ALBUM_IDS, SCENES } from '../content/text'

const zero = () => 0

describe('키보드 걷기', () => {
  it('빈 칸으로 한 칸 이동하고, 이동 중 새 경로를 만들지 않는다', () => {
    const s = newGame(CONTENT)
    const base = { ...s, npcs: {}, player: { ...s.player, x: 11, y: 9, path: [] } }
    const next = walkDirection(base, 1, 0)
    expect(next.player.path).toEqual([{ x: 12, y: 9 }])
    expect(next.target).toBeNull()
    expect(walkDirection(next, 0, 1)).toBe(next)
  })
  it('지도 경계와 벽을 통과하지 않는다', () => {
    const s = newGame(CONTENT)
    const base = { ...s, player: { ...s.player, x: 1, y: 9, path: [] } }
    // 못 가지만 그쪽을 바라본다 (자리와 경로는 그대로)
    const turned = walkDirection(base, -1, 0)
    expect(turned.player).toMatchObject({ x: 1, y: 9, path: [], facing: 'left' })
    expect(walkDirection(base, 1, 1)).toBe(base)
  })
})
const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id) as NeighborDef

/** 이벤트가 나올 때까지(최대 90초) 돌린다 */
function runUntilEvent(s: GameState) {
  for (let i = 0; i < 1800; i++) {
    const r = tick(s, 0.05, zero, CONTENT)
    s = r.state
    if (r.events.length) return { state: s, events: r.events }
  }
  throw new Error('no event')
}
const at = (s: GameState, minute: number, day = s.clock.day): GameState => ({ ...s, clock: { day, minute } })

describe('새 게임', () => {
  it('시작 칸, 빵 둘과 물 하나, 첫 장면은 환영', () => {
    const s = newGame(CONTENT)
    expect([s.player.x, s.player.y]).toEqual([START.x, START.y])
    expect(s.inv).toEqual({ water: 1, bread: 2 })
    expect(s.scenes).toEqual(['welcome'])
    // 상인은 장날이 아니라 제안이 없다
    expect(s.offers.merchant).toBeUndefined()
    // 책을 고르기 전에는 아무도 조각을 건네지 않는다
    expect(s.offers).toEqual({})
    expect(s.collected).toEqual([])
    // 누가복음을 고르면 1장 조각이 이웃에게 배정된다 (눅 1:1-4도 이웃이 건넨다)
    const lk = chooseBook(s, 'lk', CONTENT)
    expect(lk.offers.merchant).toBeUndefined()
    expect(Object.keys(lk.offers).length).toBe(6)
    for (const id of Object.values(lk.offers)) expect(id.startsWith('lk-001-')).toBe(true)
    expect(lk.progress.lk.arrangement).toEqual({})
  })
})

describe('걷기와 도착', () => {
  it('책상을 누르면 책상 앞으로 가서 도착, 책상을 바라본다', () => {
    const s = tapTile(newGame(CONTENT), PLACES.desk.tiles[0])
    const r = runUntilEvent(s)
    expect(r.events[0]).toEqual({ type: 'arrived', target: { kind: 'place', id: 'desk', tile: PLACES.desk.tiles[0] } })
    expect([r.state.player.x, r.state.player.y]).toEqual([PLACES.desk.stand!.x, PLACES.desk.stand!.y])
    expect(r.state.player.facing).toBe('left')
  })
  it('갈대처럼 서는 칸이 없는 곳은 옆 칸까지 간다', () => {
    const s = tapTile(outside(), { x: 6, y: 34 })
    const r = runUntilEvent(s)
    expect(r.events[0].type).toBe('arrived')
    expect(Math.abs(r.state.player.x - 6) + Math.abs(r.state.player.y - 34)).toBe(1)
  })
  it('이웃에게 걸어가 옆에 서면 곁에 선다 — 대화는 대화하기 단추로 (곁에서 누르면 바로 도착)', () => {
    let s = at(outside(), 8 * 60)
    s = { ...s, npcs: Object.fromEntries(Object.entries(s.npcs)) }
    const r0 = tick(s, 0.01, zero, CONTENT).state
    const baker = r0.npcs.baker
    expect(baker.visible).toBe(true)
    const bt = { x: Math.round(baker.x), y: Math.round(baker.y) }
    let w = tapTile(r0, bt)
    for (let i = 0; i < 1800 && (w.player.path.length || w.target); i++) w = tick(w, 0.05, zero, CONTENT).state
    expect(neighborBeside(w)).toBe('baker')
    const r = runUntilEvent(tapTile(w, { x: Math.round(w.npcs.baker.x), y: Math.round(w.npcs.baker.y) }))
    expect(r.events[0].type).toBe('arrived')
  })
  it('갈 수 없는 곳은 무시, 기록자를 누르면 돌아본다', () => {
    const s = newGame(CONTENT)
    expect(tapTile(s, { x: 0, y: 0 }).player.path).toEqual([])
    const g = tapTile({ ...s, player: { ...s.player, facing: 'left' } }, START)
    expect(g.player.facing).toBe('down')
    expect(g.idle.action?.kind).toBe('greet')
  })
})

describe('이웃', () => {
  it('하루 첫 인사에 마음 2점, 두 번째는 그대로 (하트는 10점마다 하나)', () => {
    let s = greetNeighbor(newGame(CONTENT), 'baker')
    expect(s.hearts.baker).toBe(2)
    s = greetNeighbor(s, 'baker')
    expect(s.hearts.baker).toBe(2)
    expect(heartsOf(s.hearts.baker)).toBe(0)
  })
  it('이야기는 한 번만 받는다', () => {
    const s = chooseBook(newGame(CONTENT), 'lk', CONTENT)
    // 오늘 이야기를 가진 이웃 하나
    const who = Object.keys(s.offers)[0]
    const first = listen(s, who, CONTENT)
    expect(first.pieceId).toBe(s.offers[who])
    expect(first.state.progress.lk.arrangement[1]).toEqual([s.offers[who]])
    expect(listen(first.state, who, CONTENT).pieceId).toBeNull()
  })
  it('돕기: 필요한 것을 내고 보상을 받는다, 하루 한 번', () => {
    let s = newGame(CONTENT)
    expect(canHelp(s, def('baker'))).toBeNull()
    s = finishHelp(s, def('baker'))
    expect(s.inv.water).toBeUndefined()
    expect(s.inv.bread).toBe(4)
    expect(canHelp(s, def('baker'))).toBe('done')
    expect(canHelp({ ...newGame(CONTENT), inv: {} }, def('baker'))).toBe('needs')
  })
  it('포도 철에는 할아버지를 도우면 포도를 받는다', () => {
    const s = at(newGame(CONTENT), 600, dayOf('autumn', 2))
    expect(finishHelp(s, def('grandpa')).inv.grapes).toBe(2)
    expect(finishHelp(newGame(CONTENT), def('grandpa')).inv.fig).toBe(2)
  })
  it('선물: 좋아하는 것이면 5점, 아니면 2점, 하루 한 번', () => {
    const s = { ...newGame(CONTENT), inv: { grapes: 2, bread: 1 } }
    const liked = giveGift(s, def('baker'), 'grapes')!
    expect(liked.liked).toBe(true)
    expect(liked.state.hearts.baker).toBe(5)
    expect(giveGift(liked.state, def('baker'), 'grapes')).toBeNull()
    const plain = giveGift(s, def('smith'), 'grapes')!
    expect(plain.state.hearts.smith).toBe(2)
    expect(giveGift(s, def('smith'), 'wool')).toBeNull()
  })
  it('하트 셋(30점)이 되면 선물과 장면', () => {
    let s: GameState = { ...newGame(CONTENT), hearts: { smith: 29 } }
    s = greetNeighbor(s, 'smith')
    expect(s.inv.brightLamp).toBe(1)
    expect(s.giftsGot).toContain('brightLamp')
    expect(s.scenes).toContain('gift:smith:3')
  })
  it('아이의 하트가 셋이면 글자를 배우고 싶어 하고, 저녁마다 한 글자', () => {
    let s: GameState = { ...newGame(CONTENT), hearts: { child: 29 } }
    s = greetNeighbor(s, 'child')
    expect(s.flags.childAsked).toBe(1)
    expect(s.scenes).toContain('childAsks')
    expect(lessonTime(at(s, 17 * 60))).toBe(false)
    s = at(s, 18 * 60 + 10)
    expect(lessonTime(s)).toBe(true)
    s = teach(s)
    expect(s.flags.childLetters).toBe(1)
    expect(s.scenes).toContain('firstLetter')
    expect(lessonTime(s)).toBe(false)
    expect(teach(s)).toBe(s)
  })
  it('장날에만 상인과 바꾼다', () => {
    const pen = TRADES.find((t) => t.id === 'pen')!
    const s = { ...newGame(CONTENT), inv: { grapes: 3, wool: 2 } }
    expect(trade(s, pen)).toBeNull()
    const m = trade(at(s, 600, 7), pen)!
    expect(m.inv).toEqual({ goodPen: 1 })
    expect(trade({ ...m, inv: { ...m.inv, grapes: 3, wool: 2 } }, pen)).toBeNull()
  })
})

describe('벤치에서 읽기', () => {
  it('모은 이야기만 읽을 수 있고, 읽을 때마다 피로가 30 풀린다', () => {
    const s: GameState = { ...newGame(CONTENT), collected: ['lk-001-001'], needs: { hunger: 0, fatigue: 80, cold: 0, heat: 0 } }
    expect(readScripture(s, 'lk-015-011')).toBeNull()
    const a = readScripture(s, 'lk-001-001')!
    expect(a.rested).toBe(true)
    // 30 풀린 뒤 읽는 20분 동안 조금 다시 쌓인다
    expect(a.state.needs.fatigue).toBeGreaterThanOrEqual(50)
    expect(a.state.needs.fatigue).toBeLessThan(55)
    expect(a.state.clock.minute).toBe(s.clock.minute + 20)
    // 바로 다시 읽어도 또 풀린다
    const b = readScripture(a.state, 'lk-001-001')!
    expect(b.rested).toBe(true)
    expect(b.state.needs.fatigue).toBeLessThan(a.state.needs.fatigue - 25)
    expect(b.state.clock.minute).toBe(a.state.clock.minute + 20)
  })
})

describe('마음의 속도', () => {
  it('매일 인사하고 도와도 하트가 다 차려면 스무 날쯤 걸린다', () => {
    let s = newGame(CONTENT)
    let days = 0
    while (heartsOf(s.hearts.baker) < 10 && days < 60) {
      s = greetNeighbor(s, 'baker')
      s = finishHelp({ ...s, inv: { ...s.inv, water: 1 } }, def('baker'))
      s = goToSleep({ ...s, inv: { water: 1 } }, CONTENT)
      days++
    }
    expect(days).toBeGreaterThanOrEqual(18)
    expect(days).toBeLessThanOrEqual(22)
  })
})

describe('손일', () => {
  it('우물·갈대·보리밭', () => {
    const s = newGame(CONTENT)
    expect(finishGather(s, 'well').inv.water).toBe(2)
    expect(finishGather(s, 'reeds').inv.reed).toBe(2)
    expect(finishGather(s, 'field').inv.barley).toBe(1)
    expect(finishGather(at(s, 600, dayOf('summer', 16)), 'field').inv.barley).toBe(3)
    expect(gatherInfo(s, 'vine')).toEqual({ blocked: 'notRipe' })
    expect(finishGather(s, 'well').clock.minute).toBe(s.clock.minute + 10)
  })
  it('지치면 손일을 못 한다', () => {
    const s = { ...newGame(CONTENT), needs: { hunger: 0, fatigue: 100, cold: 0, heat: 0 } }
    expect(gatherInfo(s, 'well')).toEqual({ blocked: 'tired' })
    expect(finishGather(s, 'well')).toBe(s)
  })
  it('만들기는 요리법을 기억한다', () => {
    const s = finishCraft({ ...newGame(CONTENT), inv: { reed: 1 } }, 'papyrus')
    expect(s.inv.papyrus).toBe(1)
    expect(s.recipesKnown).toEqual(['papyrus'])
  })
  it('빵 먹기·담요·별 보기', () => {
    const s = { ...newGame(CONTENT), needs: { hunger: 80, fatigue: 10, cold: 70, heat: 0 } }
    expect(eatBread(s)!.needs.hunger).toBe(30)
    expect(eatBread({ ...s, inv: {} })).toBeNull()
    expect(coverWithBlanket(s)).toBeNull()
    const b = coverWithBlanket({ ...s, inv: { blanket: 1 } })!
    expect(b.needs.cold).toBe(0)
    expect(b.scenes).toContain('blanket')
    expect(stargaze(at(s, 22 * 60, 1), CONTENT).state.scenes).toContain('stars')
    expect(stargaze(at(s, 12 * 60, 1), CONTENT).state.scenes).not.toContain('stars')
    // 요한계시록을 엮지 않으면 편지함에서 꺼낼 것이 없다
    expect(stargaze(at(s, 22 * 60, 1), CONTENT).pieceIds).toEqual([])
  })
})

describe('책상', () => {
  const chapter1 = piecesOf('lk').filter((p) => p.chapter === 1).map((p) => p.id)
  const ready = (): GameState => setArrangement({ ...chooseBook(newGame(CONTENT), 'lk', CONTENT), collected: chapter1 }, 'lk', 1, [...chapter1])
  it('낮에는 등잔이 필요 없고, 밤에는 기름이 든다', () => {
    const s = ready()
    expect(lightLamp(s)).toBe(s)
    const night = at(s, 20 * 60)
    expect(lightLamp(night)).toBeNull()
    const lit = lightLamp({ ...night, inv: { oil: 1 } })!
    expect(lit.inv.oil).toBeUndefined()
    expect(lit.lampLitDay).toBe(1)
    expect(lightLamp(lit)).toBe(lit)
  })
  it('밝은 등잔이면 기름 하나로 두 밤', () => {
    const s = lightLamp({ ...at(ready(), 20 * 60), inv: { oil: 1, brightLamp: 1 } })!
    expect(s.lampFuel).toBe(1)
    const next = lightLamp(at(s, 20 * 60, 2))!
    expect(next.lampFuel).toBe(0)
    expect(next.lampLitDay).toBe(2)
  })
  it('장을 다 쓰려면 파피루스와 잉크가 든다', () => {
    const s = ready()
    expect(submitChapter(s, 'lk', 1, CONTENT).result.kind).toBe('supplies')
    const ok = submitChapter({ ...s, inv: { papyrus: 1, ink: 1 } }, 'lk', 1, CONTENT)
    expect(ok.result.kind).toBe('done')
    expect(ok.state.progress.lk.completed).toEqual([1])
    expect(ok.state.inv).toEqual({})
    expect(ok.state.scenes).toContain('firstChapter')
  })
  it('순서가 틀리면 비용을 쓰지 않는다', () => {
    const s = setArrangement({ ...ready(), inv: { papyrus: 1, ink: 1 } }, 'lk', 1, [...chapter1].reverse())
    const r = submitChapter(s, 'lk', 1, CONTENT)
    expect(r.result.kind).toBe('wrong')
    expect(r.state.inv).toEqual({ papyrus: 1, ink: 1 })
  })
})

describe('복음서 방 완성 잔치', () => {
  const FOUR = { mt: 2, mk: 1, lk: 2, jn: 0 } as const
  // 2일째 밤에 자면 3일째 아침 — 3일째는 비
  const night = (shelved: GameState['shelved']): GameState => ({ ...at(newGame(CONTENT), 22 * 60, 2), shelved })
  const eve = (s: GameState, minute: number) => tick(at(s, minute), 0.05, zero, CONTENT)

  it('네 권을 꽂고 처음 잠든 다음 날: 아침 장면, 비가 와도 저녁 광장 모닥불 잔치, 앨범 한 장', () => {
    const s = goToSleep(night(FOUR), CONTENT)
    expect(s.clock.day).toBe(3)
    expect(isWet(weatherOf(3))).toBe(true)
    expect(s.scenes.filter((x) => x === 'gospelFeast')).toHaveLength(1)
    expect(s.flags.gospelFeast).toBe(1)
    // 잔치 날에는 저녁 초대·저녁 모임을 잡지 않는다
    expect(s.today.inviter).toBeNull()
    // 저녁: 이사 온 이웃은 모두(상인도, 비가 와도) 모닥불 둘레로
    const e = eve(s, FESTIVAL_FROM + 1).state
    const joined = CONTENT.neighbors.filter((d) => d.joinsAt === undefined)
    expect(joined.length).toBeGreaterThanOrEqual(9)
    for (const d of joined) expect(e.npcs[d.id].goal, d.id).toEqual(FESTIVAL_SPOTS[d.id])
    // 마을 단계가 모자란 이웃은 아직 오지 않는다
    for (const d of CONTENT.neighbors.filter((x) => x.joinsAt !== undefined)) expect(e.npcs[d.id].goal, d.id).toBeNull()
    // 잔치가 끝나면 제자리로
    expect(eve(s, FESTIVAL_TO + 1).state.npcs.merchant.goal).toBeNull()
    // 앨범에는 한 장
    let seen = sceneSeen(s, 'gospelFeast', ALBUM_IDS)
    seen = sceneSeen({ ...seen, scenes: ['gospelFeast'] }, 'gospelFeast', ALBUM_IDS)
    expect(seen.album.filter((a) => a.id === 'gospelFeast')).toHaveLength(1)
  })
  it('잔치 저녁 광장에 가면 모닥불 장면 (한 번)', () => {
    let s = goToSleep(night(FOUR), CONTENT)
    s = { ...s, scenes: [], player: { ...s.player, x: 24, y: 19, path: [] } }
    expect(eve(s, FESTIVAL_FROM + 5).events).toEqual([])
    const r = eve(s, FESTIVAL_FROM + 31)
    expect(r.events).toContainEqual({ type: 'moment', id: 'feastFire' })
    expect(eve({ ...r.state, scenes: [] }, FESTIVAL_FROM + 40).events).toEqual([])
    // 모닥불 장면은 앨범 칸을 따로 만들지 않고, 잔치 칸의 사진이 된다
    expect(ALBUM_IDS).not.toContain('feastFire')
    expect(SCENES.feastFire.photoFor).toBe('gospelFeast')
  })
  it('두 번째 밤에는 다시 나오지 않고, 잔치 다음 날부터 사도행전 방 문이 빛난다', () => {
    const s = goToSleep(night(FOUR), CONTENT)
    expect(actsDoorGlows(s)).toBe(false)
    const s2 = goToSleep(at({ ...s, scenes: [] }, 22 * 60), CONTENT)
    expect(s2.scenes).not.toContain('gospelFeast')
    expect(s2.flags.gospelFeast).toBe(2)
    expect(actsDoorGlows(s2)).toBe(true)
    // 잔치 날이 지나면 모닥불 자리로 모이지 않는다 (결말 없이 하루가 이어진다)
    expect(eve(s2, FESTIVAL_FROM + 1).state.npcs.baker.goal).not.toEqual(FESTIVAL_SPOTS.baker)
    const s3 = goToSleep(at({ ...s2, scenes: [] }, 22 * 60), CONTENT)
    expect(s3.scenes).not.toContain('gospelFeast')
    expect(s3.flags.gospelFeast).toBe(2)
    expect(s3.clock.day).toBe(5)
  })
  it('아기 잔치 날과 겹치면 복음서 방 잔치를 하루 미룬다 (저녁 모임이 겹치지 않는다)', () => {
    // 21일째 밤에 자면 22일째 아침 — 22일째는 아기 잔치 날(비가 오지 않는 날)
    expect(isWet(weatherOf(22))).toBe(false)
    const baby = goToSleep({ ...night(FOUR), clock: { day: 21, minute: 22 * 60 } }, CONTENT)
    expect(baby.clock.day).toBe(22)
    expect(baby.today.gathering).toBe('babyParty')
    expect(baby.scenes).not.toContain('gospelFeast')
    expect(baby.flags.gospelFeast).toBeUndefined()
    // 다음 밤에 자면 그다음 날 복음서 방 잔치가 열린다
    const feast = goToSleep(at({ ...baby, scenes: [] }, 22 * 60), CONTENT)
    expect(feast.clock.day).toBe(23)
    expect(feast.scenes.filter((x) => x === 'gospelFeast')).toHaveLength(1)
    expect(feast.flags.gospelFeast).toBe(1)
  })
  it('마을 행사(수확·모닥불) 날과 겹치면 복음서 방 잔치를 하루 미룬다', () => {
    // 전날 밤에 자면 가을 서른째 날 아침 — 포도 수확 잔치
    const G = dayOf('autumn', 30)
    expect(festivalOf(G)).toBe('grapes')
    const fest = goToSleep({ ...night(FOUR), clock: { day: G - 1, minute: 22 * 60 } }, CONTENT)
    expect(fest.clock.day).toBe(G)
    expect(fest.scenes).not.toContain('gospelFeast')
    expect(fest.flags.gospelFeast).toBeUndefined()
    // 그날 저녁은 원래 마을 행사 하나만 — 복음서 방 잔치 알림이 함께 뜨지 않는다
    const todays = scheduledEvents(fest, CONTENT).filter((e) => e.day === G)
    expect(todays.some((e) => e.id.endsWith(':gospelFeast'))).toBe(false)
    expect(todays.some((e) => e.id.endsWith(':festival'))).toBe(true)
    // 다음 날 아침 복음서 방 잔치
    const feast = goToSleep(at({ ...fest, scenes: [] }, 22 * 60), CONTENT)
    expect(feast.clock.day).toBe(G + 1)
    expect(feast.scenes.filter((x) => x === 'gospelFeast')).toHaveLength(1)
    expect(feast.flags.gospelFeast).toBe(1)
  })
  it('세 권일 때는 잔치가 없다', () => {
    const s = goToSleep(night({ mt: 1, mk: 1, lk: 1 }), CONTENT)
    expect(s.scenes).not.toContain('gospelFeast')
    expect(s.flags.gospelFeast).toBeUndefined()
    expect(actsDoorGlows(s)).toBe(false)
  })
})

describe('새 날 아침', () => {
  it('일어나면 기지개를 켠다', () => {
    expect(goToSleep(newGame(CONTENT), CONTENT).idle.action?.kind).toBe('stretch')
  })
})

describe('잠과 새 날', () => {
  it('일지를 남기고 침대 앞에서 일어나며, 이웃 인사·돕기가 새로워진다', () => {
    let s = chooseBook(newGame(CONTENT), 'lk', CONTENT)
    const who = Object.keys(s.offers)[0]
    const got = listen(greetNeighbor(s, who), who, CONTENT)
    s = { ...got.state, helped: [who] }
    expect(reviewPick(s, zero)).toBe(got.pieceId)
    s = goToSleep(s, CONTENT)
    expect(s.clock).toEqual({ day: 2, minute: 360 })
    expect(s.journal).toEqual([{ day: 1, heard: [got.pieceId], notes: [] }])
    expect(s.talked).toEqual([])
    expect(s.helped).toEqual([])
    // 새 날에는 조각을 건넨 이웃 기록도 새로워진다
    expect(s.listened).toEqual([])
    expect([s.player.x, s.player.y]).toEqual([PLACES.bed.stand!.x, PLACES.bed.stand!.y])
    expect(s.scenes).toContain('strays')
  })
  it('굶거나 지친 채 자면 다음 날 늦게 일어나고 병문안', () => {
    const s = goToSleep({ ...newGame(CONTENT), needs: { hunger: 100, fatigue: 20, cold: 0, heat: 0 } }, CONTENT)
    expect(s.clock.minute).toBe(600)
    expect(s.scenes).toContain('sick')
    expect(s.needs.hunger).toBe(20)
  })
  it('여드레째 아침에 아기가 태어난다', () => {
    expect(goToSleep(at(newGame(CONTENT), 22 * 60, 7), CONTENT).scenes).toContain('babyBorn')
  })
  it('장면을 보면 앨범과 오늘 일지에 남는다', () => {
    const s = sceneSeen({ ...newGame(CONTENT), scenes: ['stars'] }, 'stars', ['stars'])
    expect(s.scenes).toEqual([])
    expect(s.album).toEqual([{ id: 'stars', day: 1 }])
    expect(s.todayNotes).toEqual(['stars'])
    expect(sceneSeen(s, 'stars', ['stars']).album).toHaveLength(1)
  })
})

describe('평안', () => {
  it('자기 전에 읽고 자면 다음 날 하루 평안', () => {
    const s0 = at(newGame(CONTENT), 22 * 60, 3)
    const read = goToSleep(s0, CONTENT, { read: true })
    expect(read.clock.day).toBe(4)
    expect(peaceful(read)).toBe(true)
    expect(peaceful(goToSleep(read, CONTENT))).toBe(false)
    expect(peaceful(goToSleep(s0, CONTENT))).toBe(false)
  })
  it('복습 구절은 읽고 잘 때만 다시 읽을 목록에서 빠진다', () => {
    const s0 = { ...at(newGame(CONTENT), 22 * 60, 3), rereads: ['r1', 'r2'] }
    expect(goToSleep(s0, CONTENT, { read: true, pieceId: 'r1' }).rereads).toEqual(['r2'])
    expect(goToSleep(s0, CONTENT).rereads).toEqual(['r1', 'r2'])
    expect(goToSleep(s0, CONTENT, { read: true }).rereads).toEqual(['r1', 'r2'])
  })
  it('다시 읽을 것·오늘 들은 것이 없어도 모아 둔 조각이 있으면 읽을 수 있다', () => {
    const s = { ...newGame(CONTENT), rereads: [], todayHeard: [], collected: ['a', 'b', 'c'] }
    expect(reviewPick(s, zero)).toBe('a')
    expect(reviewPick(s, () => 0.999)).toBe('c')
    expect(reviewPick({ ...s, collected: [] }, zero)).toBeNull()
  })
  it('다시 읽을 것이 오늘 들은 것보다, 오늘 들은 것이 모아 둔 조각보다 먼저다', () => {
    const s = { ...newGame(CONTENT), rereads: ['r1'], todayHeard: ['h1'], collected: ['c1'] }
    expect(reviewPick(s, zero)).toBe('r1')
    expect(reviewPick({ ...s, rereads: [] }, zero)).toBe('h1')
  })
})

describe('동반 동물·방·나의 한 줄', () => {
  it('둘째 날부터 떠돌이 둘, 하나를 들이면 사라진다', () => {
    const s = at(newGame(CONTENT), 600, 2)
    expect(straysToday(newGame(CONTENT))).toEqual([])
    expect(straysToday(s)).toEqual(['cat', 'dog'])
    const a = adoptStray(s, 'cat', '나비')
    expect(a.companion?.name).toBe('나비')
    expect([a.companion?.x, a.companion?.y]).toEqual([STRAY_SPOTS.cat.x, STRAY_SPOTS.cat.y])
    expect(a.flags.childPet).toBe(2)
    expect(straysToday(a)).toEqual([])
    expect(a.scenes).toContain('companionJoined')
  })
  it('깔개는 3×2칸으로 깔리고, 치우면 가방으로', () => {
    const s = { ...newGame(CONTENT), inv: { rug: 1 } }
    const p = placeFurniture(s, 'rug', h(5, 4))!
    expect(p.room).toEqual([{ item: 'rug', ...h(5, 4) }])
    expect(p.inv.rug).toBeUndefined()
    expect(placeFurniture(s, 'rug', { x: 12, y: 12 })).toBeNull()
    // 예전 집 자리(지금은 풀밭)에는 깔 수 없다
    expect(placeFurniture(s, 'rug', { x: 5, y: 4 })).toBeNull()
    // 깔개 오른쪽 아래 칸을 눌러도 치워진다
    expect(removeFurniture(p, h(7, 5)).inv.rug).toBe(1)
  })
  it('식탁 위에 물병을 올리고, 식탁을 치우면 물병도 함께', () => {
    const s = { ...newGame(CONTENT), inv: { table: 1, jar: 1 } }
    // 문깔개 바로 위(들어와 서는 칸)는 막을 수 없다
    expect(placeFurniture(s, 'table', HOME_ENTRY)).toBeNull()
    let p = placeFurniture(s, 'table', h(7, 6))!
    p = placeFurniture(p, 'jar', h(8, 6))!
    expect(p.room).toEqual([{ item: 'table', ...h(7, 6) }, { item: 'jar', ...h(8, 6), on: true }])
    // 식탁이 길을 막는다
    const t76 = h(7, 6)
    expect(tapTile(p, t76).player.path.some((t) => t.x === t76.x && t.y === t76.y)).toBe(false)
    const back = removeFurniture(p, h(8, 6))
    expect(back.room).toEqual([{ item: 'table', ...h(7, 6) }])
    expect(back.inv.jar).toBe(1)
    const all = removeFurniture(back, h(7, 6))
    expect(all.room).toEqual([])
    expect(all.inv).toEqual({ table: 1, jar: 1 })
  })
  it('나의 한 줄은 80자까지, 비우면 지운다', () => {
    let s = setMyLine(newGame(CONTENT), 'lk-015-008', '  '.padEnd(3) + 'ㄱ'.repeat(100))
    expect(s.myLines['lk-015-008']).toHaveLength(80)
    s = setMyLine(s, 'lk-015-008', '   ')
    expect(s.myLines['lk-015-008']).toBeUndefined()
  })
  it('책에 대한 한 줄은 book:책 키로 저장되고, 조각 키와 함께 남는다', () => {
    expect(bookLineKey('mk')).toBe('book:mk')
    let s = setMyLine(newGame(CONTENT), 'lk-015-008', '잃은 것을 찾는 이야기')
    s = setMyLine(s, bookLineKey('mk'), '  빠르게   이어지는 책 ')
    expect(s.myLines).toEqual({ 'lk-015-008': '잃은 것을 찾는 이야기', 'book:mk': '빠르게 이어지는 책' })
  })
  it('불러올 때 책 한 줄과 옛 조각 한 줄은 남고, 없는 책 키는 걸러 낸다', () => {
    const s = newGame(CONTENT)
    const old = { ...JSON.parse(serializeForTest(s)), myLines: { 'lk-001-005': '옛 조각', 'book:jn': '요한', 'book:ac': '사도행전', 'book:zz': '없는 책' } }
    const back = deserialize(JSON.stringify(old), CONTENT)!
    // 사도행전(ac)도 책이다 (계획 5) — 없는 책 키만 걸러 낸다
    expect(back.myLines).toEqual({ 'lk-001-005': '옛 조각', 'book:jn': '요한', 'book:ac': '사도행전' })
    // myLines가 아예 없던 옛 저장도 열린다
    const { myLines: _drop, ...older } = JSON.parse(serializeForTest(s))
    expect(deserialize(JSON.stringify(older), CONTENT)!.myLines).toEqual({})
  })
})

describe('특별한 순간', () => {
  it('겨울 둘째 날 밖에 나가면 첫눈', () => {
    let s = at(newGame(CONTENT), 10 * 60, dayOf('winter', 2))
    s = { ...s, player: { ...s.player, x: 11, y: 9 } }
    const r = tick(s, 0.05, zero, CONTENT)
    expect(r.events).toContainEqual({ type: 'moment', id: 'firstSnow' })
    expect(r.state.scenes).toContain('firstSnow')
    // 한 해에 한 번
    const again = tick({ ...r.state, scenes: [] }, 0.05, zero, CONTENT)
    expect(again.events).toEqual([])
  })
  it('행사 날 저녁 장터에 가면 잔치', () => {
    let s = at(newGame(CONTENT), 18 * 60 + 5, dayOf('summer', 25))
    // 모닥불이 피는 광장 (장터 광장 19~29, 13~20)
    s = { ...s, player: { ...s.player, x: 24, y: 19 } }
    // 이웃이 모이기 전에는 아직
    expect(tick(s, 0.05, zero, CONTENT).events).toEqual([])
    s = at(s, 18 * 60 + 31, dayOf('summer', 25))
    expect(tick(s, 0.05, zero, CONTENT).events).toContainEqual({ type: 'moment', id: 'festival:barley' })
  })
})

describe('리뷰 지적 회귀', () => {
  it('M3: 궂은 날 집에서 쉬는 이웃(대장장이)에게는 이야기를 배정하지 않는다', () => {
    // 3일째는 비
    const s = goToSleep(at(chooseBook(newGame(CONTENT), 'lk', CONTENT), 22 * 60, 2), CONTENT)
    expect(s.clock.day).toBe(3)
    expect(s.offers.smith).toBeUndefined()
    expect(s.offers.baker).toBeDefined()
  })
  it('m2: 잔치 날 저녁에는 글자 수업이 없다', () => {
    const s: GameState = { ...at(newGame(CONTENT), 18 * 60 + 10, dayOf('summer', 25)), flags: { childAsked: 1 } }
    expect(lessonTime(s)).toBe(false)
    expect(lessonTime({ ...s, clock: { day: dayOf('summer', 24), minute: 18 * 60 + 10 } })).toBe(true)
  })
  it('m3: 가방이 넘치면 모으기·돕기·만들기·바꾸기·가구 거두기를 막는다', () => {
    const full: GameState = { ...newGame(CONTENT), inv: { reed: 9, water: 9, bread: 9, papyrus: 9, grapes: 9, rug: 9 } }
    expect(gatherInfo(full, 'reeds')).toEqual({ blocked: 'full' })
    expect(gatherInfo(full, 'well')).toEqual({ blocked: 'full' })
    expect(canHelp(full, def('baker'))).toBe('full')
    expect(canCraft(full, 'papyrus')).toBe('full')
    expect(trade(at(full, 600, 7), TRADES.find((t) => t.id === 'papyrus')!)).toBeNull()
    const placed = { ...full, room: [{ item: 'rug' as const, x: 5, y: 5 }] }
    expect(removeFurniture(placed, { x: 5, y: 5 }).room).toHaveLength(1)
  })
})

describe('저장', () => {
  const memory = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage
  }
  it('저장하고 다시 불러온다 (걷던 길·동작·이웃 위치는 새로)', () => {
    const store = memory()
    let s = tapTile(newGame(CONTENT), PLACES.desk.tiles[0])
    s = { ...s, idle: { seconds: 99, action: { kind: 'doze', left: Infinity }, cooldown: 0 }, inv: { reed: 3 }, hearts: { baker: 2 } }
    expect(saveGame(s, store)).toBe(true)
    const back = loadGame(CONTENT, store)!
    expect(back.player.path).toEqual([])
    expect(back.idle.action).toBeNull()
    expect(back.inv).toEqual({ reed: 3 })
    expect(back.hearts).toEqual({ baker: 2 })
    expect(Object.keys(back.npcs)).toHaveLength(CONTENT.neighbors.length)
  })
  it('옛 저장의 텃밭 작물은 새 텃밭(14~17, 3~4) 같은 자리로 옮긴다', () => {
    const s = newGame(CONTENT)
    const plot = { crop: 'herb', grown: 1, wateredDay: null }
    const old = { ...JSON.parse(serializeForTest(s)), garden: { '1,8': plot, '4,9': plot } }
    const back = deserialize(JSON.stringify(old), CONTENT)!
    expect(Object.keys(back.garden).sort()).toEqual(['14,3', '17,4'])
  })
  it('N2·N4: 끝낸 장의 새 조각은 모은 것으로, 빠진 조각은 본문 순서 자리에', () => {
    const s = newGame(CONTENT)
    const old = {
      ...JSON.parse(serializeForTest(s)),
      collected: ['lk-001-026', 'lk-001-005', 'lk-001-001'],
      progress: { ...s.progress, lk: { arrangement: { 1: ['lk-001-026', 'lk-001-005'] }, completed: [2] } },
    }
    const back = deserialize(JSON.stringify(old), CONTENT)!
    // 순서에서 빠진 머리말은 맨 앞에 끼워진다 (끝이 아니라)
    expect(back.progress.lk.arrangement[1]).toEqual(['lk-001-001', 'lk-001-026', 'lk-001-005'])
    // 끝낸 2장의 조각은 모두 모은 것으로
    for (const p of piecesOf('lk').filter((x) => x.chapter === 2)) expect(back.collected).toContain(p.id)
    // 다른 책의 2장은 건드리지 않는다
    expect(back.collected.some((id) => id.startsWith('mk-'))).toBe(false)
  })
  it('m3: 이웃의 하트 선물은 가방 한도를 넘어도 모두 받는다', () => {
    const s = greetNeighbor({ ...newGame(CONTENT), hearts: { grandpa: 29 }, inv: { fig: 8 } }, 'grandpa')
    expect(s.inv.fig).toBe(11)
  })
  it('M2: 없는 조각 id는 걸러 내고 책상 순서를 모은 조각과 맞춘다', () => {
    const s = newGame(CONTENT)
    const bad = {
      ...JSON.parse(serializeForTest(s)),
      collected: ['lk-001-005', 'lk-999-001', 'lk-002-008'],
      progress: { ...s.progress, lk: { arrangement: { 1: ['lk-999-001'], 2: [] }, completed: [] } },
      todayHeard: ['lk-999-001'],
      myLines: { 'lk-999-001': '없는 조각', 'lk-001-005': '있는 조각' },
      journal: [{ day: 1, heard: ['lk-999-001', 'lk-001-005'] }],
      offers: { baker: 'lk-999-001' },
    }
    const back = deserialize(JSON.stringify(bad), CONTENT)!
    expect(back.collected).toEqual(['lk-001-005', 'lk-002-008'])
    expect(back.progress.lk.arrangement[1]).toEqual(['lk-001-005'])
    expect(back.progress.lk.arrangement[2]).toEqual(['lk-002-008'])
    expect(back.todayHeard).toEqual([])
    expect(back.myLines).toEqual({ 'lk-001-005': '있는 조각' })
    expect(back.journal[0].heard).toEqual(['lk-001-005'])
    expect(back.offers).toEqual({})
  })
  it('끝나지 않은 책의 서고 칸은 불러올 때 없어지고, 끝낸 책의 등급은 남는다', () => {
    const s = newGame(CONTENT)
    const allMk = [...new Set(piecesOf('mk').map((p) => p.chapter))]
    const load = (mkChapters: number[], shelved: object) =>
      deserialize(
        JSON.stringify({ ...JSON.parse(serializeForTest(s)), shelved, progress: { ...s.progress, mk: { arrangement: {}, completed: mkChapters } } }),
        CONTENT,
      )!
    const partial = load([1, 2, 3], { mk: 2 })
    expect(partial.shelved.mk).toBeUndefined()
    expect(partial.progress.mk.completed).toEqual([1, 2, 3])
    const done = load(allMk, { mk: 2 })
    expect(done.shelved.mk).toBe(2)
  })
  it('서고 칸은 책 키가 mt|mk|lk|jn이고 값이 0|1|2인 것만 남는다', () => {
    const s = newGame(CONTENT)
    const all: Record<string, { arrangement: object; completed: number[] }> = {}
    for (const b of ['mt', 'mk', 'lk', 'jn'] as const)
      all[b] = { arrangement: {}, completed: [...new Set(piecesOf(b).map((p) => p.chapter))] }
    const load = (shelved: unknown) =>
      deserialize(JSON.stringify({ ...JSON.parse(serializeForTest(s)), shelved, progress: all }), CONTENT)!
    const back = load({ mt: 0, mk: 1, lk: 3, jn: 'x', zz: 1, toString: 1, __proto__: 2 })
    expect(back.shelved).toEqual({ mt: 0, mk: 1 })
    expect(load({ lk: -1, jn: 1.5 }).shelved).toEqual({})
    expect(load('junk').shelved).toEqual({})
  })
  it('깨진 저장은 null, 저장소 예외도 흡수', () => {
    expect(deserialize('{not json', CONTENT)).toBeNull()
    expect(deserialize(JSON.stringify({ version: 9 }), CONTENT)).toBeNull()
    expect(deserialize(JSON.stringify({ version: 1 }), CONTENT)).toBeNull()
    const bad = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage
    expect(saveGame(newGame(CONTENT), bad)).toBe(false)
    expect(loadGame(CONTENT, bad)).toBeNull()
    expect(saveGame(newGame(CONTENT), null)).toBe(false)
    expect(SAVE_KEY).toBe('twenty-seven/save')
  })
})

describe('리뷰 3차 수정', () => {
  it('옛 저장의 가구가 지금 규칙으로 길을 막으면 가방으로 돌아간다', () => {
    const s = newGame(CONTENT)
    // 들어와 서는 칸을 막는 걸상(지금은 막는 가구) + 정상 깔개
    const old = { ...s, room: [{ item: 'stool', ...HOME_ENTRY }, { item: 'rug', ...h(4, 4) }], inv: { ...s.inv, stool: 0 } }
    const back = deserialize(serializeForTest(old as typeof s), CONTENT)!
    expect(back.room.map((f) => f.item)).toEqual(['rug'])
    expect(back.inv.stool).toBe(1)
  })
})

describe('QA 수정', () => {
  it('보상이 가방에 안 들어가면 부탁을 아직 건네지 않는다', () => {
    const s = newGame(CONTENT)
    const r = REQUESTS_T.find((x) => x.id === 'merchant:1')!
    const st = { ...s, hearts: { ...s.hearts, merchant: 90 }, flags: { ...s.flags, 'req:merchant:1': 1 }, inv: { bread: 3, papyrus: 9 } }
    expect(r.reward.papyrus).toBe(2)
    expect(fulfillRequestT(st, 'merchant')).toBeNull()
    expect(fulfillRequestT({ ...st, inv: { bread: 3 } }, 'merchant')).not.toBeNull()
  })
})

describe('스페이스 상호작용', () => {
  it('바라보는 칸의 장소를 고르고, 없으면 옆·선 자리에서 찾는다', () => {
    const s = newGame(CONTENT)
    const stand = PLACES.desk.stand!
    const desk = PLACES.desk.tiles[0]
    const facing = desk.x < stand.x ? 'left' : desk.x > stand.x ? 'right' : desk.y < stand.y ? 'up' : 'down'
    const at = { ...s, player: { ...s.player, x: stand.x, y: stand.y, path: [], facing } } as GameState
    const t = interactTileT(at)
    expect(t && placeAtT(t)).toBe('desk')
    // 걷는 중에는 아무것도 하지 않는다
    expect(interactTileT({ ...at, player: { ...at.player, path: [desk] } })).toBeNull()
  })
  it('조이스틱 가운데 누르기: 바라보는 앞 칸, 앞에 누를 것이 없으면 서 있는 칸', () => {
    const s = newGame(CONTENT)
    const stand = PLACES.desk.stand!
    const desk = PLACES.desk.tiles.find((t) => Math.abs(t.x - stand.x) + Math.abs(t.y - stand.y) === 1)!
    const facing = desk.x < stand.x ? 'left' : desk.x > stand.x ? 'right' : desk.y < stand.y ? 'up' : 'down'
    const away = ({ left: 'right', right: 'left', up: 'down', down: 'up' } as const)[facing]
    const at = (f: GameState['player']['facing']) => ({ ...s, player: { ...s.player, x: stand.x, y: stand.y, path: [], facing: f } }) as GameState
    expect(pressTileT(at(facing))).toEqual(desk)
    // 스페이스와 달리 옆 칸을 찾아가지 않는다 — 화면에서 앞 칸을 누른 것과 같다
    expect(pressTileT(at(away))).toEqual(stand)
  })
  it('막힌 쪽으로 걸으려 하면 그쪽을 바라본다', () => {
    const s = newGame(CONTENT)
    const next = walkDirectionT({ ...s, player: { ...s.player, x: 1, y: 1, path: [], facing: 'down' } }, 0, -1)
    expect(next.player.facing).toBe('up')
  })
})

describe('언덕 모임 자리 (소풍·별 보는 밤)', () => {
  const on = (g: 'picnic' | 'starNight', minute: number, x: number, y: number) => {
    const s0 = newGame(CONTENT)
    const s: GameState = { ...s0, scenes: [], npcs: {}, clock: { day: 4, minute }, today: { ...s0.today, gathering: g }, player: { ...s0.player, x, y, path: [] } }
    return tick(s, 0.05, zero, CONTENT).state.flags[`done:${g}`] === 1
  }
  it('새 언덕 벤치 곁에 서면 모임 장면이 나오고, 옛 자리(15,3)에서는 나오지 않는다', () => {
    expect(inGathering('picnic', 12 * 60, PLACES.hill.stand!)).toBe(true)
    expect(inGathering('picnic', 12 * 60, { x: 15, y: 3 })).toBe(false)
    expect(on('picnic', 12 * 60, 14, 11)).toBe(true)
    expect(on('picnic', 12 * 60, 15, 3)).toBe(false)
    expect(on('starNight', 20 * 60 + 30, 15, 11)).toBe(true)
    expect(on('starNight', 20 * 60 + 30, 15, 3)).toBe(false)
  })
  it('모임 자리는 이웃이 모이는 자리를 모두 품는다', () => {
    for (const t of Object.values(HILL_SPOTS)) expect(inGathering('picnic', 12 * 60, t)).toBe(true)
  })
  it('아기 잔치 자리는 빵집 앞 모임 자리를 품고, 내 집 문 앞은 아니다', () => {
    for (const t of Object.values(BABY_PARTY_SPOTS)) expect(inGathering('babyParty', 18 * 60 + 10, t)).toBe(true)
    expect(inGathering('babyParty', 18 * 60 + 10, HOME_FRONT)).toBe(false)
  })
})

describe('옛 저장에서 갇히지 않기', () => {
  const load = (x: number, y: number, companion: unknown = null) => {
    const s = newGame(CONTENT)
    return deserialize(JSON.stringify({ ...JSON.parse(serializeForTest(s)), player: { ...s.player, x, y }, companion }), CONTENT)!
  }
  it('지금은 집 안인 칸에 서 있던 저장은 집 앞으로 옮긴다', () => {
    for (const [x, y] of [[3, 13], [12, 20], [36, 28]]) {
      const back = load(x, y)
      expect({ x: back.player.x, y: back.player.y }).toEqual(HOME_FRONT)
      expect(back.player.path).toEqual([])
    }
  })
  it('멀쩡한 저장은 자리를 지킨다', () => {
    const back = load(20, 10)
    expect({ x: back.player.x, y: back.player.y }).toEqual({ x: 20, y: 10 })
  })
  it('갇힌 동반 동물은 기록자 곁으로 옮긴다', () => {
    const c = { kind: 'cat', name: '나비', since: 1, x: 3, y: 13, path: [], facing: 'down', walkTime: 0 }
    const back = load(20, 10, c)
    expect(Math.abs(back.companion!.x - 20) + Math.abs(back.companion!.y - 10)).toBe(1)
  })
})
