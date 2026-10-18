import { expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { CONTENT } from '../../src/content/catalog'
import { ensureOtBook } from '../../src/content/ot-catalog'
import { makeBlankQuiz } from '../../src/engine/blank-quiz'
import { newGame } from '../../src/engine/game'
import { BOOK_CHAPTERS } from '../../src/engine/job'
import { OT_BOOK_TABLE, type CopyBook } from '../../src/engine/ot-books'

it('성경 전체 완성 장에서 열 문제를 출제한다', async () => {
  const base = newGame(CONTENT)
  const failures: string[] = []
  let checked = 0
  const books = [...Object.entries(BOOK_CHAPTERS).map(([book, chapters]) => ({book: book as CopyBook, chapters})), ...OT_BOOK_TABLE.map(r => ({book: r.id, chapters:r.chapters}))]
  for (const {book, chapters} of books) {
    if (OT_BOOK_TABLE.some(r => r.id === book)) await ensureOtBook(book as Parameters<typeof ensureOtBook>[0])
    for (let chapter = 1; chapter <= chapters; chapter++) {
      const game = { ...base, copy: {...base.copy, copied:{[book]:[chapter]}} }
      const questions = makeBlankQuiz(game, CONTENT, 7788, {book, chapter})
      checked++
      if (questions.length !== 10) failures.push(`${book}:${chapter} (${questions.length})`)
    }
  }
  writeFileSync('artifacts/scenery/chapter-blank-all-chapters.json',JSON.stringify({checked,failures},null,2))
  expect(failures).toEqual([])
}, 120000)
