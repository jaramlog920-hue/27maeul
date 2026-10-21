// 2026-10-21 중반 이후 점검에서 고친 것들
import { CONTENT } from '../content/catalog'
import lifeText from '../content/life-text.json'
import { applyEarlyGrowth, canDate, canSchool, type GameState } from './game'
import { featureAccess, FEATURE_RULES } from './feature-rules'
import { gameAtChapters } from './growth-test-support'
import { festivalDays } from './fest'
import { newChild, ADULT_AT } from './child'

const scenes = (lifeText as { scenes: Record<string, unknown> }).scenes

describe('열리는 날 알림 (40장 뒤로도)', () => {
  const late = ['deepRelation', 'convenience', 'dating', 'guestbook', 'autonomy', 'spouseRoom', 'events', 'marriage', 'rank', 'childRoom', 'childBirth', 'childActivities', 'school', 'generations'] as const
  it.each(late)('%s: 그 장을 마친 순간 알림 장면이 하나 생기고 글이 있다', (id) => {
    const n = (FEATURE_RULES[id] as { full: { chapters: number } }).full.chapters
    const before = gameAtChapters(CONTENT, n - 1)
    const after = gameAtChapters(CONTENT, n)
    const next = applyEarlyGrowth(before, { ...after, scenes: [] }, CONTENT)
    expect(next.scenes).toContain(`growth:${id}:full`)
    expect(scenes[`growth:${id}:full`]).toBeDefined()
    // 다시 불러도 두 번 나오지 않는다
    expect(applyEarlyGrowth(before, { ...next, scenes: [] }, CONTENT).scenes).not.toContain(`growth:${id}:full`)
  })
})

describe('여는 때 맞추기', () => {
  it('서고지기와 방명록, 결혼과 배우자 생활은 같은 날 열린다', () => {
    const s = gameAtChapters(CONTENT, 70)
    expect(featureAccess(s, 'library')).toBe('full')
    expect(featureAccess(gameAtChapters(CONTENT, 69), 'library')).toBe('locked')
    expect(featureAccess(gameAtChapters(CONTENT, 90), 'spouseLife')).toBe('full')
  })
  it('90–99장에 결혼해도 데이트가 다시 잠기지 않는다', () => {
    const s = gameAtChapters(CONTENT, 92)
    const married: GameState = { ...s, romance: { partner: 'cosmo', stage: 'married', since: 1, weddingDay: 10, marriedDay: 10 } }
    expect(canDate(married, 'tea', CONTENT)).not.toBe('locked')
  })
})

describe('아이·잔치', () => {
  it('다 자란 아이는 배움터에 맡기지 않는다', () => {
    const s = gameAtChapters(CONTENT, 150)
    const day = s.clock.day + 200
    const grown: GameState = { ...s, clock: { day, minute: 600 }, coins: 100, child: { ...newChild(day - ADULT_AT - 1, s.stats, undefined), born: day - ADULT_AT - 1 } }
    expect(canSchool(grown)).toBe('grown')
  })
  it('비 오는 날·내 결혼 잔치 날은 잔치 역할을 고르는 날에서 빠진다', () => {
    const s = gameAtChapters(CONTENT, 90)
    const days = festivalDays({ ...s, clock: { day: 1, minute: 360 } } as GameState)
    for (let d = 1; d < 120; d++) {
      const list = festivalDays({ ...s, clock: { day: d, minute: 360 }, romance: { ...s.romance, weddingDay: d } } as GameState)
      expect(list).not.toContain(d)
    }
    void days
  })
})

describe('220–260장에 열리는 것 (2026-10-21 사용자)', () => {
  it.each(['villageBook', 'grandBirth', 'finale'] as const)('%s: 그 장에 알림이 나온다', (id) => {
    const n = (FEATURE_RULES[id] as { full: { chapters: number } }).full.chapters
    const next = applyEarlyGrowth(gameAtChapters(CONTENT, n - 1), { ...gameAtChapters(CONTENT, n), scenes: [] }, CONTENT)
    expect(next.scenes).toContain(`growth:${id}:full`)
    expect(scenes[`growth:${id}:full`]).toBeDefined()
  })
})

describe('모든 이웃의 꿈터 (2026-10-21 사용자)', () => {
  it('새 터가 열리고 마음 넷이면 꿈 이야기를 듣고, 들으면 꿈터 주인 목록에 오른다 — 자리를 물려준 이웃은 빼고', async () => {
    const { canHearDream } = await import('./newland-life')
    const { kidWorkOwners } = await import('./kid-work')
    const s = gameAtChapters(CONTENT, 260)
    const open = { ...s, flags: { ...s.flags, newlandGift: 1 }, hearts: { ...s.hearts, baker: 45 } } as GameState
    expect(canHearDream(open, 'baker')).toBe(true)
    expect(canHearDream({ ...open, gen: { ...open.gen!, retired: { baker: { heir: 'g-1', day: 1 } } } } as GameState, 'baker')).toBe(false)
    const heard = { ...open, flags: { ...open.flags, 'dream:baker': 5 } } as GameState
    expect(kidWorkOwners(heard).map((o) => o.owner)).toContain('npc:baker')
  })
})

describe('나루는 여행과 함께 (2026-10-21 사용자: 40장 하면 배 탈 수 있게)', () => {
  it('40장을 마치면 책이 한 권도 안 끝났어도 나루가 열린다', async () => {
    const { zoneBooks } = await import('./feature-rules')
    const { lockedZones } = await import('./world')
    const { newGame, recordProgress } = await import('./game')
    // 마태복음부터 차례로 (긴 책 둘 — 마친 책은 두 권뿐)
    const at = (n: number) => { const s = newGame(CONTENT); s.progress.mt.completed = Array.from({ length: Math.min(28, n) }, (_, i) => i + 1); s.progress.mk.completed = Array.from({ length: Math.max(0, n - 28) }, (_, i) => i + 1); return recordProgress(s).state }
    expect(lockedZones(zoneBooks(at(39))).some((z) => z.id === 'dock')).toBe(true)
    expect(lockedZones(zoneBooks(at(40))).some((z) => z.id === 'dock')).toBe(false)
    expect(lockedZones(zoneBooks(at(40))).some((z) => z.id === 'vineyard')).toBe(true)
  })
})
