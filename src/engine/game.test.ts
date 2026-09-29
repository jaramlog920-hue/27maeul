import {
  adoptStray,
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
  type GameState,
} from './game'
import { REQUESTS as REQUESTS_T } from './bonds'
import { fulfillRequest as fulfillRequestT, interactTile as interactTileT, walkDirection as walkDirectionT } from './game'
import { placeAt as placeAtT } from './world'
import { deserialize, loadGame, saveGame, serialize as serializeForTest, SAVE_KEY } from './save'
import { HOME_DOOR, PLACES, START } from './world'
import { heartsOf } from './hearts'
import { STRAY_SPOTS } from './companion'
import { CONTENT, piecesOf } from '../content/catalog'
import type { NeighborDef } from './types'

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
    const s = tapTile(newGame(CONTENT), { x: 6, y: 33 })
    const r = runUntilEvent(s)
    expect(r.events[0].type).toBe('arrived')
    expect(Math.abs(r.state.player.x - 6) + Math.abs(r.state.player.y - 33)).toBe(1)
  })
  it('이웃에게 걸어가 옆에 서면 도착한다', () => {
    let s = at(newGame(CONTENT), 8 * 60)
    s = { ...s, npcs: Object.fromEntries(Object.entries(s.npcs)) }
    const r0 = tick(s, 0.01, zero, CONTENT).state
    const baker = r0.npcs.baker
    expect(baker.visible).toBe(true)
    const r = runUntilEvent(tapTile(r0, { x: Math.round(baker.x), y: Math.round(baker.y) }))
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
    const s = at(newGame(CONTENT), 600, 16)
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
    expect(finishGather(at(s, 600, 10), 'field').inv.barley).toBe(3)
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
    expect(stargaze(at(s, 22 * 60, 1)).scenes).toContain('stars')
    expect(stargaze(at(s, 12 * 60, 1)).scenes).not.toContain('stars')
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

describe('다 쓴 날 아침', () => {
  it('이웃들이 마당에 모여 있다 (상인도)', () => {
    let s: GameState = { ...newGame(CONTENT), flags: { ending: 1 } }
    s = goToSleep(s, CONTENT)
    expect(s.flags.endingDay).toBe(2)
    // 아직 이사 오지 않은 이웃(베 짜는·벌 치는, 서고 권수로 오는 이웃)은 빼고
    const later = (id: string) => {
      const d = CONTENT.neighbors.find((x) => x.id === id)
      return !!d?.joinsAt || d?.joinsAtBooks !== undefined
    }
    for (const n of Object.values(s.npcs).filter((x) => !later(x.id))) {
      expect(n.visible, n.id).toBe(true)
      expect(n.y, n.id).toBeGreaterThanOrEqual(8)
      expect(n.x, n.id).toBeLessThanOrEqual(9)
    }
    // 낮 열두 시가 지나면 제자리로
    const noon = tick({ ...s, clock: { day: 2, minute: 12 * 60 + 1 } }, 0.05, zero, CONTENT).state
    expect(noon.npcs.merchant.goal).toBeNull()
  })
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
    const p = placeFurniture(s, 'rug', { x: 5, y: 4 })!
    expect(p.room).toEqual([{ item: 'rug', x: 5, y: 4 }])
    expect(p.inv.rug).toBeUndefined()
    expect(placeFurniture(s, 'rug', { x: 12, y: 12 })).toBeNull()
    // 깔개 오른쪽 아래 칸을 눌러도 치워진다
    expect(removeFurniture(p, { x: 7, y: 5 }).inv.rug).toBe(1)
  })
  it('식탁 위에 물병을 올리고, 식탁을 치우면 물병도 함께', () => {
    const s = { ...newGame(CONTENT), inv: { table: 1, jar: 1 } }
    // 문 바로 위(6,6)는 막을 수 없다
    expect(placeFurniture(s, 'table', { x: 6, y: 6 })).toBeNull()
    let p = placeFurniture(s, 'table', { x: 7, y: 6 })!
    p = placeFurniture(p, 'jar', { x: 8, y: 6 })!
    expect(p.room).toEqual([{ item: 'table', x: 7, y: 6 }, { item: 'jar', x: 8, y: 6, on: true }])
    // 식탁이 길을 막는다
    expect(tapTile(p, { x: 7, y: 6 }).player.path.some((t) => t.x === 7 && t.y === 6)).toBe(false)
    const back = removeFurniture(p, { x: 8, y: 6 })
    expect(back.room).toEqual([{ item: 'table', x: 7, y: 6 }])
    expect(back.inv.jar).toBe(1)
    const all = removeFurniture(back, { x: 7, y: 6 })
    expect(all.room).toEqual([])
    expect(all.inv).toEqual({ table: 1, jar: 1 })
  })
  it('나의 한 줄은 80자까지, 비우면 지운다', () => {
    let s = setMyLine(newGame(CONTENT), 'lk-015-008', '  '.padEnd(3) + 'ㄱ'.repeat(100))
    expect(s.myLines['lk-015-008']).toHaveLength(80)
    s = setMyLine(s, 'lk-015-008', '   ')
    expect(s.myLines['lk-015-008']).toBeUndefined()
  })
})

describe('특별한 순간', () => {
  it('겨울 둘째 날 밖에 나가면 첫눈', () => {
    let s = at(newGame(CONTENT), 10 * 60, 23)
    s = { ...s, player: { ...s.player, x: 11, y: 9 } }
    const r = tick(s, 0.05, zero, CONTENT)
    expect(r.events).toContainEqual({ type: 'moment', id: 'firstSnow' })
    expect(r.state.scenes).toContain('firstSnow')
    // 한 해에 한 번
    const again = tick({ ...r.state, scenes: [] }, 0.05, zero, CONTENT)
    expect(again.events).toEqual([])
  })
  it('행사 날 저녁 장터에 가면 잔치', () => {
    let s = at(newGame(CONTENT), 18 * 60 + 5, 12)
    s = { ...s, player: { ...s.player, x: 14, y: 14 } }
    // 이웃이 모이기 전에는 아직
    expect(tick(s, 0.05, zero, CONTENT).events).toEqual([])
    s = at(s, 18 * 60 + 31, 12)
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
    const s: GameState = { ...at(newGame(CONTENT), 18 * 60 + 10, 12), flags: { childAsked: 1 } }
    expect(lessonTime(s)).toBe(false)
    expect(lessonTime({ ...s, clock: { day: 11, minute: 18 * 60 + 10 } })).toBe(true)
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
    // 문 위를 막는 걸상(지금은 막는 가구) + 정상 깔개
    const old = { ...s, room: [{ item: 'stool', x: HOME_DOOR.x, y: HOME_DOOR.y }, { item: 'rug', x: 4, y: 4 }], inv: { ...s.inv, stool: 0 } }
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
  it('막힌 쪽으로 걸으려 하면 그쪽을 바라본다', () => {
    const s = newGame(CONTENT)
    const next = walkDirectionT({ ...s, player: { ...s.player, x: 1, y: 1, path: [], facing: 'down' } }, 0, -1)
    expect(next.player.facing).toBe('up')
  })
})
