// 배경 소재 시트 살피기: 크기와 한 줄의 색 구간(화소 배율 가늠)
import { readPng } from './png-read.mjs'

const img = readPng(new URL('../assets/background-materials-simple.png', import.meta.url))
console.log('size', img.w, img.h)
const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('')
for (const y of [200, 500, 720, 760]) {
  const runs = []
  let start = 0, cur = hex(img.px(0, y))
  for (let x = 1; x <= img.w; x++) {
    const c = x < img.w ? hex(img.px(x, y)) : null
    if (c !== cur) { runs.push(`${start}-${x - 1}:${cur}`); start = x; cur = c }
  }
  console.log('row', y, runs.filter((r) => !r.endsWith('#ffffff')).join(' '))
}
