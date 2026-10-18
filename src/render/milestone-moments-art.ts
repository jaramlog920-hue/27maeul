import { withLookDefaults, type Avatar } from '../engine/avatar'
import { PALETTE, SMALL_PALETTE, BABY, spriteRows, writerPalette, type Who } from './sprites'
import type { Facing,Season } from '../engine/types'

export type MilestoneKind = 'shelfBook' | 'firstConfession' | 'marketEvening' | 'childWalks' | 'homeExpanded'
type Px = (x: number, y: number, c: string, w?: number, h?: number) => void
export function person(px: Px, x: number, floor: number, av: Avatar | null, facing: Facing = 'up', who: Who = 'writer', crouch = false, walk = false, t = 0, growth = 1, short?: number,elder?:boolean,season:Season='spring') {
  const full = av ? withLookDefaults(av) : undefined, pal = who === 'writer' ? writerPalette(season, full) : PALETTE
  const rows = spriteRows(who, facing, { frame: walk ? (Math.floor(t * 3) % 2 ? 1 : 2) : 0, blink: false, avatar: full, pose: crouch ? 'crouch' : 'stand', growth, short,elder,season })
  rows.forEach((r, y) => [...r].forEach((c, xx) => { if (c !== '.' && pal[c]) px(x + xx * 2, floor - rows.length * 2 + y * 2, pal[c], 2, 2) }))
}
function interior(px: Px, w: number, h: number) {
  const floor = Math.round(h * .79)
  px(0, 0, '#c9b6a0', w, h); px(0, floor, '#a48567', w, h - floor)
  for (let y = floor + 5; y < h; y += 8) px(0, y, '#927457', w)
  px(0, floor - 2, '#8d7257', w, 3)
  return floor
}

export function drawMilestone(g: CanvasRenderingContext2D, kind: MilestoneKind, w: number, h: number, t: number, avatar: Avatar | null, partner: Avatar | null, partnerWho: Who, shelfCount: number, dialogue = false, confessionPerson?: string) {
  g.imageSmoothingEnabled = false
  const px: Px = (x, y, c, a = 1, b = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b)) }
  const cx = Math.round(w * .5)
  if (kind === 'shelfBook') {
    const floor = interior(px, w, h), sx = cx - 58
    px(sx - 5, floor - 82, '#6a5341', 128, 84); px(sx, floor - 78, '#493e36', 118, 78)
    for (let row = 0; row < 3; row++) px(sx - 4, floor - 54 + row * 26, '#b0916e', 126, 3)
    const gapX = sx + 53, gapY = floor - 22
    // 새 책은 팔이 닿는 아래 선반에 둔다.
    let left = Math.max(0, Math.min(26, shelfCount - 1))
    for (let i = 0; i < 27; i++) {
      if (i === 22 || left <= 0) continue
      const x = sx + 5 + i % 9 * 12, y = floor - 74 + Math.floor(i / 9) * 26
      px(x, y, ['#8e6955', '#7b947a', '#c7ad7a', '#8e829c'][i % 4], 7, 18); px(x + 1, y + 3, '#d7c7a7', 5); left--
    }
    const done = t >= 2.5, bookX = gapX - 10 + Math.min(1, t / 2.5) * 10
    person(px, gapX - 24, floor + 3, avatar, 'right')
    px(bookX, gapY, '#a78359', 7, 18); px(bookX + 1, gapY + 3, '#e2c887', 5)
    if (!done) {
      const pal = writerPalette('spring', avatar ? withLookDefaults(avatar) : undefined)
      px(gapX - 12, floor - 13, pal.r, 4, 3); px(gapX - 8, floor - 16, pal.s, 2, 4)
    }
    return
  }
  if (kind === 'firstConfession') {
    const cups=confessionPerson==='poppy'||confessionPerson==='merchant'
    const night=confessionPerson==='dexter'
    const mist=confessionPerson==='cosmo'
    px(0, 0, night?'#273348':mist?'#c5d0cc':cups?'#baa78d':'#c2cfbd', w, h)
    px(0, h * .28, night?'#344458':mist?'#adbebc':cups?'#baa78d':'#b7c9ba', w, h * .28)
    const floor = Math.round(h * (dialogue ? .59 : .81))
    px(0, floor - 18, '#7e9a77', w, h - floor + 18); px(0, floor - 2, '#c4b18b', w, h - floor + 2)
    for (let i = 0; i < 5; i++) {
      const x = 16 + i * (w - 32) / 4
      if (cups||night||mist||Math.abs(x - cx) < 44) continue
      px(x + 10, floor - 20, '#816c53', 5, 19)
      px(x + 6, floor - 47, '#66876b', 13, 5); px(x + 2, floor - 42, '#66876b', 21, 5)
      px(x, floor - 37, '#4d715b', 25, 10); px(x + 3, floor - 27, '#4d715b', 19, 5)
      px(x + 4, floor - 41, '#91aa83', 11, 4)
    }
    if(night)for(let i=0;i<32;i++)px((i*73+17)%w,12+(i*31)%Math.max(20,floor-58),'#c8ccb8')
    if(mist){px(0,floor-50,'#9aaead',w,28);for(let i=0;i<8;i++)px(i*w/8,floor-42+i%3*7,'#c6d0c8',22,1);px(cx-43,floor+3,'#93775b',82,7);px(cx-37,floor+10,'#6b5949',70,4)}
    if(cups){px(cx-86,floor-70,'#785e46',40,44);px(cx-82,floor-66,'#c2a18a',32,35);px(cx-68,floor-66,'#94795b',2,35);px(cx-86,floor-34,'#a88d67',40,3);px(cx+53,floor-62,'#6f5843',26,63);for(let i=0;i<3;i++)px(cx+51,floor-43+i*19,'#a18962',30,3)}
    if(confessionPerson==='tilly'){px(cx-88,floor-35,'#615951',36,36);px(cx-82,floor-26,'#c38353',23,22);px(cx-77,floor-18,'#e6b375',12,12);px(cx+58,floor-19,'#666c67',23,6);px(cx+64,floor-13,'#6c5b4c',8,15)}
    if(confessionPerson==='postman'){px(cx-95,floor-5,'#91917e',50,8);px(cx-101,floor+3,'#b2af97',62,8)}
    if(confessionPerson==='penelope'){px(cx+62,floor-42,'#a18561',3,43);px(cx+91,floor-42,'#a18561',3,43);px(cx+61,floor-39,'#b89b72',34,4);for(let i=0;i<7;i++)px(cx+65+i*4,floor-33,'#d1c6aa',1,28)}
    const approach = Math.min(1, t / 3)
    person(px, cx - 29 + approach * 12, floor + 4, avatar, 'right', 'writer', cups, t > 0 && t < 3, t)
    person(px, cx + 9 - approach * 6, floor + 4, partner, 'left', partnerWho, cups, t > 0 && t < 3, t)
    if(cups){px(cx-23,floor-2,'#b3966c',49,5);px(cx-19,floor+3,'#795e43',3,10);px(cx+19,floor+3,'#795e43',3,10)}
    const bx = cx - 17 + approach * 13, by = cups?floor-10:floor-7
    if (!confessionPerson) {
    px(bx + 3, by + 1, '#5f7951', 2, 7); px(bx + 1, by + 3, '#839661', 6, 2)
    for (const [x, y, c] of [[0, 0, '#d49aa5'], [4, -3, '#edc294'], [7, 0, '#d5b8cf']] as const) { px(bx + x, by + y, c, 3, 3); px(bx + x + 1, by + y + 1, '#f1dcb0') }
    } else drawConfessionToken(px,bx,by,confessionPerson)
    return
  }
  if (kind === 'marketEvening') {
    px(0, 0, '#646078', w, h)
    const floor = Math.round(h * .81)
    px(0, h * .35, '#a58587', w, h * .22); px(0, h * .57, '#c4a08a', w, h * .24); px(0, floor, '#857663', w, h - floor)
    for (let i = 0; i < 4; i++) {
      const x = Math.round(w * .08 + i * w * .22)
      px(x, floor - 53, '#87715f', 49, 52); px(x - 3, floor - 55, i % 2 ? '#827c69' : '#ad8176', 55, 8)
      px(x, floor - 31, '#503f38', 49, 27); px(x - 2, floor - 16, '#b19470', 53, 4)
      if (t >= i * .75) { px(x + 17, floor - 44, '#bba076', 14, 13); px(x + 20, floor - 41, '#f2d49a', 8, 7) }
      else px(x + 20, floor - 41, '#76695c', 8, 7)
      for (let j = 0; j < 3; j++) if (t < 2 + j) px(x + 4 + j * 12, floor - 21, j % 2 ? '#a98557' : '#889569', 9, 5)
      if (t > 1.5) { px(x + 34, floor - 24, '#a4815e', 12, 8); px(x + 34, floor - 21, '#735c45', 12, 1) }
      person(px, x + 10, floor + 4, null, 'up', (['merchant', 'baker', 'weaver', 'smith'] as const)[i])
    }
    person(px, cx - 10, floor + 7, avatar)
    return
  }
  if (kind === 'childWalks') {
    const floor = interior(px, w, h), parentX = cx + 18
    px(cx - 60, floor - 2, '#bd9c79', 126, 27); px(cx - 55, floor + 1, '#b1896e', 116, 2)
    const x = cx - 36 + Math.min(1, t / 4) * 46, foot = floor + 16
    person(px, parentX, foot, avatar, 'left', 'writer', true)
    // 기존 아기 걷기 그림을 쓴다. 어른 몸을 축소해서 대신하지 않는다.
    BABY.walk.forEach((r, y) => [...r].forEach((c, xx) => {
      const step = y === BABY.walk.length - 1 && t < 4 && xx === (Math.floor(t * 3) % 2 ? 1 : 3) ? 1 : 0
      if (c !== '.' && SMALL_PALETTE[c]) px(x + xx * 2, foot - BABY.walk.length * 2 + y * 2 - step, SMALL_PALETTE[c], 2, 2)
    }))
    px(x + 5, foot - 9, SMALL_PALETTE.k); px(x + 5, foot - 7, '#d79b7b')
    px(x + 8, foot - 5, SMALL_PALETTE.s, 2, 2)
    px(cx - 63, floor - 31, '#927556', 18, 32); px(cx - 66, floor - 33, '#b69671', 24, 3)
    return
  }
  const floor = interior(px, w, h), wx = Math.round(w * .65)
  px(12, floor - 79, '#846b54', 42, 79); px(17, floor - 74, '#6d6258', 32, 74)
  px(wx - 3, floor - 68, '#967c60', 58, 54); px(wx, floor - 65, '#c4d5ca', 52, 48)
  px(wx + 25, floor - 65, '#a38968', 2, 48); px(wx, floor - 42, '#a38968', 52, 2)
  const curtainW = Math.max(4, 23 * (1 - Math.min(1, t / 4)))
  px(wx, floor - 65, '#dfccaa', curtainW, 49); px(wx + 52 - curtainW, floor - 65, '#dfccaa', curtainW, 49); px(wx - 6, floor - 70, '#846a52', 64, 2)
  if (t > 2) for (let y = 0; y < 25; y++) px(wx - y * 2, floor + y, '#bea381', 35, 1)
  const walk = t < 4, x = 36 + Math.min(1, t / 4) * (w * .48 - 36)
  person(px, x, floor + 11, avatar, walk ? 'right' : 'up', 'writer', false, walk, t)
}

/** 고백은 꽃을 건네는 공통 행동이 아니다. 각 인물 대사의 실제 소품. */
export function drawConfessionToken(p: Px,x:number,y:number,who:string){
 if(who==='rudy'){p(x-3,y-5,'#806346',16,12);p(x-2,y-4,'#c3a079',14,10);for(let i=0;i<3;i++)p(x+i*3,y-2,'#745339',2,1);p(x,y+2,'#8e6244',9,1)}
 else if(who==='postman'){p(x-3,y-5,'#6a5946',16,13);p(x-1,y-4,'#eadbb7',13,11);p(x+4,y-4,'#ab9574',1,11);p(x,y-2,'#856e51',4,1);p(x+6,y+1,'#856e51',5,1)}
 else if(who==='wendell'){p(x-2,y,'#ba8955',15,7);p(x,y-2,'#d3aa70',11,10);p(x+4,y,'#895f3e',1,5);p(x+5,y,'#895f3e',3,1)}
 else if(who==='poppy'||who==='merchant'){p(x,y,'#d9c8a5',9,7);p(x+8,y+1,'#ac9876',3,4);p(x+1,y,'#785c43',7,2);p(x-1,y+7,'#b59d78',12,2)}
 else if(who==='tilly'){p(x,y-4,'#64757b',10,13);p(x+1,y-3,'#abb5af',8,10);p(x+3,y-1,'#66736d',4,1)}
 else if(who==='penelope'){p(x-3,y-3,'#8baabd',17,12);for(let i=0;i<4;i++)p(x-2+i*4,y+7,'#d3ceb4',1,3);p(x+2,y,'#e8dfcb',5,5);p(x+4,y-1,'#e8dfcb',1,7);p(x+4,y+2,'#c5ad77',1,1)}
 else if(['basil','marigold','presser'].includes(who)){p(x-3,y-4,'#ebdabb',16,13);for(let i=0;i<4;i++)p(x-1,y-2+i*3,'#927e62',i===0?10:7,1);if(who==='basil')p(x+8,y+4,'#9c8262',3,3)}
 // 덱스터는 별을 가리키고, 코스모는 노를 잡고, 주니퍼는 소품 없이 춤춘다.
 else if(who==='cosmo'){p(x+5,y-16,'#a08058',2,30);p(x+3,y+10,'#b4986d',6,9)}
 else if(who==='dexter'){p(x+9,y-34,'#e8ddb9',1,5);p(x+7,y-32,'#e8ddb9',5,1)}
}
