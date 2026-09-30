// 계획 9 작업 1: 요한계시록의 자리 — 방 표(rev 줄, 장이 오는 길 'stars', 첫머리 문제 없음)·장 조각·옮겨 적기·서고 퀴즈
import bible from '../content/nt-krv.json'
import { BOOKS_WITH_CONTENT, CONTENT, copySourceFor, inBrackets, LETTER_OPENINGS, LETTER_PIECES, noText, PIECES, pieceOfVerse, piecesOf, quizSourceFor, REV_PIECES, versesOf } from '../content/catalog'
import { JOURNAL_NOTES, SCENES, T } from '../content/text'
import { pickableBooks, roomOpen } from './books'
import { blanksFor, COPY_BLANKS, fillVerse } from './copy'
import { chooseBook, goToSleep, newGame, shelvedCount, type GameState } from './game'
import { mulberry32 } from './offers'
import { buildLibraryQuiz, MAX_BOOK_OPTIONS, QUIZ_SIZE, quizzable, type Question } from './quiz'
import { deserialize, serialize } from './save'
import { arrivesOf, modeOf, roomOf, shelfRoom, SHELF_ROOMS, SUBSET_BOOKS } from './shelf-rooms'
import { BOOKS, isLetter, LETTERS, type Book } from './types'

const FULL = bible as Record<string, string[][]>
/** 계획서를 쓰며 원문(nt-krv.json)으로 센 장 길이 — 작업 때 다시 세어 박는다 */
const REV_LENGTHS = [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]
const ROM_PHM = shelfRoom('romPhm').books
const HEB_JUD = shelfRoom('hebJud').books
const norm = (s: string) => s.replace(/[\s,.!?]+/g, '')

/** 히브리서–유다서 방이 열린 상태 + 그 방의 책 몇 권을 꽂음 (로마서–빌레몬서 방까지는 다 찼다) */
function hebJudShelved(books: readonly Book[]): GameState {
  const s = newGame(CONTENT)
  const shelved = { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1, ...Object.fromEntries([...ROM_PHM, ...books].map((b) => [b, 1])) } as GameState['shelved']
  return { ...s, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 }, shelved }
}

describe('방 표의 요한계시록 줄', () => {
  it('rev 방: 책 rev 하나, 장째로(letters), 넷째 문, 별 보는 밤에 오고, 첫머리 문제 없음', () => {
    expect(shelfRoom('rev')).toEqual({ id: 'rev', books: ['rev'], mode: 'letters', door: 3, arrives: 'stars', noOpening: true })
    expect(roomOf('rev').id).toBe('rev')
    expect(modeOf('rev')).toBe('letters')
    expect(arrivesOf('rev')).toBe('stars')
    for (const b of LETTERS) expect(arrivesOf(b), b).toBe('post')
    // 다른 방에는 새 칸이 없다
    for (const r of SHELF_ROOMS.filter((x) => x.id !== 'rev')) {
      expect(r.arrives, r.id).toBeUndefined()
      expect(r.noOpening, r.id).toBeUndefined()
    }
  })

  it('BOOKS 끝에 rev, 편지(LETTERS)에는 넣지 않는다', () => {
    expect(BOOKS).toHaveLength(27)
    expect(BOOKS.at(-1)).toBe('rev')
    expect(SHELF_ROOMS.flatMap((r) => r.books)).toEqual(BOOKS)
    expect(LETTERS).not.toContain('rev')
    expect(isLetter('rev')).toBe(false)
    expect(SUBSET_BOOKS.at(-1)).toBe('rev')
    expect((T.quiz.books as Record<string, string>).rev).toBe('요한계시록')
  })

  it('약어 계: 요한계시록이고 다른 책 약어와 헷갈리지 않는다', () => {
    expect(versesOf('계 2:1')[0].text).toBe(FULL.rev[1][0])
    expect(versesOf('계 1:1')[0].text).toBe(FULL.rev[0][0])
    expect(versesOf('계 1:1')[0].text).not.toBe(FULL.jhn[0][0])
    expect(pieceOfVerse('계 2:1')?.id).toBe('rev-002')
    expect(pieceOfVerse('계 22:21')?.id).toBe('rev-022')
    expect(quizSourceFor(['rev']).versesOf('계 2:1').map((v) => v.ref)).toEqual(['계 2:1'])
  })
})

describe('① 장 조각 — 장 하나에 조각 하나', () => {
  it('조각 22개, 장 길이가 원문 값과 같고 조각 ref 끝 절 = 장 길이', () => {
    expect(FULL.rev.map((c) => c.length)).toEqual(REV_LENGTHS)
    expect(REV_PIECES).toHaveLength(22)
    expect(piecesOf('rev')).toEqual(REV_PIECES)
    REV_PIECES.forEach((p, i) => {
      const ch = i + 1
      expect(p).toEqual({ id: `rev-${String(ch).padStart(3, '0')}`, book: 'rev', ref: `계 ${ch}:1-${REV_LENGTHS[i]}`, chapter: ch, title: `요한계시록 ${ch}장`, stamps: [] })
    })
    expect(REV_PIECES[0]).toEqual({ id: 'rev-001', book: 'rev', ref: '계 1:1-20', chapter: 1, title: '요한계시록 1장', stamps: [] })
    // PIECES = pieces.json + 편지 장 조각 + 요한계시록 장 조각
    expect(PIECES.filter((p) => p.book === 'rev')).toEqual(REV_PIECES)
    expect(PIECES.filter((p) => isLetter(p.book))).toEqual(LETTER_PIECES)
    expect(BOOKS_WITH_CONTENT).toContain('rev')
  })

  it('② 본문 없는 절 0개 — versesOf로 본 절 수 = 원문 절 수(404), 괄호가 든 절은 계 20:5 하나', () => {
    expect(FULL.rev.flat().filter(noText)).toEqual([])
    expect(REV_PIECES.reduce((n, p) => n + versesOf(p.ref).length, 0)).toBe(404)
    expect(FULL.rev.reduce((n, c) => n + c.length, 0)).toBe(404)
    const parens = FULL.rev.flatMap((c, ci) => c.flatMap((t, vi) => (/[[\]()]/.test(t) ? [`계 ${ci + 1}:${vi + 1}`] : [])))
    expect(parens).toEqual(['계 20:5'])
    expect(inBrackets('계 20:5')).toBe(true)
    expect(inBrackets('계 20:4')).toBe(false)
    expect(inBrackets('계 20:6')).toBe(false)
  })
})

describe('③ 옮겨 적기 — 22장 전부', () => {
  /** 원문으로 까닭을 확인한, 빈칸이 셋에 못 미치는 장 — 잰 값(2026-09-30): 없음, 22장 모두 셋 */
  const SHORT: Record<number, number> = {}

  for (const p of REV_PIECES) {
    it(p.ref, () => {
      const src = copySourceFor('rev')
      const blanks = blanksFor('rev', p.chapter, src)
      expect(blanks.length).toBeGreaterThanOrEqual(1)
      expect(blanks).toHaveLength(SHORT[p.chapter] ?? COPY_BLANKS)
      const shown = src.versesOf(p.ref)
      const original = FULL.rev[p.chapter - 1]
      const revSrc = quizSourceFor(['rev'])
      const allSrc = quizSourceFor(BOOKS)
      for (const b of blanks) {
        expect(b.ref).not.toBe('계 20:5')
        expect(inBrackets(b.ref)).toBe(false)
        const v = shown.find((x) => x.ref === b.ref)!
        expect(quizzable(v.text, v.inBrackets)).toBe(true)
        expect(fillVerse(v.text, b.index, b.answer)).toBe(original[Number(b.ref.split(':')[1]) - 1])
        for (const o of b.options.filter((x) => x !== b.answer)) {
          // 다른 보기로 채운 절이 요한계시록에도, 앱 본문 어디에도 없다
          expect(revSrc.countVerse(fillVerse(v.text, b.index, o)), o).toBe(0)
          expect(allSrc.countVerse(fillVerse(v.text, b.index, o)), o).toBe(0)
        }
      }
      // 빈칸을 모두 답으로 채운 장 = 원문 장 (계 20:5 괄호 절도 본문으로 보인다)
      const filled = shown.map((v) => {
        const b = blanks.find((x) => x.ref === v.ref)
        return b ? fillVerse(v.text, b.index, b.answer) : v.text
      })
      expect(filled).toEqual(original)
    })
  }

  it('계 20:5(괄호 절)는 빈칸이 되지 않지만 20장 본문에는 보인다', () => {
    const src = copySourceFor('rev')
    expect(blanksFor('rev', 20, src).map((b) => b.ref)).not.toContain('계 20:5')
    expect(src.versesOf('계 20:1-15').map((v) => v.ref)).toContain('계 20:5')
  })
})

describe('④ 방 열림 — 히브리서–유다서 여덟 권이 다 꽂힌 다음 날', () => {
  it('여덟 권 중 하나라도 안 꽂혔으면 닫힘, 모두 꽂고 잔 다음 날 열림·장면 roomOpen:rev', () => {
    for (const missing of HEB_JUD) {
      const slept = goToSleep(hebJudShelved(HEB_JUD.filter((b) => b !== missing)), CONTENT)
      expect(roomOpen('rev', slept.flags), missing).toBe(false)
      expect(slept.scenes).not.toContain('roomOpen:rev')
    }
    const full = hebJudShelved(HEB_JUD)
    expect(roomOpen('rev', full.flags)).toBe(false)
    const next = goToSleep(full, CONTENT)
    expect(roomOpen('rev', next.flags)).toBe(true)
    expect(next.flags['room:rev']).toBe(1)
    expect(next.scenes).toContain('roomOpen:rev')
    const again = goToSleep({ ...next, scenes: [] }, CONTENT)
    expect(again.scenes).not.toContain('roomOpen:rev')
  })

  it('열리기 전에는 pickableBooks에 없고 chooseBook("rev")이 그대로, 열리면 고를 수 있다', () => {
    const s = hebJudShelved(HEB_JUD)
    expect(pickableBooks(s.flags, BOOKS_WITH_CONTENT)).not.toContain('rev')
    expect(chooseBook(s, 'rev', CONTENT)).toBe(s)
    const open = goToSleep(s, CONTENT)
    expect(pickableBooks(open.flags, BOOKS_WITH_CONTENT)).toEqual(BOOKS)
    const picked = chooseBook(open, 'rev', CONTENT)
    expect(picked.activeBook).toBe('rev')
    // 장째로 오는 책 — 이웃이 조각을 건네지 않는다
    expect(picked.offers).toEqual({})
  })

  it('방 열림 장면·앨범·일지 문구 (앞 두 방과 같은 짜임)', () => {
    const scene = SCENES['roomOpen:rev']
    expect(scene.title).toBe('서고 오른쪽 아래 문')
    expect(scene.lines.map((l) => l.speaker)).toEqual(['narration', 'narration', 'postman'])
    expect(scene.lines[0].text).toBe('늘 잠겨 있던 서고 오른쪽 아래 문이 열렸다는 소식이 들려왔다.')
    expect(scene.lines[1].text).toBe('안에는 책 한 권을 꽂을 선반과 책장, 창 둘 사이 벽에 건 카드 판, 가운데 읽는 탁자가 있다.')
    expect(scene.lines[2].text).toBe('그 방 책은 해 질 녘에 언덕 벤치 곁 편지함에 넣어 둘게요. 맑은 밤에 별 보러 올라가서 꺼내 가세요. 비 오거나 흐린 날엔 젖을까 봐 넣지 않아요.')
    expect(scene.album).toBe('서고 오른쪽 아래 방이 열린 날')
    expect(JOURNAL_NOTES['roomOpen:rev']).toBe(' 서고 오른쪽 아래 방이 열렸다.')
  })

  it('책상·퀴즈 문구', () => {
    expect(T.copy.pickHintStars).toBe('요한계시록은 맑은 밤, 언덕 벤치 곁 편지함에서 한두 장씩 꺼내 와요.')
    expect(T.copy.notReceivedStars).toBe('아직 이 장이 오지 않았어요. 맑은 밤에 언덕에 올라 별을 보세요.')
    expect(T.quiz.verseOrderBook).toBe('이 책에서 먼저 나오는 구절은 어느 쪽인가요?')
  })
})

describe('⑤ 옛 저장', () => {
  it('계획 7 배포본 모양(열여덟 권)·계획 8 모양(스물여섯 권) 저장을 불러와도 progress.rev가 있고, 방이 닫혀 고를 수 없다', () => {
    const s = hebJudShelved([])
    const o = JSON.parse(serialize(chooseBook(s, 'heb', CONTENT)))
    const pick = (ids: readonly string[]) => Object.fromEntries(ids.map((b) => [b, o.progress[b]]))
    const plan7 = pick(['mt', 'mk', 'lk', 'jn', 'ac', ...ROM_PHM])
    const plan8 = pick(['mt', 'mk', 'lk', 'jn', 'ac', ...ROM_PHM, ...HEB_JUD])
    for (const [name, progress, flags] of [
      ['계획 7', plan7, { ...o.flags, 'room:hebJud': undefined }],
      ['계획 8', plan8, o.flags],
    ] as const) {
      const back = deserialize(JSON.stringify({ ...o, progress, flags: JSON.parse(JSON.stringify(flags)) }), CONTENT)!
      expect(back, name).not.toBeNull()
      expect(back.progress.rev, name).toEqual({ completed: [], arrangement: {} })
      expect(pickableBooks(back.flags, BOOKS_WITH_CONTENT), name).not.toContain('rev')
    }
  })
})

describe('⑥ 서고 퀴즈 — 편지 모양, 첫머리 문제 없음', () => {
  const pools: [string, Book[]][] = [
    ['요한계시록만', ['rev']],
    ['스물일곱 권 전부', [...BOOKS]],
  ]
  const allSrc = quizSourceFor(BOOKS)
  for (const [name, pool] of pools) {
    it(name, () => {
      const src = quizSourceFor(pool)
      const kinds = new Set<string>()
      for (let seed = 1; seed <= 30; seed++) {
        const qs: Question[] = buildLibraryQuiz({ current: 'rev', pool, piecesOf, rng: mulberry32(seed), src, openings: LETTER_OPENINGS })
        const w = `${name}/${seed}`
        expect(qs, w).toHaveLength(QUIZ_SIZE)
        for (const q of qs) {
          kinds.add(q.kind)
          expect(['detective', 'order', 'verse', 'opening', 'openingNone'], w).not.toContain(q.kind)
          const refs = q.kind === 'verseOrder' ? q.options : 'ref' in q ? [q.ref] : []
          for (const r of refs) expect(r, w).not.toBe('계 20:5')
          if (q.kind === 'book') {
            expect(q.options.length, w).toBeLessThanOrEqual(MAX_BOOK_OPTIONS)
            expect(q.options, w).toContain(q.answer)
            const text = src.versesOf(q.ref)[0].text
            expect(src.countVerse(text), w).toBe(1)
            expect(pieceOfVerse(q.ref)?.book, w).toBe(q.answer)
          } else if (q.kind === 'verseOrder') {
            for (const r of q.options) {
              expect(pieceOfVerse(r)?.book, w).toBe('rev')
              expect(src.countVerse(src.versesOf(r)[0].text), w).toBe(1)
            }
          } else if (q.kind === 'blank') {
            const text = [q.before, q.answer, q.after].filter(Boolean).join(' ')
            expect(norm(text), w).toBe(norm(versesOf(q.ref)[0].text))
            expect(pieceOfVerse(q.ref)?.book, w).toBe('rev')
            expect(src.countVerse(text), w).toBe(1)
            for (const o of q.options.filter((x) => x !== q.answer)) {
              const filled = [q.before, o, q.after].filter(Boolean).join(' ')
              expect(src.countVerse(filled), `${w} ${o}`).toBe(0)
              expect(allSrc.countVerse(filled), `${w} ${o}`).toBe(0)
            }
          } else if (q.kind === 'puzzle') {
            expect(pieceOfVerse(q.ref)?.book, w).toBe('rev')
            expect(src.countVerse(src.versesOf(q.ref)[0].text), w).toBe(1)
          }
        }
      }
      // 요한계시록 퀴즈에 첫머리 문제는 한 번도 나오지 않는다
      expect(kinds.has('opening')).toBe(false)
      expect(kinds.has('openingNone')).toBe(false)
      expect(kinds.has('blank')).toBe(true)
      expect(kinds.has('verseOrder')).toBe(true)
    })
  }

  it('letters.json에 요한계시록 줄이 없다', () => {
    expect(LETTER_OPENINGS.some((o) => o.book === 'rev')).toBe(false)
  })
})

describe('⑦ shelvedCount', () => {
  it('요한계시록을 꽂아도 그대로', () => {
    const s = hebJudShelved(HEB_JUD)
    expect(shelvedCount({ shelved: { ...s.shelved, rev: 2 } })).toBe(shelvedCount(s))
    expect(shelvedCount({ shelved: { rev: 1 } })).toBe(0)
  })
})
