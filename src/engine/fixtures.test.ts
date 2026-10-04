// 계획 13: 기록 설비 단계 — 빠르기는 그대로, 덜 번거로움만 (정성 등급은 없앴다)
import { CONTENT, piecesOf } from '../content/catalog'
import { SCENES } from '../content/text'
import {
  bindMinutes,
  canOrderFixture,
  canSeal,
  chapterCost,
  chooseBook,
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
import { FIXTURE_STEPS, fixtureTier, inkYield, lampNightsPerOil, nextFixture } from './fixtures'

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

  it('잉크 제조대: 한 번에 세 병 (좋은 펜은 계획 14부터 병 수를 바꾸지 않는다)', () => {
    const s = { ...newGame(CONTENT), inv: { soot: 1, water: 1 } }
    expect(inkYield(s)).toBe(1)
    expect(inkYield({ ...s, inv: { ...s.inv, goodPen: 1 } })).toBe(1)
    const stand = { ...s, flags: { ...s.flags, 'fix:inkStand': 1 } }
    expect(inkYield(stand)).toBe(3)
    expect(inkYield({ ...stand, inv: { ...stand.inv, goodPen: 1 } })).toBe(3)
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

describe('장 엮기와 봉인 (정성 등급은 없앴다)', () => {
  it('등불·좋은 파피루스와 상관없이 한 장은 늘 파피루스 하나·잉크 하나, 정성 기록은 남지 않는다', () => {
    let s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    const pieces = piecesOf('mk')
    const ch = currentChapter(pieces, [])!
    s = { ...setArrangement(s, 'mk', ch, canonicalOrder(pieces, ch)), collected: pieces.filter((p) => p.chapter === ch).map((p) => p.id) }
    s = { ...at(s, 10 * 60), inv: { papyrus: 1, ink: 1, finePapyrus: 1 }, flags: { ...s.flags, useFine: 1 } }
    expect(chapterCost(s)).toEqual({ papyrus: 1, ink: 1 })
    const { state, result } = submitChapter(s, 'mk', ch, CONTENT)
    expect(result.kind).toBe('done')
    expect(state.careful.mk ?? []).toEqual([])
    expect(state.inv.finePapyrus).toBe(1)
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
