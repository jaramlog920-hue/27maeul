import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// 메인 파일뿐 아니라 정적 import로 함께 받는 파일까지 측정한다.
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'))
const visited = new Set()
function walk(key) {
  if (visited.has(key)) return
  visited.add(key)
  for (const dependency of manifest[key].imports ?? []) walk(dependency)
}
for (const [key, entry] of Object.entries(manifest)) if (entry.isEntry) walk(key)
const files = [...new Set([...visited].map(key => manifest[key].file))]
if (files.some(file => /assets\/(nt|ot|screens)\//.test(file))) {
  throw new Error('첫 로딩에 본문 또는 생활 화면 청크가 포함되어 있어요.')
}
const sw = readFileSync(join(dist, 'sw.js'), 'utf8')
const cached = [...sw.matchAll(/url:"([^"]+)"/g)].map(match => match[1])
if (!cached.includes('index.html')) throw new Error('PWA 사전 캐시 목록을 확인할 수 없어요.')
if (cached.some(file => /assets\/(nt|ot|screens)\//.test(file))) {
  throw new Error('PWA 사전 캐시에 본문 또는 생활 화면 청크가 포함되어 있어요.')
}
const sizes = files.map(file => readFileSync(join(dist, file)))
const kb = bytes => (bytes / 1000).toFixed(2)
console.log(`첫 화면 JS: ${files.length}개, ${kb(sizes.reduce((n, data) => n + data.length, 0))} kB (gzip ${kb(sizes.reduce((n, data) => n + gzipSync(data).length, 0))} kB)`)
console.log('본문·생활 화면: 정적 의존성 및 PWA 사전 캐시에서 제외 확인')
