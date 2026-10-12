import { CONTENT, pieceById, piecesOf, quizSourceFor } from '../content/catalog'
import { chaptersOf } from './books'
import { mulberry32 } from './offers'
import { buildQuiz, hintOptions, isCorrect } from './quiz'
import { GOSPELS } from './types'

it.each([...GOSPELS, 'ac'] as const)('%s 이야기 선택지는 화면 제목이 구분되고 힌트가 정답을 숨기지 않는다', (book) => {
  const src = quizSourceFor([book])
  for (const chapter of chaptersOf(book, CONTENT)) {
    for (const seed of [13, 73, 211]) {
      const questions = buildQuiz(piecesOf(book), chapter, mulberry32(seed), src)
      for (const q of questions) {
        const where = `${book}/${chapter}/${seed}/${q.kind}`
        if (q.kind === 'verse' || q.kind === 'order') {
          const labels = q.options.map(id => pieceById(id).title.trim())
          expect(new Set(labels).size, where).toBe(labels.length)
        }
        if (q.kind === 'puzzle' || q.kind === 'detective') {
          expect(hintOptions(q, 10), where).toEqual([])
          continue
        }
        expect(q.options.filter(o => isCorrect(q, o)), where).toEqual([q.answer])
        for (const n of [0, 1, 2, 10]) {
          const hidden = hintOptions(q, n)
          expect(hidden, where).not.toContain(q.answer)
          expect(new Set(hidden).size, where).toBe(hidden.length)
          expect(q.options.length - hidden.length, where).toBeGreaterThanOrEqual(2)
          for (const o of hidden) expect(q.options, where).toContain(o)
        }
      }
    }
  }
}, 30_000)
