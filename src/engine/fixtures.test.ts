// 계획 13: 기록 설비 단계와 정성 들인 장 — 빠르기는 그대로, 정성과 덜 번거로움만
import { CONTENT, piecesOf } from '../content/catalog'
import { SCENES } from '../content/text'
import { chaptersOf } from './books'
import {
  bindMinutes,
  canOrderFixture,
  canSeal,
  careNow,
  chapterCost,
  chooseBook,
  eatBread,
  finishCraft,
  fixtureOffers,
  goToSleep,
  lightLamp,
  newGame,
  orderFixture,
  sealBook,
  setArrangement,
  submitChapter,
  type GameState,
} from './game'
import { currentChapter } from './offers'
import { canonicalOrder } from './scroll'
import { CAREFUL_AT, careScore, FIXTURE_STEPS, fixtureTier, goldTrim, inkYield, lampNightsPerOil, nextFixture } from './fixtures'

const at = (s: GameState, minute: number): GameState => ({ ...s, clock: { ...s.clock, minute } })
const moved = (s: GameState): GameState => ({ ...s, flags: { ...s.flags, 'movedIn:carpenter': 1 } })

describe('기록 설비 단계', () => {
  it('기록대·등잔·서가는 셋, 잉크 제조대는 둘 — 목수(기록대·서가·잉크)와 대장장이(등잔)', () => {
    expect(FIXTURE_STEPS.filter((x) => x.line === 'desk').map((x) => x.coins)).toEqual([80, 300])
    expect(FIXTURE_STEPS.filter((x) => x.line === 'shelf').map((x) => x.coins)).toEqual([200, 500])
    expect(FIXTURE_STEPS.filter((x) => x.maker === 'smith').every((x) => x.line === 'lamp')).toBe(true)
    // 윗단계엔 희귀품이 든다
    expect(FIXTURE_STEPS.find((x) => x.line === 'shelf' && x.tier === 2)!.needs).toEqual({ purpleCloth: 1, bronzeOrnament: 1 })
  })

  it('예전에 장날에서 산 넓은 책상·밝은 등잔은 1단계로 친다', () => {
    const s = newGame(CONTENT)
    expect(fixtureTier(s, 'desk')).toBe(0)
    expect(fixtureTier({ ...s, inv: { wideDesk: 1 } }, 'desk')).toBe(1)
    expect(nextFixture({ ...s, inv: { brightLamp: 1 } }, 'lamp')?.tier).toBe(2)
  })

  it('부탁: 닢과 재료를 내고 다음 날 아침 설치 (장면) — 목수는 이사 온 뒤에', () => {
    const s0 = { ...newGame(CONTENT), coins: 1000 }
    expect(canOrderFixture(s0, 'inkStand')).toBe('notMoved')
    expect(canOrderFixture(s0, 'lamp')).toBeNull()
    const s = moved(s0)
    expect(fixtureOffers(s, 'carpenter').map((x) => x.step.line)).toEqual(['desk', 'shelf', 'inkStand'])
    const ordered = orderFixture(s, 'inkStand')!
    expect(ordered.coins).toBe(1000 - 120)
    expect(canOrderFixture(ordered, 'inkStand')).toBe('ordered')
    const morning = goToSleep(at(ordered, 22 * 60), CONTENT)
    expect(fixtureTier(morning, 'inkStand')).toBe(1)
    expect(morning.scenes).toContain('fixed:inkStand:1')
    expect(SCENES['fixed:inkStand:1']).toBeDefined()
    expect(canOrderFixture(morning, 'inkStand')).toBe('done')
  })

  it('희귀품이 모자라면 윗단계를 부탁할 수 없다', () => {
    const s = moved({ ...newGame(CONTENT), coins: 1000, flags: { ...newGame(CONTENT).flags, 'fix:desk': 1 } })
    expect(canOrderFixture(s, 'desk')).toBe('needs')
    const rich = { ...s, inv: { bronzeOrnament: 1 } }
    const o = orderFixture(rich, 'desk')!
    expect(o.inv.bronzeOrnament ?? 0).toBe(0)
  })

  it('잉크 제조대: 한 번에 세 병 (좋은 펜이면 네 병)', () => {
    const s = { ...newGame(CONTENT), inv: { soot: 1, water: 1 } }
    expect(inkYield(s)).toBe(1)
    const stand = { ...s, flags: { ...s.flags, 'fix:inkStand': 1 } }
    expect(inkYield(stand)).toBe(3)
    expect(inkYield({ ...stand, inv: { ...stand.inv, goodPen: 1 } })).toBe(4)
    expect(finishCraft(stand, 'ink').inv.ink).toBe(3)
  })

  it('등잔: 기름 한 병으로 작은 등잔 하룻밤, 두 심지 이틀, 청동 사흘', () => {
    const s = { ...at(newGame(CONTENT), 20 * 60), inv: { oil: 1 } }
    expect(lampNightsPerOil(s)).toBe(1)
    expect(lightLamp(s)!.lampFuel).toBe(0)
    const bronze = { ...s, flags: { ...s.flags, 'fix:lamp': 2 } }
    expect(lightLamp(bronze)!.lampFuel).toBe(2)
  })

  it('설비는 필사를 더 빠르게 하지 않는다 — 장인의 기록대도 넓은 기록대와 같은 시간', () => {
    const s = newGame(CONTENT)
    const wide = { ...s, flags: { ...s.flags, 'fix:desk': 1 } }
    const scribe = { ...s, flags: { ...s.flags, 'fix:desk': 2 } }
    expect(bindMinutes(scribe)).toBe(bindMinutes(wide))
  })
})

describe('정성 들인 장', () => {
  it('좋은 파피루스·집중·좋은 빛·장인의 기록대 한 점씩, 둘 이상이면 정성', () => {
    expect(CAREFUL_AT).toBe(2)
    expect(careScore({ fine: false, focused: false, goodLight: true, deskTier: 0 })).toBe(1)
    expect(careScore({ fine: true, focused: true, goodLight: true, deskTier: 2 })).toBe(4)
  })

  it('낮엔 빛이 좋고, 밤엔 두 심지 등잔부터 — 먹은 날은 집중', () => {
    const s = at(newGame(CONTENT), 10 * 60)
    expect(careNow(s).goodLight).toBe(true)
    expect(careNow(at(s, 21 * 60)).goodLight).toBe(false)
    expect(careNow({ ...at(s, 21 * 60), inv: { brightLamp: 1 } }).goodLight).toBe(true)
    expect(careNow(s).focused).toBe(false)
    const ate = eatBread({ ...s, inv: { bread: 1 }, needs: { ...s.needs, hunger: 40 } })!
    expect(careNow(ate).focused).toBe(true)
    expect(careNow(ate).score).toBe(2)
  })

  it('좋은 파피루스로 쓰기를 켜고 있으면 그것으로 — 없으면 보통 파피루스', () => {
    const s = { ...newGame(CONTENT), inv: { papyrus: 1, ink: 1, finePapyrus: 1 } }
    expect(chapterCost(s)).toEqual({ papyrus: 1, ink: 1 })
    const on = { ...s, flags: { ...s.flags, useFine: 1 } }
    expect(chapterCost(on)).toEqual({ finePapyrus: 1, ink: 1 })
    expect(chapterCost({ ...on, inv: { papyrus: 1, ink: 1 } })).toEqual({ papyrus: 1, ink: 1 })
  })

  it('정성 들인 장이면 적어 두고, 반을 넘으면 책등에 금테', () => {
    let s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    const pieces = piecesOf('mk')
    const ch = currentChapter(pieces, [])!
    s = { ...setArrangement(s, 'mk', ch, canonicalOrder(pieces, ch)), collected: pieces.filter((p) => p.chapter === ch).map((p) => p.id) }
    s = { ...at(s, 10 * 60), inv: { papyrus: 1, ink: 1, bread: 1 }, needs: { ...s.needs, hunger: 30 } }
    s = eatBread(s)!
    const { state, result } = submitChapter(s, 'mk', ch, CONTENT)
    expect(result.kind).toBe('done')
    expect(state.careful.mk).toEqual([ch])
    const n = chaptersOf('mk', CONTENT).length
    expect(goldTrim([ch], n)).toBe(n <= 2)
    expect(goldTrim([...Array(Math.ceil(n / 2)).keys()], n)).toBe(true)
  })

  it('봉인: 서고에 꽂은 책을 봉인용 밀랍으로 한 번', () => {
    const s = { ...newGame(CONTENT), shelved: { mk: 2 as const }, inv: { sealWax: 1 } }
    expect(canSeal({ ...s, shelved: {} }, 'mk')).toBe('notShelved')
    expect(canSeal({ ...s, inv: {} }, 'mk')).toBe('noWax')
    const sealed = sealBook(s, 'mk')
    expect(sealed.sealed).toEqual(['mk'])
    expect(sealed.inv.sealWax ?? 0).toBe(0)
    expect(canSeal(sealed, 'mk')).toBe('sealed')
  })
})
