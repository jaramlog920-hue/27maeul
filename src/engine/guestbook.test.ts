// 계획 21 R10: 서고 방명록 — 사흘에 하루꼴, 순위 날엔 다른 마을 서기, 수입 없음, 30줄까지
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { FORBIDDEN, FORBIDDEN_PLACES } from '../content/forbidden'
import { guestMorning, isRankDay, newGame, type GameState } from './game'
import { ourScore } from './villages'

const at = (day: number, g?: GameState['guestbook']): GameState => ({ ...newGame(CONTENT), clock: { day, minute: 360 }, guestbook: g })

describe('서고 방명록', () => {
  it('사흘에 하루꼴로 한 줄, 같은 날 두 번 없음, 순위 날엔 서기', () => {
    let s = at(3)
    let n = 0
    for (let d = 3; d <= 92; d++) {
      const before = s.guestbook?.length ?? 0
      s = guestMorning({ ...s, clock: { day: d, minute: 360 } })
      if ((s.guestbook?.length ?? 0) > before) n++
      expect(guestMorning(s)).toBe(s)
      if (isRankDay(d)) expect(s.guestbook!.at(-1)).toMatchObject({ day: d, kind: 'scribe' })
    }
    expect(n).toBeGreaterThan(15)
    expect(n).toBeLessThan(50)
    expect(s.guestbook!.length).toBeLessThanOrEqual(30)
    expect(s.coins).toBe(at(3).coins)
  })
  it('방명록 줄은 서고 점수에 더해지고, 문구에 금지어·지명이 없다', () => {
    expect(ourScore({ ...at(3), guestbook: [{ day: 3, kind: 'kid' }] })).toBe(ourScore(at(3)) + 1)
    for (const v of Object.values(T.guestbook.lines)) for (const re of [...FORBIDDEN, ...FORBIDDEN_PLACES]) expect(re.test(v), `${v} ${re}`).toBe(false)
  })
})
