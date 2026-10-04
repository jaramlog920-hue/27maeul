// 계획 7 작업 1: 열세 권(로마서–빌레몬서)의 자리와 서고 방 표 — 편지는 장째로(편지 한 통 = 한 장)
// 계획 8 작업 1: 여덟 권(히브리서–유다서)을 방 표 hebJud 줄에 — 같은 흐름
import bible from '../content/nt-krv.json'
import subset from '../content/bible-subset.json'
import { BOOKS_WITH_CONTENT, CONTENT, LETTER_PIECES, noText, PIECES, pieceOfVerse, piecesOf, quizSourceFor, versesOf } from '../content/catalog'
import { JOURNAL_NOTES, SCENES, T } from '../content/text'
import { emptyProgress, pickableBooks, roomOpen } from './books'
import { chooseBook, goToSleep, newGame, shelvedCount, type GameState } from './game'
import { deserialize, sanitize, serialize } from './save'
import { modeOf, roomOf, shelfRoom, SHELF_ROOMS, SUBSET_BOOKS } from './shelf-rooms'
import { BOOKS, GOSPELS, isLetter, LETTERS, type Book } from './types'

const FULL = bible as Record<string, string[][]>
const ROM_PHM_IDS = ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm'] as const
const HEB_JUD_IDS = ['heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud'] as const
const LETTER_IDS = [...ROM_PHM_IDS, ...HEB_JUD_IDS]

/** 네 복음서와 사도행전을 서고에 꽂은 상태 (잔치는 지났다) */
function actsShelved(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}

describe('방 표와 편지 스물한 권의 자리', () => {
  it('BOOKS는 오늘 성경 순서의 스물일곱 권 — 방 표의 책을 차례로 늘어놓은 것과 같다 (요한계시록은 편지가 아니다)', () => {
    expect(LETTERS).toEqual(LETTER_IDS)
    expect(BOOKS).toEqual(['mt', 'mk', 'lk', 'jn', 'ac', ...LETTER_IDS, 'rev'])
    expect(shelfRoom('rev').books).toEqual(['rev'])
    expect(isLetter('rev')).toBe(false)
    expect(SHELF_ROOMS.flatMap((r) => r.books)).toEqual(BOOKS)
    expect(SHELF_ROOMS.map((r) => r.id)).toEqual(['gospels', 'acts', 'romPhm', 'hebJud', 'rev'])
    expect(SHELF_ROOMS.map((r) => r.door)).toEqual([null, 0, 1, 2, 3])
    expect(shelfRoom('romPhm').books).toEqual(ROM_PHM_IDS)
    expect(shelfRoom('hebJud').books).toEqual(HEB_JUD_IDS)
    expect(shelfRoom('hebJud').mode).toBe('letters')
    expect(Object.keys(emptyProgress())).toEqual(BOOKS)
    for (const b of LETTERS) {
      expect(isLetter(b)).toBe(true)
      expect(roomOf(b).id).toBe((ROM_PHM_IDS as readonly string[]).includes(b) ? 'romPhm' : 'hebJud')
      expect(modeOf(b)).toBe('letters')
    }
    for (const b of [...GOSPELS, 'ac'] as Book[]) {
      expect(isLetter(b)).toBe(false)
      expect(modeOf(b)).toBe('pieces')
    }
  })

  it('방 이름은 책 범위로 — 문 순서의 잠긴 방 이름과 같다', () => {
    expect(T.library.lockedRooms).toEqual(['사도행전 방', '로마서–빌레몬서 방', '히브리서–유다서 방', '요한계시록 방'])
  })

  it('앱 본문(bible-subset)은 방 표의 책 전부 — 원본과 한 글자도 다르지 않다', () => {
    expect(SUBSET_BOOKS).toEqual(['mat', 'mrk', 'luk', 'jhn', 'act', ...LETTER_IDS, 'rev'])
    expect(Object.keys(subset)).toEqual(SUBSET_BOOKS)
    for (const id of SUBSET_BOOKS) expect(JSON.stringify((subset as Record<string, unknown>)[id]), id).toBe(JSON.stringify(FULL[id]))
  })

  it('서고 퀴즈 책 이름이 스물일곱 권 모두 있다', () => {
    const names = T.quiz.books as Record<string, string>
    expect(LETTERS.map((b) => names[b])).toEqual([
      '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서',
      '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서',
      '히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서',
    ])
    for (const b of BOOKS) expect(names[b], b).toBeTruthy()
  })

  it('약어: 요일·요이·요삼·벧전·벧후·히·약·유가 복음서 "요"와 헷갈리지 않는다', () => {
    expect(versesOf('요일 1:1')[0].text).toBe(FULL['1jn'][0][0])
    expect(versesOf('요 1:1')[0].text).toBe(FULL.jhn[0][0])
    expect(versesOf('요이 1:1')[0].text).toBe(FULL['2jn'][0][0])
    expect(versesOf('요삼 1:1')[0].text).toBe(FULL['3jn'][0][0])
    expect(versesOf('벧전 1:1')[0].text).toBe(FULL['1pe'][0][0])
    expect(versesOf('벧후 1:1')[0].text).toBe(FULL['2pe'][0][0])
    expect(versesOf('히 1:1')[0].text).toBe(FULL.heb[0][0])
    expect(versesOf('약 1:1')[0].text).toBe(FULL.jas[0][0])
    expect(versesOf('유 1:1')[0].text).toBe(FULL.jud[0][0])
    expect(FULL['1jn'][0][0]).not.toBe(FULL.jhn[0][0])
    // 절로 조각 찾기(첫 낱말로 책 찾기)도 같은 책으로
    expect(pieceOfVerse('요일 1:1')?.id).toBe('1jn-001')
    expect(pieceOfVerse('요 1:1')?.id).toBe('jn-001-001')
    expect(pieceOfVerse('유 1:25')?.id).toBe('jud-001')
    expect(quizSourceFor(['1jn']).versesOf('요일 1:1').map((v) => v.ref)).toEqual(['요일 1:1'])
  })
})

describe('편지 "장 조각" — 장 하나에 조각 하나', () => {
  const coverage = (ids: readonly Book[]) => {
    for (const b of ids) {
      const ps = piecesOf(b)
      const chapters = FULL[b]
      expect(ps.map((p) => p.chapter), b).toEqual(chapters.map((_, i) => i + 1))
      ps.forEach((p, i) => {
        const ch = i + 1
        const m = p.ref.match(/^(\S+) (\d+):1-(\d+)$/)
        expect(m, p.ref).not.toBeNull()
        expect(Number(m![2])).toBe(ch)
        expect(Number(m![3]), p.ref).toBe(chapters[ch - 1].length)
        expect(p.id).toBe(`${b}-${String(ch).padStart(3, '0')}`)
        expect(p.stamps).toEqual([])
        expect(p.book).toBe(b)
        expect(p.title).toBe(`${(T.quiz.books as Record<string, string>)[b]} ${ch}장`)
      })
    }
  }

  it('① 편지 장 조각은 87 + 34 = 121개', () => {
    expect(LETTER_PIECES).toHaveLength(87 + 34)
    expect(LETTER_IDS.reduce((n, id) => n + FULL[id].length, 0)).toBe(121)
  })

  it('① 여덟 권 34장이 조각 34개로 빠짐없이 덮이고, 조각 ref의 끝 절이 원문 장 길이와 같다 (요이·요삼·유는 조각 하나)', () => {
    const eight = LETTER_PIECES.filter((p) => (HEB_JUD_IDS as readonly string[]).includes(p.book))
    expect(eight).toHaveLength(34)
    expect(HEB_JUD_IDS.map((b) => FULL[b].length)).toEqual([13, 5, 5, 3, 5, 1, 1, 1])
    coverage(HEB_JUD_IDS)
    for (const b of ['2jn', '3jn', 'jud'] as const) expect(piecesOf(b), b).toHaveLength(1)
    expect(piecesOf('2jn')[0]).toEqual({ id: '2jn-001', book: '2jn', ref: '요이 1:1-13', chapter: 1, title: '요한이서 1장', stamps: [] })
    expect(piecesOf('3jn')[0].ref).toBe('요삼 1:1-15')
    expect(piecesOf('jud')[0].ref).toBe('유 1:1-25')
    expect(piecesOf('heb')[12].ref).toBe('히 13:1-25')
    expect(PIECES.filter((p) => isLetter(p.book))).toEqual(LETTER_PIECES)
    for (const b of HEB_JUD_IDS) expect(BOOKS_WITH_CONTENT).toContain(b)
  })

  it('① 열세 권 87장이 조각 87개로 빠짐없이 덮이고, 조각 ref의 끝 절이 원문 장 길이와 같다', () => {
    expect(LETTER_PIECES.filter((p) => (ROM_PHM_IDS as readonly string[]).includes(p.book))).toHaveLength(87)
    expect(ROM_PHM_IDS.reduce((n, id) => n + FULL[id].length, 0)).toBe(87)
    // 한 절짜리 장은 없다 — 끝 절은 원문 배열 길이(본문 없는 절이 끝에 있어도 번호는 걸친다)
    coverage(ROM_PHM_IDS)
    expect(LETTER_PIECES[0]).toEqual({ id: 'rom-001', book: 'rom', ref: '롬 1:1-32', chapter: 1, title: '로마서 1장', stamps: [] })
    // PIECES = pieces.json + 편지 장 조각
    expect(PIECES.filter((p) => isLetter(p.book))).toEqual(LETTER_PIECES)
    for (const b of LETTERS) expect(BOOKS_WITH_CONTENT).toContain(b)
  })

  it('② versesOf로 본 편지 본문에는 본문 없는 절이 없다 — 원문에서 센 두 절(롬 9:2, 16:24)만큼 줄어든다 (여덟 권은 원문으로 세어 0)', () => {
    let raw = 0
    let shown = 0
    const hidden: string[] = []
    for (const p of LETTER_PIECES) {
      const vs = versesOf(p.ref)
      const all = FULL[p.book][p.chapter - 1]
      raw += all.length
      shown += vs.length
      for (const v of vs) {
        expect(noText(v.text), `${p.ref} ${v.verse}`).toBe(false)
        expect(v.text).not.toBe('(없음)')
        expect(v.text).not.toMatch(/절에 포함되어 있음/)
      }
      all.forEach((t, i) => noText(t) && hidden.push(`${p.book} ${p.chapter}:${i + 1}`))
    }
    expect(hidden).toEqual(['rom 9:2', 'rom 16:24'])
    expect(raw - shown).toBe(2)
    // 여덟 권: 원문(nt-krv.json)으로 센 본문 없는 절 = 0 — versesOf가 하나도 줄이지 않는다
    const eight = LETTER_PIECES.filter((p) => (HEB_JUD_IDS as readonly string[]).includes(p.book))
    expect(eight.flatMap((p) => FULL[p.book][p.chapter - 1].filter(noText))).toEqual([])
    expect(eight.reduce((n, p) => n + FULL[p.book][p.chapter - 1].length - versesOf(p.ref).length, 0)).toBe(0)
    expect(versesOf('롬 9:1-3').map((v) => v.verse)).toEqual([1, 3])
    expect(versesOf('롬 16:1-27').map((v) => v.verse)).not.toContain(24)
  })
})

describe('로마서–빌레몬서 방 열림', () => {
  it('③ 사도행전을 꽂고 잔 다음 날 열린다 — 꽂기 전·그날 밤 전에는 닫힘', () => {
    const before = newGame(CONTENT)
    const feastDone = { ...before, flags: { ...before.flags, gospelFeast: 2 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0 } } as GameState
    expect(roomOpen('romPhm', feastDone.flags)).toBe(false)
    // 사도행전을 꽂지 않고 자면 닫힌 채
    const slept = goToSleep(feastDone, CONTENT)
    expect(roomOpen('romPhm', slept.flags)).toBe(false)
    expect(slept.scenes).not.toContain('roomOpen:romPhm')
    // 사도행전을 꽂은 그날(밤 전)은 아직 닫힘
    const shelvedDay = actsShelved()
    expect(roomOpen('romPhm', shelvedDay.flags)).toBe(false)
    // 자고 일어나면 열린다 — 아침 장면
    const next = goToSleep(shelvedDay, CONTENT)
    expect(roomOpen('romPhm', next.flags)).toBe(true)
    expect(next.flags['room:romPhm']).toBe(1)
    expect(next.scenes).toContain('roomOpen:romPhm')
    // 다음 밤에는 장면을 또 세우지 않는다
    const again = goToSleep({ ...next, scenes: [] }, CONTENT)
    expect(again.scenes).not.toContain('roomOpen:romPhm')
    expect(roomOpen('romPhm', again.flags)).toBe(true)
  })

  it('복음서 방은 늘, 사도행전 방은 잔치 다음 날부터 (actsRoomOpen 그대로)', () => {
    expect(roomOpen('gospels', {})).toBe(true)
    expect(roomOpen('acts', {})).toBe(false)
    expect(roomOpen('acts', { gospelFeast: 1 })).toBe(false)
    expect(roomOpen('acts', { gospelFeast: 2 })).toBe(true)
  })

  it('콘텐츠가 없는 방은 앞 방이 다 차도 표식을 세우지 않는다 (계획 9부터 요한계시록 방은 콘텐츠가 있어 열린다)', () => {
    const s = actsShelved()
    const all = Object.fromEntries(LETTERS.map((b) => [b, 1]))
    const full = { ...s, flags: { ...s.flags, 'room:romPhm': 1, 'room:hebJud': 1 }, shelved: { ...s.shelved, ...all } }
    // 요한계시록 조각을 뺀 콘텐츠 — 방은 닫힌 채
    const noRev = { ...CONTENT, pieces: CONTENT.pieces.filter((p) => p.book !== 'rev') }
    const closed = goToSleep(full, noRev)
    expect(closed.flags['room:rev']).toBeUndefined()
    expect(roomOpen('rev', closed.flags)).toBe(false)
    expect(closed.scenes.filter((x) => x.startsWith('roomOpen:'))).toEqual([])
    // 지금 콘텐츠로는 열린다
    const next = goToSleep(full, CONTENT)
    expect(roomOpen('rev', next.flags)).toBe(true)
    expect(next.scenes.filter((x) => x.startsWith('roomOpen:'))).toEqual(['roomOpen:rev'])
  })
})

describe('히브리서–유다서 방 열림', () => {
  /** 로마서–빌레몬서 방이 열린 상태 + 그 방의 책 몇 권을 꽂음 */
  const romPhmShelved = (books: readonly Book[]): GameState => {
    const s = actsShelved()
    return { ...s, flags: { ...s.flags, 'room:romPhm': 1 }, shelved: { ...s.shelved, ...Object.fromEntries(books.map((b) => [b, 1])) } }
  }

  it('③ 열세 권 중 하나라도 안 꽂혔으면 닫힘 — 모두 꽂고 잔 다음 날 열린다', () => {
    for (const missing of ROM_PHM_IDS) {
      const s = romPhmShelved(ROM_PHM_IDS.filter((b) => b !== missing))
      const slept = goToSleep(s, CONTENT)
      expect(roomOpen('hebJud', slept.flags), missing).toBe(false)
      expect(slept.scenes).not.toContain('roomOpen:hebJud')
    }
    const full = romPhmShelved(ROM_PHM_IDS)
    // 꽂은 그날(밤 전)은 아직 닫힘
    expect(roomOpen('hebJud', full.flags)).toBe(false)
    const next = goToSleep(full, CONTENT)
    expect(roomOpen('hebJud', next.flags)).toBe(true)
    expect(next.flags['room:hebJud']).toBe(1)
    expect(next.scenes).toContain('roomOpen:hebJud')
    // 다음 밤에는 장면을 또 세우지 않는다
    const again = goToSleep({ ...next, scenes: [] }, CONTENT)
    expect(again.scenes).not.toContain('roomOpen:hebJud')
    expect(roomOpen('hebJud', again.flags)).toBe(true)
  })

  it('③ 열리기 전에는 pickableBooks에 여덟 권이 없고 chooseBook("heb")이 그대로, 열리면 고를 수 있다', () => {
    const s = romPhmShelved(ROM_PHM_IDS)
    expect(pickableBooks(s.flags, BOOKS_WITH_CONTENT)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac', ...ROM_PHM_IDS])
    for (const b of HEB_JUD_IDS) expect(chooseBook(s, b, CONTENT), b).toBe(s)
    const open = goToSleep(s, CONTENT)
    // 요한계시록 방은 아직 닫혀 있다
    expect(pickableBooks(open.flags, BOOKS_WITH_CONTENT)).toEqual(BOOKS.filter((b) => b !== 'rev'))
    expect(chooseBook(open, 'heb', CONTENT).activeBook).toBe('heb')
  })

  it('방 열림 장면·앨범·일지 문구가 있다 (로마서–빌레몬서 방과 같은 짜임)', () => {
    const scene = SCENES['roomOpen:hebJud']
    expect(scene.title).toBe('서고 오른쪽 위 문')
    expect(scene.lines[0]).toEqual({ speaker: 'narration', text: '늘 잠겨 있던 서고 오른쪽 위 문이 열렸다는 소식이 들려왔다.' })
    expect(scene.lines.map((l) => l.speaker)).toEqual(['narration', 'narration', 'postman'])
    expect(scene.album).toBe('서고 오른쪽 위 방이 열린 날')
    expect(JOURNAL_NOTES['roomOpen:hebJud']).toBe(' 서고 오른쪽 위 방이 열렸다.')
  })
})

describe('책 고르기와 불러오기', () => {
  it('④ 방이 닫혀 있으면 pickableBooks에 편지가 없고 chooseBook("rom")이 그대로', () => {
    const s = actsShelved()
    expect(pickableBooks(s.flags, BOOKS_WITH_CONTENT)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(chooseBook(s, 'rom', CONTENT)).toBe(s)
    const open = { ...s, flags: { ...s.flags, 'room:romPhm': 1 } }
    // 로마서–빌레몬서 방만 열렸으면 여덟 권은 아직 없다
    expect(pickableBooks(open.flags, BOOKS_WITH_CONTENT)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac', ...ROM_PHM_IDS])
    // 콘텐츠가 없는 책은 방이 열려도 없다
    expect(pickableBooks(open.flags, ['mt', 'mk', 'lk', 'jn', 'ac'])).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(chooseBook(open, 'rom', CONTENT).activeBook).toBe('rom')
  })

  it('⑤ 네 권짜리·다섯 권짜리 옛 저장을 불러와도 progress.rom이 있다', () => {
    const o = JSON.parse(serialize(newGame(CONTENT)))
    const five = Object.fromEntries(['mt', 'mk', 'lk', 'jn', 'ac'].map((b) => [b, o.progress[b]]))
    const { ac: _drop, ...four } = five
    for (const progress of [four, five]) {
      const back = deserialize(JSON.stringify({ ...o, progress }), CONTENT)!
      expect(back).not.toBeNull()
      for (const b of LETTERS) expect(back.progress[b], b).toEqual({ completed: [], arrangement: {} })
    }
  })

  it('④ 계획 7 배포본 모양(열여덟 권) 옛 저장을 불러와도 progress.heb가 있고, 방이 닫혀 여덟 권을 고를 수 없다', () => {
    const s = { ...actsShelved(), flags: { ...actsShelved().flags, 'room:romPhm': 1 } }
    const o = JSON.parse(serialize(chooseBook(s, 'rom', CONTENT)))
    const eighteen = Object.fromEntries(['mt', 'mk', 'lk', 'jn', 'ac', ...ROM_PHM_IDS].map((b) => [b, o.progress[b]]))
    eighteen.rom = { completed: [], arrangement: {} }
    const back = deserialize(JSON.stringify({ ...o, progress: eighteen }), CONTENT)!
    expect(back).not.toBeNull()
    expect(back.activeBook).toBe('rom')
    for (const b of HEB_JUD_IDS) expect(back.progress[b], b).toEqual({ completed: [], arrangement: {} })
    expect(pickableBooks(back.flags, BOOKS_WITH_CONTENT).filter((b) => (HEB_JUD_IDS as readonly string[]).includes(b))).toEqual([])
    // 방이 닫혔는데 여덟 권 중 하나를 고른 채로 저장돼 있으면 비운다
    expect(sanitize({ ...back, activeBook: 'heb' }, CONTENT).activeBook).toBeNull()
    expect(sanitize({ ...back, activeBook: 'heb', flags: { ...back.flags, 'room:hebJud': 1 } }, CONTENT).activeBook).toBe('heb')
  })

  it('불러올 때 편지 책을 고른 채인데 방이 닫혀 있으면 고른 책을 비운다', () => {
    const s = { ...actsShelved(), activeBook: 'rom' as const }
    expect(sanitize(s, CONTENT).activeBook).toBeNull()
    expect(sanitize({ ...s, flags: { ...s.flags, 'room:romPhm': 1 } }, CONTENT).activeBook).toBe('rom')
  })

  it('⑥ 어느 책을 고르든 오늘의 조각(offers)은 그대로 — 새 날의 특별한 대화도 많아야 한 명 (계획 14 작업 5)', () => {
    const s = actsShelved()
    const open = { ...s, flags: { ...s.flags, 'room:romPhm': 1 }, offers: { baker: 'mk-001-001' } }
    expect(chooseBook(open, 'mk', CONTENT).offers).toEqual(open.offers)
    const rom = chooseBook(open, 'rom', CONTENT)
    expect(rom.offers).toEqual(open.offers)
    for (let i = 0; i < 5; i++) {
      const next = goToSleep({ ...rom, clock: { ...rom.clock, day: rom.clock.day + i } }, CONTENT)
      expect(Object.keys(next.offers).length, `day ${next.clock.day}`).toBeLessThanOrEqual(1)
    }
  })

  it('⑦ 서고에 꽂은 책은 편지도 한 권씩 센다 (마을 구역·이사 조건)', () => {
    const s = actsShelved()
    expect(shelvedCount(s)).toBe(5)
    const all = Object.fromEntries(LETTERS.map((b) => [b, 2]))
    expect(shelvedCount({ shelved: { ...s.shelved, ...all } })).toBe(5 + LETTERS.length)
    expect(shelvedCount({ shelved: { rom: 2, phm: 1 } })).toBe(2)
    expect(shelvedCount({ shelved: Object.fromEntries(HEB_JUD_IDS.map((b) => [b, 1])) })).toBe(HEB_JUD_IDS.length)
  })
})
