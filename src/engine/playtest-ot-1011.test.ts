// 2026-10-11 구약 영역 점검(docs/playtest-old-testament-2026-10-11.md)에서 찾은 버그의 회귀 검사
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { heartUp, mendQuarrelWith, readOtWith, type GameState } from './game'
import { legacyGame } from './growth-test-support'
import { otRow } from './ot-books'

const all = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
function withRuth(extra: Partial<GameState> = {}): GameState {
  const base = legacyGame(CONTENT)
  return {
    ...base,
    clock: { day: 80, minute: 600 },
    otProgress: { ...(base.otProgress ?? {}), rut: { completed: all(otRow('rut').chapters) } } as GameState['otProgress'],
    ...extra,
  }
}

describe('1. 구약 함께 읽기·마당 화해도 마음 문턱(이야기 사건)에서 멈춘다', () => {
  it('함께 읽기는 heartUp과 같게 오르고 30분이 흐른다', () => {
    const s = withRuth({ hearts: { ...legacyGame(CONTENT).hearts, wendell: 74 } })
    const want = heartUp(s, 'wendell', 3).hearts.wendell
    expect(want).toBe(74)
    const out = readOtWith(s, 'wendell', CONTENT)
    expect(out.hearts.wendell).toBe(want)
    expect(out.flags.otReadDay).toBe(80)
    expect(out.clock.minute).toBe(600 + 30)
  })
  it('마당 화해도 heartUp을 거친다', () => {
    const s = withRuth({ hearts: { ...legacyGame(CONTENT).hearts, wendell: 74, poppy: 30 }, newland: { builds: [{ id: 'b1', kind: 'courtyard', x: 4, y: 4, facing: 'down', state: 'done', day: 1 }] } as never })
    const out = mendQuarrelWith(s, ['wendell', 'poppy'])
    expect(out.flags.loveCase).toBe(80)
    expect(out.hearts.wendell).toBe(heartUp(s, 'wendell', 5).hearts.wendell)
  })
})

import { facilityAt, GUESTS, settledAt, settledSpot } from './newland-life'
import type { Build } from './newland-build'

describe('8. 입주한 손님은 보이는 시간(8~20시)에만 말이 걸린다', () => {
  const house: Build = { id: 'b1', kind: 'home', x: 16, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 } as Build
  const at = (minute: number) => ({ ...legacyGame(CONTENT), clock: { day: 123, minute }, flags: { ...legacyGame(CONTENT).flags, [`settled:${GUESTS[0].id}`]: 1 }, newland: { builds: [house] } } as unknown as GameState)
  it('06:50에는 빈 칸, 10:10에는 그 손님', () => {
    const spot = settledSpot(house)!
    expect(settledAt(at(10 * 60 + 10), spot)).toBe(GUESTS[0].id)
    expect(facilityAt(at(10 * 60 + 10), spot)).toBe('settled')
    expect(settledAt(at(6 * 60 + 50), spot)).toBeNull()
    expect(facilityAt(at(6 * 60 + 50), spot)).not.toBe('settled')
    expect(settledAt(at(20 * 60 + 5), spot)).toBeNull()
  })
})

import { T } from '../content/text'

it('손님 선물 알림은 "남겼어요" (손님은 다음 날 아침 떠난다 — 2026-10-12 사용자 결정)', () => {
  expect(T.newlandLife.guestGift).toBe('{whoSubj} {itemObj} 남겼어요. 다음에 다시 오면 빈 입주 주택을 내어 줄 수 있어요.')
})
