import type { Avatar } from '../engine/avatar'
import { BOOKS } from '../engine/types'
import type { Grade } from '../engine/library'
import type { Who } from './sprites'
import { person } from './milestone-moments-art'
import { householdCradleFrame } from './village-followup-art'
import { withLookDefaults } from '../engine/avatar'

export interface FinalePerson { avatar: Avatar | null; who: Who; short?: number }
export interface LibraryFinaleCast { guests: FinalePerson[]; spouse: FinalePerson | null; child: FinalePerson | null; baby: boolean; babyName: string }
export const LIBRARY_PHOTO_TIME = 14
export function libraryFinalePhase(t: number): number { return t < 3 ? 0 : t < 7 ? 1 : t < 12 ? 2 : t < 16 ? 3 : 4 }
export const LIBRARY_CAPTIONS = [
  '마지막 책을 빈칸에 조심히 꽂았다.',
  '한 권씩 옮겨 적은 스물일곱 권이, 하나의 서고가 되었다.',
  '익숙한 발소리가 들렸다. 이웃들이 하나둘 곁에 섰다.',
  '처음에는 빈 책칸이었다.\n이제는 함께 읽을 스물일곱 권이 되었다.',
  '서고 밖에 등불이 켜지고, 이웃들이 작은 식탁을 함께 채웠다.',
]
type Px = (x: number, y: number, c: string, w?: number, h?: number) => void
const ease = (x: number) => { const a = Math.max(0, Math.min(1, x)); return a * a * (3 - 2 * a) }

export function drawLibraryFinale(g: CanvasRenderingContext2D, w: number, h: number, t: number, avatar: Avatar | null, grades: Partial<Record<typeof BOOKS[number], Grade>>, lastBook: number, cast: LibraryFinaleCast) {
  g.imageSmoothingEnabled = false
  const cx = Math.round(w / 2), floor = Math.round(h * .68), phase = libraryFinalePhase(t)
  // 고정된 정수 화소 구도. 개별 도트를 분수 배율로 축소하면 책과 인물이 덜컥거리며 변형된다.
  const p: Px = (x, y, c, a = 1, b = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b)) }
  const character = (who: FinalePerson, x: number, foot: number, facing: 'up' | 'right' | 'down' | 'left', walk = false) => person(p, x, foot, who.avatar, facing, who.who, false, walk, t, 1, who.short)
  const baby = (x: number, foot: number) => {
    const av = withLookDefaults(cast.child?.avatar ?? { look: 'f', name: cast.babyName })
    const crib = householdCradleFrame({ look: av.look, name: cast.babyName, hair: av.hairColor, avatar: { skin: av.skin } }, 0, true)
    for (const [rows, pal] of [[crib.back, crib.propPalette], [crib.actor, crib.actorPalette], [crib.front, crib.propPalette]] as const) rows.forEach((row, y) => [...row].forEach((c, xx) => { if (c !== '.' && pal[c]) p(x + xx * 2, foot - 26 + y * 2, pal[c], 2, 2) }))
  }
  if (phase < 4) {
    g.fillStyle = '#c9b79b'; g.fillRect(0, 0, w, h)
    p(-100, floor, '#ac8d69', w + 200, h)
    p(-100, floor - 3, '#80664e', w + 200, 3)
    for (let y = floor + 6; y < floor + h; y += 9) p(-100, y, '#977956', w + 200)
    // 27권을 넓은 세 단으로 전시. 마지막 책은 손이 닿는 아래 가운데 빈칸에 둔다.
    const sx = cx - 69, sy = floor - 91
    p(sx - 8, sy - 8, '#74563f', 154, 101); p(sx - 4, sy - 4, '#b39672', 146, 95); p(sx, sy, '#514333', 138, 91)
    p(sx - 12, sy - 12, '#997853', 162, 5); p(sx - 11, floor + 2, '#806347', 160, 5)
    const order = [...BOOKS], last = Math.max(0, Math.min(26, lastBook))
    ;[order[22], order[last]] = [order[last], order[22]]
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const i = row * 9 + col, book = order[i], inserting = i === 22
        const x = sx + 4 + col * 15 - (inserting ? (1 - ease(t / 2.2)) * 7 : 0), y = sy + 5 + row * 29
        p(x, y, ['#a98761', '#80917a', '#a99874', '#948299', '#a67965'][BOOKS.indexOf(book) % 5], 10, 21)
        p(x + 2, y + 3, '#d7c6a4', 6, 1)
        if ((grades[book] ?? 0) > 0) { const c = grades[book] === 2 ? '#e4c47b' : '#c7cbd0'; p(x + 1, y + 1, c, 8, 1); p(x + 1, y + 17, c, 8, 2); p(x + 1, y + 7, c, 1, 5) }
      }
      p(sx - 4, sy + 27 + row * 29, '#b4966d', 146, 3)
    }
    // 나무 문과 햇빛, 선반 위 작은 잎 장식.
    p(17, floor - 68, '#927351', 32, 70); p(21, floor - 64, '#6d5842', 24, 66)
    const door = 24 - ease((t - 6) / 1.5) * 20
    p(21, floor - 64, '#aa875c', door, 64)
    p(w - 53, floor - 74, '#927351', 36, 44); p(w - 50, floor - 71, '#e9d1a8', 30, 38)
    p(w - 36, floor - 71, '#aa8963', 2, 38); p(w - 50, floor - 53, '#aa8963', 30, 2)
    p(w - 40, floor - 25, '#8b704f', 14, 10); p(w - 34, floor - 35, '#698459', 2, 12); p(w - 41, floor - 33, '#8fa078', 7, 3); p(w - 33, floor - 37, '#8fa078', 7, 3)
    const back = ease((t - 4) / 3), playerX = cx - 30 + back * 25
    character({ avatar, who: 'writer' }, playerX, floor + 16 * back + 2, t < 3 ? 'right' : 'up', t > 4 && t < 7)
    if (t > 7) {
      cast.guests.forEach((guest, i) => { const arrived = ease((t - 7 - i * .6) / 3); if (!arrived) return; character(guest, 22 + (cx - 32 - i * 26 - 22) * arrived, floor + 17, arrived < 1 ? 'right' : 'up', arrived < 1) })
      if (cast.spouse) { const arrived = ease((t - 8.2) / 3); if (arrived) character(cast.spouse, cx + 22 + 32 * (1 - arrived), floor + 17 + 10 * (1 - arrived), arrived < 1 ? 'left' : 'up', arrived < 1) }
      if (cast.child && t > 10) { const arrived = ease((t - 10) / 2); if (cast.baby) baby(cx + 50, floor + 17); else character(cast.child, cx + 49 + 24 * (1 - arrived), floor + 17 + 13 * (1 - arrived), arrived < 1 ? 'left' : 'up', arrived < 1) }
    }
  } else {
    // 저녁의 서고와 이웃이 함께 차린 작은 식탁. 다음 날의 실제 잔치 보상과 독립된 회상이다.
    p(0, 0, '#726780', w, h); p(0, h * .22, '#a3878b', w, h * .18); p(0, h * .40, '#c2a18c', w, h * .22)
    const ground = Math.round(h * .72), by = ground - 48
    p(0, ground, '#9a9574', w, h - ground); p(cx - 112, ground - 1, '#c4b18b', 224, h - ground)
    p(cx - 96, by, '#dfceb0', 192, 48); p(cx - 99, by - 32, '#9e6553', 198, 33)
    for (let y = by - 28; y < by - 1; y += 6) p(cx - 96, y, '#b47b63', 192, 2)
    p(cx - 103, by + 1, '#75593f', 206, 4); p(cx - 101, by - 35, '#bc8d73', 202, 4)
    p(cx - 11, by + 15, '#72573f', 23, 34); p(cx - 7, by + 18, '#e9c58b', 15, 31)
    for (const x of [cx - 71, cx - 42, cx + 34, cx + 63]) { p(x, by + 14, '#a7835f', 17, 20); p(x + 3, by + 17, '#f0cc91', 11, 14); p(x + 8, by + 17, '#b09268', 1, 14); p(x + 3, by + 23, '#b09268', 11, 1) }
    for (const x of [cx - 119, cx + 115]) { p(x, ground - 37, '#725d43', 3, 39); p(x - 3, ground - 40, '#a98b62', 9, 12); p(x - 1, ground - 37, '#f4d89f', 5, 6) }
    const settle = ease((t - 16) / 3)
    cast.guests.forEach((guest, i) => character(guest, cx - 57 + i * 34, ground + 1, 'down'))
    p(cx - 65, ground - 5, '#ba9a70', 126, 12); p(cx - 65, ground + 7, '#75573c', 126, 3)
    p(cx - 59, ground + 10, '#75573c', 3, 11); p(cx + 53, ground + 10, '#75573c', 3, 11)
    for (let i = 0; i < 5; i++) if (settle > i * .16) {
      const x = cx - 56 + i * 24
      p(x, ground - 8, '#e4d3ae', 17, 3); p(x + 3, ground - 12, i % 2 ? '#a88b60' : '#bd9159', 11, 5); p(x + 5, ground - 12, '#e3c28a', 4, 1)
      p(x + 17, ground - 9, '#e9d9b8', 4, 4); p(x + 18, ground - 9, '#8d6950', 2, 1)
    }
    character({ avatar, who: 'writer' }, cx - 87, ground + 5, 'right')
    if (cast.spouse) character(cast.spouse, cx + 64, ground + 5, 'left')
    if (cast.child) { if (cast.baby) baby(cx + 86, ground + 19); else character(cast.child, cx + 88, ground + 18, 'left') }

  }
  if (t > 15.6 && t < 16.4) { const a = 1 - Math.abs(t - 16) / .4; g.fillStyle = `rgba(40,36,38,${a})`; g.fillRect(0, 0, w, h) }
}
