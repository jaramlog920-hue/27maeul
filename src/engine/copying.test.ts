// 계획 14 작업 1: 필사 엔진 — 한 절씩 따라 적기, 재료 없음
import { CONTENT } from '../content/catalog'
import { chaptersOf, emptyProgress } from './books'
import {
  acceptInput,
  checkCopy,
  composingPrefix,
  COPY_CHAPTER_XP,
  copySpot,
  copyVerses,
  jamoOf,
  normalizeCopy,
  originalEnd,
  sanitizeCopy,
} from './copying'
import { newGame, saveCopyDraft, startCopy, writeVerse, type GameState } from './game'
import { deserialize, serialize } from './save'
import { BOOK_CHAPTERS, copyJobLevel, jobOf } from './job'
import { statScore } from './stats'
import { BOOKS, type Book } from './types'

const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), scenes: [], ...patch })

/** 그 책의 지금 절을 끝까지 맞게 적는다 */
function writeCurrent(s: GameState, book: Book) {
  const spot = copySpot(s, book, CONTENT)!
  return writeVerse(s, book, spot.verse.text, CONTENT)
}
/** 한 장을 끝까지 적는다 (마지막 결과와 함께) */
function writeChapter(s: GameState, book: Book) {
  let r = writeCurrent(s, book)
  while (r.result.kind === 'verse') r = writeCurrent(r.state, book)
  return r
}

describe('정규화 — 띄어쓰기·문장부호 무시', () => {
  it('띄어쓰기·쉼표·마침표·괄호·따옴표·가운뎃점·말줄임표를 뗀다', () => {
    expect(normalizeCopy('태초에 말씀이 계시니라, 이 말씀이.')).toBe('태초에말씀이계시니라이말씀이')
    expect(normalizeCopy(' [ 가 ] ( 나 ) “다” ‘라’ 마·바…사! 아? ~자; 차: ')).toBe('가나다라마바사아자차')
    expect(normalizeCopy('\t줄\n바꿈 도')).toBe('줄바꿈도')
  })
  it('한글·한자·숫자는 남긴다', () => {
    expect(normalizeCopy('上帝 하나님 25절')).toBe('上帝하나님25절')
  })
  it('조합형(NFD) 자모도 음절로 모은다', () => {
    expect(normalizeCopy('하나'.normalize('NFD'))).toBe('하나')
  })
  it('띄어쓰기를 달리 써도, 부호를 빼도 같은 절로 맞는다', () => {
    const verse = '아브라함과 다윗의 자손 예수 그리스도의 세계라'
    expect(checkCopy('아브라함과다윗의 자손예수 그리스도의세계라', verse).done).toBe(true)
    expect(checkCopy('너희가 만일 믿음이 있으면', '너희가, 만일 믿음이 (있으면)').done).toBe(true)
  })
})

describe('한글 조합 중인 마지막 글자', () => {
  it('자모 나누기: 겹모음·겹받침은 누르는 차례대로', () => {
    expect(jamoOf('한')).toBe('ㅎㅏㄴ')
    expect(jamoOf('왔')).toBe('ㅇㅗㅏㅆ')
    expect(jamoOf('닭')).toBe('ㄷㅏㄹㄱ')
    expect(jamoOf('ㄳ')).toBe('ㄱㅅ')
    expect(jamoOf('ㅢ')).toBe('ㅡㅣ')
  })
  it('본문 글자의 앞부분이면 맞게 가는 중 (틀림 아님)', () => {
    const t = '하나님이'
    expect(checkCopy('ㅎ', t)).toMatchObject({ matched: 0, composing: true, typo: false, done: false })
    expect(checkCopy('하', t)).toMatchObject({ matched: 1, composing: false, typo: false })
    // 받침이 다음 글자의 첫소리로 넘어가기 전: '한' (하+ㄴ) → '하나'
    expect(checkCopy('한', t)).toMatchObject({ matched: 0, composing: true, typo: false })
    expect(checkCopy('하난', t)).toMatchObject({ matched: 1, composing: true, typo: false })
    expect(checkCopy('하남', t)).toMatchObject({ matched: 1, composing: false, typo: true })
    // 겹모음 조합 중: '오' → '와', 겹받침 조합 중: '달' → '닭'
    expect(checkCopy('오', '와서')).toMatchObject({ composing: true, typo: false })
    expect(checkCopy('달', '닭이')).toMatchObject({ composing: true, typo: false })
    expect(composingPrefix('앉', '안자')).toBe(true)
  })
  it('마지막 글자가 아니거나 앞부분이 아니면 틀림', () => {
    expect(checkCopy('한나', '하나')).toMatchObject({ matched: 0, typo: true })
    expect(checkCopy('허', '하나')).toMatchObject({ matched: 0, composing: false, typo: true })
    expect(checkCopy('각', '가')).toMatchObject({ typo: true })
    expect(checkCopy('a', '가')).toMatchObject({ typo: true })
  })
})

describe('맞게 쓴 길이·오타 뒤 고치기', () => {
  const t = '태초에 말씀이 계시니라'
  it('앞에서부터 맞게 쓴 글자 수', () => {
    expect(checkCopy('', t)).toMatchObject({ matched: 0, typo: false, total: 10, done: false })
    expect(checkCopy('태초에 말', t)).toMatchObject({ matched: 4, typo: false })
  })
  it('오타가 나면 그 자리에서 멈추고, 지우고 고치면 다시 맞는다', () => {
    expect(checkCopy('태초애 말씀', t)).toMatchObject({ matched: 2, typo: true, done: false })
    expect(checkCopy('태초', t)).toMatchObject({ matched: 2, typo: false })
    expect(checkCopy('태초에 말씀이 계시니라', t).done).toBe(true)
  })
  it('본문보다 더 쓰면 틀림', () => {
    expect(checkCopy('태초에 말씀이 계시니라 또', t)).toMatchObject({ matched: 10, typo: true, done: false })
  })
  it('원문에서 맞게 쓴 부분이 끝나는 자리 (띄어쓰기·부호 건너뜀)', () => {
    const v = '가라사대, 너희 믿음이'
    expect(originalEnd(v, 0)).toBe(0)
    expect(originalEnd(v, 4)).toBe(4)
    expect(originalEnd(v, 5)).toBe(v.indexOf('너') + 1)
    expect(originalEnd(v, 99)).toBe(v.length)
  })
})

describe('자동완성·붙여넣기 막기', () => {
  it('붙여넣기 표식이면 앞 입력 그대로', () => {
    expect(acceptInput('태초', '태초에 말씀이 계시니라', true)).toBe('태초')
  })
  it('한 번에 여러 글자가 늘면 받지 않고, 한두 글자·지우기는 받는다', () => {
    expect(acceptInput('', '태초에 말씀이')).toBe('')
    expect(acceptInput('태초', '태초에')).toBe('태초에')
    expect(acceptInput('안', '안자')).toBe('안자')
    expect(acceptInput('태초에 말씀이', '태')).toBe('태')
  })
  it('writeVerse도 붙여넣은 입력은 기록하지 않는다', () => {
    const s = startCopy(fresh(), 'mt', CONTENT)
    const spot = copySpot(s, 'mt', CONTENT)!
    const r = writeVerse(s, 'mt', spot.verse.text, CONTENT, true)
    expect(r.result.kind).toBe('notYet')
    expect(r.state.copyStats.verses).toBe(0)
  })
})

describe('장의 절 목록', () => {
  it('본문 없는 절은 빠지고 번호만 건너뛴다 (마 17:21, 행 15:26·34, 롬 9:2)', () => {
    const mt17 = copyVerses('mt', 17, CONTENT)
    expect(mt17.map((v) => v.verse)).not.toContain(21)
    expect(mt17.map((v) => v.verse)).toContain(20)
    expect(mt17.map((v) => v.verse)).toContain(22)
    expect(copyVerses('ac', 15, CONTENT).map((v) => v.verse)).not.toContain(26)
    expect(copyVerses('ac', 15, CONTENT).map((v) => v.verse)).not.toContain(34)
    expect(copyVerses('rom', 9, CONTENT).map((v) => v.verse)).not.toContain(2)
  })
  it('대괄호 절은 본문이므로 필사에 넣는다 (요 8:1)', () => {
    expect(copyVerses('jn', 8, CONTENT).map((v) => v.verse)).toContain(1)
  })
  it('27권 260장 전부: 장마다 필사할 절이 하나 이상, 정규화한 본문이 비어 있지 않다', () => {
    let chapters = 0
    for (const b of BOOKS)
      for (const c of chaptersOf(b, CONTENT)) {
        const vs = copyVerses(b, c, CONTENT)
        expect(vs.length, `${b} ${c}`).toBeGreaterThan(0)
        for (const v of vs) {
          expect(normalizeCopy(v.text).length, `${b} ${c}:${v.verse}`).toBeGreaterThan(0)
          expect(v.text).not.toMatch(/^\((없음|\d+절에 포함되어 있음)\)$/)
          // 본문 그대로를 적으면 언제나 맞는다
          expect(checkCopy(v.text, v.text).done).toBe(true)
        }
        chapters++
      }
    expect(chapters).toBe(260)
  })
})

describe('절·장·권 완료', () => {
  it('처음엔 아직 마치지 않은 첫 장의 첫 절, 재료 없이 적는다', () => {
    const s = startCopy(fresh({ inv: {} }), 'mt', CONTENT)
    expect(s.copy.book).toBe('mt')
    const spot = copySpot(s, 'mt', CONTENT)!
    expect(spot).toMatchObject({ chapter: 1, index: 0, draft: '' })
    expect(spot.verse.verse).toBe(1)
    const r = writeVerse(s, 'mt', '아브라함과 다윗의 자손 예수 그리스도의 세계라', CONTENT)
    expect(r.result).toEqual({ kind: 'verse', chapter: 1, verse: 1 })
    expect(r.state.copyStats).toMatchObject({ verses: 1, chars: normalizeCopy('아브라함과 다윗의 자손 예수 그리스도의 세계라').length, chapters: 0, firstDay: s.clock.day })
    expect(copySpot(r.state, 'mt', CONTENT)!.verse.verse).toBe(2)
    expect(r.state.inv).toEqual({})
  })

  it('덜 맞으면 기록하지 않고 입력만 자리에 저장한다', () => {
    const s = fresh()
    const r = writeVerse(s, 'mt', '아브라함과 다윗', CONTENT)
    expect(r.result).toMatchObject({ kind: 'notYet', check: { matched: 7, typo: false } })
    expect(r.state.copyStats.verses).toBe(0)
    expect(r.state.copy.at.mt).toEqual({ chapter: 1, verse: 1, draft: '아브라함과 다윗' })
  })

  it('장의 마지막 절이면 장을 마친다: 마친 장에 더하고, 지능·손재주, 시간·피로 조금', () => {
    const s = fresh({ inv: {}, collected: [] })
    const r = writeChapter(s, 'mt')
    if (r.result.kind !== 'chapter') throw new Error('장이 끝나지 않았다')
    const verses = copyVerses('mt', 1, CONTENT)
    expect(r.result).toMatchObject({ chapter: 1, verses: verses.length, bookDone: false, next: 2 })
    expect(r.result.chars).toBe(verses.reduce((n, v) => n + v.chars, 0))
    expect(r.state.progress.mt.completed).toEqual([1])
    expect(r.state.scenes).toContain('firstChapter')
    expect(r.state.copyStats).toMatchObject({ verses: verses.length, chars: r.result.chars, chapters: 1, books: 0 })
    expect(r.state.stats.wit.xp).toBe(COPY_CHAPTER_XP)
    expect(r.state.stats.hand.xp).toBe(COPY_CHAPTER_XP)
    expect(r.result.gains).toEqual({ wit: statScore(r.state.stats.wit) - 1, hand: statScore(r.state.stats.hand) - 1 })
    expect(r.result.gains.wit).toBeGreaterThanOrEqual(1)
    expect(r.state.needs.fatigue).toBeGreaterThanOrEqual(s.needs.fatigue + 6) // 일 6 + 흐른 시간만큼
    expect(r.state.clock.minute).toBeGreaterThan(s.clock.minute)
    // 재료도 조각도 받은 편지도 보지 않았다
    expect(r.state.inv).toEqual({})
    expect(copySpot(r.state, 'mt', CONTENT)).toMatchObject({ chapter: 2, index: 0 })
  })

  it('마지막 장을 마치면 한 권 — bookBound 장면, 권 수, 쓸 절 없음', () => {
    // 빌레몬서는 한 장
    const s = startCopy(fresh(), 'phm', CONTENT)
    const r = writeChapter(s, 'phm')
    expect(r.result).toMatchObject({ kind: 'chapter', bookDone: true, next: null })
    expect(r.state.scenes).toEqual(['firstChapter', 'bookBound'])
    expect(r.state.copyStats.books).toBe(1)
    expect(copySpot(r.state, 'phm', CONTENT)).toBeNull()
    expect(writeVerse(r.state, 'phm', '아무 글', CONTENT).result.kind).toBe('none')
  })

  it('예전에 마친 장은 건너뛰고, 한 권의 남은 마지막 장을 필사로 마치면 bookBound', () => {
    const all = chaptersOf('mk', CONTENT)
    const progress = { ...emptyProgress(), mk: { completed: all.slice(0, -1), arrangement: {} } }
    const s = fresh({ progress })
    expect(copySpot(s, 'mk', CONTENT)!.chapter).toBe(16)
    const r = writeChapter(s, 'mk')
    expect(r.result).toMatchObject({ kind: 'chapter', chapter: 16, bookDone: true })
    expect(r.state.scenes).toContain('bookBound')
    expect(r.state.scenes).not.toContain('firstChapter')
  })

  it('사도행전 장을 마치면 여정 카드, 요한계시록 2장이면 일곱 교회 카드가 들어온다', () => {
    const ac = writeChapter(fresh(), 'ac')
    expect(ac.state.progress.ac.completed).toEqual([1])
    const prog = { ...emptyProgress(), rev: { completed: [1], arrangement: {} } }
    const rev = writeChapter(fresh({ progress: prog }), 'rev')
    expect(rev.state.progress.rev.completed).toEqual([1, 2])
    expect(rev.state.churches.length).toBeGreaterThan(0)
  })

  it('27권 어느 책이든 처음부터 고를 수 있다 (서고 방이 닫혀 있어도)', () => {
    for (const b of BOOKS) expect(startCopy(fresh(), b, CONTENT).copy.book).toBe(b)
  })
})

describe('이어 쓰기 위치 — 저장/불러오기', () => {
  it('쓰다 만 절과 입력이 저장되고, 불러오면 그 절 그 입력부터', () => {
    let s = startCopy(fresh(), 'lk', CONTENT)
    s = writeCurrent(s, 'lk').state
    s = writeCurrent(s, 'lk').state
    s = saveCopyDraft(s, 'lk', '우리 중에', CONTENT)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.copy.book).toBe('lk')
    expect(copySpot(back, 'lk', CONTENT)).toMatchObject({ chapter: 1, index: 2, draft: '우리 중에' })
    expect(back.copyStats).toEqual(s.copyStats)
  })

  it('책마다 따로 자리를 기억한다', () => {
    let s = writeCurrent(fresh(), 'mt').state
    s = writeCurrent(s, 'jn').state
    s = writeCurrent(s, 'jn').state
    expect(copySpot(s, 'mt', CONTENT)!.verse.verse).toBe(2)
    expect(copySpot(s, 'jn', CONTENT)!.verse.verse).toBe(3)
  })

  it('저장된 절이 본문 없는 절이면 다음 절부터 (마 17:21 → 22)', () => {
    const s = fresh({ copy: { book: 'mt', at: { mt: { chapter: 17, verse: 21 } }, legacy: {} } })
    expect(copySpot(s, 'mt', CONTENT)!.verse.verse).toBe(22)
    // 20절을 적으면 21절을 건너 22절로
    const at20 = fresh({ copy: { book: 'mt', at: { mt: { chapter: 17, verse: 20 } }, legacy: {} } })
    expect(copySpot(writeCurrent(at20, 'mt').state, 'mt', CONTENT)!.verse.verse).toBe(22)
  })

  it('저장된 장을 이미 마쳤으면 아직 마치지 않은 장으로', () => {
    const progress = { ...emptyProgress(), mt: { completed: [1, 2], arrangement: {} } }
    const s = fresh({ progress, copy: { book: 'mt', at: { mt: { chapter: 2, verse: 5, draft: '옛' } }, legacy: {} } })
    expect(copySpot(s, 'mt', CONTENT)).toMatchObject({ chapter: 3, index: 0, draft: '' })
  })

  it('이상한 저장 값은 버린다', () => {
    const c = sanitizeCopy({ book: 'xx', at: { mt: { chapter: 0, verse: 1 }, mk: { chapter: 2, verse: 3, draft: 7 }, zz: { chapter: 1, verse: 1 } }, legacy: { mt: [1] } }, emptyProgress())
    expect(c).toEqual({ book: null, at: { mk: { chapter: 2, verse: 3 } }, legacy: {} })
  })
})

describe('옛 저장', () => {
  it('이미 마친 장은 그대로 마친 장, 예전에 엮은 장으로 남고 글자 수는 0에서', () => {
    const base = fresh()
    const o = JSON.parse(serialize({ ...base, progress: { ...emptyProgress(), lk: { completed: [1, 2], arrangement: {} } } }))
    delete o.copy
    delete o.copyStats
    const back = deserialize(JSON.stringify(o), CONTENT)!
    expect(back.progress.lk.completed).toEqual([1, 2])
    expect(back.copy).toEqual({ book: null, at: {}, legacy: { lk: [1, 2] } })
    expect(back.copyStats).toEqual({ verses: 0, chars: 0, chapters: 0, books: 0, firstDay: null })
    // 이어 쓰기는 3장부터
    expect(copySpot(back, 'lk', CONTENT)).toMatchObject({ chapter: 3, index: 0 })
  })

  it('새 게임 저장은 예전에 엮은 장이 없다', () => {
    const back = deserialize(serialize(fresh()), CONTENT)!
    expect(back.copy).toEqual({ book: null, at: {}, legacy: {} })
  })
})

describe('재료 없는 필사에 맞춰 (계획 14 사용자 결정)', () => {
  it('넓은 책상·책상 고치기는 필사를 빠르게 하지 않는다', () => {
    const plain = writeChapter(fresh({ inv: {} }), 'phm').state
    const wide = writeChapter(fresh({ inv: { wideDesk: 1 } }), 'phm').state
    const fixed = writeChapter(fresh({ flags: { ...newGame(CONTENT).flags, 'fix:desk': 1 } }), 'phm').state
    expect(wide.clock.minute).toBe(plain.clock.minute)
    expect(fixed.clock.minute).toBe(plain.clock.minute)
  })

  it('밤에 등잔 기름이 없어도 필사한다', () => {
    const night = fresh({ clock: { day: 1, minute: 22 * 60 }, inv: {} })
    expect(writeCurrent(night, 'mt').result.kind).toBe('verse')
  })

  it('장 수표가 본문과 같다', () => {
    for (const b of BOOKS) expect(BOOK_CHAPTERS[b], b).toBe(chaptersOf(b, CONTENT).length)
  })

  it('직업 단계는 필사한 장·마친 권으로 오르고, 옛 저장의 단계는 내려가지 않는다', () => {
    const prog = (done: Partial<Record<Book, number>>) => {
      const p = emptyProgress()
      for (const [b, n] of Object.entries(done)) p[b as Book] = { completed: Array.from({ length: n! }, (_, i) => i + 1), arrangement: {} }
      return p
    }
    const base = { lettersDone: 0, shelved: {} }
    expect(jobOf({ ...base, progress: prog({ mt: 9 }) })).toBe(0)
    expect(jobOf({ ...base, progress: prog({ mt: 10 }) })).toBe(1)
    expect(jobOf({ ...base, progress: prog({ mk: 16, lk: 24 }) })).toBe(2)
    // 짧은 편지 네 권만으로는 서고지기가 아니다
    expect(jobOf({ ...base, progress: prog({ phm: 1, '2jn': 1, '3jn': 1, jud: 1 }) })).toBe(0)
    expect(jobOf({ ...base, progress: prog({ mt: 28, mk: 16, lk: 24, jn: 21 }) })).toBe(3)
    // 예전 셈(복음서 네 권 꽂음)이 더 높으면 그대로
    expect(jobOf({ lettersDone: 0, shelved: { mt: 1, mk: 1, lk: 1, jn: 1 }, progress: prog({}) })).toBe(3)
    expect(copyJobLevel(0, 0)).toBe(0)
  })
})
