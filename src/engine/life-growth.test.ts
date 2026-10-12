import { CONTENT } from '../content/catalog'
import { SCENES } from '../content/text'
import { BOOKS } from './types'
import { NT_CHAPTER_COUNTS, villageBookCount } from './progression'
import { featureAccess, FEATURE_RULES } from './feature-rules'
import { applyEarlyGrowth, canGiveBouquet, canGiveCord, canOrderHome, canTrip, goToSleep, newGame } from './game'
import { canCook, startCook, deliverCook } from './cooking'
import { createClub, type ClubInput } from './clubs'
import { canOpenStall } from './stall'
import { canPick, offeredProjects } from './projects'
import { FACILITY_IDS } from './village-sites'
import { DEST_IDS } from './travel'

function chapters(n: number) {
  const s = newGame(CONTENT)
  s.progress.mt.completed = Array.from({ length: n }, (_, i) => i + 1)
  return s
}
function books(n: number) {
  const s = newGame(CONTENT)
  // 짧은 책부터 써도 같은 조건: 서고 배치나 성경 순서와 무관하다.
  const order = [...BOOKS].sort((a, b) => NT_CHAPTER_COUNTS[a] - NT_CHAPTER_COUNTS[b])
  for (const book of order.slice(0, n)) s.progress[book].completed = Array.from({ length: NT_CHAPTER_COUNTS[book] }, (_, i) => i + 1)
  return s
}
const club: ClubInput = { name: '작은 차 모임', place: 'hallTable', members: ['baker'], weekday: 2, slot: 'morning', activity: 'tea' }

it('15·20·25장의 체험과 4·5·7권 정식 해금은 독립적이다', () => {
  for (const [id, chapter, count] of [['cooking', 15, 4], ['clubs', 20, 5], ['community', 25, 7]] as const) {
    expect(featureAccess(chapters(chapter - 1), id)).toBe('locked')
    expect(featureAccess(chapters(chapter), id)).toBe('preview')
    expect(featureAccess(books(count), id)).toBe('full')
  }
  for (const [id, rule] of Object.entries(FEATURE_RULES)) {
    if ('full' in rule && rule.full.books) expect(featureAccess(books(rule.full.books), id as keyof typeof FEATURE_RULES)).toBe('full')
  }
})
it('새 게임의 잠긴 생활 행동은 자원이나 진행을 바꾸지 않는다', () => {
  const s = newGame(CONTENT)
  expect(startCook(s, 'beanDish', () => 0.5)).toBe(s)
  expect(createClub(s, club, CONTENT)).toEqual({ state: s, error: 'locked' })
  expect(canOpenStall(s)).toBe('locked')
  expect(offeredProjects(s, CONTENT)).toEqual([])
  expect(canPick(s, FACILITY_IDS[0], CONTENT)).toBe('locked')
  expect(canTrip(s, DEST_IDS[0])).toBe('locked')
  expect(canGiveBouquet(s, CONTENT.neighbors[0])).toBe('locked')
  expect(canGiveCord(s, CONTENT.neighbors[0])).toBe('locked')
  expect(canOrderHome(s)).toBe('locked')
})
it('완필만으로 지역이 열리며 옛 저장에서 열렸던 지역을 다시 잠그지 않는다', () => {
  const s = books(8)
  expect(Object.keys(s.shelved)).toHaveLength(0)
  expect(villageBookCount(s)).toBe(8)
  expect(featureAccess(s, 'travel')).toBe('full')
  const old = { ...s, flags: { ...s.flags, growthLegacy: 1 }, shelved: { mt: 0 as const } }
  expect(villageBookCount(old)).toBe(1)
  expect(villageBookCount({ ...newGame(CONTENT), shelved: { mt: 0 as const } })).toBe(1)
})
it('요리 체험은 차를 바로 만들지만 정식 레시피는 제한한다', () => {
  const s = chapters(15)
  s.inv = { ...s.inv, herb: 3, water: 3, bean: 3 }
  expect(canCook(s, 'herbTea')).toBeNull()
  expect(canCook(s, 'beanDish')).toBe('locked')
  const started = startCook(s, 'herbTea', () => 0.5)
  expect(started.cooking?.run?.dish).toBe('herbTea')
  // 잠금이 바뀌어도 이미 낸 재료로 만들던 요리는 완성할 수 있다.
  const ready = { ...started, progress: newGame(CONTENT).progress, cooking: { ...started.cooking!, run: { ...started.cooking!.run!, phase: 'ready' as const } } }
  expect(deliverCook(ready).inv.herbTea).toBe(1)
})
it('소모임 체험에서 다른 활동과 두 번째 모임을 막는다', () => {
  const s = chapters(20)
  expect(createClub(s, { ...club, activity: 'read' }, CONTENT).error).toBe('preview')
  s.clubs = [{ ...club, id: 'club:1', active: true, paused: false }]
  expect(createClub(s, club, CONTENT).error).toBe('preview')
})
it('성장 안내는 한 번만 발생하고 모든 장면이 존재한다', () => {
  for (const chapter of [15, 20, 25]) {
    const next = applyEarlyGrowth(chapters(chapter - 1), chapters(chapter), CONTENT)
    expect(next.scenes.length).toBeGreaterThan(0)
    for (const id of next.scenes) expect(SCENES[id]).toBeDefined()
    expect(applyEarlyGrowth(next, next, CONTENT)).toEqual(next)
  }
})
it('아이 출생은 22권부터이며 기존 아이와 여행 귀환은 잠금으로 사라지지 않는다', () => {
  const s = chapters(1)
  s.homeLevel = 2
  s.clock.day = 100
  s.romance = { ...s.romance, partner: 'baker', stage: 'married', marriedDay: 1 }
  expect(goToSleep(s, CONTENT).child).toBe(s.child)
  expect(canTrip(s, DEST_IDS[0], [], true)).not.toBe('locked')
  const legacy = { ...s, flags: { ...s.flags, growthLegacy: 1 } }
  expect(featureAccess(legacy, 'school')).toBe('full')
  expect(goToSleep(legacy, CONTENT).child).toBeDefined()
})
