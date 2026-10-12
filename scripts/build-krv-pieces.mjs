import { readFile, writeFile } from 'node:fs/promises'
import { expandRef, countsFrom, verseKeyString, parseRef } from '../src/content/ref.ts'
const read = async p => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'))
const source = await read('data/krv-headings.json')
const bible = await read('../src/content/nt-krv.json')
const books = await read('../src/content/books.json')
const lookup = Object.fromEntries(books.map(b => [b.abbr, b.id]))
const counts = countsFrom(bible)
const codes = { mt: 'mat', mk: 'mrk', lk: 'luk', jn: 'jhn', ac: 'act' }
const abbr = { mt: '마', mk: '막', lk: '눅', jn: '요', ac: '행' }
const codeToBook = { ...Object.fromEntries(Object.entries(codes).map(([b, c]) => [c, b])), '1co': '1co' }
const headId = h => `${h.book}-${String(h.chapter).padStart(3, '0')}-${String(h.verse).padStart(3, '0')}`
const pieces = []
for (const [book, code] of Object.entries(codes)) {
  const heads = source.headings.filter(h => h.book === book)
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i], next = heads[i + 1]
    const endChapter = next ? next.verse === 1 ? next.chapter - 1 : next.chapter : counts[code].length
    const endVerse = next && next.verse !== 1 ? next.verse - 1 : counts[code][endChapter - 1]
    const end = endChapter === h.chapter ? `${endVerse}` : `${endChapter}:${endVerse}`
    const ref = `${abbr[book]} ${h.chapter}:${h.verse}${endChapter === h.chapter && endVerse === h.verse ? '' : '-' + end}`
    const stamps = h.related.map(link => {
      const target = codeToBook[link.book]
      if (!target) throw new Error(`알 수 없는 관련 본문 책 ${link.book}`)
      const targetAbbr = books.find(b => b.id === link.book).abbr
      const label = /^\S+\s+\d/.test(link.label) ? link.label : `${targetAbbr} ${link.label.includes(':') ? '' : link.chapter + ':'}${link.label}`
      const normalized = label.replace(/\s*(상|하)\s*/g, '').replace(/:\s+/g, ':')
      parseRef(normalized, lookup, counts)
      return { kind: 'related', book: target, ref: normalized, ...(normalized !== label ? { label } : {}) }
    })
    pieces.push({ id: headId(h), book, ref, chapter: h.chapter, title: h.title, stamps, source: h.source })
  }
}
// 첫 실행 시 기존 조각 범위를 보존한다. 이후 재생성에서도 이전 저장 변환 기준을 바꾸지 않는다.
let legacy
try { legacy = await read('data/legacy-pieces-v1.json') } catch {
  legacy = (await read('../src/content/pieces.json')).map(({ id, ref }) => ({ id, ref }))
  await writeFile(new URL('data/legacy-pieces-v1.json', import.meta.url), JSON.stringify(legacy, null, 2) + '\n')
}
const keys = p => expandRef(p.ref, lookup, counts).map(verseKeyString)
const at = new Map(pieces.flatMap(p => keys(p).map(k => [k, p.id])))
const migration = Object.fromEntries(legacy.map(p => [p.id, [...new Set(keys(p).map(k => at.get(k)).filter(Boolean))]]))
if (Object.values(migration).some(v => !v.length)) throw new Error('이전 조각 중 변환할 수 없는 범위')
await writeFile(new URL('../src/content/piece-migration-v2.json', import.meta.url), JSON.stringify(migration, null, 2) + '\n')
await writeFile(new URL('../src/content/pieces.json', import.meta.url), JSON.stringify(pieces, null, 2) + '\n')
await writeFile(new URL('data/krv-piece-index.json', import.meta.url), JSON.stringify(pieces, null, 2) + '\n')
for (const book of Object.keys(codes)) {
  const rows = pieces.filter(p => p.book === book).map(p => `${p.ref} | ${p.title} | ${p.stamps.map(s => '@' + s.ref).join('; ')}`)
  await writeFile(new URL(`pieces/${book}.txt`, import.meta.url), '# 대한성서공회 개역한글 소제목 기준. scripts/data/krv-headings.json에서 생성. @는 관련 본문.\n' + rows.join('\n') + '\n')
}
console.log(`개역한글 소제목 ${pieces.length}개, 이전 조각 ${legacy.length}개 변환표 생성`)
