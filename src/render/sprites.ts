// 코드로 그린 도트. 외모 주장이 아니라 게임 표현이다 (exclusion-list §1-2).
import type { Facing, Season } from '../engine/types'
import type { Look } from '../engine/avatar'

export type { Look }

export const SPRITE_W = 10
export const SPRITE_H = 14

export const PALETTE: Record<string, string> = {
  k: '#3b2a20', // 윤곽
  s: '#eab996', // 피부
  h: '#5a3a22', // 머리
  r: '#8a6a4a', // 겉옷
  R: '#6d5238', // 겉옷 그늘
  b: '#c9a15a', // 띠
  P: '#e8d9a8', // 귀에 꽂은 펜
  K: '#2b2238', // 잉크 묻은 손
  S: '#a34a40', // 겨울 목도리
  // 이웃
  c: '#b4533f', C: '#8e3f30', a: '#f1e6cf', y: '#e0c878', // 빵 굽는 이웃
  W: '#e8e4dc', g: '#6b7a8f', G: '#55627a', // 할아버지
  H: '#7a3b6b', p: '#c28b2c', Q: '#9c6c1f', // 상인
  j: '#2a2020', n: '#8f5a3a', N: '#6e4329', L: '#4a3a30', // 대장장이
  e: '#d8cfae', u: '#7c6a4f', U: '#5f503a', // 양치기
  q: '#4f7a4a', i: '#a89a6a', I: '#877a4f', // 기름 짜는 이웃
  z: '#5f8fb4', Z: '#4a7396', // 아이
  V: '#7a5a9a', X: '#5f4579', F: '#e8a0b0', // 베 짜는 이웃
  E: '#6f8f3f', M: '#57722f', Y: '#e6c35a', // 벌 치는 이웃
}

/** 계절 옷 (겉옷, 그늘) */
const SEASON_ROBE: Record<Season, [string, string]> = {
  spring: ['#8a6a4a', '#6d5238'],
  summer: ['#bfa27a', '#9c825e'],
  autumn: ['#7a5238', '#5e3e2a'],
  winter: ['#5b4a44', '#453733'],
}

export type SpriteRows = readonly string[]

const FRONT: SpriteRows = [
  '...kkkk...',
  '..khhhhk..',
  '.khhhhhhk.',
  '.khsssshk.',
  '.kskssksk.',
  '.kssssssk.',
  '..kssssk..',
  '.krrrrrrk.',
  'krrrrrrrrk',
  'ksrrbbrrsk',
  '.krrrrrrk.',
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
  'krrrrrrrrk',
  'ksrrbbrrsk',
  '.krrrrrrk.',
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
  '.khsssssk.',
  '..kssssk..',
  '.krrrrrrk.',
  '.krrrrrrk.',
  '.krrbbrsk.',
  '.krrrrrrk.',
  '.kRrrrrRk.',
  '.kRrrrrRk.',
  '..kk..kk..',
]

const WALK_FEET = '...kkkk...'

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

export type Who = 'writer' | 'baker' | 'child' | 'grandpa' | 'merchant' | 'smith' | 'shepherd' | 'presser' | 'weaver' | 'beekeeper'
export type Pose = 'stand' | 'handUp' | 'wave' | 'crouch'

export interface SpriteOpts {
  frame: 0 | 1
  blink: boolean
  pose?: Pose
  season?: Season
  /** 기록자: 잉크 묻은 손 */
  inky?: boolean
  /** 아이: 자란 정도 0~3 */
  growth?: number
  /** 주인공 모습 */
  look?: Look
}

function dressNeighbor(who: Who, rows: string[]): string[] {
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
      const out = recolor(rows, { h: 'H', r: 'p', R: 'Q', b: 'H' })
      for (let x = 2; x <= 7; x++) setPixel(out, x, 0, 'H')
      return out
    }
    case 'smith': {
      const out = recolor(rows, { h: 'j', r: 'n', R: 'N', b: 'L' })
      for (let y = 9; y <= 12; y++) for (let x = 3; x <= 6; x++) if (out[y][x] === 'n' || out[y][x] === 'N') setPixel(out, x, y, 'L')
      return out
    }
    case 'shepherd':
      return recolor(rows, { h: 'e', r: 'u', R: 'U', b: 'e' })
    case 'presser': {
      const out = recolor(rows, { r: 'i', R: 'I', b: 'q' })
      for (let x = 2; x <= 7; x++) if (out[2][x] === 'h') setPixel(out, x, 2, 'q')
      return out
    }
    case 'child':
      return recolor(rows, { r: 'z', R: 'Z', b: 'y' })
    case 'weaver':
      // 분홍 머릿수건, 보랏빛 옷
      return recolor(rows, { h: 'F', r: 'V', R: 'X', b: 'F' })
    case 'beekeeper': {
      // 챙 넓은 밀짚모자, 풀빛 옷
      const out = recolor(rows, { r: 'E', R: 'M', b: 'Y' })
      for (let x = 0; x <= 9; x++) setPixel(out, x, 1, 'Y')
      for (let x = 2; x <= 7; x++) setPixel(out, x, 0, 'Y')
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
  if (opts.frame === 1) rows[13] = WALK_FEET
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
    setPixel(rows, 0, 9, '.')
    setPixel(rows, 9, 9, '.')
    setPixel(rows, 1, 9, 'k')
    setPixel(rows, 8, 9, 'k')
    setPixel(rows, 0, 6, 's')
    setPixel(rows, 9, 6, 's')
    setPixel(rows, 0, 7, 'k')
    setPixel(rows, 9, 7, 'k')
  }
  if (pose === 'wave' && facing === 'down') {
    setPixel(rows, 9, 9, '.')
    setPixel(rows, 8, 9, 'k')
    setPixel(rows, 9, 6, 's')
    setPixel(rows, 9, 7, 'k')
  }
  if (who === 'writer') {
    // 여자 모습: 어깨까지 내려오는 머리 (얼굴 양옆의 빈 칸)
    if (opts.look === 'f') for (let y = 3; y <= 8; y++) for (const x of [0, 9]) if (rows[y]?.[x] === '.') setPixel(rows, x, y, 'h')
    // 귀에 꽂은 펜: 앞모습은 오른쪽 귀, 옆모습은 뒤통수 쪽 (왼쪽은 아래에서 통째로 뒤집힌다)
    if (facing !== 'up') setPixel(rows, facing === 'down' ? 8 : 2, 2, 'P')
    if (opts.inky && facing === 'down' && rows[9][1] === 's') setPixel(rows, 1, 9, 'K')
    if (opts.season === 'winter') for (let x = 2; x <= 7; x++) if (rows[7][x] === 'r') setPixel(rows, x, 7, 'S')
  } else {
    rows = dressNeighbor(who, rows)
  }
  if (who === 'child') rows = shorten(rows, opts.growth ?? 0)
  if (facing === 'left') rows = mirror(rows)
  if (pose === 'crouch') rows = [...rows.slice(0, 7), ...rows.slice(9)]
  return rows
}

/** 기록자의 계절 옷 색 */
export function writerPalette(season: Season): Record<string, string> {
  const [r, R] = SEASON_ROBE[season]
  return { ...PALETTE, r, R }
}

// ── 동물과 작은 것들 (자기 팔레트) ──

export const ANIMAL_PALETTE: Record<'cat' | 'dog', Record<string, string>> = {
  cat: { a: '#d9914a', A: '#b8733a', e: '#2a2020', n: '#e9a0a0', w: '#f6efe2' },
  dog: { a: '#b07a45', A: '#8a5a30', e: '#2a2020', n: '#3a2a20', w: '#f1e3c8' },
}

/** 오른쪽을 본다 */
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

export const SMALL_PALETTE: Record<string, string> = {
  w: '#f6f1e6', W: '#d9d1c0', k: '#3b2a20', s: '#eab996', a: '#f1e6cf', y: '#e0c878', z: '#5f8fb4',
  o: '#f28c5a', O: '#f5d46a', b: '#8fb8e0', B: '#6a95c4',
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
  k: '#3b2a20', b: '#6fb0e0', B: '#3f7fb4', g: '#7aa84f', G: '#4f7a33', y: '#e3c46a', Y: '#b8953c',
  w: '#f4ecd8', W: '#d9ccb0', p: '#7a4a8f', P: '#56306a', r: '#b4533f', o: '#6b8f3a', O: '#3f5a22',
  d: '#2a2230', l: '#f5c542', n: '#a4703f', N: '#7a5230', s: '#eab996', f: '#e27a9a', c: '#c9b28a',
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
  table: ['........', 'NNNNNNNN', 'nnnnnnnn', 'NNNNNNNN', '.N....N.', '.N....N.', '.N....N.', '........'],
  nightstand: ['........', '.NNNNNN.', '.nnnnnn.', '.NNNNNN.', '.nnkknn.', '.nnnnnn.', '.NNNNNN.', '.N....N.'],
  jar: ['...kk...', '..kbbk..', '..kBBk..', '.kbbbbk.', '.kbBbbk.', '.kbbbbk.', '..kkkk..', '........'],
  candle: ['...l....', '...y....', '..www...', '..wWw...', '..www...', '..www...', '.NNNNN..', '........'],
  bowl: ['........', '........', '..yyyy..', 'NyYyyYyN', 'NnnnnnnN', '.NnnnnN.', '..NNNN..', '........'],
  honey: ['...NN...', '..kyyk..', '.kyllyk.', '.kyyyyk.', '.klyyyk.', '.kyyyyk.', '..kkkk..', '........'],
  bird: ['........', '..nn....', '.nkn....', 'Nnnnnnn.', '.nnnnnNN', '..nnnn..', '...N.N..', '..NN.NN.'],
  goldLeaf: ['........', '.yyyyyy.', '.yYyyyy.', '.yyyyYy.', '.yyyyyy.', '.yYyyyy.', '.yyyyyy.', '........'],
}
