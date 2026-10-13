import { FAMILY_KINDS, PROGRESS_KINDS, LIVING_KINDS, type LivingKind, type ProgressKind, type FamilyKind } from '../engine/scenic-kinds'
import { drawFamilyMoment, type FamilyDetails } from './family-moments-art'
import { withLookDefaults, type Avatar } from '../engine/avatar'
import { spriteRows, writerPalette, type Who } from './sprites'
import { householdCradleFrame } from './village-followup-art'
import { drawScenicBench } from './stargazing-art'
import { drawSunset } from './sunset-scene-art'
import { drawMilestone, type MilestoneKind } from './milestone-moments-art'

export type MomentKind = 'rainCopy' | 'bookBound' | 'dateSunset' | 'babySleep' | 'firstSnow' | MilestoneKind | FamilyKind
export type LandscapeKind = 'stars' | 'sunset' | 'lastManuscript' | 'bibleLastLetter' | 'completeBible' | MomentKind | ProgressKind | LivingKind
export function landscapeKind(id: string): LandscapeKind | null {
  if(id.startsWith('firstDinner:'))return 'firstDinner'
  if(id.startsWith('facilityFinished:'))return 'facilityFinished'
  if((LIVING_KINDS as readonly string[]).includes(id))return id as LivingKind
  if(id.startsWith('workSuccession:'))return 'workSuccession'
  if((PROGRESS_KINDS as readonly string[]).includes(id))return id as ProgressKind
  if ((FAMILY_KINDS as readonly string[]).includes(id)) return id as FamilyKind
  if (id === 'rainbow') return 'rainbowRest'
  if (['stars', 'sunset', 'lastManuscript', 'bibleLastLetter', 'completeBible', 'rainCopy', 'bookBound', 'dateSunset', 'babySleep', 'firstSnow', 'shelfBook', 'firstConfession', 'marketEvening', 'childWalks', 'homeExpanded'].includes(id)) return id as LandscapeKind
  if (/^date:sunset:[0-2]$/.test(id)) return 'dateSunset'
  if (id === 'firstShelved' || id === 'shelved') return 'shelfBook'
  if (/^confess:/.test(id) || /^ev:.*:confess$/.test(id)) return 'firstConfession'
  return /^home:[1-3]$/.test(id) ? 'homeExpanded' : null
}

type Px = (x: number, y: number, c: string, w?: number, h?: number) => void
function actor(px: Px, x: number, floor: number, avatar: Avatar | null, side = false) {
  const av = avatar ? withLookDefaults(avatar) : undefined
  const pal = writerPalette('winter', av)
  spriteRows('writer', side ? 'right' : 'up', { frame: 0, blink: false, avatar: av, look: av?.look }).forEach((row, y) => [...row].forEach((c, xx) => {
    if (c !== '.' && pal[c]) px(x + xx * 2, floor - 28 + y * 2, pal[c], 2, 2)
  }))
}
function room(px: Px, w: number, h: number, dawn: boolean, t: number, raining = false) {
  const floor = Math.round(h * .78), wx = Math.round(w * .15), wy = Math.round(h * .26)
  px(0, 0, dawn ? '#b4a6a0' : '#39333d', w, h)
  px(0, floor, dawn ? '#977c65' : '#655348', w, h - floor)
  for (let y = floor + 6; y < h; y += 9) px(0, y, dawn ? '#8a715c' : '#58473e', w, 1)
  px(0, floor - 2, '#796252', w, 3)
  px(wx - 3, wy - 3, '#896c55', 57, 55)
  px(wx, wy, dawn ? '#e8c0a0' : '#1e293e', 51, 48)
  for (let i = 0; i < 22; i++) {
    const x = wx + 2 + (i * 17) % 46, y = wy + (i * 13 + Math.floor(t * 18)) % 40
    if (!dawn && raining) { px(x, y, '#8697aa', 1, 4); px(x + 1, y + 3, '#546c8a', 1, 3) }
    else if (!dawn && i < 8) px(x, wy + 4 + (i * 7) % 18, '#c6c9b7')
  }
  if (dawn) {
    px(wx + 28, wy + 23, '#f9d9af', 11, 11)
    for (let y = 0; y < 18; y++) px(wx + 30 + y * 2, floor + y, '#b49876', 45, 1)
  }
  px(wx + 24, wy, '#9e8061', 3, 48); px(wx, wy + 23, '#9e8061', 51, 3)
  if (!dawn) {
    const bx = w * .5
    for (let y = floor - 60; y < floor; y++) for (let x = bx - 54; x < bx + 54; x++) {
      const distance = ((x - bx) / 54) ** 2 + ((y - floor + 18) / 45) ** 2
      if (distance < 1) px(x, y, distance < .25 ? '#665043' : distance < .55 ? '#534238' : '#44383a')
    }
  }
  // 짧은 책장: 따뜻한 종이와 기존 마을의 목재 색.
  const sx = Math.round(w * .77)
  px(sx, floor - 53, '#463d35', 37, 51)
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 7; i++) px(sx + 3 + i * 4, floor - 49 + row * 15, ['#8e7660', '#a7a08a', '#947966'][i % 3], 3, 10)
    px(sx, floor - 37 + row * 15, '#917458', 37, 2)
  }
  return floor
}
function desk(px: Px, bx: number, floor: number, t: number, complete: boolean, avatar: Avatar | null) {
  px(bx - 38, floor - 18, '#b4936d', 76, 12)
  px(bx - 38, floor - 6, '#6f5543', 76, 3)
  px(bx - 33, floor - 3, '#6f5543', 4, 13); px(bx + 28, floor - 3, '#6f5543', 4, 13)
  const closed = complete && t >= 4
  px(bx + 10, floor - 17, '#5b493c', 20, 10)
  if (closed) {
    px(bx + 10, floor - 19, '#b68963', 20, 8)
    px(bx + 13, floor - 17, '#d0a573', 14, 1)
  } else {
    px(bx + 10, floor - 19, '#eddec0', 20, 9)
    px(bx + 19, floor - 19, '#a38b6b', 1, 9)
    for (let i = 0; i < 3; i++) { px(bx + 12, floor - 17 + i * 2, '#ae9779', 5); px(bx + 22, floor - 17 + i * 2, '#ae9779', 6) }
  }
  // 등잔은 책 왼쪽. 불꽃은 두 화소만 움직인다.
  px(bx - 28, floor - 21, '#775946', 7, 3)
  px(bx - 26, floor - 29, '#dec29a', 3, 8)
  px(bx - 26, floor - 32, Math.floor(t * 3) % 2 ? '#f0bd7c' : '#f9da98', 2, 4)
  // 기존 인물의 상체를 유지하고 앉은 다리만 네 화소로 접는다.
  const av = avatar ? withLookDefaults(avatar) : undefined, pal = writerPalette('summer', av)
  spriteRows('writer', 'up', { frame: 0, blink: false, avatar: av }).slice(0, 10).forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.' && pal[c]) px(bx - 10 + x * 2, floor - 28 + y * 2, pal[c], 2, 2)
  }))
  px(bx - 13, floor - 9, '#8c6b4f', 26, 3)
  px(bx - 10, floor - 6, '#564439', 3, 6); px(bx + 7, floor - 6, '#564439', 3, 6)
  for (const x of [bx - 6, bx + 2]) { px(x, floor - 6, pal.d ?? pal.R, 4, 4); px(x - 1, floor - 2, pal.k, 6, 2) }
  if (av && [0, 1, 4, 5].includes(av.bottom)) px(bx - 7, floor - 6, pal.d, 14, 4)
  // 오른손은 어깨 바로 옆에서 책 끝까지, 몸보다 길게 늘어나지 않는다.
  if (!closed) { px(bx + 8, floor - 17, pal.r, 4, 3); px(bx + 12, floor - 17, pal.s, 2, 2); px(bx + 14, floor - 18 + Math.floor(t * 2) % 2, '#4b3b32', 1, 4) }
}

export function drawMoment(g: CanvasRenderingContext2D, kind: MomentKind, w: number, h: number, t: number, avatar: Avatar | null, partner: Avatar | null, babyName: string, partnerWho: Who = 'writer', shelfCount = 1, dialogue = false, family: FamilyDetails = { baby: false, helpKind: 1, childGrowth: 1, childWho: 'child', childAvatar: null, helpSecond: false }, confessionPerson?: string) {
  g.imageSmoothingEnabled = false
  const px: Px = (x, y, c, a = 1, b = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b)) }
  if ((FAMILY_KINDS as readonly string[]).includes(kind)) { drawFamilyMoment(g, kind as FamilyKind, w, h, t, avatar, partner, partnerWho, babyName, family); return }
  if (['shelfBook', 'firstConfession', 'marketEvening', 'childWalks', 'homeExpanded'].includes(kind)) { drawMilestone(g, kind as MilestoneKind, w, h, t, avatar, partner, partnerWho, shelfCount, dialogue, confessionPerson); return }
  if (kind === 'dateSunset') {
    drawSunset(g, w, h, t, avatar, partner, partnerWho)
    return
  }
  if (kind === 'rainCopy' || kind === 'bookBound') {
    const floor = room(px, w, h, kind === 'bookBound', t, kind === 'rainCopy')
    desk(px, Math.round(w * .5), floor, t, kind === 'bookBound', avatar)
    return
  }
  if (kind === 'babySleep') {
    const floor = room(px, w, h, false, 0), cx = Math.round(w * .55)
    const baby = householdCradleFrame({ look: 'f', name: babyName }, 0, true)
    const rows = (art: string[], pal: Record<string, string>) => art.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.' && pal[c]) px(cx + x * 2, floor - 26 + y * 2, pal[c], 2, 2) }))
    rows(baby.back, baby.propPalette); rows(baby.actor, baby.actorPalette); rows(baby.front, baby.propPalette)
    drawScenicBench(g, cx - 24, floor + 4, avatar)
    px(cx + 38, floor - 11, '#846749', 15, 3); px(cx + 43, floor - 8, '#66513f', 3, 14)
    px(cx + 42, floor - 19, '#ead0a0', 3, 8); px(cx + 42, floor - 23, '#f4cc82', 2, 4)
    return
  }
  // 눈 오는 마을: 지붕과 길 위에만 눈을 얹고, 인물은 기존 10×14 비율 그대로.
  px(0, 0, '#a7b7c7', w, h)
  const floor = Math.round(h * .76)
  px(0, floor - 5, '#dde3dc', w, h - floor + 5)
  px(0, floor + 12, '#c5d2cc', w, 2)
  for (let i = 0; i < 3; i++) {
    const x = Math.round(w * (.08 + i * .31)), y = floor - 42 - (i % 2) * 8
    px(x, y, '#c8bba2', 60, 42)
    px(x - 3, y - 23, '#9b796c', 66, 25)
    px(x - 3, y - 24, '#edf0e7', 66, 5); px(x - 3, y - 1, '#e3e8df', 66, 4)
    for (const xx of [x + 8, x + 40]) { px(xx, y + 12, '#9b8269', 10, 12); px(xx + 2, y + 14, '#f3ca88', 6, 8) }
    px(x + 24, y + 20, '#8c6e57', 12, 22)
    px(x + 44, y - 30, '#806f68', 5, 10); px(x + 43, y - 31, '#ebeee6', 7, 2)
  }
  actor(px, Math.round(w * .5) - 10, floor + 25, avatar)
  for (let i = 0; i < 75; i++) {
    const x = (i * 47 + Math.floor(t * 3) + Math.sin(i) * 6 + w) % w, y = (i * 29 + Math.floor(t * (5 + i % 3))) % h
    px(x, y, i % 3 ? '#f0f1e9' : '#d2dce1', i % 11 ? 1 : 2, i % 11 ? 1 : 2)
  }
}
