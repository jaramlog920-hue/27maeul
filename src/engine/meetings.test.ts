// 계획 21 R7: 마을 소리내어 읽기 모임·계절 필사 — 이름에 회당·절기 말 없음, 하루·계절 한 번
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { FORBIDDEN } from '../content/forbidden'
import { finishReading, newGame } from './game'
import { dayOf } from './calendar'
import { canRead, isReadingDay, READING_FROM, seasonCopyGift, seasonCopyKey } from './meetings'
import { scheduledEvents } from './events'

describe('마을 소리내어 읽기 모임', () => {
  it('일곱 날에 한 번 저녁, 하루 한 번, 끝나면 경험치', () => {
    const day = [1, 2, 3, 4, 5, 6, 7].find(isReadingDay)!
    const s = { ...newGame(CONTENT), clock: { day, minute: READING_FROM + 10 } }
    expect(canRead({ ...s, clock: { day, minute: 600 } })).toBe('time')
    expect(canRead(s)).toBeNull()
    const after = finishReading(s, CONTENT)
    expect(after.flags.readDay).toBe(day)
    expect(after.stats.wit.xp).toBeGreaterThan(s.stats.wit.xp)
    expect(canRead(after)).toBe('done')
    expect(scheduledEvents(s, CONTENT).some((e) => e.title === T.meetings.reading)).toBe(true)
  })
  it('행사 이름·문구에 회당·안식일·절기 말이 없다', () => {
    for (const v of Object.values(T.meetings)) for (const re of FORBIDDEN) expect(re.test(v), `${v} ${re}`).toBe(false)
  })
})

describe('계절 필사', () => {
  it('계절 15–21일에만, 계절마다 한 번', () => {
    expect(seasonCopyGift(dayOf('spring', 10), {})).toBeNull()
    const d = dayOf('summer', 16)
    expect(seasonCopyGift(d, {})).toBe('vase')
    expect(seasonCopyGift(d, { [seasonCopyKey(d)]: 1 })).toBeNull()
    expect(seasonCopyGift(dayOf('summer', 16, 2), { [seasonCopyKey(d)]: 1 })).toBe('vase')
  })
})
