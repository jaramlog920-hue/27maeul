// 아주 작은 PNG 읽기 (8비트 RGB/RGBA, 인터레이스 없음) — 자산 시트를 도트 줄로 옮길 때 쓴다.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

export function readPng(path) {
  const buf = readFileSync(path)
  let p = 8
  let w = 0, h = 0, type = 0, depth = 0
  const idat = []
  let palette = null
  while (p < buf.length) {
    const len = buf.readUInt32BE(p)
    const name = buf.toString('ascii', p + 4, p + 8)
    const data = buf.subarray(p + 8, p + 8 + len)
    if (name === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
      depth = data[8]
      type = data[9]
    } else if (name === 'PLTE') palette = data
    else if (name === 'IDAT') idat.push(data)
    p += 12 + len
  }
  if (depth !== 8) throw new Error(`bit depth ${depth}`)
  const bpp = type === 6 ? 4 : type === 2 ? 3 : type === 3 ? 1 : type === 4 ? 2 : 1
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * bpp
  const out = Buffer.alloc(w * h * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      let v = line[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const pp = a + b - c
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      line[i] = v & 255
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      if (type === 6) line.copy(out, o, x * 4, x * 4 + 4)
      else if (type === 2) { out[o] = line[x * 3]; out[o + 1] = line[x * 3 + 1]; out[o + 2] = line[x * 3 + 2]; out[o + 3] = 255 }
      else if (type === 3) { const k = line[x] * 3; out[o] = palette[k]; out[o + 1] = palette[k + 1]; out[o + 2] = palette[k + 2]; out[o + 3] = 255 }
      else { out[o] = out[o + 1] = out[o + 2] = line[x * (type === 4 ? 2 : 1)]; out[o + 3] = 255 }
    }
    prev = line
  }
  return { w, h, px: (x, y) => { const o = (y * w + x) * 4; return [out[o], out[o + 1], out[o + 2], out[o + 3]] } }
}
