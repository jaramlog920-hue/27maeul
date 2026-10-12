import type { Avatar } from '../engine/avatar'
import { drawScenicBench } from './stargazing-art'

/** 호숫가 정자에서 보는 노을. 고정 화소의 하늘과 물결만 느리게 변한다. */
export function drawSunset(g: CanvasRenderingContext2D, w: number, h: number, seconds: number, avatar: Avatar | null) {
  g.imageSmoothingEnabled = false
  const px = (x: number, y: number, c: string, a = 1, b = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b)) }
  const horizon = Math.round(h * .57), shore = Math.round(h * .83)
  const sky = ['#4c4866', '#75617d', '#a17c88', '#cc9390', '#eeb298', '#f5c39a', '#f6cfaa']
  for (let y = 0; y < horizon; y++) px(0, y, sky[Math.min(6, Math.floor(y / horizon * 7))], w)
  // 구름도 얇은 사각형을 겹쳐 또렷한 도트로 그린다.
  for (const [x, y, length] of [[.12, .24, .23], [.65, .18, .25], [.45, .39, .18]]) {
    px(x * w, y * horizon, '#ab7d89', w * length, 2)
    px((x + .025) * w, y * horizon - 2, '#b88a94', w * (length - .05), 2)
    px(x * w + 4, y * horizon + 2, '#e4a297', w * (length - .035), 1)
  }
  const sx = Math.round(w * .65), sy = Math.round(horizon - 12 + Math.min(5, seconds / 7))
  for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++)
    if (x * x + y * y <= 144) px(sx + x, sy + y, y > 3 ? '#edaa7c' : '#ffdb9d')
  for (let x = 0; x < w; x++) {
    const y = horizon - 3 + Math.round(Math.sin(x / w * 9) * 4 + Math.sin(x / w * 22) * 2)
    px(x, y, '#756a7d', 1, 8)
  }
  px(0, horizon + 5, '#7f7b91', w, shore - horizon)
  const wave = Math.floor(seconds * 2)
  for (let row = 0; row < 25; row++) {
    const y = horizon + 8 + row * Math.max(2, Math.floor((shore - horizon) / 25))
    if (y >= shore) continue
    const len = 12 + row * 2
    px(sx - len / 2 + Math.sin(row * 3 + wave * .3) * 3, y, row % 3 ? '#e8b397' : '#f8cf9f', len, 1)
    for (let x = (row * 19 + wave % 4) % 33; x < w; x += 37)
      if (Math.abs(x - sx) > len / 2 + 8) px(x, y + 1, row % 2 ? '#9490a3' : '#6e758c', 9 + row % 5, 1)
  }
  for (let x = 0; x < w; x++) {
    const y = shore + Math.round(Math.sin(x / w * 7 + 2) * 4)
    px(x, y, '#3f5149', 1, h - y)
  }
  px(w * .32, shore + 4, '#64705b', w * .36, h - shore)
  // 정자 기둥과 처마는 가장자리에서 풍경을 감싼다.
  px(0, h * .26, '#574c48', w * .10, 5)
  px(0, h * .26 - 3, '#786052', w * .12, 3)
  px(w * .035, h * .26 + 5, '#5f5148', 5, h * .60)
  px(w * .035 + 1, h * .26 + 5, '#94715a', 1, h * .60)
  // 오른쪽 물가의 버드나무. 가운데 하늘은 비워 둔다.
  px(w - 13, h * .44, '#4a4940', 5, h * .44)
  for (let i = 0; i < 9; i++) {
    const x = w - 7 - i * 4, y = h * .42 + Math.abs(i - 3) * 2
    px(x, y, '#4f6253', 7, 8)
    px(x + 2, y + 8, '#435a4c', 2, 10 + i % 3 * 5)
  }
  drawScenicBench(g, Math.round(w * .5), Math.round(h * .88), avatar)
}
