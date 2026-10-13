import { isFamilyAlbum } from './family'
import { isFamilyNote } from './daybook'
import { CONTENT } from '../content/catalog'
import { legacyGame } from './growth-test-support'
import { familyScenicEvents } from './family-scenes'
import { HOME_ENTRY } from './world'
import { newChild } from './child'
import { weatherOf } from './calendar'
import { seasonOf } from './clock'
import { momentNow, onceKey } from './stories'
import { shelve } from './library'
import { BOOKS } from './types'
import { deserialize, serialize } from './save'
import { goToSleep } from './game'
import { count } from './items'

function household(day = 10, minute = 6 * 60) {
  const s = legacyGame(CONTENT)
  return { ...s, scenes: [], clock: { day, minute }, player: { ...s.player, ...HOME_ENTRY, path: [] },
    romance: { ...s.romance, stage: 'married' as const, partner: 'wendell', marriedDay: 9 },
    npcs: { ...s.npcs, wendell: { ...s.npcs.wendell, ...HOME_ENTRY, visible: true } } }
}

it('결혼 다음 날 함께 있는 첫 아침만 예약하고 저장 후에도 중복하지 않는다', () => {
  const s = household(), first = familyScenicEvents(s, s, null)
  expect(first.scenes).toEqual(['firstMorning'])
  expect(first.coins).toBe(s.coins)
  expect(first.stats).toEqual(s.stats)
  const saved = deserialize(serialize(first), CONTENT)!
  expect(familyScenicEvents(saved, { ...saved, scenes: [] }, null).scenes).toEqual([])
  expect(familyScenicEvents(s, household(11), null).scenes).toEqual([])
  expect(familyScenicEvents(s, household(10, 13 * 60), null).scenes).toEqual([])
})

it('귀가는 배우자가 실제로 집 밖에서 안으로 들어오는 저녁에만 열린다', () => {
  const next = household(15, 19 * 60)
  const before = { ...next, npcs: { ...next.npcs, wendell: { ...next.npcs.wendell, x: 24, y: 17 } } }
  const first = familyScenicEvents(before, next, null)
  expect(first.scenes).toContain('spouseReturn')
  expect(familyScenicEvents(next, next, null).scenes).toEqual([])
  expect(familyScenicEvents(before, { ...next, player: { ...next.player, x: 24, y: 17 } }, null).scenes).toEqual([])
  expect(familyScenicEvents(before, { ...next, flags: first.flags }, null).scenes).toEqual([])
})

it('첫 도움은 물건을 받은 날 아이와 집에 함께 있을 때 한 번만 보인다', () => {
  const s = household(70), child = newChild(1, s.stats, undefined)
  const waiting = { ...s, child, flags: { ...s.flags, childFirstHelpPending: 70, childHelpKind: 1 } }
  expect(familyScenicEvents(s, waiting, null).scenes).toEqual([])
  expect(familyScenicEvents(s, waiting, { x: 24, y: 17 }).scenes).toEqual([])
  const shown = familyScenicEvents(s, waiting, HOME_ENTRY)
  expect(shown.scenes).toEqual(['childFirstHelp'])
  expect(familyScenicEvents(shown, { ...shown, scenes: [] }, HOME_ENTRY).scenes).toEqual([])
  expect(familyScenicEvents(s, { ...waiting, clock: { ...waiting.clock, day: 71 } }, HOME_ENTRY).scenes).toEqual([])
})

it('겨울밤에는 눈 오는 밤 가족이 모두 집에 있을 때만 열린다', () => {
  const day = Array.from({ length: 160 }, (_, i) => i + 1).find(d => seasonOf(d) === 'winter' && weatherOf(d) === 'snow')!
  const s = household(day, 22 * 60), child = newChild(day - 50, s.stats, undefined)
  const together = { ...s, child }
  expect(familyScenicEvents(s, together, HOME_ENTRY).scenes).toEqual(['familyWinter'])
  expect(familyScenicEvents(s, together, { x: 24, y: 17 }).scenes).toEqual([])
  expect(familyScenicEvents(s, { ...together, child: { ...child, left: true } }, HOME_ENTRY).scenes).toEqual([])
  expect(familyScenicEvents(s, { ...together, clock: { day, minute: 14 * 60 } }, HOME_ENTRY).scenes).toEqual([])
  expect(familyScenicEvents(s, { ...together, flags: { [onceKey('familyWinter', day)]: 1 } }, HOME_ENTRY).scenes).toEqual([])
})

it('스물일곱 번째 책을 처음 꽂을 때만 완성된 서고가 열린다', () => {
  const s = legacyGame(CONTENT)
  const shelved = Object.fromEntries(BOOKS.slice(0, -1).map(b => [b, 0 as const]))
  const first = shelve({ ...s, scenes: [], shelved }, BOOKS.at(-1)!, 0, [])
  expect(first.scenes).toEqual(['fullLibrary'])
  expect(shelve({ ...first, scenes: [] }, BOOKS.at(-1)!, 5, []).scenes).toEqual([])
})

it('잠자고 일어나는 실제 흐름에서 첫 아침과 첫 도움을 예약한다', () => {
  const married = household(9, 22 * 60)
  const morning = goToSleep({ ...married, homeLevel: 2 }, CONTENT)
  expect(morning.clock.day).toBe(10)
  expect(morning.scenes).toContain('firstMorning')
  const s = household(69, 22 * 60)
  const child = { ...newChild(28, s.stats, 'hand'), mode: 'home' as const }
  const helped = goToSleep({ ...s, homeLevel: 2, child, flags: { ...s.flags, childWalked: 1, childHelping: 1 } }, CONTENT)
  expect(helped.clock.day).toBe(70)
  expect(count(helped.inv, 'papyrus') + count(helped.chest, 'papyrus')).toBe(count(s.inv, 'papyrus') + count(s.chest, 'papyrus') + 1)
  expect(helped.scenes).toContain('childFirstHelp')
})

it.each([['spring', 'springWalk', { x: 14, y: 12 }], ['summer', 'summerCreek', { x: 13, y: 32 }], ['autumn', 'autumnPath', { x: 14, y: 12 }]] as const)('%s 풍경은 맞는 계절·장소·맑은 낮에 해마다 한 번 열린다', (season, id, player) => {
  const day = Array.from({ length: 160 }, (_, i) => i + 1).find(d => seasonOf(d) === season && weatherOf(d) === 'sunny')!
  const ctx = { day, minute: 12 * 60, outdoors: true, player, flags: {} }
  expect(momentNow(ctx)).toBe(id)
  expect(momentNow({ ...ctx, outdoors: false })).toBeNull()
  expect(momentNow({ ...ctx, player: { x: 24, y: 17 } })).toBeNull()
  expect(momentNow({ ...ctx, flags: { [onceKey(id, day)]: 1 } })).toBeNull()
})

it.each(['firstMorning', 'spouseReturn', 'childFirstHelp', 'familyWinter', 'babySleep'])('%s은 가족 일지와 가족 앨범에서 찾을 수 있다', id => {
  expect(isFamilyAlbum(id)).toBe(true)
  expect(isFamilyNote(id)).toBe(true)
})
