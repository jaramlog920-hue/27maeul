import { advance, darkness, formatTime, MINUTE_CAP, NIGHT_DARK, newClock, phaseOf, seasonOf, sleepClock } from './clock'
import { DOZE_AFTER, IDLE_GAP, pickIdleAction, stepIdle, IDLE_RESET, greet } from './autonomy'

describe('clock', () => {
  it('하루는 06:00에 시작한다', () => {
    expect(newClock()).toEqual({ day: 1, minute: 360 })
  })
  it('시간대', () => {
    expect(phaseOf(6 * 60)).toBe('morning')
    expect(phaseOf(12 * 60)).toBe('day')
    expect(phaseOf(18 * 60)).toBe('evening')
    expect(phaseOf(22 * 60)).toBe('night')
    expect(phaseOf(25 * 60)).toBe('night')
  })
  it('1초는 1분, 02:00에서 멈춘다', () => {
    expect(advance({ day: 1, minute: 360 }, 30).minute).toBe(390)
    expect(advance({ day: 1, minute: MINUTE_CAP - 1 }, 100).minute).toBe(MINUTE_CAP)
  })
  it('23시 넘어 자면 08:00에 일어난다', () => {
    expect(sleepClock({ day: 2, minute: 22 * 60 })).toEqual({ day: 3, minute: 360 })
    expect(sleepClock({ day: 2, minute: 23 * 60 })).toEqual({ day: 3, minute: 480 })
    expect(sleepClock({ day: 2, minute: 25 * 60 })).toEqual({ day: 3, minute: 480 })
  })
  it('계절은 7일마다 바뀌고 돈다', () => {
    expect(seasonOf(1)).toBe('spring')
    expect(seasonOf(7)).toBe('spring')
    expect(seasonOf(8)).toBe('summer')
    expect(seasonOf(22)).toBe('winter')
    expect(seasonOf(29)).toBe('spring')
  })
  it('시각 표기', () => {
    expect(formatTime(6 * 60 + 5)).toBe('06:05')
    expect(formatTime(25 * 60 + 30.7)).toBe('01:30')
  })
  it('어둠은 낮에 0, 한밤에 최대', () => {
    expect(darkness(12 * 60)).toBe(0)
    expect(darkness(23 * 60 + 30)).toBe(NIGHT_DARK)
    expect(darkness(25 * 60)).toBe(NIGHT_DARK)
    const dusk = darkness(19 * 60)
    expect(dusk).toBeGreaterThan(0)
    expect(dusk).toBeLessThan(0.3)
  })
})

describe('autonomy', () => {
  it('6초 전에는 아무것도 하지 않는다', () => {
    expect(pickIdleAction({ idleSeconds: 5.9, minute: 600 }, () => 0)).toBeNull()
  })
  it('오래 두면 존다', () => {
    expect(pickIdleAction({ idleSeconds: DOZE_AFTER, minute: 600 }, () => 0)?.kind).toBe('doze')
  })
  it('가중치 선택은 결정적이다', () => {
    expect(pickIdleAction({ idleSeconds: 10, minute: 600 }, () => 0)?.kind).toBe('look')
    expect(pickIdleAction({ idleSeconds: 10, minute: 22 * 60 }, () => 0.99)?.kind).toBe('yawn')
    expect(pickIdleAction({ idleSeconds: 10, minute: 600 }, () => 0.99)?.kind).toBe('yawn')
    expect(pickIdleAction({ idleSeconds: 10, minute: 600 }, () => 0.4)?.kind).toBe('stretch')
  })
  it('동작이 끝나면 쉬었다가 다음 동작을 고른다', () => {
    let s = stepIdle({ seconds: 10, action: { kind: 'look', left: 0.5 }, cooldown: 0 }, 1, 600, () => 0)
    expect(s.action).toBeNull()
    expect(s.cooldown).toBe(IDLE_GAP)
    s = stepIdle(s, IDLE_GAP - 0.5, 600, () => 0)
    expect(s.action).toBeNull()
    s = stepIdle(s, 1, 600, () => 0)
    expect(s.action?.kind).toBe('look')
  })
  it('처음 6초는 가만히 있는다', () => {
    const s = stepIdle(IDLE_RESET, 1, 600, () => 0)
    expect(s.action).toBeNull()
    expect(s.seconds).toBe(1)
  })
  it('인사는 입력 시간을 되돌린다', () => {
    expect(greet().action?.kind).toBe('greet')
    expect(greet().seconds).toBe(0)
  })
})
