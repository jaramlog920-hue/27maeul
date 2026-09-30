// 코드로 그린 도트. 외모 주장이 아니라 게임 표현이다 (exclusion-list §1-2).
import type { Facing, Season } from '../engine/types'
import { hsvToHex, shadeOf, SKINS, TOPS, type FullAvatar, type Look } from '../engine/avatar'
import { FURNI_PALETTE, FURNITURE_ART, ICON_CHAR, iconFromArt } from './furniture-art'

export type { Look }

export const SPRITE_W = 10
export const SPRITE_H = 14

export const PALETTE: Record<string, string> = {
  k: '#3c2418', // 윤곽 (참고 그림 인물의 짙은 밤색)
  '+': '#f0a890', // 볼 발그레 (귀엽게 — 참고 그림)
  s: '#f8d8a8', // 피부 (참고 그림)
  h: '#583828', // 머리 (참고 그림)
  r: '#ac7444', // 겉옷
  R: '#906040', // 겉옷 그늘
  b: '#d4b060', // 띠
  P: '#f8d8a8', // 귀에 꽂은 펜
  K: '#2a2020', // 잉크 묻은 손
  S: '#b05848', // 겨울 목도리
  // 이웃
  c: '#c07058', C: '#a86048', a: '#f8e8cc', y: '#e0c898', // 빵 굽는 이웃
  W: '#e8e0d8', g: '#4880b4', G: '#3c6c9c', // 할아버지
  H: '#b05c88', p: '#c8a04c', Q: '#ac883c', // 상인
  j: '#2a2020', n: '#a86048', N: '#845038', L: '#583828', // 대장장이
  e: '#f0d8b0', u: '#987858', U: '#80644a', O: '#4a2c20', // 양치기 (O: 짙은 곱슬머리 — 다른 이웃과 겹치지 않게)
  q: '#58984c', i: '#d4b060', I: '#ac883c', // 기름 짜는 이웃
  z: '#5c94c4', Z: '#4880b4', // 아이
  V: '#b05c88', X: '#944850', F: '#d888b4', // 베 짜는 이웃
  E: '#74ac5c', M: '#58984c', Y: '#d4b060', // 벌 치는 이웃
  // 새 이웃 넷 — o·l·d·D는 주인공 옷 글자(writerPalette)라 비어 있는 글자를 쓴다
  t: '#4880b4', T: '#3c6c9c', // 편지 나르는 이웃
  A: '#bc6c54', B: '#a45a44', // 주막 주인
  J: '#5cacb8', w: '#3c808c', // 어부
  v: '#c8a04c', m: '#ac883c', // 목수
}

/** 계절 옷 (겉옷, 그늘) */
const SEASON_ROBE: Record<Season, [string, string]> = {
  spring: ['#ac7444', '#906040'],
  summer: ['#e0c898', '#ac8c6c'],
  autumn: ['#906040', '#845038'],
  winter: ['#605048', '#504038'],
}

export type SpriteRows = readonly string[]

const FRONT: SpriteRows = [
  '...kkkk...',
  '..khhhhk..',
  '.khhhhhhk.',
  '.khsssshk.',
  '.kskssksk.',
  '.k+kssk+k.',
  '..kssssk..',
  '.krrrrrrk.',
  '.kRrrrrRk.',
  '.kRrbbrRk.',
  '.ksrrrrsk.',
  '.kRrrrrRk.',
  '.kRrrrrRk.',
  '..kk..kk..',
]

const BACK: SpriteRows = [
  '...kkkk...',
  '..khhhhk..',
  '.khhhhhhk.',
  '.khhhhhhk.',
  '.khhhhhhk.',
  '.khhhhhhk.',
  '..khhhhk..',
  '.krrrrrrk.',
  '.kRrrrrRk.',
  '.kRrbbrRk.',
  '.ksrrrrsk.',
  '.kRrrrrRk.',
  '.kRrrrrRk.',
  '..kk..kk..',
]

/** 오른쪽을 본다. 왼쪽은 좌우 반전 */
const SIDE: SpriteRows = [
  '...kkkk...',
  '..khhhhk..',
  '.khhhhhhk.',
  '.khhhsssk.',
  '.khhssksk.',
  '.khsssk+k.',
  '..kssssk..',
  '.krrrrrrk.',
  '.krrrrrrk.',
  '.krrbbrsk.',
  '.krrrrrrk.',
  '.kRrrrrRk.',
  '.kRrrrrRk.',
  '..kk..kk..',
]

/** 옆모습 걸음: 앞뒤로 벌린 다리가 모이는 박자 */
const WALK_FEET = '...kkkk...'

/**
 * 앞·뒤 걸음: 몸은 그대로 두고 한 발씩 번갈아 든다 (frame 1 = 왼발, 2 = 오른발).
 * 든 발은 한 줄 짧아진다. 다리를 옆으로 벌리지도, 몸이 뜨지도 않는다.
 */
function stepLegs(rows: string[], frame: 1 | 2): string[] {
  const out = [...rows]
  const feet = out[out.length - 1]
  const half = feet.length / 2
  out[out.length - 1] = frame === 1 ? '.'.repeat(half) + feet.slice(half) : feet.slice(0, half) + '.'.repeat(half)
  return out
}

export function mirror(rows: SpriteRows): string[] {
  return rows.map((r) => [...r].reverse().join(''))
}

export function recolor(rows: SpriteRows, map: Record<string, string>): string[] {
  return rows.map((r) => [...r].map((ch) => map[ch] ?? ch).join(''))
}

function setPixel(rows: string[], x: number, y: number, ch: string) {
  const r = rows[y]
  if (!r || x < 0 || x >= r.length) return
  rows[y] = r.slice(0, x) + ch + r.slice(x + 1)
}

export type Who =
  | 'writer'
  | 'baker'
  | 'child'
  | 'grandpa'
  | 'merchant'
  | 'smith'
  | 'shepherd'
  | 'presser'
  | 'weaver'
  | 'beekeeper'
  | 'postman'
  | 'apothecary'
  | 'fisher'
  | 'carpenter'
export type Pose = 'stand' | 'handUp' | 'wave' | 'crouch'

export interface SpriteOpts {
  /** 0 = 서 있음, 1·2 = 걸음 두 박자(왼다리·오른다리) */
  frame: 0 | 1 | 2
  blink: boolean
  pose?: Pose
  season?: Season
  /** 기록자: 잉크 묻은 손 */
  inky?: boolean
  /** 아이: 자란 정도 0~3 */
  growth?: number
  /** 주인공 모습 */
  look?: Look
  /** 주인공이 고른 머리·옷·장신구 (있으면 look보다 먼저) */
  avatar?: FullAvatar
}

/** 머리 모양 (주인공·이웃 같이 쓴다): 곱슬·삐죽·가운데 가르마·짧게 깎음·옆 가르마 (대머리는 쓰지 않는다). ch는 그 사람의 머리 글자 */
export type HairShape = 'curly' | 'spiky' | 'curtain' | 'crop' | 'sidePart'
function hairShape(rows: string[], facing: Facing, kind: HairShape, ch = 'h') {
  const front = facing === 'down'
  const back = facing === 'up'
  const put = (pts: number[][], c = ch) => pts.forEach(([x, y]) => setPixel(rows, x, y, c))
  switch (kind) {
    case 'curly': // 곱슬: 윗머리와 옆머리가 양털처럼 부푼다
      put(front || back ? [[1, 1], [8, 1], [0, 2], [9, 2], [0, 3], [9, 3]] : [[1, 1], [8, 1], [0, 2], [9, 2], [0, 3]])
      break
    case 'spiky': // 삐죽 머리: 정수리가 들쭉날쭉
      put([[2, 0], [4, 0], [7, 0], [1, 1], [8, 1]])
      break
    case 'curtain': // 가운데 가르마: 이마 양쪽으로 갈라 내린 앞머리
      if (front) put([[2, 3], [3, 3], [6, 3], [7, 3], [2, 4], [7, 4]])
      else if (!back) put([[5, 3], [6, 3], [7, 3], [7, 4]])
      break
    case 'crop': // 짧게 깎음: 귀 옆 머리를 걷어 낸다
      if (front) put([[1, 3], [8, 3]], 'k')
      if (front) put([[2, 3], [7, 3]], 's')
      else if (!back) put([[3, 3], [4, 3]], 's')
      break
    case 'sidePart': // 옆 가르마: 한쪽으로 쓸어 넘긴 앞머리
      if (front) put([[3, 3], [4, 3], [5, 3]])
      else if (!back) put([[5, 3], [6, 3]])
      break
  }
}

function longHair(rows: string[]) {
  for (let y = 3; y <= 8; y++) for (const x of [0, 9]) if (rows[y]?.[x] === '.') setPixel(rows, x, y, 'h')
}

/**
 * 주인공이 고른 모습을 입힌다 (오른쪽을 보는 모습 기준, 왼쪽은 나중에 통째로 뒤집힌다).
 * 새 글자: o 눈, l 윗옷 무늬, d/D 아래옷과 그늘, x 머리띠·머릿수건, f 꽃, y 금붙이
 */
function dressAvatar(rows: string[], facing: Facing, a: FullAvatar, blink: boolean) {
  const front = facing === 'down'
  const back = facing === 'up'
  // 눈
  if (!blink && !back) for (const x of front ? [3, 6] : [6]) if (rows[4][x] === 'k') setPixel(rows, x, 4, 'o')
  // 뒷머리 → 앞머리 순서로 그린다 (앞머리가 얼굴 쪽을 덮는다)
  const sides = front || back ? [[0, 1], [9, 8]] : [[0, 1]] // [바깥 칸, 머리 윤곽 칸]
  const paint = (x: number, y0: number, y1: number, ch = 'h') => {
    for (let y = y0; y <= y1; y++) setPixel(rows, x, y, ch)
  }
  switch (a.hairBack) {
    case 1: // 긴 머리: 머리 옆에서 어깨까지 끊기지 않게 (목 옆 빈칸까지 채운다)
      for (const [out, edge] of sides) {
        paint(out, 2, 8)
        paint(edge, 3, 7)
      }
      if (back) for (let x = 2; x <= 7; x++) paint(x, 6, 8)
      break
    case 2: // 단발: 턱선까지
      for (const [out, edge] of sides) {
        paint(out, 2, 5)
        paint(edge, 3, 6)
      }
      if (back) for (let x = 2; x <= 7; x++) setPixel(rows, x, 6, 'h')
      break
    case 3: // 올린 머리: 정수리에 틀어 올린 머리
      for (const x of [3, 4, 5, 6]) setPixel(rows, x, 0, 'h')
      break
    case 4: // 묶은 머리: 뒤로 늘어진 꽁지
      if (front) paint(9, 3, 6)
      else if (back) for (const x of [4, 5]) paint(x, 6, 9)
      else {
        paint(0, 3, 7)
        setPixel(rows, 1, 3, 'x')
      }
      break
    case 5: // 양갈래: 끈으로 묶은 두 갈래 (끈이 있어 긴 머리와 다르다)
      for (const [out] of sides) {
        setPixel(rows, out, 3, 'x')
        paint(out, 4, 7)
      }
      break
    case 6: // 땋은 머리: 어깨 앞(앞모습)·등(뒷모습)으로 내린 한 가닥
      if (front) for (let y = 3; y <= 9; y++) setPixel(rows, y < 7 ? 9 : 8, y, 'h')
      else if (back) for (let y = 6; y <= 11; y++) setPixel(rows, y % 2 ? 4 : 5, y, 'h')
      else paint(1, 5, 9)
      break
  }
  switch (a.hairFront) {
    case 1: // 일자 앞머리
      if (front) for (let x = 3; x <= 6; x++) setPixel(rows, x, 3, 'h')
      else if (!back) for (const x of [5, 6]) setPixel(rows, x, 3, 'h')
      break
    case 2: // 옆 가르마: 한쪽으로 쓸어 넘긴 앞머리
      if (front) for (const x of [3, 4]) setPixel(rows, x, 3, 'h')
      else if (!back) setPixel(rows, 5, 3, 'h')
      break
    case 3: // 짧게 깎음: 귀 옆 머리를 걷어 낸다
      if (front) for (const x of [2, 7]) setPixel(rows, x, 3, 's')
      else if (!back) for (const x of [3, 4]) setPixel(rows, x, 3, 's')
      break
    case 4: // 부스스: 부푼 윗머리
      for (const [x, y] of front || back ? [[1, 1], [8, 1], [0, 2], [9, 2]] : [[1, 1], [0, 2], [8, 1]]) setPixel(rows, x, y, 'h')
      break
    case 5:
      hairShape(rows, facing, 'curly')
      break
    case 6:
      hairShape(rows, facing, 'spiky')
      break
    case 7:
      hairShape(rows, facing, 'curtain')
      break
  }
  // 윗옷 무늬
  const pattern = TOPS[a.top]?.[4] ?? 'plain'
  if (pattern === 'stripe') for (const y of [8, 10]) for (let x = 0; x < 10; x++) if (rows[y][x] === 'r') setPixel(rows, x, y, 'l')
  if (pattern === 'apron' && !back) for (let y = 10; y <= 12; y++) for (let x = 3; x <= 6; x++) setPixel(rows, x, y, 'l')
  if (pattern === 'vest') for (let y = 7; y <= 10; y++) for (const x of [1, 2, 7, 8]) if (rows[y][x] === 'r') setPixel(rows, x, y, 'l')
  // 아래옷
  const LONG = '.kDddddDk.'
  const PANTS = '.kddkkddk.'
  const LEGS = '..ks..sk..'
  const [r11, r12] = [
    [LONG, LONG],
    [LONG, LEGS],
    [PANTS, PANTS],
    [PANTS, LEGS],
  ][a.bottom] ?? [LONG, LONG]
  const apron = pattern === 'apron' && !back
  rows[11] = apron && a.bottom < 2 ? r11.slice(0, 3) + rows[11].slice(3, 7) + r11.slice(7) : r11
  rows[12] = apron && a.bottom === 0 ? r12.slice(0, 3) + rows[12].slice(3, 7) + r12.slice(7) : r12
  // 장신구
  switch (a.acc) {
    case 1: // 머리띠
      for (let x = 2; x <= 7; x++) if (rows[2][x] === 'h') setPixel(rows, x, 2, 'x')
      break
    case 2: // 꽃 핀
      setPixel(rows, back ? 6 : front ? 2 : 3, 1, 'f')
      break
    case 3: // 목걸이
      if (!back) for (const x of front ? [4, 5] : [5, 6]) setPixel(rows, x, 7, 'y')
      break
    case 4: // 귀걸이
      if (front) for (const x of [0, 9]) setPixel(rows, x, 5, 'y')
      else if (!back) setPixel(rows, 2, 5, 'y')
      break
    case 5: // 머릿수건: 머리 위쪽을 천으로 덮는다
      for (let y = 0; y <= 2; y++) for (let x = 0; x < 10; x++) if (rows[y][x] === 'h') setPixel(rows, x, y, 'x')
      for (let x = 3; x <= 6; x++) setPixel(rows, x, 0, 'x')
      capTop(rows, 'x')
      break
  }
}

/** 머릿수건·모자를 쓴 사람: 머리 꼭대기 검은 윤곽이 천 위로 비치지 않게, 윗줄 윤곽을 천 색으로 */
function capTop(rows: string[], ch: string) {
  for (let x = 0; x < 10; x++) if (rows[0][x] === 'k') setPixel(rows, x, 0, ch)
  for (const x of [1, 2, 7, 8]) if (rows[1][x] === 'k') setPixel(rows, x, 1, ch)
}

function dressNeighbor(who: Who, rows: string[], facing: Facing): string[] {
  switch (who) {
    case 'baker': {
      const out = recolor(rows, { h: 'y', r: 'c', R: 'C', b: 'a' })
      for (let y = 8; y <= 11; y++) for (let x = 3; x <= 6; x++) if (out[y][x] === 'c') setPixel(out, x, y, 'a')
      return out
    }
    case 'grandpa': {
      const out = recolor(rows, { h: 'W', r: 'g', R: 'G', b: 'W' })
      // 흰 수염
      if (out[5][3] === 's') for (const x of [3, 4, 5, 6]) setPixel(out, x, 6, 'W')
      return out
    }
    case 'merchant': {
      // 짙은 밤색 머리에 겨자색 모자 (남자 이웃에 분홍 머리는 쓰지 않는다)
      const out = recolor(rows, { h: 'L', r: 'p', R: 'Q', b: 'H' })
      for (let x = 2; x <= 7; x++) setPixel(out, x, 0, 'Q')
      capTop(out, 'Q')
      return out
    }
    case 'smith': {
      const out = recolor(rows, { h: 'j', r: 'n', R: 'N', b: 'L' })
      for (let y = 9; y <= 12; y++) for (let x = 3; x <= 6; x++) if (out[y][x] === 'n' || out[y][x] === 'N') setPixel(out, x, y, 'L')
      return out
    }
    case 'shepherd': {
      // 짙은 곱슬머리 (윗머리가 양털처럼 부푼다) — 다른 이웃과 겹치지 않는 머리
      const out = recolor(rows, { h: 'O', r: 'u', R: 'U', b: 'e' })
      hairShape(out, facing, 'curly', 'O')
      return out
    }
    case 'presser': {
      const out = recolor(rows, { r: 'i', R: 'I', b: 'q' })
      for (let x = 2; x <= 7; x++) if (out[2][x] === 'h') setPixel(out, x, 2, 'q')
      return out
    }
    case 'child':
      return recolor(rows, { r: 'z', R: 'Z', b: 'y' })
    case 'weaver': {
      // 분홍 옆 가르마 머리, 보랏빛 옷
      const out = recolor(rows, { h: 'F', r: 'V', R: 'X', b: 'F' })
      hairShape(out, facing, 'sidePart', 'F')
      return out
    }
    case 'beekeeper': {
      // 챙 넓은 밀짚모자, 풀빛 옷
      const out = recolor(rows, { r: 'E', R: 'M', b: 'Y' })
      for (let x = 0; x <= 9; x++) setPixel(out, x, 1, 'Y')
      for (let x = 2; x <= 7; x++) setPixel(out, x, 0, 'Y')
      capTop(out, 'Y')
      return out
    }
    case 'postman': {
      // 푸른 겉옷, 어깨에 멘 편지 가방 끈
      const out = recolor(rows, { r: 't', R: 'T', b: 'a' })
      hairShape(out, facing, 'curtain')
      for (let y = 7; y <= 10; y++) setPixel(out, 2 + (y - 7), y, 'L')
      return out
    }
    case 'apothecary':
      // 붉은 겉옷, 흰 앞치마
      return recolor(rows, { r: 'A', R: 'B', b: 'a' })
    case 'fisher': {
      // 청록 겉옷, 밀짚 머릿수건 (옆 가르마)
      const out = recolor(rows, { h: 'e', r: 'J', R: 'w', b: 'e' })
      hairShape(out, facing, 'sidePart', 'e')
      capTop(out, 'e')
      return out
    }
    case 'carpenter': {
      // 나무색 작업복, 가죽 띠, 짧게 깎은 머리
      const out = recolor(rows, { h: 'L', r: 'v', R: 'm', b: 'L' })
      hairShape(out, facing, 'crop', 'L')
      return out
    }
    default:
      return rows
  }
}

/** 아이는 몸통이 짧다. 계절마다 한 줄씩 자란다 */
function shorten(rows: string[], growth: number): string[] {
  const drop = Math.max(0, 3 - growth)
  const cut = [10, 11, 12].slice(0, drop)
  return rows.filter((_, i) => !cut.includes(i))
}

export function spriteRows(who: Who, facing: Facing, opts: SpriteOpts): string[] {
  const base = facing === 'up' ? BACK : facing === 'down' ? FRONT : SIDE
  let rows = [...base]
  const side = facing === 'left' || facing === 'right'
  if (side && opts.frame === 1) rows[13] = WALK_FEET
  if (opts.blink && facing !== 'up') {
    // 눈 자리를 피부로 덮고 한 줄 아래에 감은 눈을 그린다
    const eyes = facing === 'down' ? [3, 6] : [6]
    for (const x of eyes) {
      setPixel(rows, x, 4, 's')
      setPixel(rows, x, 5, 'k')
    }
  }
  const pose = opts.pose ?? 'stand'
  if (pose === 'handUp' && facing === 'down') {
    // 두 손을 어깨 위로 (비 맞는 손바닥, 기지개)
    for (const [x, hand] of [[0, 2], [9, 7]]) {
      setPixel(rows, x, 6, 's')
      setPixel(rows, x, 7, 'r')
      setPixel(rows, hand, 10, 'r')
    }
  }
  if (pose === 'wave' && facing === 'down') {
    setPixel(rows, 9, 6, 's')
    setPixel(rows, 9, 7, 'r')
    setPixel(rows, 7, 10, 'r')
  }
  if (who === 'writer') {
    if (opts.avatar) dressAvatar(rows, facing, opts.avatar, opts.blink)
    // 여자 모습: 어깨까지 내려오는 머리 (얼굴 양옆의 빈 칸)
    else if (opts.look === 'f') longHair(rows)
    if (opts.inky && facing === 'down' && rows[10][2] === 's') setPixel(rows, 2, 10, 'K')
    if (opts.season === 'winter') for (let x = 2; x <= 7; x++) if (rows[7][x] === 'r') setPixel(rows, x, 7, 'S')
  } else {
    rows = dressNeighbor(who, rows, facing)
  }
  if (who === 'child') rows = shorten(rows, opts.growth ?? 0)
  if (!side && opts.frame) rows = stepLegs(rows, opts.frame)
  if (facing === 'left') rows = mirror(rows)
  if (pose === 'crouch') rows = [...rows.slice(0, 7), ...rows.slice(9)]
  return rows
}

/** 기록자의 계절 옷 색 */
export function writerPalette(season: Season, avatar?: FullAvatar): Record<string, string> {
  if (!avatar) {
    const [r, R] = SEASON_ROBE[season]
    return { ...PALETTE, r, R }
  }
  const [, r, R, l] = TOPS[avatar.top] ?? TOPS[0]
  return {
    ...PALETTE,
    s: SKINS[avatar.skin] ?? SKINS[1],
    h: hsvToHex(avatar.hairColor),
    o: hsvToHex(avatar.eyeColor),
    r,
    R,
    l,
    b: l,
    d: hsvToHex(avatar.bottomColor),
    D: hsvToHex(shadeOf(avatar.bottomColor)),
    x: '#b05848',
    f: '#d888b4',
    y: '#d4b060',
  }
}

// ── 동물과 작은 것들 (자기 팔레트) ──

export const ANIMAL_PALETTE: Record<'cat' | 'dog', Record<string, string>> = {
  cat: { a: '#eeb080', A: '#ac7444', e: '#2a2020', n: '#cc8068', w: '#e8e0d8' },
  dog: { a: '#ac7444', A: '#ac7444', e: '#2a2020', n: '#583828', w: '#f8e8cc' },
}

/** 왼쪽을 본다 (눈 e·코 n이 왼쪽 끝, 꼬리가 오른쪽). 오른쪽을 보게 하려면 animalRows로 뒤집는다 */
export const ANIMAL: Record<'cat' | 'dog', { adult: SpriteRows; baby: SpriteRows; curl: SpriteRows }> = {
  cat: {
    adult: ['a.a.....', 'aaa....a', 'eaan...a', '.aaaaaa.', '.aawaaa.', '.a.a.a.a'],
    baby: ['a.a...', 'eaa..a', '.aaaa.', '.a..a.'],
    curl: ['..aaa..', '.aaaaaa', 'aaaaaAa', '.aaaaa.'],
  },
  dog: {
    adult: ['A.......', 'aaA....a', 'eaan...a', 'aaaaaaa.', '.awaaaa.', '.a.a.a.a'],
    baby: ['A.....', 'eaA..a', '.aaaa.', '.a..a.'],
    curl: ['..aaa..', '.aaaaAa', 'aaaaaaa', '.aaaaa.'],
  },
}

/** 동물 그림: 걷는 쪽으로 머리가 가게. 그림은 왼쪽을 보므로 오른쪽일 때 뒤집는다 */
export function animalRows(kind: 'cat' | 'dog', form: 'adult' | 'baby' | 'curl', side: 'left' | 'right'): SpriteRows {
  const rows = ANIMAL[kind][form]
  return side === 'right' ? mirror(rows) : rows
}

export const SMALL_PALETTE: Record<string, string> = {
  w: '#ffffff', W: '#f8e8cc', k: '#583828', s: '#f8c094', a: '#f8e8cc', y: '#e0c898', z: '#5c94c4',
  o: '#cc8468', O: '#d4b060', b: '#5c94c4', B: '#5c94c4',
}

export const SHEEP: SpriteRows = ['.wwwww..', 'wwwwwwkk', 'wWwwwwks', '.wwwwww.', '.k.k.k..']
export const BABY: Record<'baby' | 'crawl' | 'walk', SpriteRows> = {
  baby: ['.aa.', 'asaa', 'aaaa', '.aa.'],
  crawl: ['..kk..', '.kssk.', 'zzzzzs', 'z.z..z'],
  walk: ['.kk.', 'kssk', '.ss.', 'zzzz', 'zzzz', '.z.z'],
}
export const BUTTERFLY: [SpriteRows, SpriteRows] = [
  ['o.o', 'OkO'],
  ['.o.', '.k.'],
]

// ── 가방 아이콘 (8×8) ──

export const ICON_PALETTE: Record<string, string> = {
  k: '#492c1b', b: '#80b8e2', B: '#4586bc', g: '#81b650', G: '#528e2b', y: '#e2c87e', Y: '#bd9c46',
  w: '#fdf6e7', W: '#e8d8b5', p: '#8643a4', P: '#612580', r: '#bc5a45', o: '#72a036', O: '#457016',
  d: '#2f213a', l: '#ffce4a', n: '#b17640', N: '#8d5829', s: '#f2c4a3', f: '#e689a5', c: '#dbbd8b',
  E: '#77a23a', a: '#fbf1dc', V: '#8153b0',
  // 가구 그림에서 줄인 아이콘의 색 (furniture-art ICON_CHAR)
  ...Object.fromEntries(Object.entries(ICON_CHAR).map(([from, to]) => [to, FURNI_PALETTE[from]])),
}

export const ICONS: Record<string, SpriteRows> = {
  water: ['........', '..kkkk..', '.kbbbbk.', '.kbBbbk.', '.kbbbbk.', '.kbbBbk.', '..kkkk..', '........'],
  reed: ['..g..g..', '..g.gg..', '.gg.g...', '..g.g.g.', '..gGg.g.', '..gG..g.', '..G..G..', '..G..G..'],
  papyrus: ['........', '.wwwwww.', '.wWwwWw.', '.wwwwww.', '.wWwwWw.', '.wwwwww.', '.WWWWWW.', '........'],
  soot: ['........', '........', '...dd...', '..dddd..', '.dddddd.', '.dddddd.', '..dddd..', '........'],
  ink: ['...kk...', '...WW...', '..kddk..', '.kddddk.', '.kddddk.', '.kddddk.', '..kkkk..', '........'],
  olive: ['....G...', '...G....', '..oo.o..', '.oOo.oO.', '.ooo.oo.', '..o...o.', '........', '........'],
  oil: ['...kk...', '...yy...', '..kyyk..', '.kyYyyk.', '.kyyyyk.', '.kyyYyk.', '..kkkk..', '........'],
  barley: ['..y.y...', '.yY.yY..', '..yyy...', '...y..y.', '...Yyy..', '...Y....', '...Y....', '...Y....'],
  bread: ['........', '..NNNN..', '.NnnnnN.', 'NnynynnN', 'NnnnnnnN', '.NNNNNN.', '........', '........'],
  grapes: ['....G...', '...G....', '..pp....', '.pPpp...', '.ppPpp..', '..pPpp..', '...pp...', '....p...'],
  wool: ['........', '..wwww..', '.wWwwWw.', 'wwwwwwww', 'wWwwwWww', '.wwwwww.', '..wwww..', '........'],
  fig: ['....G...', '...GG...', '..pppp..', '.pPpppp.', '.ppppPp.', '.pppppp.', '..pppp..', '........'],
  blanket: ['........', 'rrrrrrrr', 'rwrrwrrw', 'rrrrrrrr', 'rrwrrwrr', 'rrrrrrrr', 'WWWWWWWW', '........'],
  pot: ['...g....', '..ggg.g.', '.g.g.gg.', '...gg...', '.NNNNNN.', '..NnnN..', '..NnnN..', '...NN...'],
  rug: ['........', '........', 'rrrrrrrr', 'ryrryrry', 'rrrrrrrr', 'yrryrryr', 'rrrrrrrr', '........'],
  stool: ['........', '........', '.NNNNNN.', '.nnnnnn.', '..N..N..', '..N..N..', '.N....N.', '........'],
  basket: ['........', '..NNNN..', '.N....N.', 'NnNnNnNn', 'nNnNnNnN', '.NnNnNn.', '..NNNN..', '........'],
  vase: ['..f.f...', '.fGfGf..', '...G....', '..bBbb..', '.bbbbBb.', '.bBbbbb.', '..bbbb..', '...bb...'],
  cushion: ['........', '........', '.wwwwww.', 'wwWwwWww', 'wwwwwwww', '.WWWWWW.', '........', '........'],
  goodPen: ['......y.', '.....yY.', '....yY..', '...yY...', '..yY....', '.kY.....', 'kk......', '........'],
  brightLamp: ['...l....', '..lyl...', '...y....', '.NnnnN..', 'NnnnnnnN', '.NNNNNN.', '........', '........'],
  wideDesk: ['........', '.www.aa.', '.wWw.aa.', 'NNNNNNNN', 'nnnnnnnn', 'NNNNNNNN', 'N.N..N.N', 'N......N'],
  table: ['........', 'NNNNNNNN', 'nnnnnnnn', 'NNNNNNNN', '.N....N.', '.N....N.', '.N....N.', '........'],
  nightstand: ['........', '.NNNNNN.', '.nnnnnn.', '.NNNNNN.', '.nnkknn.', '.nnnnnn.', '.NNNNNN.', '.N....N.'],
  jar: ['...kk...', '..kbbk..', '..kBBk..', '.kbbbbk.', '.kbBbbk.', '.kbbbbk.', '..kkkk..', '........'],
  candle: ['...l....', '...y....', '..www...', '..wWw...', '..www...', '..www...', '.NNNNN..', '........'],
  bowl: ['........', '........', '..yyyy..', 'NyYyyYyN', 'NnnnnnnN', '.NnnnnN.', '..NNNN..', '........'],
  honey: ['...NN...', '..kyyk..', '.kyllyk.', '.kyyyyk.', '.klyyyk.', '.kyyyyk.', '..kkkk..', '........'],
  bird: ['........', '..nn....', '.nkn....', 'Nnnnnnn.', '.nnnnnNN', '..nnnn..', '...N.N..', '..NN.NN.'],
  goldLeaf: ['........', '.yyyyyy.', '.yYyyyy.', '.yyyyYy.', '.yyyyyy.', '.yYyyyy.', '.yyyyyy.', '........'],
  seedHerb: ['........', '..kkkk..', '.kaaaak.', '.kaEaak.', '.kaaEak.', '.kaaaak.', '..kkkk..', '........'],
  seedBean: ['........', '..kkkk..', '.kaaaak.', '.kayaak.', '.kaayak.', '.kaaaak.', '..kkkk..', '........'],
  herb: ['...E....', '..EEE...', '.EEEEE..', '..EEE.E.', '...k.EEE', '...k..E.', '...k....', '........'],
  bean: ['........', '.yy.....', 'yYyy.yy.', '.yyyyYy.', '...yyyy.', '........', '........', '........'],
  cover: ['........', '.kkkkkk.', '.kVVVVk.', '.kVyyVk.', '.kVVVVk.', '.kVVVVk.', '.kkkkkk.', '........'],
  // 가방과 신 (계획 11 작업 2): 끈 달린 가죽 가방(덮개·쇠고리), 두 겹 밑창 가죽신, 끈을 엮은 연한 가죽신
  leatherBag: ['..NNNN..', '.N....N.', 'NNNNNNNN', 'NnnnnnnN', 'NnnyynnN', 'NnnnnnnN', 'NnnnnnnN', '.NNNNNN.'],
  sturdyShoes: ['........', '........', '.NNN....', '.NnN....', '.NnnNN..', '.NnnnnNN', 'NNNNNNNN', 'kkkkkkkk'],
  lightShoes: ['........', '........', '.c..c...', '.cWcW...', '.cwwcc..', '.cwwwwcc', 'cWWWWWWc', '.NNNNNN.'],
  // 연애와 결혼 (계획 6): 분홍·흰 들꽃 다발(풀빛 줄기, 끈), 붉게 꼰 약속의 끈
  bouquet: ['..f.a...', '.faf.f..', '..f.faf.', '..E.Ef..', '...EE...', '...rr...', '...EE...', '........'],
  promiseCord: ['........', '.rN.....', '..rN....', '...rNrN.', '....NrN.', '...Nr...', '..rN....', '........'],
  // 손에 익은 연장: 엇갈린 칼과 송곳 (가죽 손잡이)
  handyKit: ['........', '.W....N.', '.WW..NN.', '..WWNN..', '..NWWN..', '.NN..WW.', '.N....W.', '........'],
  // 희귀품 (계획 13): 흰 테두리 좋은 파피루스, 붉은 봉랍, 자주색 천, 향유 병, 청동 장식
  finePapyrus: ['........', '.wwwwww.', '.wyyyyw.', '.wy..yw.', '.wyyyyw.', '.wy..yw.', '.wwwwww.', '........'],
  sealWax: ['........', '..rrrr..', '.rrrrrr.', '.rrwwrr.', '.rrwwrr.', '.rrrrrr.', '..rrrr..', '........'],
  purpleCloth: ['........', '.pppppp.', '.pPppPp.', '.pppppp.', '.pPppPp.', '.pppppp.', '..p..p..', '........'],
  perfumeOil: ['...kk...', '...yy...', '..kyyk..', '.kyllyk.', '.kyllyk.', '.kyyyyk.', '..kkkk..', '........'],
  bronzeOrnament: ['........', '...YY...', '..YyyY..', '.YyYYyY.', '.YyYYyY.', '..YyyY..', '...YY...', '........'],
  // 향초: 불꽃, 심지, 옅은 밀랍 몸통 두 개
  scentCandle: ['..l..l..', '..y..y..', '..k..k..', '.ww.ww..', '.wW.wW..', '.ww.ww..', 'NNNNNNN.', '........'],
}

// 가구 20종은 그림을 줄여 아이콘으로
for (const [id, a] of Object.entries(FURNITURE_ART)) ICONS[id] = iconFromArt(a)
