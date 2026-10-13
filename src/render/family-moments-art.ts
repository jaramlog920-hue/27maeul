import { withLookDefaults, type Avatar } from '../engine/avatar'
import { person } from './milestone-moments-art'
import { drawScenicBench } from './stargazing-art'
import { householdCradleFrame } from './village-followup-art'
import type { Who } from './sprites'

import { type FamilyKind } from '../engine/scenic-kinds'
export interface FamilyDetails { baby: boolean; helpKind: number; childGrowth: number; childWho: Who; childAvatar: Avatar | null; childShort?: number; helpSecond: boolean }
type Px = (x: number, y: number, c: string, w?: number, h?: number) => void

function windowArt(p: Px, x: number, y: number, night: boolean, t: number, snow = false) {
  p(x - 3, y - 3, '#846b55', 50, 47); p(x, y, night ? '#29364b' : '#eccb9c', 44, 40)
  if (snow) for (let i = 0; i < 18; i++) p(x + 2 + (i * 13) % 39, y + (i * 17 + Math.floor(t * 5)) % 36, '#e2e8de', 1, 2)
  if (!night) { p(x + 25, y + 18, '#ffe4b1', 9, 9); p(x, y + 32, '#b2bd95', 44, 8) }
  p(x + 21, y, '#ab8965', 2, 40); p(x, y + 19, '#ab8965', 44, 2)
  p(x - 6, y - 6, '#725943', 56, 2); p(x - 1, y, '#d4bea0', 5, 40); p(x + 40, y, '#d4bea0', 5, 40)
  p(x - 4, y + 40, '#b39470', 52, 3)
}
function interior(p: Px, w: number, h: number, night = false, winter = false) {
  const floor = Math.round(h * (winter ? .65 : .72))
  p(0, 0, night ? '#594c48' : '#cbbba2', w, h); p(0, floor, night ? '#79624e' : '#a88a68', w, h - floor)
  p(0, floor - 3, night ? '#483d36' : '#8b7053', w, 3)
  for (let y = floor + 7; y < h; y += 9) p(0, y, night ? '#6a5645' : '#967958', w)
  for (let y = floor + 8; y < h; y += 18) for (let x = 24 + (y % 3) * 16; x < w; x += 73) p(x, y - 7, night ? '#6a5645' : '#967958', 1, 7)
  return floor
}
function plant(p: Px, x: number, floor: number) {
  p(x - 6, floor - 10, '#a87856', 12, 9); p(x - 7, floor - 12, '#bd926b', 14, 3)
  p(x - 1, floor - 29, '#567052', 2, 18)
  for (const [dx, dy] of [[-8, -24], [1, -28], [-6, -18], [1, -20]]) { p(x + dx, floor + dy, '#7c9867', 7, 3); p(x + dx + 2, floor + dy - 2, '#7c9867', 4, 2) }
}
function hearth(p: Px, x: number, floor: number, t: number) {
  p(x - 32, floor - 56, '#927462', 64, 56)
  for (let y = floor - 54; y < floor; y += 8) { p(x - 32, y + 6, '#715b50', 64, 2); for (let j = 0; j < 4; j++) p(x - 28 + j * 18 + (y % 16 ? 8 : 0), y, '#715b50', 1, 6) }
  p(x - 18, floor - 29, '#302c2b', 36, 29); p(x - 14, floor - 32, '#302c2b', 28, 3)
  p(x - 37, floor - 59, '#b29478', 74, 4); p(x - 36, floor - 1, '#ad8e70', 72, 4)
  p(x - 12, floor - 6, '#6f4e35', 26, 4); p(x - 9, floor - 8, '#8d6744', 23, 3)
  for (let i = 0; i < 3; i++) {
    const fh = [10, 17, 12][i] + Math.floor(Math.sin(t * 3 + i * 2) * 2), fx = x - 12 + i * 8
    p(fx, floor - 7 - fh / 3, '#bb7246', 8, fh / 3)
    p(fx + 1, floor - 7 - fh * .72, '#d69250', 6, fh * .72)
    p(fx + 3, floor - 7 - fh, '#d69250', 2, fh)
    p(fx + 2, floor - 9 - fh / 3, '#f2cc80', 4, fh / 3 + 2)
  }
}
function countryside(p: Px, w: number, h: number, autumn: boolean, t: number, rainbow = false, blossom = true) {
  const floor = Math.round(h * .70)
  p(0, 0, rainbow ? '#a7bdc6' : autumn ? '#c8c3a6' : '#c3d4cb', w, h)
  for (let x = 0; x < w; x++) { const y = Math.round(h * .36 + Math.sin(x / 39) * 7); p(x, y, autumn ? '#a4ae88' : '#a3bfa5', 1, h - y) }
  for (let x = 0; x < w; x++) { const y = Math.round(h * .46 + Math.sin(x / 31 + 2) * 9); p(x, y, autumn ? '#8c9b70' : '#7d9f80', 1, h - y) }
  p(0, floor - 4, autumn ? '#a2a376' : '#8ba97a', w, h - floor + 4)
  for (let y = floor - 4; y < h; y++) { const half = 12 + (y - floor + 4) * .75; p(w / 2 - half, y, '#c6b48e', half * 2, 1) }
  for (const x of [w * .12, w * .78]) {
    p(x + 12, floor - 50, '#857052', 5, 55); p(x + 6, floor - 40, '#857052', 8, 4)
    const widths = [14, 26, 36, 40, 42, 38, 30, 18]
    for (let row = 0; row < widths.length; row++) p(x + 14 - widths[row] / 2, floor - 76 + row * 4, autumn ? row < 3 ? '#c7a267' : row < 6 ? '#ac875b' : '#99784f' : row < 3 ? '#9eb887' : row < 6 ? '#82a576' : '#6f9168', widths[row], 4)
    for (let i = 0; i < 16; i++) {
      const fx = x - 3 + (i * i * 11 + 3) % 34, fy = floor - 68 + (i * i * 5 + i * 9) % 20
      p(fx, fy, autumn ? '#d3af75' : '#a3bc8c', 3, 1)
      if (!autumn && blossom && i % 2 === 0) { p(fx, fy - 1, '#e7b7b4', 3, 2); p(fx + 1, fy - 2, '#f0d1c0', 1, 4) }
    }
  }
  for (let i = 0; i < 65; i++) { const x = (i * 53) % w, y = floor + (i * 17) % Math.max(1, h - floor); if (Math.abs(x - w / 2) < 16 + (y - floor) * .75) continue; p(x, y, autumn ? '#c49559' : '#b9c78a', 2, 1); if (!autumn && i % 4 === 0) p(x, y - 2, i % 3 ? '#eed8a3' : '#dbaaa9', 2, 2) }
  if (rainbow) {
    const colors = ['#bc8b8c', '#c5a487', '#d3c496', '#aaba99', '#93afb0', '#9c9db8']
    for (let band = 0; band < colors.length; band++) for (let a = 0; a <= 180; a++) {
      const r = w * .30 - band * 2, rad = a * Math.PI / 180
      p(w * .51 + Math.cos(rad) * r, h * .48 - Math.sin(rad) * r * .7, colors[band], 2, 2)
    }
    // 무지개 뒤로 물러나는 작은 구름.
    for (let i = 0; i < 3; i++) { const x = w * (.18 + i * .31) + Math.min(t, 8); p(x, h * .32, '#d5ded9', 28, 5); p(x + 6, h * .32 - 4, '#d5ded9', 15, 4) }
  }
  return floor
}

export function drawFamilyMoment(g: CanvasRenderingContext2D, kind: FamilyKind, w: number, h: number, t: number, avatar: Avatar | null, partner: Avatar | null, partnerWho: Who, babyName: string, details: FamilyDetails) {
  g.imageSmoothingEnabled = false
  const p: Px = (x, y, c, a = 1, b = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b)) }
  const cx = Math.round(w / 2)
  if (kind === 'springWalk' || kind === 'autumnPath' || kind === 'rainbowRest') {
    const floor = countryside(p, w, h, kind === 'autumnPath', t, kind === 'rainbowRest', kind === 'springWalk')
    const moving = kind !== 'rainbowRest' && t < 5
    person(p, cx - 20 + (moving ? Math.min(t, 5) * 3 : kind === 'rainbowRest' ? 0 : 15), floor + 12, avatar, kind === 'rainbowRest' ? 'up' : 'right', 'writer', false, moving, t)
    if (kind !== 'rainbowRest') for (let i = 0; i < 16; i++) { const x = (i * 43 + Math.floor(t * 4)) % w, y = floor - 55 + (i * 19 + Math.floor(t * 5)) % 62; if (Math.abs(x - cx) > 20) p(x, y, kind === 'autumnPath' ? '#c39965' : '#edc7c2', 2, 1) }
    return
  }
  if (kind === 'summerCreek') {
    const floor = countryside(p, w, h, false, t, false, false)
    for (let y = floor - 7; y < h; y++) p(w * .58 + Math.sin(y / 18) * 10, y, '#789fa0', w * .42, 1)
    for (let i = 0; i < 35; i++) p(w * .67 + (i * 17 + Math.floor(t * 2)) % Math.round(w * .3), floor + (i * 11) % Math.max(1, h - floor), i % 2 ? '#a8c5bd' : '#5f8b94', 4, 1)
    p(cx - 29, floor + 6, '#858b78', 42, 10); p(cx - 24, floor + 3, '#a4a58a', 31, 5)
    drawScenicBench(g, cx - 9, floor + 14, avatar, null, false)
    for (let i = 0; i < 8; i++) { const x = w * .72 + i * 7, y = floor + 18 + i % 2 * 8; p(x, y - 14, '#67865f', 1, 16); p(x - 2, y - 12, '#b4a76c', 2, 5) }
    return
  }
  const night = kind === 'familyWinter' || kind === 'spouseReturn' || kind === 'afterCopy'
  const floor = interior(p, w, h, night, kind === 'familyWinter')
  windowArt(p, w * .13, floor - 68, night, t, kind === 'familyWinter')
  plant(p, w * .85, floor + 2)
  if (kind === 'firstMorning') {
    for (let y = 0; y < 24; y++) p(w * .13 + 25 + y * 1.5, floor + y, '#c1a37a', 46, 1)
    p(cx - 16, floor - 67, '#9d8060', 32, 22); p(cx - 13, floor - 64, '#c0d1c0', 26, 16); p(cx - 13, floor - 55, '#98ac87', 26, 7); p(cx + 2, floor - 62, '#ead8ac', 5, 5)
    // 식탁 앞쪽에 둘이 앉는다. 뒷모습의 손은 식탁 뒤로 가린다.
    p(cx - 43, floor - 16, '#bea07b', 86, 13); p(cx - 43, floor - 4, '#7d5e43', 86, 4)
    p(cx - 38, floor - 1, '#7d5e43', 4, 8); p(cx + 33, floor - 1, '#7d5e43', 4, 8)
    p(cx - 6, floor - 20, '#e8d4af', 18, 4); p(cx - 2, floor - 23, '#c39963', 11, 5); p(cx + 1, floor - 23, '#eed0a0', 3, 1)
    for (const x of [cx - 22, cx + 22]) { p(x, floor - 22, '#e3d4b8', 5, 6); p(x + 5, floor - 20, '#a48a6a', 2, 3); p(x + 1, floor - 21, '#8c6951', 3, 1); p(x + 2 + Math.floor(t) % 2, floor - 28, '#ddd5ba', 1, 4) }
    drawScenicBench(g, cx, floor + 1, avatar, partner, true, 'writer', partnerWho)
    return
  }
  if (kind === 'spouseReturn') {
    const dx = w * .64
    p(dx - 4, floor - 65, '#9c7d5f', 38, 67); p(dx, floor - 61, '#354357', 30, 61)
    p(dx, floor - 14, '#756c66', 30, 14); p(dx + 4, floor - 36, '#dbb879', 3, 5)
    const open = Math.min(1, t / 1.5), doorWidth = 30 - open * 25
    p(dx, floor - 61, '#846346', doorWidth, 61); p(dx + 2, floor - 57, '#9d7c56', Math.max(1, doorWidth - 4), 53)
    p(dx - 2, floor + 2, '#b1936f', 35, 3)
    const walking = t > 1.5 && t < 5, approach = Math.max(0, Math.min(1, (t - 1.5) / 3.5))
    if (t >= 1.5) person(p, dx + 4 - approach * 35, floor + 7, partner, 'left', partnerWho, false, walking, t)
    person(p, cx - 26, floor + 7, avatar, t > 1 ? 'right' : 'up')
    p(cx - 28, floor + 11, '#a48b6d', 57, 2)
    return
  }
  if (kind === 'childFirstHelp') {
    p(cx - 61, floor + 2, '#b29b79', 123, 22); p(cx - 56, floor + 5, '#c3ae89', 113, 2)
    const approach = Math.min(1, t / 4), x = cx - 39 + approach * 21, foot = floor + 16
    person(p, cx + 5, foot, avatar, 'left', 'writer', true)
    person(p, x, foot, details.childAvatar, 'right', details.childWho, false, t < 4, t, details.childGrowth, details.childShort)
    // 작은 손 바로 앞에 물건을 둔다. 전달이 끝나면 부모 곁에 내려놓는다.
    const ox = t < 5 ? x + 14 : cx + 2, oy = t < 5 ? foot - 11 : foot - 7
    if (details.helpKind === 3 && details.helpSecond) { p(ox, oy - 2, '#a49660', 1, 9); p(ox + 2, oy, '#c3ae73', 1, 7); p(ox + 4, oy - 1, '#b9a36b', 1, 8); p(ox - 1, oy + 3, '#7c6d4d', 7, 1) }
    else if (details.helpKind === 3) { p(ox, oy, '#a78058', 6, 7); p(ox + 1, oy - 2, '#bb9a70', 4, 2); p(ox + 2, oy, '#ddd2ad', 2, 2) }
    else if (details.helpKind === 1 && details.helpSecond) { p(ox + 1, oy - 1, '#5a514c', 4, 2); p(ox, oy + 1, '#7b7064', 6, 5); p(ox + 2, oy + 2, '#c5b79b', 2, 2) }
    else if (details.helpKind === 1) { p(ox, oy, '#e0cba2', 7, 5); p(ox + 1, oy + 1, '#ba9f77', 5, 1) }
    else { p(ox + 2, oy - 1, '#688052', 2, 2); p(ox + 1, oy + 1, '#947990', 4, 5); p(ox, oy + 2, '#947990', 6, 3); p(ox + 2, oy + 2, '#c1a0ad', 1, 2) }
    return
  }
  if (kind === 'fullLibrary') {
    const sx = cx - 72 + Math.round(Math.min(t, 8) * .5)
    p(sx - 5, floor - 94, '#705741', 148, 96); p(sx, floor - 90, '#463d34', 138, 90)
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) { const x = sx + 4 + i * 15, y = floor - 85 + row * 28; p(x, y, ['#a28565', '#809378', '#ad9970', '#948399', '#a77461'][(i + row * 9) % 5], 10, 21); p(x + 2, y + 4, '#dec7a1', 6, 1); p(x + 2, y + 17, '#bfab87', 6, 1) }
      p(sx - 3, floor - 61 + row * 28, '#b59670', 144, 3)
    }
    person(p, cx - 10, floor + 13, avatar)
    return
  }
  if (kind === 'afterCopy') {
    p(cx - 35, floor - 23, '#a48a69', 70, 11); p(cx - 35, floor - 12, '#624d3b', 70, 3)
    p(cx - 30, floor - 9, '#624d3b', 3, 16); p(cx + 27, floor - 9, '#624d3b', 3, 16)
    p(cx - 19, floor - 26, '#a17c54', 23, 7); p(cx - 17, floor - 25, '#dfc99e', 19, 1)
    p(cx + 17, floor - 28, '#9f7d52', 8, 3); p(cx + 19, floor - 37, '#dec89c', 3, 9)
    p(cx + 19, floor - 40, Math.floor(t * 2) % 2 ? '#e8b776' : '#f4d493', 2, 4)
    person(p, cx - 5 + Math.min(t, 4) * 6, floor + 15, avatar, t < 4 ? 'right' : 'up', 'writer', false, t < 4, t)
    return
  }
  hearth(p, cx + 20, floor, t)
  p(cx - 43, floor + 7, '#a18a6b', 110, 28); p(cx - 38, floor + 10, '#b09b77', 100, 2)
  drawScenicBench(g, cx - 2, floor + 29, avatar, partner, true, 'writer', partnerWho)
  if (details.baby) {
    const av = withLookDefaults(details.childAvatar ?? { look: 'f', name: babyName })
    const cradle = householdCradleFrame({ look: av.look, name: babyName, hair: av.hairColor,
      avatar: { skin: av.skin, hairFront: av.hairFront, hairBack: av.hairBack, top: av.top, bottom: av.bottom, acc: av.acc } }, 0, true)
    const rows = (art: string[], pal: Record<string, string>) => art.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.' && pal[c]) p(cx + 42 + x * 2, floor + 4 + y * 2, pal[c], 2, 2) }))
    rows(cradle.back, cradle.propPalette); rows(cradle.actor, cradle.actorPalette); rows(cradle.front, cradle.propPalette)
  } else {
    p(cx + 43, floor + 26, '#b49b78', 23, 5); p(cx + 45, floor + 24, '#c5ac86', 19, 3)
    person(p, cx + 45, floor + 26, details.childAvatar, 'up', details.childWho, true, false, 0, details.childGrowth, details.childShort)
  }
}
