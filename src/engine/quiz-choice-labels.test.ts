import { CONTENT, pieceById, piecesOf, quizSourceFor } from '../content/catalog'
import { chaptersOf } from './books'
import { mulberry32 } from './offers'
import { buildQuiz, isCorrect } from './quiz'
import { GOSPELS } from './types'

it.each([...GOSPELS, 'ac'] as const)('%s 이야기 선택지는 화면 제목이 구분되고 정답이 유일하다', (book) => {
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
        if (q.kind === 'puzzle' || q.kind === 'detective') continue
        expect(q.options.filter(o => isCorrect(q, o)), where).toEqual([q.answer])
      }
    }
  }
}, 30_000)
