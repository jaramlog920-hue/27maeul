// Focused visual QA: awake, asleep, blink, empty, and an alternate skin tone.
import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'

registerHooks({
  resolve(s, c, n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s, c) },
  load(url, c, n) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }
    return n(url, c)
  },
})
const { householdCradleFrame } = await import('../src/render/village-followup-art.ts')
const output = process.argv[2]
if (!output) throw new Error('Usage: node scripts/preview-cradle-baby.mjs <output.png>')
const width = 640, height = 144, pixels = new Uint8Array(width * height * 4)
for (let i = 0; i < pixels.length; i += 4) pixels.set([246, 237, 218, 255], i)
const baby = { look: 'f', name: '', avatar: { skin: 2 } }
const frames = [householdCradleFrame(baby, 0, false), householdCradleFrame(baby, 0, true), householdCradleFrame(baby, 2, false), householdCradleFrame(null, 0, false), householdCradleFrame({ ...baby, avatar: { skin: 4 } }, 0, false)]
frames.forEach((a, i) => {
  for (const [rows, palette] of [[a.back, a.propPalette], [a.actor, a.actorPalette], [a.front, a.propPalette]]) draw(pixels, width, rows, palette, i * 128 + 16, 24, 6)
})
png(output, width, height, pixels)
console.log(path.resolve(output))
