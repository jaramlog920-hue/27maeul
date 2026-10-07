// 구약 장별 필사 길잡이 원본 → src/content/ot-guides/<책 id>.json (배경·살펴보기만, 책을 불러올 때 함께 불러온다)
// 사용: node scripts/build-ot-guides.mjs && node scripts/verify-ot-guides.mjs
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { OT_GUIDE_OUT, readOtGuideRows, toOtGuideJson } from './ot-guides-parse.mjs'

const { rows } = await readOtGuideRows()
const json = toOtGuideJson(rows)
await mkdir(OT_GUIDE_OUT, { recursive: true })
// 원본에서 빠진 책의 옛 파일은 지운다
for (const f of await readdir(OT_GUIDE_OUT)) if (f.endsWith('.json') && !json[f.replace(/\.json$/, '')]) await rm(new URL(f, OT_GUIDE_OUT))
for (const [id, chapters] of Object.entries(json)) await writeFile(new URL(`${id}.json`, OT_GUIDE_OUT), JSON.stringify(chapters, null, 1) + '\n')
const n = Object.values(json).reduce((s, b) => s + Object.keys(b).length, 0)
console.log(`ot-guides: 책 ${Object.keys(json).length}권, 장 ${n}개`)
