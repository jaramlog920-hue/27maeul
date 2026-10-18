// 사랑의 계명 (2026-10-14·17 사용자): 신약만, 크고 첫째 되는 계명을 가운데 하나님 사랑·이웃 사랑 두 가지로
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { copyVerses } from './copying'
import { newGame } from './game'
import { LOVE_BRANCHES, LOVE_RECORDS, loveFound, loveInChapter } from './love-commands'
import { isOtBook } from './ot-books'

describe('사랑의 계명', () => {
  it('세 갈래, 신약만, 구절마다 실제 본문이 있다', () => {
    expect(LOVE_BRANCHES).toEqual(['크고 첫째 되는 계명', '하나님 사랑', '이웃 사랑'])
    expect(LOVE_RECORDS.length).toBeGreaterThan(200)
    for (const r of LOVE_RECORDS) {
      expect(isOtBook(r.book), r.ref).toBe(false)
      expect(copyVerses(r.book, r.chapter, CONTENT).some((v) => v.verse === r.verse), r.ref).toBe(true)
    }
    // 가운데에는 예수님이 크고 첫째 되는 계명으로 말씀하신 구절
    expect(LOVE_RECORDS.filter((r) => r.branch === '크고 첫째 되는 계명').map((r) => r.ref)).toEqual(expect.arrayContaining(['마 22:37', '마 22:39', '막 12:30', '막 12:31', '눅 10:27']))
    expect(LOVE_RECORDS.find((r) => r.ref === '롬 13:9')?.branch).toBe('이웃 사랑')
  })
  it('그 장을 마치면 발견한다', () => {
    const g = newGame(CONTENT)
    const r = LOVE_RECORDS.find((x) => x.ref === '요 13:34')!
    expect(loveFound(g, r)).toBe(false)
    const done = { ...g, progress: { ...g.progress, jn: { ...g.progress.jn, completed: [13] } } }
    expect(loveFound(done, r)).toBe(true)
    expect(loveInChapter('jn', 13).map((x) => x.ref)).toContain('요 13:34')
  })
})
