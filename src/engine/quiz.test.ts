import { BOOKS_WITH_CONTENT, CONTENT, inBrackets, pieceById, pieceOfVerse, piecesOf, quizSourceFor } from '../content/catalog'
import { chaptersOf } from './books'
import { mulberry32 } from './offers'
import { modeOf } from './shelf-rooms'
import { buildLibraryQuiz, buildQuiz, detectiveAnswer, isCorrect, QUIZ_SIZE, quizzable, quizzablePiece, wordsOf, type Question } from './quiz'

const norm = (s: string) => s.replace(/\s+/g, '')

/** 조각으로 엮는 책마다, 장마다 퀴즈 하나: [이름, 문제, 그 책의 본문, 장] — 편지에는 장 기록 퀴즈가 없다 (계획 7) */
function allQuizzes(seed: number): [string, Question[], ReturnType<typeof quizSourceFor>, number][] {
  return BOOKS_WITH_CONTENT.filter((b) => modeOf(b) === 'pieces').flatMap((b) =>
    chaptersOf(b, CONTENT).map((ch, i) => {
      const src = quizSourceFor([b])
      return [`${b} ${ch}장`, buildQuiz(piecesOf(b), ch, mulberry32(seed + i), src), src, ch] as [string, Question[], typeof src, number]
    }),
  )
}

describe('기록 퀴즈', () => {
  it('조각이 있는 책의 모든 장에서 다섯 문제가 나오고, 형식이 섞인다', () => {
    for (const seed of [1, 7, 42]) {
      for (const [name, qs] of allQuizzes(seed)) {
        expect(qs, name).toHaveLength(QUIZ_SIZE)
        expect(new Set(qs.map((q) => q.kind)).size, name).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('모든 문제는 그 장(또는 앞뒤 장)의 본문에서 나오고, 정답이 정확히 하나다', () => {
    for (const seed of [1, 7, 42, 99]) {
      for (const [name, qs, src, ch] of allQuizzes(seed)) {
        for (const q of qs) {
          const where = `${name} ${q.kind}`
          if (q.kind === 'puzzle') {
            const v = src.versesOf(q.ref)[0]
            expect(q.answer.join(' ')).toBe(wordsOf(v.text).join(' '))
            expect([...q.words].sort()).toEqual([...q.answer].sort())
            expect(q.words.join(' '), where).not.toBe(q.answer.join(' '))
            expect(src.countVerse(v.text), where).toBe(1)
            expect(quizzable(v.text, v.inBrackets), where).toBe(true)
            expect(isCorrect(q, q.answer)).toBe(true)
          } else if (q.kind === 'blank') {
            const v = src.versesOf(q.ref)[0]
            expect([q.before, q.answer, q.after].filter(Boolean).join(' ')).toBe(v.text.trim().split(/\s+/).join(' '))
            expect(quizzable(v.text, v.inBrackets), where).toBe(true)
            expect(new Set(q.options.map(norm)).size, where).toBe(4)
            // 다른 보기로 채운 문장은 그 책 어디에도 없다 → 정답은 하나
            for (const o of q.options.filter((x) => x !== q.answer)) expect(src.countVerse([q.before, o, q.after].filter(Boolean).join(' ')), where).toBe(0)
          } else if (q.kind === 'detective') {
            const p = pieceById(q.pieceId)
            expect(p.chapter).toBe(ch)
            expect(p.stamps.some((s) => s.kind === 'similar'), where).toBe(false)
            expect(q.answer).toContain(p.book)
            expect(q.answer).toEqual(detectiveAnswer(p))
          } else if (q.kind === 'verse') {
            expect(new Set(q.options).size).toBe(3)
            const qv = src.versesOf(q.ref)[0]
            expect(quizzable(qv.text, qv.inBrackets), where).toBe(true)
            const [c] = q.ref.split(' ')[1].split(':').map(Number)
            const answer = pieceById(q.answer)
            expect(answer.chapter).toBe(c)
            // 절이 정답 조각 안에 있다
            expect(src.versesOf(answer.ref).some((v) => v.ref === q.ref), where).toBe(true)
            for (const o of q.options.filter((x) => x !== q.answer)) expect(src.versesOf(pieceById(o).ref).some((v) => v.ref === q.ref)).toBe(false)
          } else {
            expect(q.options).toHaveLength(2)
            expect(q.answer).toBe([...q.options].sort()[0])
            for (const o of q.options) expect(pieceById(o).chapter).toBe(ch)
          }
        }
      }
    }
  })

  it('탐정: 그 조각의 책은 늘 답에 있고, 같은 이야기 도장의 복음서가 더해진다', () => {
    expect(detectiveAnswer(pieceById('lk-015-008'))).toEqual(['lk'])
    expect(detectiveAnswer(pieceById('lk-009-010'))).toEqual(['mt', 'mk', 'lk', 'jn'])
    // 비슷한 이야기가 있는 조각은 탐정 문제로 쓰지 않는다
    expect(detectiveAnswer(pieceById('lk-015-001'))).toBeNull()
    // 막 1:9-11은 요한 쪽이 "비슷한 이야기"(~요 1:29-34)라 탐정 문제에 쓰지 않는다
    expect(detectiveAnswer(pieceById('mk-001-009'))).toBeNull()
    // 막 2:1-12는 =마 9:1-8; =눅 5:17-26
    expect(detectiveAnswer(pieceById('mk-002-001'))).toEqual(['mt', 'mk', 'lk'])
  })

  it('괄호 절은 문제로 쓰지 않는다', () => {
    expect(quizzable('(없음)')).toBe(false)
    expect(quizzable('[예수께서 안식후 첫날 이른 아침에')).toBe(false)
    expect(quizzable('저희가 [그에게 경배하고] 큰 기쁨으로')).toBe(false)
    expect(quizzable('어느 여자가 열 드라크마가 있는데')).toBe(true)
    // 여러 절에 걸친 괄호 구간의 가운데 절 (막 16:10은 괄호 글자가 없다)
    expect(quizzable('어느 여자가 열 드라크마가 있는데', true)).toBe(false)
    // 둥근 괄호: 마 6:13 송영 같은 절도 쓰지 않는다
    expect(quizzable('다만 악에서 구하옵소서 (나라와 권세와 영광이 아버지께 영원히 있사옵나이다 아멘)')).toBe(false)
  })

  it('둥근 괄호 구간: 마 6:13(송영)과 여러 절에 걸친 막 7:3-4는 괄호 안, (없음)과 이웃 절은 밖', () => {
    expect(inBrackets('마 6:13')).toBe(true)
    expect(inBrackets('마 6:12')).toBe(false)
    expect(inBrackets('마 6:14')).toBe(false)
    expect(inBrackets('마 24:15')).toBe(true) // (읽는 자는 깨달을찐저)
    expect(inBrackets('마 24:14')).toBe(false)
    expect(inBrackets('마 24:16')).toBe(false)
    expect(inBrackets('막 7:3')).toBe(true)
    expect(inBrackets('막 7:4')).toBe(true)
    expect(inBrackets('막 7:5')).toBe(false)
    expect(inBrackets('눅 17:36')).toBe(false) // (없음) — 괄호로 치지 않음, 구간을 열지도 않음
    expect(inBrackets('눅 17:37')).toBe(false)
  })

  it('마 6:13은 문제·정답·보기 어디에도 나오지 않는다', () => {
    const src = quizSourceFor(['mt'])
    const doxology = src.versesOf('마 6:13')[0]
    const onlyThere = wordsOf(doxology.text).filter((w) => /[()]/.test(w)) // "(나라와", "아멘)"
    expect(onlyThere.length).toBeGreaterThan(0)
    for (let seed = 1; seed <= 200; seed++) {
      for (const ch of [5, 6, 7]) {
        const qs = buildQuiz(piecesOf('mt'), ch, mulberry32(seed), src)
        expect(qs, `ch ${ch} seed ${seed}`).toHaveLength(QUIZ_SIZE)
        for (const q of qs) {
          const where = `ch ${ch} seed ${seed} ${q.kind}`
          if ('ref' in q) expect(q.ref, where).not.toBe('마 6:13')
          if (q.kind === 'blank') for (const o of q.options) expect(/[()]/.test(o), `${where} ${o}`).toBe(false)
          if (q.kind === 'puzzle') for (const w of q.words) expect(/[()]/.test(w), where).toBe(false)
        }
      }
    }
  })

  it('괄호 조각(막 16:9-20)은 문제·보기·정답 어디에도 나오지 않는다', () => {
    const src = quizSourceFor(['mk'])
    const bracket = piecesOf('mk').filter((p) => !quizzablePiece(p, src)).map((p) => p.id)
    expect(bracket).toEqual(['mk-016-009', 'mk-016-012', 'mk-016-014', 'mk-016-019'])
    expect(quizzablePiece(pieceById('mk-016-001'), src)).toBe(true)
    for (let seed = 1; seed <= 200; seed++) {
      for (const ch of [15, 16]) {
        const qs = buildQuiz(piecesOf('mk'), ch, mulberry32(seed), src)
        expect(qs, `ch ${ch} seed ${seed}`).toHaveLength(QUIZ_SIZE)
        for (const q of qs) {
          const ids = q.kind === 'detective' ? [q.pieceId] : q.kind === 'order' || q.kind === 'verse' ? [...q.options, q.answer] : q.kind === 'verseOrder' ? q.options.map((r) => pieceOfVerse(r)!.id) : [pieceOfVerse(q.ref)!.id]
          for (const id of ids) expect(bracket, `ch ${ch} seed ${seed} ${q.kind}`).not.toContain(id)
        }
      }
    }
  })

  it('괄호 조각(요 7:53-8:11)은 7장 퀴즈와 요한 서고 퀴즈의 문제·보기·정답 어디에도 나오지 않는다', () => {
    const src = quizSourceFor(['jn'])
    expect(quizzablePiece(pieceById('jn-007-053'), src)).toBe(false)
    const check = (qs: Question[], where: string) => {
      for (const q of qs) {
        const ids = q.kind === 'detective' ? [q.pieceId] : q.kind === 'order' || q.kind === 'verse' ? [...q.options, q.answer] : q.kind === 'verseOrder' ? q.options.map((r) => pieceOfVerse(r)!.id) : [pieceOfVerse(q.ref)!.id]
        expect(ids, `${where} ${q.kind}`).not.toContain('jn-007-053')
      }
    }
    for (let seed = 1; seed <= 200; seed++) {
      check(buildQuiz(piecesOf('jn'), 7, mulberry32(seed), src), `ch 7 seed ${seed}`)
      check(buildLibraryQuiz({ current: 'jn', pool: ['jn'], piecesOf, rng: mulberry32(seed), src }), `library seed ${seed}`)
    }
  })

  it('정답 판정', () => {
    const q: Question = { kind: 'detective', pieceId: 'x', options: ['mt', 'mk', 'lk', 'jn'], answer: ['mt', 'lk'] }
    expect(isCorrect(q, ['lk', 'mt'])).toBe(true)
    expect(isCorrect(q, ['lk'])).toBe(false)
    const o: Question = { kind: 'order', options: ['a', 'b'], answer: 'a' }
    expect(isCorrect(o, 'a')).toBe(true)
    expect(isCorrect(o, 'b')).toBe(false)
  })
})
