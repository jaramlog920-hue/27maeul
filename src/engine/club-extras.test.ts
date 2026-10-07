// 소모임 덧붙임 (2026-10-08): 계절 고르기 · 만든 음식 나누기 · 근황에 함께하기
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { canJoinNews, canShareClubDish, clubDishes, clubSeason, joinNews, shareClubDish } from './club-extras'
import { newGame, type GameState } from './game'

const npc = CONTENT.neighbors.find((d) => !d.marketOnly)!.id
function teaRun(step: 'choose' | 'activity' = 'activity', inv: GameState['inv'] = { beanDish: 2 }): GameState {
  const base = newGame(CONTENT)
  const appt = { id: 'a1', title: '차 모임', activity: 'tea', day: 10, from: 600, to: 720, state: 'running', members: [npc], startedWith: [npc], clubId: 'c1', attended: true } as unknown as GameState['plans']['appts'][number]
  return {
    ...base,
    clock: { day: 10, minute: 630 },
    inv: { ...base.inv, ...inv },
    plans: { ...base.plans, appts: [appt] },
    clubSessions: { a1: { id: 'a1', mode: 'direct', step } },
  }
}

describe('소모임 덧붙임', () => {
  it('계절마다 활동별 고르기 문구가 있다', () => {
    for (const a of ['tea', 'sew', 'garden', 'observe'])
      for (const season of ['spring', 'summer', 'autumn', 'winter'])
        expect((T.clubs.seasonChoice as Record<string, Record<string, string>>)[a][season]).toBeTruthy()
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(clubSeason(teaRun()))
  })

  it('차 모임에 만든 음식을 한 번 나눈다: 가방에서 하나, 함께한 이웃 마음', () => {
    const s = teaRun()
    expect(clubDishes(s)).toEqual(['beanDish'])
    expect(canShareClubDish(s, 'a1')).toBe(true)
    const t = shareClubDish(s, 'a1', 'beanDish')
    expect(t.inv.beanDish).toBe(1)
    expect(t.hearts[npc]).toBe((s.hearts[npc] ?? 0) + 1)
    expect(canShareClubDish(t, 'a1')).toBe(false)
    expect(canShareClubDish(teaRun('choose'), 'a1')).toBe(false)
    expect(canShareClubDish(teaRun('activity', {}), 'a1')).toBe(false)
  })

  it('근황에 함께하기: 모임마다 한 번, 마음 +2', () => {
    const s = teaRun()
    expect(canJoinNews(s, 'a1', npc)).toBe(true)
    const t = joinNews(s, 'a1', npc)
    expect(t.hearts[npc]).toBe((s.hearts[npc] ?? 0) + 2)
    expect(canJoinNews(t, 'a1', npc)).toBe(false)
  })
})
