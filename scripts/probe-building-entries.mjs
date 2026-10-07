// 건물 입구 좌표 살피기 (manifest.json)
import { readFileSync } from 'node:fs'

const m = JSON.parse(readFileSync(new URL('../assets/old-testament-generations/manifest.json', import.meta.url), 'utf8'))
for (const it of m.items) {
  if (it.group !== 'buildings' || !['home', 'guest', 'weaver', 'garden', 'courtyard'].includes(it.id)) continue
  console.log(it.id, it.facing, JSON.stringify(it.entry), JSON.stringify(it.footprint))
}
