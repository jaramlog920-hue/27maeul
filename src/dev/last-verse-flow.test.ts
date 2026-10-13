// 시험 저장(?test=26)에서 마지막 절 → 요한계시록 꽂기 → 확장권·서른아홉 권의 터 (2026-10-13 사용자: 꽂아도 반응이 없었다)
import { CONTENT } from '../content/catalog'
import { copySpot } from '../engine/copying'
import { finishLibrary, writeVerse } from '../engine/game'
import { allShelved, shelveNow } from '../engine/library'
import { lastVerseGame } from './test-saves'

it('마지막 책을 꽂는 순간 확장권과 구약 터를 받고 큰길 끝 표지 장면이 이어진다', async () => {
  let s = await lastVerseGame(CONTENT)
  const spot = copySpot(s, 'rev', CONTENT)!
  s = writeVerse(s, 'rev', spot.verse.text, CONTENT).state
  s = shelveNow({ ...s, scenes: [], bound: { ...s.bound, rev: { day: s.clock.day } } }, 'rev', CONTENT)
  expect(allShelved(s)).toBe(true)
  const done = finishLibrary(s)
  expect(done.flags.otTicket).toBe(1)
  expect(done.flags.otExpand).toBe(1)
  expect(done.flags.newlandGift).toBe(1)
  expect(done.scenes).toContain('newlandGift')
  // 두 번 불러도 한 번뿐
  const again = finishLibrary(done)
  expect(again.flags.otExpand).toBe(1)
  expect(again.scenes.filter((x) => x === 'newlandGift')).toHaveLength(1)
})
