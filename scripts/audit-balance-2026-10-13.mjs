import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const out = path.join(root, 'docs/audits/balance-2026-10-13')
fs.mkdirSync(out, { recursive: true })
const parameters = [], gates = [], effects = []
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
for (const file of walk(path.join(root, 'src')).filter(f => /\.(ts|tsx)$/.test(f) && !/\.test\.|test-support/.test(f) && /[/\\](engine|store)[/\\]/.test(f))) {
  const source = fs.readFileSync(file, 'utf8')
  const loc = index => ({ file: path.relative(root, file).replaceAll('\\', '/'), line: source.slice(0, index).split('\n').length })
  // Source inventory, not executable evaluation: preserve surrounding lines for manual review.
  for (const m of source.matchAll(/(?:export )?const ([A-Za-z_][\w]*)[^\n]*=[^\n]*/g)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(m[1])) continue
    const expression = source.slice(m.index, source.indexOf('\n\n', m.index) < 0 ? source.length : source.indexOf('\n\n', m.index)).slice(0, 3200)
    if (/\d/.test(expression)) parameters.push({ ...loc(m.index), name: m[1], expression })
  }
  for (const m of source.matchAll(/(?:export )?function ([A-Za-z_][\w]*)[^\n]*/g)) {
    if (/^(can|.*Cost|.*Pay|.*Minutes|.*Gain|.*Level|.*Stage|.*Access|.*Unlock|.*Ready|.*Chance)/.test(m[1])) gates.push({ ...loc(m.index), name: m[1], source: source.slice(m.index, m.index + 1200) })
  }
  for (const m of source.matchAll(/\b(passTime|heartUp|earn|spend|train|work|rest|featureAccess|takeStock|useStock)\([^\n]*/g)) effects.push({ ...loc(m.index), call: m[0] })
}
fs.writeFileSync(path.join(out, 'parameters.json'), JSON.stringify({ capturedAt: new Date().toISOString(), parameters, gates, effects }, null, 2))
const typesSource = fs.readFileSync('src/engine/types.ts', 'utf8')
const idsOf = name => [...typesSource.match(new RegExp(`export const ${name}[^=]*=\\s*\\[[\\s\\S]*?\\]`))[0].matchAll(/'([a-z0-9]+)'/g)].map(m => m[1])
const order = [...idsOf('GOSPELS'), 'ac', ...idsOf('LETTERS'), 'rev']
const books = order.map(id => {
  const { chapters } = JSON.parse(fs.readFileSync(`src/content/nt/${id}.json`, 'utf8'))
  return { id, chapters: chapters.length, verses: chapters.reduce((a, c) => a + c.length, 0), chars: chapters.flat().reduce((a, t) => a + Array.from(t.normalize('NFC').replace(/[\s\p{P}\p{S}]/gu, '')).length, 0), chapterVerses: chapters.map(c => c.length), chapterChars: chapters.map(c => c.reduce((a, t) => a + Array.from(t.normalize('NFC').replace(/[\s\p{P}\p{S}]/gu, '')).length, 0)) }
})
const shortest = [...books].sort((a, b) => a.chapters - b.chapters || a.chars - b.chars)
const cheapestChars = [...books].sort((a, b) => a.chars - b.chars)
const paySource = fs.readFileSync('src/engine/game.ts', 'utf8').match(/export function copyPay[\s\S]*?\n}/)?.[0]
const copyPay = new Function('verses', 'effort', 'return ' + paySource.match(/return (.*)/)[1])
const route = list => {
  let chapters = 0, chars = 0, verses = 0, coins = 0
  return list.map((b, i) => {
    chapters += b.chapters; chars += b.chars; verses += b.verses
    coins += b.chapterVerses.reduce((a, v) => a + Math.round(copyPay(v, 1) * (1 + i * .03)), 0)
    return { books: i + 1, lastBook: b.id, chapters, chars, verses, gameHours: chapters, coins, typingHoursAt200: +(chars / 200 / 60).toFixed(2) }
  })
}
const result = { capturedAt: new Date().toISOString(), copyPaySource: paySource, assumptions: 'Unique direct-copy chapters; book completion counts; pre-chapter library bonus; no mood or OT bonus; chars use engine NFC normalization excluding whitespace/punctuation/symbols; typing hours exclude reading, UI and mistakes. Shortest-chapter order is not a proven global shortest-real-time path.', books, canonical: route(books), shortestChapters: route(shortest), shortestChars: route(cheapestChars) }
if (books.length !== 27 || result.canonical.at(-1).chapters !== 260) throw new Error('Unexpected NT book/chapter count')
for (const rows of [result.canonical, result.shortestChapters, result.shortestChars]) {
  if (rows.some(row => !Number.isFinite(row.coins) || row.coins < 0)) throw new Error('Invalid income model')
  if (rows.at(-1).chars !== result.canonical.at(-1).chars) throw new Error('Route changes total transcription workload')
}
fs.writeFileSync(path.join(out, 'progression-model.json'), JSON.stringify(result, null, 2))
const modules = [...new Set(parameters.map(p => p.file))].filter(f => f.startsWith('src/engine/'))
fs.writeFileSync(path.join(out, 'source-inventory.md'), '# Balance source inventory\n\nCaptured: ' + result.capturedAt + '\n\n' + modules.map(f => `- ${f}: ${parameters.filter(p => p.file === f).length} constants; ${gates.filter(p => p.file === f).length} rule functions; ${effects.filter(p => p.file === f).length} resource/time calls`).join('\n') + '\n')
console.log(JSON.stringify({ modules: modules.length, parameters: parameters.length, gates: gates.length, effects: effects.length, books: books.length, total: result.canonical.at(-1), gatesComparison: [1, 4, 8, 17, 19, 22, 27].map(n => ({ n, canonical: result.canonical[n - 1], shortest: result.shortestChapters[n - 1] })) }, null, 2))
