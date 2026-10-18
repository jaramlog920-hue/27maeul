// 여행 판 주사위는 떠날 때의 세계·날·행선지·다녀온 횟수로 정해진다 — 새로고침해 다시 떠나도 같은 주사위 (2026-10-18 감사 M-4)
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { mulberry32 } from './offers'
import { NEW_BOARD, playTurn, rollDie, tripSeed } from './trip-board'

function playAll(seed: number) {
  const rnd = mulberry32(seed)
  let b = NEW_BOARD
  const rolls: number[] = []
  while (!b.done) {
    const n = rollDie(rnd)
    rolls.push(n)
    b = playTurn(b, n, rnd, { withChild: false }).board
  }
  return { rolls, rewards: b.rewards }
}

describe('여행 판 씨앗', () => {
  const s = { ...newGame(CONTENT), clock: { day: 20, minute: 480 } }
  it('같은 날 같은 곳이면 다시 떠나도 주사위와 보상이 같다', () => {
    expect(playAll(tripSeed(s, 'harbor'))).toEqual(playAll(tripSeed({ ...s }, 'harbor')))
  })
  it('날·행선지·다녀온 횟수가 다르면 씨앗이 다르다', () => {
    const base = tripSeed(s, 'harbor')
    expect(tripSeed({ ...s, clock: { ...s.clock, day: 21 } }, 'harbor')).not.toBe(base)
    expect(tripSeed(s, 'hillTown')).not.toBe(base)
    expect(tripSeed({ ...s, flags: { ...s.flags, 'trip:harbor': 1 } }, 'harbor')).not.toBe(base)
  })
})
