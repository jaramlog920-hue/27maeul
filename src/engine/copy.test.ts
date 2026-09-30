// 계획 7 작업 3: 빈칸 채워 옮겨 적기 — 장마다 빈칸 셋, 답으로 채우면 원문(개역한글) 그대로
import bible from '../content/nt-krv.json'
import { CONTENT, copySourceFor, inBrackets, LETTER_PIECES, noText, piecesOf, quizSourceFor, versesOf } from '../content/catalog'
import { blanksFor, COPY_BLANKS, fillVerse, isContentWord, optionRank, wordAt } from './copy'
import { chapterReady, chooseBook, letterReady, listen, newGame, recordLetter, setArrangement, submitChapter, type GameState } from './game'
import { CHAPTER_COST } from './items'
import { POSTMAN } from './post'
import { quizzable, MIN_VERSE_CHARS, wordsOf } from './quiz'
import { BOOKS, LETTERS, type Book } from './types'

const FULL = bible as Record<string, string[][]>
const norm = (s: string) => s.replace(/[\s,.!?]+/g, '')
const wordsIn = (text: string) => text.split(/\s+/).filter(Boolean).map(norm)
const allSrc = quizSourceFor(BOOKS)
const refParts = (ref: string) => {
  const m = /^(\S+) (\d+):(\d+)$/.exec(ref)!
  return { abbr: m[1], chapter: Number(m[2]), verse: Number(m[3]) }
}

describe('blanksFor — 121장 전부', () => {
  it('열세 권 87장 + 여덟 권 34장', () => {
    expect(LETTER_PIECES).toHaveLength(87 + 34)
    expect(LETTER_PIECES.filter((p) => ['heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud'].includes(p.book))).toHaveLength(34)
    expect(COPY_BLANKS).toBe(3)
  })

  for (const p of LETTER_PIECES) {
    it(`${p.ref}`, () => {
      const src = copySourceFor(p.book)
      const blanks = blanksFor(p.book, p.chapter, src)
      // 121장 모두 빈칸이 꼭 셋 (예외 없음 — 모자라는 장이 생기면 여기서 걸린다)
      expect(blanks).toHaveLength(COPY_BLANKS)
      // 빈칸 셋은 서로 다른 절, 서로 다른 낱말
      expect(new Set(blanks.map((b) => b.ref)).size).toBe(blanks.length)
      expect(new Set(blanks.map((b) => norm(b.answer))).size).toBe(blanks.length)

      const shown = src.versesOf(p.ref)
      const original = FULL[p.book][p.chapter - 1]
      const bookWords = new Set(
        LETTER_PIECES.filter((x) => x.book === p.book)
          .flatMap((x) => versesOf(x.ref))
          .flatMap((v) => wordsOf(v.text)),
      )
      const bookSrc = quizSourceFor([p.book])

      for (const b of blanks) {
        const { chapter, verse } = refParts(b.ref)
        expect(chapter).toBe(p.chapter)
        const orig = original[verse - 1]
        const v = shown.find((x) => x.ref === b.ref)!
        // ② 빈칸 절: 본문이 있고 괄호·괄호 구간이 아니며 14자 이상
        expect(v).toBeDefined()
        expect(noText(orig)).toBe(false)
        expect(inBrackets(b.ref)).toBe(false)
        expect(quizzable(v.text, v.inBrackets)).toBe(true)
        expect(v.text.replace(/\s+/g, '').length).toBeGreaterThanOrEqual(MIN_VERSE_CHARS)
        // ① 답으로 채운 절 = 원문 절 글자 그대로
        expect(wordAt(v.text, b.index)).toBe(b.answer)
        expect(fillVerse(v.text, b.index, b.answer)).toBe(orig)
        expect(isContentWord(b.answer)).toBe(true)
        // ③ 보기 넷, 서로 다름(띄어쓰기·문장부호 빼고), 답은 하나
        expect(b.options).toHaveLength(4)
        expect(new Set(b.options.map(norm)).size).toBe(4)
        expect(b.options.filter((o) => norm(o) === norm(b.answer))).toHaveLength(1)
        for (const o of b.options) {
          // ⑤ 보기는 모두 같은 책의 낱말
          expect(bookWords.has(o), o).toBe(true)
          // ④ 다른 보기로 채운 절이 그 책에도, 본문의 다른 어느 책에도 없다
          if (o !== b.answer) {
            expect(bookSrc.countVerse(fillVerse(v.text, b.index, o)), o).toBe(0)
            expect(allSrc.countVerse(fillVerse(v.text, b.index, o)), o).toBe(0)
          }
        }
        // ⑦ 답 낱말이 같은 절에 한 번 더 나오지 않는다 (가려도 답이 보이면 안 된다)
        expect(wordsIn(v.text).filter((w) => w === norm(b.answer)), b.answer).toHaveLength(1)
        // ⑧ 한 빈칸의 답이 같은 장 다른 빈칸의 보기로 나오지 않는다
        for (const other of blanks) if (other !== b) expect(other.options.map(norm), b.answer).not.toContain(norm(b.answer))
      }

      // 빈칸을 모두 답으로 채운 장 = 원문 장 (본문이 없는 절만 빠진다)
      const filled = shown.map((v) => {
        const b = blanks.find((x) => x.ref === v.ref)
        return b ? fillVerse(v.text, b.index, b.answer) : v.text
      })
      expect(filled).toEqual(original.filter((t) => !noText(t)))

      // ⑥ 두 번 불러도 같다 (새로 만든 출처로도)
      expect(blanksFor(p.book, p.chapter, { ...src })).toEqual(blanks)
    })
  }

  it('롬 9:2·16:24(본문 없는 절)는 빈칸이 될 수 없다', () => {
    const src = copySourceFor('rom')
    const refs = [9, 16].flatMap((c) => blanksFor('rom', c, src).map((b) => b.ref))
    expect(refs).not.toContain('롬 9:2')
    expect(refs).not.toContain('롬 16:24')
  })

  it('121장 모두 빈칸이 셋 — 모자라는 장 없음', () => {
    const short = LETTER_PIECES.filter((p) => blanksFor(p.book, p.chapter, copySourceFor(p.book)).length !== COPY_BLANKS).map((p) => p.ref)
    expect(short).toEqual([])
  })

  it('짧은 이음말·문장부호가 붙은 낱말은 내용 낱말이 아니다', () => {
    for (const w of ['그러나', '그러므로', '우리가', '너희가', '이는', '또한', '하나님께,', '(곧', '말씀.', '주']) expect(isContentWord(w), w).toBe(false)
    for (const w of ['하나님의', '복음을', '사도로']) expect(isContentWord(w), w).toBe(true)
  })

  it('이음 구실을 하는 말은 빈칸이 되지 않는다', () => {
    const filler = ['안에서', '위하여', '가운데', '말미암아', '인하여', '이것을', '이것이', '하물며', '아무도', '가지는', '하나도', '되나니', '같으니', '같으나']
    for (const w of filler) expect(isContentWord(w), w).toBe(false)
    const answers = LETTER_PIECES.flatMap((p) => blanksFor(p.book, p.chapter, copySourceFor(p.book)).map((b) => b.answer))
    for (const w of filler) expect(answers, w).not.toContain(w)
  })

  it('보기 순서: 끝 두 글자 같음 → 끝 글자 같음 → 나머지, 무리 안에서 길이 ±1 먼저', () => {
    const a = '하나님께서'
    expect(optionRank(a, '그리스도께서')).toBeLessThan(optionRank(a, '예수께서는'))
    expect(optionRank(a, '성령께서')).toBe(0)
    expect(optionRank(a, '그리스도께서')).toBe(0)
    expect(optionRank(a, '주예수그리스도께서')).toBe(1)
    expect(optionRank(a, '아들이셔서')).toBe(2)
    expect(optionRank(a, '말미암지')).toBe(4)
    expect(optionRank(a, '성령께서')).toBeLessThan(optionRank(a, '아들이셔서'))
    expect(optionRank(a, '아들이셔서')).toBeLessThan(optionRank(a, '말미암지'))
  })

  it('보기의 끝말이 답을 드러내지 않는다: 대부분의 빈칸에서 틀린 보기 셋 중 둘 이상이 답과 끝 글자가 같다', () => {
    // 잰 값(2026-09-30): 261빈칸 중 250 (95.8%). 끝 글자가 같은 낱말이 책에 모자란 빈칸만 예외
    const all = LETTER_PIECES.flatMap((p) => blanksFor(p.book, p.chapter, copySourceFor(p.book)))
    const good = all.filter((b) => {
      const last = norm(b.answer).slice(-1)
      return b.options.filter((o) => o !== b.answer && norm(o).slice(-1) === last).length >= 2
    })
    expect(all).toHaveLength(121 * COPY_BLANKS)
    expect(good.length / all.length).toBeGreaterThanOrEqual(0.9)
  })

  it('틀린 보기 확인은 다른 책까지 센다 (countAnywhere)', () => {
    const src = copySourceFor('rom')
    // 에베소서 절은 로마서 안에서는 0번, 모든 책에서는 1번 이상
    const t = versesOf('엡 2:8')[0].text
    expect(src.countVerse(t)).toBe(0)
    expect(src.countAnywhere(t)).toBeGreaterThanOrEqual(1)
    expect(src.countAnywhere(t)).toBe(allSrc.countVerse(t))
  })

  it('같은 절에 두 번 나오는 낱말은 답이 되지 않는다 (딤후 3:2 사랑하며)', () => {
    expect(wordsIn(versesOf('딤후 3:2')[0].text).filter((w) => w === '사랑하며').length).toBeGreaterThan(1)
    const b = blanksFor('2ti', 3, copySourceFor('2ti')).find((x) => x.ref === '딤후 3:2')
    if (b) expect(b.answer).not.toBe('사랑하며')
  })
})

// ── 기록 ──

/** 로마서–빌레몬서·히브리서–유다서 방이 열리고, 재료가 넉넉한 상태 */
function ready(book: Book): GameState {
  const s = newGame(CONTENT)
  const open = {
    ...s,
    flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 },
    shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } as GameState['shelved'],
    inv: { ...s.inv, papyrus: 5, ink: 5 },
  }
  return listen(chooseBook(open, book, CONTENT), POSTMAN, CONTENT).state
}
const answers = (book: Book, chapter: number) => blanksFor(book, chapter, copySourceFor(book)).map((b) => b.answer)

describe('recordLetter', () => {
  it('맞게 채우면 재료가 줄고 장이 채워진다 (첫 장 장면)', () => {
    const s = ready('rom')
    expect(s.collected).toContain('rom-001')
    expect(letterReady(s, 'rom', 1, CONTENT)).toEqual({ kind: 'ready' })
    const r = recordLetter(s, 'rom', 1, answers('rom', 1), CONTENT)
    expect(r).not.toBe(s)
    expect(r.progress.rom.completed).toEqual([1])
    expect(r.inv.papyrus).toBe(5 - CHAPTER_COST.papyrus!)
    expect(r.inv.ink).toBe(5 - CHAPTER_COST.ink!)
    expect(r.scenes).toContain('firstChapter')
    expect(r.clock.minute).toBeGreaterThan(s.clock.minute)
    expect(r.needs.fatigue).toBeGreaterThan(s.needs.fatigue)
    // 한 번 기록한 장은 다시 기록하지 않는다
    expect(recordLetter(r, 'rom', 1, answers('rom', 1), CONTENT)).toBe(r)
    expect(letterReady(r, 'rom', 1, CONTENT)).toEqual({ kind: 'recorded' })
    // 다음 장으로 이어진다
    const r2 = recordLetter(r, 'rom', 2, answers('rom', 2), CONTENT)
    expect(r2.progress.rom.completed).toEqual([1, 2])
  })

  it('틀린 답이면 그대로', () => {
    const s = ready('rom')
    const a = answers('rom', 1)
    const wrong = blanksFor('rom', 1, copySourceFor('rom'))[0].options.find((o) => o !== a[0])!
    expect(recordLetter(s, 'rom', 1, [wrong, ...a.slice(1)], CONTENT)).toBe(s)
    expect(recordLetter(s, 'rom', 1, a.slice(0, -1), CONTENT)).toBe(s)
    expect(recordLetter(s, 'rom', 1, [...a, a[0]], CONTENT)).toBe(s)
  })

  it('받지 않은 장이면 그대로', () => {
    const s = ready('rom')
    const notYet = s.collected.includes('rom-003') ? 4 : 3
    const done = { ...s, progress: { ...s.progress, rom: { ...s.progress.rom, completed: Array.from({ length: notYet - 1 }, (_, i) => i + 1) } } }
    expect(done.collected).not.toContain(`rom-${String(notYet).padStart(3, '0')}`)
    expect(letterReady(done, 'rom', notYet, CONTENT)).toEqual({ kind: 'notReceived' })
    expect(recordLetter(done, 'rom', notYet, answers('rom', notYet), CONTENT)).toBe(done)
    // 다른 책(아직 받지 않은 고린도전서)도
    expect(recordLetter(s, '1co', 1, answers('1co', 1), CONTENT)).toBe(s)
  })

  it('순서를 건너뛰면 그대로', () => {
    const s = ready('rom')
    expect(s.collected).toContain('rom-002')
    expect(letterReady(s, 'rom', 2, CONTENT)).toEqual({ kind: 'order' })
    expect(recordLetter(s, 'rom', 2, answers('rom', 2), CONTENT)).toBe(s)
  })

  it('재료가 없거나 피곤하면 그대로', () => {
    const s = ready('rom')
    const poor = { ...s, inv: { ...s.inv, papyrus: 0, ink: 0 } }
    expect(letterReady(poor, 'rom', 1, CONTENT)).toEqual({ kind: 'supplies', need: CHAPTER_COST })
    expect(recordLetter(poor, 'rom', 1, answers('rom', 1), CONTENT)).toBe(poor)
    const tired = { ...s, needs: { ...s.needs, fatigue: 100 } }
    expect(letterReady(tired, 'rom', 1, CONTENT)).toEqual({ kind: 'tired' })
    expect(recordLetter(tired, 'rom', 1, answers('rom', 1), CONTENT)).toBe(tired)
  })

  it('조각 책(복음서)은 옮겨 적기로 기록하지 않는다', () => {
    const s = ready('rom')
    expect(recordLetter(s, 'mk', 1, [], CONTENT)).toBe(s)
  })

  it('편지 책은 조각 엮기 길(chapterReady·submitChapter)로 기록되지 않는다', () => {
    for (const b of ['rom', 'phm'] as const) {
      const s = setArrangement(ready(b), b, 1, [`${b}-001`])
      expect(s.collected).toContain(`${b}-001`)
      expect(chapterReady(s, b, 1, CONTENT).kind).not.toBe('done')
      const r = submitChapter(s, b, 1, CONTENT)
      expect(r.result.kind).not.toBe('done')
      expect(r.state).toBe(s)
      expect(r.state.progress[b].completed).toEqual([])
    }
  })

  it('빌레몬서 한 장 기록 → 다 엮음(bookBound)', () => {
    const s = ready('phm')
    const r = recordLetter(s, 'phm', 1, answers('phm', 1), CONTENT)
    expect(r.progress.phm.completed).toEqual([1])
    expect(r.scenes).toContain('bookBound')
  })

  it('스물한 권 모두 첫 장을 기록할 수 있다', () => {
    for (const b of LETTERS) {
      const s = ready(b)
      expect(recordLetter(s, b, 1, answers(b, 1), CONTENT).progress[b].completed, b).toEqual([1])
    }
  })

  it('편지 장 조각은 책마다 장 순서대로', () => {
    for (const b of LETTERS) expect(piecesOf(b).map((p) => p.chapter)).toEqual(FULL[b].map((_, i) => i + 1))
  })
})
