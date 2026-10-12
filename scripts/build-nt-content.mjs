// 원본 본문과 길잡이에서 책별 청크·본문 없는 색인을 만든다.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { BOOKS } from '../src/engine/types.ts'
import { bibleIdOf } from '../src/engine/shelf-rooms.ts'
import { verseHash, verseKey, verseNoText } from '../src/content/verse-hash.ts'

const dir = new URL('../src/content/', import.meta.url)
const read = async name => JSON.parse(await readFile(new URL(name, dir), 'utf8'))
const bible = await read('bible-subset.json')
const guides = await read('chapter-guides.json')
const books = await read('books.json')
const index = {}
const keys = new Map()
const check = process.argv.includes('--check')
await mkdir(new URL('nt/', dir), { recursive: true })
async function emit(name, value) {
  const text = JSON.stringify(value)
  const file = new URL(name, dir)
  if (check) {
    if (await readFile(file, 'utf8').catch(() => '') !== text) throw new Error(`${name} 불일치: npm run build:nt 실행 필요`)
  } else await writeFile(file, text)
}
for (const book of BOOKS) {
  const id = bibleIdOf(book)
  const chapters = bible[id]
  const abbr = books.find(b => b.id === id).abbr
  const row = { counts: chapters.map(ch => ch.length), missing: [], brackets: [], texts: {} }
  let square = false, round = false
  chapters.forEach((ch, ci) => ch.forEach((text, vi) => {
    const ref = `${abbr} ${ci + 1}:${vi + 1}`
    const hash = verseHash(text), key = verseKey(text)
    if (keys.has(hash) && keys.get(hash) !== key) throw new Error(`본문 해시 충돌: ${ref}`)
    keys.set(hash, key)
    row.texts[hash] = (row.texts[hash] ?? 0) + 1
    if (verseNoText(text)) { row.missing.push(ref); return }
    if (square || round || /[[\]()]/.test(text)) row.brackets.push(ref)
    for (const c of text) {
      if (c === '[') square = true
      else if (c === ']') square = false
      else if (c === '(') round = true
      else if (c === ')') round = false
    }
  }))
  index[book] = row
  await emit(`nt/${book}.json`, { chapters, guides: guides[id] ?? {} })
}
await emit('nt-index.json', index)
console.log(`✓ 신약 ${BOOKS.length}권 본문·길잡이·색인 ${check ? '일치' : '생성'}`)
