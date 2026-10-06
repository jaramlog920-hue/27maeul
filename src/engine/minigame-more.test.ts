// 새 손일 놀이 셋과 손에 익은 연장 (사용자 요청: 놀이가 다 똑같다 → 몇 가지 다르게, 아이템으로 건너뛰기)
import { CONTENT } from '../content/catalog'
import { newGame, trade, TRADES } from './game'
import { RECIPES } from './items'
import {
  finishNow,
  HOLD_DOWN,
  HOLD_NEED,
  HOLD_UP,
  isDone,
  litCell,
  ORDER_ROUNDS,
  ORDER_SHOW,
  progressOf,
  showing,
  startMini,
  stepMini,
  tapMini,
  WEAVE_NEED,
  type HoldState,
  type MiniState,
  type OrderState,
} from './minigame'
import type { Minigame } from './types'

const rng = () => 0.5

describe('길게 누르기', () => {
  it('밝은 칸에서 떼면 한 번, 두 번이면 끝', () => {
    let s = startMini('hold', rng) as HoldState
    for (let i = 0; i < HOLD_NEED; i++) {
      s = tapMini(s, HOLD_DOWN) as HoldState
      const mid = (s.zone[0] + s.zone[1]) / 2
      s = stepMini(s, mid / 0.6, rng) as HoldState
      s = tapMini(s, HOLD_UP) as HoldState
      expect(s.flash).toBe('hit')
    }
    expect(isDone(s)).toBe(true)
  })
  it('너무 일찍 떼면 다시, 너무 오래 누르면 넘쳐 처음부터 (실패는 없다)', () => {
    let s = tapMini(startMini('hold', rng), HOLD_DOWN) as HoldState
    s = tapMini(stepMini(s, 0.1, rng), HOLD_UP) as HoldState
    expect([s.hits, s.flash]).toEqual([0, 'miss'])
    s = stepMini(tapMini(s, HOLD_DOWN), 5, rng) as HoldState
    expect([s.fill, s.holding, s.flash]).toEqual([0, false, 'miss'])
  })
})

describe('번갈아 누르기', () => {
  it('왼쪽·오른쪽 차례로 열 번, 같은 쪽을 또 누르면 세지 않는다', () => {
    let s: MiniState = startMini('weave', rng)
    s = tapMini(s, 1)
    expect(progressOf(s)).toBe(0)
    for (let i = 0; i < WEAVE_NEED; i++) s = tapMini(s, i % 2)
    expect(isDone(s)).toBe(true)
  })
})

describe('순서 기억하기', () => {
  it('보여 주는 동안엔 누르지 못하고, 같은 차례로 누르면 두 판 만에 끝', () => {
    let s = startMini('order', rng) as OrderState
    expect(showing(s)).toBe(true)
    expect(litCell(s)).toBe(s.seq[0])
    expect(tapMini(s, s.seq[0])).toBe(s)
    for (let r = 0; r < ORDER_ROUNDS; r++) {
      while (showing(s)) s = stepMini(s, ORDER_SHOW / 2, rng) as OrderState
      for (let i = 1; i < s.seq.length; i++) expect(s.seq[i]).not.toBe(s.seq[i - 1])
      for (const n of [...s.seq]) s = tapMini(s, n) as OrderState
    }
    expect(isDone(s)).toBe(true)
  })
  it('틀리면 차례를 처음부터 다시 보여 주고, 다시 본 대로 첫 칸부터 누르면 맞는다', () => {
    let s = startMini('order', rng) as OrderState
    while (showing(s)) s = stepMini(s, 0.3, rng) as OrderState
    s = tapMini(s, s.seq[0]) as OrderState
    s = tapMini(s, (s.seq[1] + 1) % 4) as OrderState
    expect([s.step, s.flash, showing(s)]).toEqual([0, 'miss', true])
    while (showing(s)) s = stepMini(s, 0.3, rng) as OrderState
    for (const n of [...s.seq]) s = tapMini(s, n) as OrderState
    expect(s.rounds).toBe(1)
  })
})

describe('여러 가지 놀이와 손에 익은 연장', () => {
  it('손일·이웃 돕기에 여섯 가지가 고루 쓰인다', () => {
    const used = new Set<Minigame>([...Object.values(RECIPES).map((r) => r.minigame), ...CONTENT.neighbors.map((n) => n.help.minigame)])
    expect([...used].sort()).toEqual(['hold', 'mash', 'order', 'pick', 'timing', 'weave'])
  })
  it('어떤 놀이든 연장으로 바로 끝낼 수 있다', () => {
    for (const k of ['mash', 'timing', 'pick', 'hold', 'weave', 'order'] as Minigame[]) expect(isDone(finishNow(startMini(k, rng)))).toBe(true)
  })
  it('장날에 180닢, 하나만', () => {
    const t = TRADES.find((x) => x.id === 'handyKit')!
    const g = newGame(CONTENT)
    const s = trade({ ...g, coins: 500, clock: { ...g.clock, day: 7, minute: 600 } }, t)!
    expect([s.coins, s.inv.handyKit]).toEqual([320, 1])
    expect(trade(s, t)).toBeNull()
  })
})
