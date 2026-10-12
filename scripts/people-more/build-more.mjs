// 사용: node scripts/people-more/build-more.mjs .   (twenty-seven 폴더에서) → src/content/people-more.json
import fs from 'node:fs'
import { HEARTS } from './hearts-lines.mjs'
import { ROMANCE, FRIEND_SCENES, CLOSE_FRIEND } from './romance-more.mjs'
const root = process.argv[2]
const people = JSON.parse(fs.readFileSync(`${root}/src/content/people.json`, 'utf8')).people
const life = JSON.parse(fs.readFileSync(`${root}/src/content/life-text.json`, 'utf8'))
const EXTRA_REQ = { 'rudy:h6': { seen: ['rudy:label'] } }
const out = { lines: {}, events: {}, scenes: {}, closeFriend: {} }
const push = (k, id, v) => ((out[k][id] ??= []).push(v))
for (const [npc, rows] of Object.entries(HEARTS)) {
  if (!people[npc]) throw new Error('no person ' + npc)
  for (const [h, text] of rows) {
    const id = `${npc}:h${h}`
    push('lines', npc, { id, text, depth: h >= 6 ? 2 : h >= 2 ? 1 : 0, req: { hearts: h, ...(EXTRA_REQ[id] ?? {}) } })
  }
}
const asLine = (x) => (Array.isArray(x) ? { text: x[0], when: x[1] } : { text: x })
const scene = (rows) => rows.map(([speaker, text]) => ({ speaker, text }))
for (const [npc, r] of Object.entries(ROMANCE)) {
  const p = people[npc]
  r.lover.forEach((x, i) => { const l = asLine(x); push('lines', npc, { id: `${npc}:love:line${i + 1}`, text: l.text, depth: 0, ...(l.when ? { when: l.when } : {}), req: { rel: ['lover'] } }) })
  r.spouse.forEach((x, i) => { const l = asLine(x); push('lines', npc, { id: `${npc}:home:line${i + 1}`, text: l.text, depth: 0, ...(l.when ? { when: l.when } : {}), req: { rel: ['spouse'] } }) })
  const habit = `${npc}:short:spouseHabit`
  const plan = [
    ['love1', `${npc}:love:1`, (e) => ({ lover: true, romance: ['dating', 'engaged'], after: { event: e.after, days: 2 } })],
    ['love2', `${npc}:love:2`, () => ({ lover: true, romance: ['dating', 'engaged'], after: { event: `${npc}:love:1`, days: 3 } })],
    ['home1', `${npc}:home:1`, () => ({ rel: ['spouse'], after: { event: habit, days: 3 } })],
    ['home2', `${npc}:home:2`, () => ({ rel: ['spouse'], after: { event: `${npc}:home:1`, days: 5 } })],
  ]
  for (const [key, id, req] of plan) {
    const e = r[key]
    const base = p.events.find((x) => x.id === e.place)
    if (!base) throw new Error(`${npc} ${key}: no place ${e.place}`)
    if (key === 'love1' && !p.events.some((x) => x.id === e.after)) throw new Error(`${npc}: no after ${e.after}`)
    const home = key.startsWith('home')
    push('events', npc, {
      id, title: e.title, stage: home ? Math.min(base.stage, 4) : 4, at: base.at, ...(base.when ? { when: base.when } : {}),
      req: req(e), gain: home ? 3 : 5,
      lines: scene(e.lines),
      choices: e.choices.map(([label, color, reply]) => ({ label, color, memory: e.memory, reply: scene(reply) })),
    })
    push('lines', npc, { id: `${id}:after`, text: e.follow, depth: 0, ...(e.when ? { when: e.when } : {}), req: { rel: home ? ['spouse'] : ['lover', 'spouse'], memory: [e.memory] } })
  }
}
for (const [npc, rows] of Object.entries(FRIEND_SCENES)) {
  const key = `romance2:${npc}`
  const orig = life.scenes[key]
  if (!orig) throw new Error('no scene ' + key)
  out.scenes[`${key}:friend`] = { title: orig.title, lines: scene(rows) }
}
for (const [npc, texts] of Object.entries(CLOSE_FRIEND)) out.closeFriend[npc] = texts.map((text) => ({ speaker: npc, text }))
fs.writeFileSync(`${root}/src/content/people-more.json`, JSON.stringify(out, null, 2) + '\n')
const n = (k) => Object.values(out[k]).reduce((a, b) => a + b.length, 0)
console.log('lines', n('lines'), 'events', n('events'), 'scenes', Object.keys(out.scenes).length, 'closeFriend', Object.keys(out.closeFriend).length)
// ── 장면 동작 ──
const { ACTIONS, NEW_MOTIONS, guessMotion } = await import('./motions.mjs')
out.motions = {}
for (const [npc, p] of Object.entries(people)) for (const e of p.events ?? []) out.motions[e.id] = guessMotion(e)
for (const [npc, list] of Object.entries(NEW_MOTIONS)) {
  const ids = [`${npc}:love:1`, `${npc}:love:2`, `${npc}:home:1`, `${npc}:home:2`]
  ids.forEach((id, i) => { out.motions[id] = list[i] })
}
for (const [id, mo] of Object.entries(out.motions)) for (const a of [mo.npc, mo.player]) if (a && !ACTIONS.has(a)) throw new Error(`${id}: ${a}`)
fs.writeFileSync(`${root}/src/content/people-more.json`, JSON.stringify(out, null, 2) + '\n')
const tally = {}
for (const mo of Object.values(out.motions)) tally[mo.npc] = (tally[mo.npc] ?? 0) + 1
console.log('motions', Object.keys(out.motions).length, JSON.stringify(tally))
