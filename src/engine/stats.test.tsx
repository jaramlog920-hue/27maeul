// 계획 11 작업 4: 능력치 다섯 — 지능·손재주·매력·근력·운 (단계·경험치·타고난 값)
import { render } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { StatsView } from '../features/bag/Bag'
import { finishCraft, finishGather, finishHelp, giveGift, greetNeighbor, listen, newGame, sellPrice, stargaze, train, type GameState } from './game'
import { harvest, plant, water } from './garden'
import { startMini, tapMini } from './minigame'
import { hintOptions, type Question } from './quiz'
import { deserialize, serialize } from './save'
import {
  addXp,
  BORN_BONUS,
  charmBonus,
  extraChance,
  freshStats,
  handEase,
  leveledUp,
  luckyExtra,
  MAX_LEVEL,
  progressOf,
  quizDims,
  rainBonus,
  sanitizeStats,
  sellBonus,
  STAT_IDS,
  tiredScale,
  visitBonus,
  XP,
  XP_TO_NEXT,
  type StatId,
  type Stats, statScore } from './stats'

const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id)!
/** 이 능력치를 이 단계로 */
function at(level: number, id: StatId, base: Stats = freshStats()): Stats {
  return { ...base, [id]: { ...base[id], level, xp: 0 } }
}

describe('단계와 경험치', () => {
  it('새 게임은 다섯 모두 1단계, 경험치 0, 타고난 값 0', () => {
    const s = newGame(CONTENT)
    expect(STAT_IDS).toEqual(['wit', 'hand', 'charm', 'strength', 'luck'])
    for (const id of STAT_IDS) expect(s.stats[id]).toEqual({ level: 1, xp: 0, born: 0 })
  })

  it('다음 단계까지 30·60·100·150 — 넘친 경험치는 다음 단계로 이어진다', () => {
    expect(XP_TO_NEXT).toEqual([30, 60, 100, 150])
    let st = addXp(freshStats(), 'hand', 29)
    expect(st.hand).toMatchObject({ level: 1, xp: 29 })
    st = addXp(st, 'hand', 5)
    expect(st.hand).toMatchObject({ level: 2, xp: 4 })
    st = addXp(st, 'hand', 1000)
    expect(st.hand).toMatchObject({ level: MAX_LEVEL, xp: 0 })
    // 5단계면 더 쌓이지 않는다
    expect(addXp(st, 'hand', 50)).toBe(st)
    // 다른 능력치는 그대로
    expect(st.wit).toEqual({ level: 1, xp: 0, born: 0 })
  })

  it('타고난 값 한 칸마다 경험치가 25% 더 (0–2까지)', () => {
    expect(BORN_BONUS).toBe(0.25)
    const born = freshStats({ strength: 2, luck: 9, wit: -1 })
    expect(born.strength.born).toBe(2)
    expect(born.luck.born).toBe(2)
    expect(born.wit.born).toBe(0)
    expect(addXp(born, 'strength', 10).strength.xp).toBe(15)
    expect(addXp(freshStats({ strength: 1 }), 'strength', 10).strength.xp).toBe(12.5)
  })

  it('오른 능력치를 알려 주고, 찬 정도를 0–1로', () => {
    const before = addXp(freshStats(), 'charm', 28)
    const after = addXp(before, 'charm', 3)
    expect(leveledUp(before, after)).toEqual(['charm'])
    expect(leveledUp(after, after)).toEqual([])
    // 저장을 불러와 한꺼번에 크게 바뀐 것은 알리지 않는다
    expect(leveledUp(before, addXp(before, 'charm', 100))).toEqual([])
    expect(leveledUp(addXp(before, 'charm', 100), before)).toEqual([])
    expect(progressOf(after.charm)).toBeCloseTo(1 / 60)
    expect(progressOf({ level: MAX_LEVEL, xp: 0, born: 0 })).toBe(1)
  })

  it('옛 저장·이상한 값은 1단계로, 저장하고 불러와도 남는다', () => {
    expect(sanitizeStats(undefined)).toEqual(freshStats())
    expect(sanitizeStats({ wit: { level: 9, xp: 'a', born: 5 }, hand: { level: 2, xp: 999 } })).toMatchObject({
      wit: { level: 5, xp: 0, born: 2 },
      hand: { level: 2, xp: 60, born: 0 },
    })
    const s = newGame(CONTENT)
    const trained = train(s, 'luck', 40)
    expect(deserialize(serialize(trained), CONTENT)!.stats.luck).toMatchObject({ level: 2, xp: 10 })
    // 칸이 없던 옛 저장
    const old = JSON.parse(serialize(s))
    delete old.stats
    expect(deserialize(JSON.stringify(old), CONTENT)!.stats).toEqual(freshStats())
  })
})

describe('하는 일마다 오르는 능력치', () => {
  const s0 = (): GameState => newGame(CONTENT)

  it('근력: 물 긷기·갈대 꺾기 같은 모으기, 텃밭 일', () => {
    const s = finishGather(s0(), 'well')
    expect(s.stats.strength.xp).toBe(XP.gather)
    const garden = { ...s0(), inv: { seedHerb: 1 } }
    const tile = { x: 14, y: 3 }
    const planted = plant(garden, tile, 'herb')!
    expect(planted.stats.strength.xp).toBe(XP.garden)
    expect(water(planted, tile)!.stats.strength.xp).toBe(XP.garden * 2)
    const ripe = { ...planted, garden: { '14,3': { crop: 'herb' as const, grown: 9, wateredDay: null } } }
    expect(harvest(ripe, tile)!.stats.strength.xp).toBe(XP.garden * 2)
  })

  it('손재주: 작업대·화덕 일', () => {
    const s = finishCraft({ ...s0(), inv: { reed: 1 } }, 'papyrus')
    expect(s.inv.papyrus).toBe(1)
    expect(s.stats.hand.xp).toBe(XP.craft)
  })

  it('매력: 인사·선물·돕기 (돕기는 근력도)', () => {
    const greeted = greetNeighbor(s0(), 'baker')
    expect(greeted.stats.charm.xp).toBe(XP.greet)
    const gifted = giveGift({ ...s0(), inv: { bread: 1 } }, def('baker'), 'bread')!.state
    expect(gifted.stats.charm.xp).toBe(XP.gift)
    const helped = finishHelp({ ...s0(), inv: { water: 1 } }, def('baker'))
    expect(helped.helped).toContain('baker')
    expect(helped.stats.charm.xp).toBe(XP.help)
    expect(helped.stats.strength.xp).toBe(XP.help)
  })

  it('지능: 이웃 이야기를 들으면', () => {
    const s = s0()
    const [npc, piece] = Object.entries({ ...s.offers })[0] ?? []
    const withOffer = npc ? s : { ...s, offers: { baker: CONTENT.pieces[0].id } }
    const who = npc ?? 'baker'
    const heard = listen(withOffer, who, CONTENT)
    expect(heard.pieceId).toBe(piece ?? CONTENT.pieces[0].id)
    expect(heard.state.stats.wit.xp).toBe(XP.listen)
  })

  it('운: 일로는 오르지 않고, 맑은 밤 별을 보면 하루 한 번 조금', () => {
    let clearNight: GameState | null = null
    for (let day = 1; day < 60 && !clearNight; day++) {
      const s = s0()
      const t = { ...s, clock: { ...s.clock, day, minute: 22 * 60 } }
      const once = stargaze(t, CONTENT).state
      if (once.stats.luck.xp > 0) clearNight = once
    }
    expect(clearNight).not.toBeNull()
    expect(clearNight!.stats.luck.xp).toBe(XP.stars)
    // 같은 밤 또 앉아도 그대로
    expect(stargaze(clearNight!, CONTENT).state.stats.luck.xp).toBe(XP.stars)
    const worked = finishCraft(finishGather({ ...s0(), inv: { reed: 1 } }, 'well'), 'papyrus')
    expect(worked.stats.luck.xp).toBe(0)
  })
})

describe('효과는 작게', () => {
  it('근력: 단계마다 피로 6% 덜 — 모으기와 돕기', () => {
    expect(tiredScale(at(1, 'strength'))).toBe(1)
    expect(tiredScale(at(5, 'strength'))).toBeCloseTo(0.76)
    const s = newGame(CONTENT)
    const weak = finishGather(s, 'well')
    const strong = finishGather({ ...s, stats: at(5, 'strength') }, 'well')
    expect(strong.needs.fatigue).toBeLessThan(weak.needs.fatigue)
  })

  it('가끔 하나 더: 1단계는 없고, 손재주·근력 단계마다 4%, 운이 3% 거든다 — 같은 날·같은 때는 같은 결과', () => {
    expect(extraChance(freshStats(), 'hand')).toBe(0)
    expect(extraChance(at(5, 'hand'), 'hand')).toBeCloseTo(0.16)
    expect(extraChance(at(3, 'luck', at(5, 'strength')), 'strength')).toBeCloseTo(0.22)
    for (let n = 0; n < 50; n++) expect(luckyExtra(freshStats(), 'hand', 3, 1, n)).toBe(false)
    const strong = at(5, 'strength', at(5, 'luck'))
    const hits = Array.from({ length: 400 }, (_, n) => luckyExtra(strong, 'strength', 7, 1, n)).filter(Boolean).length
    expect(hits).toBeGreaterThan(40)
    expect(hits).toBeLessThan(160)
    expect(luckyExtra(strong, 'strength', 7, 1, 5)).toBe(luckyExtra(strong, 'strength', 7, 1, 5))
  })

  it('가끔 하나 더는 실제로 생기고, 가방이 넘치면 더하지 않는다', () => {
    const s = newGame(CONTENT)
    const strong = { ...s, stats: at(5, 'strength', at(5, 'luck')) }
    let extra = 0
    for (let minute = 360; minute < 360 + 400; minute++) {
      const got = finishGather({ ...strong, clock: { ...strong.clock, minute } }, 'reeds')
      if ((got.inv.reed ?? 0) === 3) extra++
      else expect(got.inv.reed).toBe(2)
    }
    expect(extra).toBeGreaterThan(0)
    // 가방 8개 + 2 = 10 은 넘친다 → 막히거나 하나 더는 없다
    for (let minute = 360; minute < 460; minute++) {
      const full = finishGather({ ...strong, inv: { reed: 7 }, clock: { ...strong.clock, minute } }, 'reeds')
      expect(full.inv.reed).toBe(9)
    }
  })

  it('매력: 하트가 조금 더 (3단계 +1점, 5단계 +2점), 장날 파는 값 +1닢 (3단계부터)', () => {
    expect(charmBonus(at(1, 'charm'))).toBe(0)
    expect(charmBonus(at(3, 'charm'))).toBe(1)
    expect(charmBonus(at(5, 'charm'))).toBe(2)
    const s = newGame(CONTENT)
    const plain = greetNeighbor(s, 'baker').hearts.baker - (s.hearts.baker ?? 0)
    const charming = greetNeighbor({ ...s, stats: at(5, 'charm') }, 'baker').hearts.baker - (s.hearts.baker ?? 0)
    expect(charming).toBe(plain + 2)
    expect(sellBonus(at(2, 'charm'))).toBe(0)
    expect(sellPrice(s, 'ink')).toBe(8)
    expect(sellPrice({ stats: at(3, 'charm') }, 'ink')).toBe(9)
    expect(sellPrice(s, 'bread')).toBeUndefined()
  })

  it('운: 비 온 다음 날 빗물 +1 (3단계부터), 이웃이 찾아올 확률 단계마다 +5%', () => {
    expect(rainBonus(at(2, 'luck'))).toBe(0)
    expect(rainBonus(at(3, 'luck'))).toBe(1)
    expect(visitBonus(freshStats())).toBe(0)
    expect(visitBonus(at(5, 'luck'))).toBeCloseTo(0.2)
  })

  it('손재주: 작업대 손놀림이 너그럽게 — 찧기 한 번에 더 차고, 타이밍 구간이 넓어진다', () => {
    expect(handEase(freshStats())).toBe(0)
    expect(handEase(at(5, 'hand'))).toBeCloseTo(0.2)
    const rng = () => 0.5
    const plain = tapMini(startMini('mash', rng), undefined)
    const eased = tapMini(startMini('mash', rng, 0.2), undefined)
    expect(eased.kind === 'mash' && plain.kind === 'mash' && eased.progress > plain.progress).toBe(true)
    const t0 = startMini('timing', rng)
    const t1 = startMini('timing', rng, 0.2)
    if (t0.kind !== 'timing' || t1.kind !== 'timing') throw new Error('timing')
    expect(t1.zone[1] - t1.zone[0]).toBeGreaterThan(t0.zone[1] - t0.zone[0])
    // 0이면 예전 그대로
    expect(startMini('mash', rng, 0)).toEqual({ kind: 'mash', progress: 0 })
  })

  it('지능: 장 기록 퀴즈에서 틀린 보기를 흐리게 — 3단계 하나, 5단계 둘, 답은 흐리지 않고 둘은 남긴다', () => {
    expect(quizDims(at(2, 'wit'))).toBe(0)
    expect(quizDims(at(3, 'wit'))).toBe(1)
    expect(quizDims(at(5, 'wit'))).toBe(2)
    const q: Question = { kind: 'verse', ref: '막 1:1', options: ['a', 'b', 'c', 'd'], answer: 'b' }
    expect(hintOptions(q, 0)).toEqual([])
    expect(hintOptions(q, 1)).toEqual(['d'])
    expect(hintOptions(q, 2)).toEqual(['d', 'c'])
    expect(hintOptions({ ...q, options: ['a', 'b', 'c'] }, 2)).toEqual(['c'])
    expect(hintOptions({ ...q, answer: 'd' }, 2)).toEqual(['c', 'b'])
    expect(hintOptions({ kind: 'puzzle', ref: 'x', words: ['a'], answer: ['a'] }, 2)).toEqual([])
  })
})

describe('가방의 능력치', () => {
  it('점수는 1단계 1점, 5단계 100점', () => {
    expect(statScore({ level: 1, xp: 0, born: 0 })).toBe(1)
    expect(statScore({ level: 5, xp: 0, born: 0 })).toBe(100)
    expect(statScore({ level: 3, xp: 0, born: 0 })).toBe(27)
  })
  it('다섯 이름·단계·타고난 별', () => {
    const stats = { ...at(3, 'charm'), luck: { level: 1, xp: 0, born: 2 } }
    const { container } = render(<StatsView stats={stats} />)
    const names = T.stats.names as Record<StatId, string>
    for (const id of STAT_IDS) expect(container.textContent).toContain(names[id])
    // 점수 1–100 (3단계 시작 = 쌓은 경험치 90/340 → 27점), 단계는 title에
    expect(container.querySelector('[data-stat="charm"] .stat-level')!.textContent).toBe(`${statScore(stats.charm)}/100`)
    expect(container.querySelector('[data-stat="charm"] .stat-level')!.getAttribute('title')).toBe('3단계')
    expect(container.querySelector('[data-stat="luck"] .stat-born')!.textContent).toBe('★★')
    expect(container.querySelectorAll('[data-stat="charm"] .stat-bar > span[style*="100%"]')).toHaveLength(3)
  })
})
