import { CONTENT } from '../content/catalog'
import { lastVerseGame } from '../dev/test-saves'
import { copySpot } from './copying'
import { bindBook, finishLibrary, writeVerse } from './game'
import { allManuscriptsDone, manuscriptFinale } from './library-finale'
import { shelveNow } from './library'
import { deserialize, serialize } from './save'
import { BOOKS } from './types'
import { NT_CHAPTER_COUNTS } from './progression'

it('마지막 실제 필사 → 짧은 여운 → 제본 → 서고 기념 장면과 기존 확장권으로 이어진다', async () => {
  const before = await lastVerseGame(CONTENT)
  const spot = copySpot(before, 'rev', CONTENT)!
  const written = writeVerse(before, 'rev', spot.verse.text, CONTENT).state
  expect(allManuscriptsDone(before)).toBe(false)
  expect(allManuscriptsDone(written)).toBe(true)
  expect(written.scenes).toContain('lastManuscript')
  expect(written.scenes).not.toContain('bookBound')
  const loaded = deserialize(serialize(written), CONTENT)!
  expect(loaded.scenes).toContain('lastManuscript')
  const bound = bindBook(loaded, 'rev', CONTENT)
  expect(bound.scenes).toContain('lastManuscript')
  const shelved = shelveNow({ ...bound, scenes: [] }, 'rev', CONTENT)
  expect(shelved.scenes).toEqual(['fullLibrary'])
  expect(shelved.flags.libraryLastBook).toBe(26)
  const done = finishLibrary(shelved)
  expect(done.flags.otTicket).toBe(1)
  expect(done.flags.newlandGift).toBe(1)
  expect(done.scenes).toContain('newlandGift')
  expect(finishLibrary(done).flags.otExpand).toBe(done.flags.otExpand)
  expect(manuscriptFinale(written, { ...written, scenes: [] }).scenes).toEqual([])
})

it('마지막 책의 종류나 장 배열 길이가 아니라 27권의 실제 모든 장을 확인한다', async () => {
  const s = await lastVerseGame(CONTENT)
  const complete = { ...s, progress: Object.fromEntries(BOOKS.map(b => [b, { completed: Array.from({ length: NT_CHAPTER_COUNTS[b] }, (_, i) => i + 1), arrangement: {} }])) as typeof s.progress }
  const lastMatthew = { ...complete, progress: { ...complete.progress, mt: { ...complete.progress.mt, completed: complete.progress.mt.completed.slice(0, -1) } } }
  const shown = manuscriptFinale(lastMatthew, complete)
  expect(shown.scenes).toContain('lastManuscript')
  const bad = { ...complete, progress: { ...complete.progress, mt: { ...complete.progress.mt, completed: Array(NT_CHAPTER_COUNTS.mt).fill(1) } } }
  expect(allManuscriptsDone(bad)).toBe(false)
  expect(manuscriptFinale(lastMatthew, bad)).toBe(bad)
  expect(manuscriptFinale(complete, { ...complete, scenes: [] }).scenes).toEqual([])
})
