import { NT_CHAPTER_COUNTS } from './progression'
import { CONTENT } from '../content/catalog'
import { ensureOtBook } from '../content/ot-catalog'
import { legacyGame } from './growth-test-support'
import { BOOKS } from './types'
import { OT_BOOKS, otRow } from './ot-books'
import { copyVerses } from './copying'
import { startCopy, writeVerse, sceneSeen } from './game'
import { bothLibrariesFull, completeBibleFinale, bibleEndingEvents } from './library-finale'
import { shelve } from './library'
import { serialize, deserialize } from './save'

function complete() {
  const s = legacyGame(CONTENT)
  return { ...s, scenes: [], flags: { ...s.flags, newlandGift: 1 },
    progress: Object.fromEntries(BOOKS.map(b => [b, { completed: Array.from({ length: NT_CHAPTER_COUNTS[b] }, (_, i) => i + 1), arrangement: {} }])) as typeof s.progress,
    shelved: Object.fromEntries(BOOKS.map(b => [b, 0 as const])),
    otProgress: Object.fromEntries(OT_BOOKS.map(b => [b, { completed: Array.from({ length: otRow(b).chapters }, (_, i) => i + 1), arrangement: {} }])) }
}

it('실제 구약의 마지막 절을 쓰면 66권 기념 장면을 한 번 예약하고 저장한다', async () => {
  await ensureOtBook('mal')
  const full = complete(), last = copyVerses('mal', 4, CONTENT).at(-1)!
  const before = startCopy({ ...full, otProgress: { ...full.otProgress, mal: { completed: [1, 2, 3], arrangement: {} } },
    copy: { ...full.copy, at: { ...full.copy.at, mal: { chapter: 4, verse: last.verse } } } }, 'mal', CONTENT)
  expect(bothLibrariesFull(before)).toBe(false)
  const finished = writeVerse(before, 'mal', last.text, CONTENT).state
  expect(bothLibrariesFull(finished)).toBe(true)
  expect(finished.scenes.filter(s => s === 'bibleLastLetter')).toHaveLength(1)
  expect(finished.flags.completeBibleScene).toBe(1)
  const loaded = deserialize(serialize(finished), CONTENT)!
  expect(loaded.scenes).toContain('bibleLastLetter')
  expect(loaded.flags.completeBibleScene).toBe(1)
  expect(completeBibleFinale(finished, { ...finished, scenes: [] }).scenes).toEqual([])
})

it('39권만 완필하거나 신약 책 하나라도 비어 있으면 열리지 않는다', () => {
  const full = complete(), incomplete = { ...full, shelved: { ...full.shelved, rev: undefined } }
  expect(bothLibrariesFull(incomplete)).toBe(false)
  expect(completeBibleFinale(incomplete, incomplete)).toBe(incomplete)
  for (const book of OT_BOOKS) {
    const chapters = otRow(book).chapters
    const missing = { ...full, otProgress: { ...full.otProgress, [book]: { completed: Array(chapters).fill(1), arrangement: {} } } }
    if (chapters > 1) expect(bothLibrariesFull(missing)).toBe(false)
  }
})

it('구약을 먼저 끝낸 저장도 마지막 신약 책을 꽂으면 한 번만 열린다', () => {
  const full = complete(), { rev: _, ...shelved } = full.shelved
  const first = shelve({ ...full, shelved }, 'rev', 0, [])
  expect(first.scenes).toContain('bibleLastLetter')
  expect(first.scenes).toContain('fullLibrary')
  expect(shelve({ ...first, scenes: [] }, 'rev', 5, []).scenes).not.toContain('bibleLastLetter')
  expect(first.coins).toBe(full.coins)
  expect(first.stats).toEqual(full.stats)
})

it('이미 두 서고를 완성한 옛 저장에는 장면을 소급해서 예약하지 않는다', () => {
  const full = complete()
  expect(completeBibleFinale(full, full)).toBe(full)
})

it('마지막 책을 본 다음 날 저녁에만 엔딩을 예약하며 작업은 기다린다',()=>{
  const full=complete(),before={...full,shelved:{...full.shelved,rev:undefined}}
  const last=completeBibleFinale(before,full)
  expect(last.flags.bibleEndingDue).toBe(last.clock.day+1)
  const seen=sceneSeen(last,'bibleLastLetter',['bibleLastLetter'])
  expect(bibleEndingEvents({...seen,clock:{day:last.clock.day,minute:1200}}).scenes).toEqual([])
  expect(bibleEndingEvents({...seen,clock:{day:last.clock.day+1,minute:1000}}).scenes).toEqual([])
  const evening={...seen,clock:{day:last.clock.day+1,minute:1080},target:null,act:undefined,player:{...seen.player,path:[]}}
  expect(bibleEndingEvents({...evening,player:{...evening.player,path:[{x:20,y:7}]}})).not.toHaveProperty('flags.bibleEndingQueued')
  const ending=bibleEndingEvents(evening)
  expect(ending.scenes).toEqual(['completeBible'])
  expect(bibleEndingEvents({...ending,scenes:[]})).toMatchObject({scenes:[]})
  const loaded=deserialize(serialize(ending),CONTENT)!
  expect(loaded.flags.bibleCompletedDay).toBe(last.clock.day)
  expect(loaded.flags.bibleEndingQueued).toBe(1)
})
it('엔딩 후 독서 편지 세 통은 늦게 돌아와도 순서대로 한 번만 온다',()=>{
  let s={...complete(),clock:{day:30,minute:420},flags:{bibleEndingSeen:10},target:null,act:undefined}
  for(let i=0;i<3;i++){
    s=bibleEndingEvents(s) as typeof s
    expect(s.scenes).toEqual([`bibleReadingLetter:${i}`])
    s={...s,scenes:[]}
  }
  expect(bibleEndingEvents(s).scenes).toEqual([])
  expect(bibleEndingEvents({...s,flags:{}}).scenes).toEqual([])
})

it('완성 당시 필사 기록은 이후 재필사나 저장 불러오기로 바뀌지 않는다',()=>{
  const full=complete(), next={...full,clock:{day:40,minute:900},copyStats:{...full.copyStats,verses:777,firstDay:4}}
  const ending=completeBibleFinale({...next,shelved:{...next.shelved,rev:undefined}},next)
  expect(ending.flags.bibleEndingVerses).toBe(777)
  expect(ending.flags.bibleEndingDays).toBe(37)
  const later=completeBibleFinale(ending,{...ending,copyStats:{...ending.copyStats,verses:900}})
  expect(later.flags.bibleEndingVerses).toBe(777)
  expect(deserialize(serialize(later),CONTENT)?.flags.bibleEndingDays).toBe(37)
})
