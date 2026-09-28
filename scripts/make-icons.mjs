// 도트 아이콘(초록 지붕 서고)을 PNG로 굽는다. 외부 도구 없이 zlib로 PNG를 만든다.
// 사용: node scripts/make-icons.mjs → public/icon-192.png, icon-512.png, apple-touch-icon.png, favicon.png
import { writeFile, mkdir } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const hex = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a]
const P = {
  '.': hex('#edf0df'), // 바탕 (첫 화면 하늘)
  g: hex('#7b9a60'), // 초록 지붕
  G: hex('#99b67b'),
  D: hex('#5f7a48'),
  c: hex('#f8e6c0'), // 벽
  y: hex('#f1bf6b'), // 불 켜진 창
  k: hex('#8e6a4d'),
  w: hex('#987654'), // 문
  p: hex('#bfcfa4'), // 풀밭
}
// 16×16: 첫 화면의 서고 — 초록 지붕, 노란 창 둘, 나무 문, 풀밭
const ART = [
  '................',
  '................',
  '.....gggggg.....',
  '....gGGGGGGg....',
  '...gggggggggg...',
  '..gggggggggggg..',
  '..DDDDDDDDDDDD..',
  '...cccccccccc...',
  '...cyyccccyyc...',
  '...cyyckkcyyc...',
  '...ccccwwcccc...',
  '...ccccwwcccc...',
  '...ccccwwcccc...',
  '..pppppppppppp..',
  '................',
  '................',
]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, pad) {
  const inner = size - pad * 2
  const scale = inner / 16
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const ax = Math.floor((x - pad) / scale)
      const ay = Math.floor((y - pad) / scale)
      const ch = ax >= 0 && ay >= 0 && ax < 16 && ay < 16 ? ART[ay][ax] : '.'
      const [r, g, b, a] = P[ch]
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const out = new URL('../public/', import.meta.url)
await mkdir(out, { recursive: true })
// 가장자리를 비워 둬야 마스크(동그라미)로 잘려도 그림이 남는다
await writeFile(new URL('icon-512.png', out), png(512, 64))
await writeFile(new URL('icon-192.png', out), png(192, 24))
await writeFile(new URL('apple-touch-icon.png', out), png(180, 18))
await writeFile(new URL('favicon.png', out), png(32, 0))
console.log('icons written')
