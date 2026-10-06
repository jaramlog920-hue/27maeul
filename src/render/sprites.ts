// 코드로 그린 도트. 외모 주장이 아니라 게임 표현이다 (exclusion-list §1-2).
import type { Facing, Season } from '../engine/types'
import { hsvToHex, shadeOf, SKINS, TOPS, type FullAvatar, type Look } from '../engine/avatar'
import { avatarDetails } from './character-details'
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
  '0': '#886447', // 머리 빛
  '1': '#422e24', // 머리 끝 그늘
  '2': '#a27a53', // 신발 앞코
  '5': '#69462f', // 손 윤곽: 마을 나무 그늘보다 짙은 갈색 — 밝은 돌·바닥에서도 손이 보이게
  '!': '#aa8062', // 손 옆의 부드러운 갈색 경계. 아래 그늘(5)과 분리한다.
  // 이웃
  c: '#b8826b', C: '#805b49', a: '#eee2c8', y: '#d5b77f', // 빵 굽는 이웃
  '3': '#8e4a30', // 헤이즐 머리: 적갈색 (2026-10-07)
  W: '#b4b5ae', g: '#718b99', G: '#4b626f', // 할아버지: 배경보다 진한 은회색 머리
  H: '#977582', p: '#bba071', Q: '#877044', // 상인
  j: '#51463d', n: '#a86048', N: '#845038', L: '#583828', // 대장장이: 그을음빛 갈색
  e: '#f0d8b0', u: '#987858', U: '#80644a', O: '#4a2c20', // 양치기 (O: 짙은 곱슬머리 — 다른 이웃과 겹치지 않게)
  q: '#7f9164', i: '#bea36c', I: '#897244', // 기름 짜는 이웃
  z: '#87a8b3', Z: '#587b87', // 아이
  V: '#a18699', X: '#72596e', F: '#b58b95', // 베 짜는 이웃
  E: '#9aa87a', M: '#68784f', Y: '#d4b77d', // 벌 치는 이웃
  // 새 이웃 넷 — o·l·d·D는 주인공 옷 글자(writerPalette)라 비어 있는 글자를 쓴다
  t: '#829ba3', T: '#506974', // 편지 나르는 이웃
  A: '#bc6c54', B: '#a45a44', // 주막 주인
  J: '#7fa09c', w: '#506f6c', '7': '#7e766b', // 어부
  v: '#c8a04c', m: '#ac883c', // 목수
  // 이웃 겨울 목도리 (계획 15): 옷과 어울리게 이웃마다 하나 — 붉은 흙빛·잿빛 파랑·세이지·옅은 장밋빛
  // (크림색은 얼굴빛과 붙어 목도리로 안 보여서 쓰지 않는다)
  '4': '#b05848', '6': '#7f9cb8', '8': '#86a872', '9': '#c98a9a',
}

/** 이웃마다 겨울 목도리 색 (PALETTE의 '4'·'6'·'8'·'9') — 옷 색과 겹치지 않게 */
export const NEIGHBOR_SCARF: Partial<Record<Who, string>> = {
  baker: '6',
  grandpa: '4',
  merchant: '8',
  smith: '6',
  shepherd: '4',
  presser: '9',
  child: '4',
  weaver: '8',
  beekeeper: '4',
  postman: '4',
  apothecary: '6',
  fisher: '9',
  carpenter: '8',
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
  '...hhhh...', '..hhhhhh..', '.hhhhhhhh.', '.hhsssshh.',
  '.ssksskss.', '.s+ssss+s.', '..5ssss5..', '.RrrssrrR.',
  '.rRrrrrRr.', '.rRrbbrRr.', '!sRRrrRRs!', '.5kRrrRk5.',
  '..kRrrRk..', '..2k..k2..',
]
const BACK: SpriteRows = [
  '...hhhh...', '..hhhhhh..', '.hhhhhhhh.', '.hhhhhhhh.',
  '.hhhhhhhh.', '.hhhhhhhh.', '..5hhhh5..', '.RrrrrrrR.',
  '.rRrrrrRr.', '.rRrbbrRr.', '!sRRrrRRs!', '.5kRrrRk5.',
  '..kRrrRk..', '..2k..k2..',
]
/** 오른쪽 모습. 왼쪽은 완성된 그림을 뒤집는다. */
const SIDE: SpriteRows = [
  '...hhhh...', '..hhhhhh..', '.hhhhhhhh.', '.hhhhsssh.',
  '.hhhssks5.', '.hhsss+s5.', '..5ssss5..', '..RrrsrR..',
  '..RrrrRk..', '..RrbrRk..', '..Rrr!s!..', '..kRrr5k..',
  '..kRrrRk..', '..2k..k2..',
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
  /** 우리 아이처럼 키가 작게 (0~3, 클수록 크다) */
  short?: number
}

/** 머리 모양 (주인공·이웃 같이 쓴다): 곱슬·삐죽·가운데 가르마·짧게 깎음·옆 가르마 (대머리는 쓰지 않는다). ch는 그 사람의 머리 글자 */
export type HairShape = 'curly' | 'spiky' | 'curtain' | 'crop' | 'sidePart'
function hairShape(rows: string[], facing: Facing, kind: HairShape, ch = 'h') {
  const front = facing === 'down'
  const back = facing === 'up'
  const put = (pts: number[][], c = ch) => pts.forEach(([x, y]) => setPixel(rows, x, y, c))
  switch (kind) {
    case 'curly': // 짧은 웨이브: 옆머리를 부풀리지 않고 앞머리 끝만 부드럽게 굽힌다.
      put(front ? [[2, 3], [5, 3], [7, 3], [2, 4]] : back ? [[2, 2], [7, 2]] : [[3, 3], [4, 3], [5, 3]])
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
  avatarDetails(rows, facing, a, blink)
}

/** 머릿수건·모자를 쓴 사람: 머리 꼭대기 검은 윤곽이 천 위로 비치지 않게, 윗줄 윤곽을 천 색으로 */
function capTop(rows: string[], ch: string) {
  for (let x = 0; x < 10; x++) if (rows[0][x] === 'k') setPixel(rows, x, 0, ch)
  for (const x of [1, 2, 7, 8]) if (rows[1][x] === 'k') setPixel(rows, x, 1, ch)
}

function dressNeighbor(who: Who, rows: string[], facing: Facing): string[] {
  const front = facing === 'down'
  const back = facing === 'up'
  const panel = (out: string[], color: string, from: number, to: number, xs = [3, 4, 5, 6]) => {
    for (let y = from; y <= to; y++) for (const x of xs) if (!'.s5k'.includes(out[y][x])) setPixel(out, x, y, color)
  }
  switch (who) {
    case 'baker': {
      // 헤이즐 (2026-10-07 사용자: 머리 바꾸기): 두건 대신 적갈색 웨이브 머리를 어깨까지
      const out = recolor(rows, { h: '3', r: 'c', R: 'C', b: 'a' })
      for (let y = 8; y <= 11; y++) for (let x = 3; x <= 6; x++) if (out[y][x] === 'c') setPixel(out, x, y, 'a')
      hairShape(out, facing, 'curly', '3')
      for (let y = 3; y <= 7; y++) for (const x of [0, 9]) if (out[y]?.[x] === '.') setPixel(out, x, y, '3')
      // 앞치마의 가슴판과 주머니.
      if (!back) { panel(out, 'a', 7, 8, [4, 5]); setPixel(out, 5, 10, 'C') }
      else { setPixel(out, 4, 9, 'a'); setPixel(out, 5, 9, 'a') }
      return out
    }
    case 'grandpa': {
      const out = recolor(rows, { h: 'W', r: 'g', R: 'G', b: 'W' })
      // 흰 머리의 외곽을 회갈색으로: 밝은 돌·벽 위에서도 머리 모양이 남는다.
      out[0] = '...7777...'
      out[1] = '..7WWWW7..'
      out[2] = '.7WWWWWW7.'
      out[3] = front ? '.7WssssW7.' : back ? '.7WWWWWW7.' : '.7WWWsss7.'
      // 흰 수염
      if (out[5][3] === 's') for (const x of [3, 4, 5, 6]) setPixel(out, x, 6, 'W')
      if (front) { setPixel(out, 3, 3, 'W'); setPixel(out, 6, 3, 'W') }
      if (!back) { panel(out, 'G', 8, 11, [4]); setPixel(out, 5, 9, 'y') }
      return out
    }
    case 'merchant': {
      // 짙은 밤색 머리에 겨자색 모자 (남자 이웃에 분홍 머리는 쓰지 않는다)
      const out = recolor(rows, { h: 'L', r: 'p', R: 'Q', b: 'H' })
      for (let x = 2; x <= 7; x++) setPixel(out, x, 0, 'Q')
      capTop(out, 'Q')
      for (let x = 1; x <= 8; x++) setPixel(out, x, 1, 'p')
      if (!back) { panel(out, 'H', 7, 10, [3, 6]); setPixel(out, 5, 10, 'Q') }
      return out
    }
    case 'smith': {
      const out = recolor(rows, { h: 'j', r: 'n', R: 'N', b: 'L' })
      for (let y = 9; y <= 12; y++) for (let x = 3; x <= 6; x++) if (out[y][x] === 'n' || out[y][x] === 'N') setPixel(out, x, y, 'L')
      if (!back) { panel(out, 'L', 7, 8, [4, 5]); setPixel(out, 5, 10, 'y') }
      // 평범한 짧은 머리: 넓은 윗선과 둥근 모서리. 정수리를 뾰족하게 좁히지 않는다.
      out[0] = '..jjjjjj..'
      out[1] = '.jjjjjjjj.'
      out[2] = '.jjjjjjjj.'
      out[3] = front ? '.jjssssjj.' : back ? '.jjjjjjjj.' : '.jjjjsssj.'
      setPixel(out, 3, 1, 'u')
      setPixel(out, 4, 1, 'u')
      return out
    }
    case 'shepherd': {
      // 옆으로 넘긴 밤색 머리와 짧은 수염으로 덱스터와 구분한다.
      const out = recolor(rows, { h: 'U', r: 'u', R: 'U', b: 'e' })
      hairShape(out, facing, 'sidePart', 'U')
      for (const x of [2, 3, 4]) setPixel(out, x, 1, 'u')
      if (!back) {
        for (let y = 3; y <= 6; y++) for (let x = 1; x <= 8; x++)
          if (out[y][x] === 's') setPixel(out, x, y, 'e')
        for (const x of front ? [3, 4, 5, 6] : [4, 5, 6]) setPixel(out, x, 6, 'u')
        setPixel(out, front ? 4 : 6, 6, 'U')
      }
      if (!back) for (let y = 7; y <= 10; y++) setPixel(out, 3 + (y - 7) % 3, y, 'e')
      else panel(out, 'U', 8, 11)
      return out
    }
    case 'presser': {
      const out = recolor(rows, { r: 'i', R: 'I', b: 'q' })
      for (let x = 2; x <= 7; x++) if (out[2][x] === 'h') setPixel(out, x, 2, 'q')
      if (!back) { panel(out, 'q', 8, 11); setPixel(out, 5, 10, 'I') }
      return out
    }
    case 'child': {
      const out = recolor(rows, { r: 'z', R: 'Z', b: 'y' })
      // 옆으로 묶은 머리: 옆모습에서는 얼굴 앞이 아니라 뒤통수 쪽(0번 칸)에 (2026-10-07 버그)
      const tail = back ? 4 : front ? 9 : 0
      setPixel(out, tail, 3, 'y')
      for (const y of [4, 5, 6]) setPixel(out, tail, y, 'h')
      if (!back) setPixel(out, 5, 8, 'a')
      return out
    }
    case 'weaver': {
      // 분홍 옆 가르마 머리, 보랏빛 옷
      const out = recolor(rows, { h: 'F', r: 'V', R: 'X', b: 'F' })
      hairShape(out, facing, 'sidePart', 'F')
      for (const x of [4, 5]) setPixel(out, x, 0, 'F')
      if (!back) { panel(out, 'F', 7, 10, [3]); setPixel(out, 6, 9, 'y') }
      return out
    }
    case 'beekeeper': {
      // 챙 넓은 밀짚모자, 풀빛 옷
      const out = recolor(rows, { r: 'E', R: 'M', b: 'Y' })
      for (let x = 0; x <= 9; x++) setPixel(out, x, 1, 'Y')
      for (let x = 2; x <= 7; x++) setPixel(out, x, 0, 'Y')
      capTop(out, 'Y')
      if (!back) { panel(out, 'a', 7, 8, [3, 6]); setPixel(out, 5, 10, 'M') }
      return out
    }
    case 'postman': {
      // 푸른 겉옷, 어깨에 멘 편지 가방 끈
      const out = recolor(rows, { r: 't', R: 'T', b: 'a' })
      // 앞머리는 눈 윗줄에만. 옆모습의 눈 옆을 머리색으로 막지 않는다.
      if (front) {
        setPixel(out, 2, 3, 'h'); setPixel(out, 7, 3, 'h')
      } else if (!back) {
        setPixel(out, 5, 3, 'h')
      }
      for (let y = 7; y <= 10; y++) setPixel(out, 2 + (y - 7), y, 'L')
      if (!back) { setPixel(out, 6, 10, 'L'); setPixel(out, 6, 11, 'L'); setPixel(out, 5, 11, 'y') }
      return out
    }
    case 'apothecary': {
      const out = recolor(rows, { r: 'A', R: 'B', b: 'a' })
      if (!back) { panel(out, 'a', 8, 11); setPixel(out, 5, 10, 'q') }
      for (const x of [3, 4, 5, 6]) setPixel(out, x, 1, 'a')
      return out
    }
    case 'fisher': {
      // 청록 겉옷, 잿빛 옆 가르마 머리
      const out = recolor(rows, { h: '7', r: 'J', R: 'w', b: 'e' })
      hairShape(out, facing, 'sidePart', '7')
      for (const x of [2, 3, 4, 5, 6, 7]) setPixel(out, x, 1, 'w')
      if (front || back) for (const x of [1, 8]) setPixel(out, x, 9, 'e')
      else setPixel(out, 6, 9, 'e')
      if (!back) setPixel(out, 4, 10, 'e')
      return out
    }
    case 'carpenter': {
      // 나무색 작업복, 가죽 띠, 짧게 깎은 머리
      const out = recolor(rows, { h: 'L', r: 'v', R: 'm', b: 'L' })
      hairShape(out, facing, 'crop', 'L')
      if (!back) { panel(out, 'u', 8, 11); setPixel(out, 4, 9, 'L'); setPixel(out, 5, 10, 'Y') }
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
  const out = rows.filter((_, i) => !cut.includes(i))
  if (drop > 0) {
    // 몸통을 줄여도 손 줄을 함께 버리지 않는다. 짧아진 소매 아래로 손을 옮긴다.
    const handY = Math.min(10, out.length - 2)
    for (let x = 0; x < rows[10].length; x++)
      if ('s5!K'.includes(rows[10][x])) setPixel(out, x, handY, rows[10][x])
  }
  return out
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
  if (who === 'writer') {
    if (opts.avatar) {
      dressAvatar(rows, facing, opts.avatar, opts.blink)
    }
    // 여자 모습: 어깨까지 내려오는 머리 (얼굴 양옆의 빈 칸)
    else if (opts.look === 'f') longHair(rows)
    if (opts.inky && facing === 'down' && rows[10][1] === 's') setPixel(rows, 1, 10, 'K')
    if (opts.season === 'winter') for (let x = 2; x <= 7; x++) if (rows[7][x] === 'r') setPixel(rows, x, 7, 'S')
  } else {
    rows = dressNeighbor(who, rows, facing)
    // 겨울엔 이웃도 목도리 (목 줄의 옷 칸만 — 윤곽·피부·가방 끈은 그대로)
    const scarf = NEIGHBOR_SCARF[who]
    if (opts.season === 'winter' && scarf) for (let x = 2; x <= 7; x++) if (!'k.sL'.includes(rows[7][x])) setPixel(rows, x, 7, scarf)
  }
  // 모든 인물에 같은 손 윤곽. 머리나 장신구를 입힌 뒤 그려 손이 가려지지 않게 한다.
  if (side) setPixel(rows, 6, 11, '5')
  else {
    for (const [hand, edge] of [[1, 0], [8, 9]]) {
      if (rows[10][hand] !== 's') continue
      setPixel(rows, edge, 10, '!')
      setPixel(rows, hand, 11, '5')
    }
    if (facing === 'down' && (pose === 'wave' || pose === 'handUp')) {
      for (const [edge, hand] of pose === 'handUp' ? [[0, 1], [9, 8]] : [[9, 8]]) {
        const sleeve = rows[8][hand]
        setPixel(rows, edge, 5, '!')
        setPixel(rows, edge, 6, 's')
        setPixel(rows, hand, 6, '!')
        setPixel(rows, edge, 7, sleeve)
        for (const y of [9, 10, 11]) {
          setPixel(rows, hand, y, '.')
          setPixel(rows, edge, y, '.')
        }
      }
    }
  }
  // 물 긷는 아이, 그리고 옷장에서 모습을 입힌 우리 아이(short)는 몸통이 짧다
  if (who === 'child') rows = shorten(rows, opts.growth ?? 0)
  else if (opts.short !== undefined) rows = shorten(rows, opts.short)
  if (!side && opts.frame) rows = stepLegs(rows, opts.frame)
  if (facing === 'left') rows = mirror(rows)
  if (pose === 'crouch') rows = [...rows.slice(0, 7), ...rows.slice(9)]
  return rows
}

/** 기록자의 계절 옷 색 */
/** 16진 색을 곱해서 어둡게 */
function darkerHex(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

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
    '0': hsvToHex([avatar.hairColor[0], Math.max(0, avatar.hairColor[1] - 10), Math.min(100, avatar.hairColor[2] + 16)]),
    '1': hsvToHex(shadeOf(avatar.hairColor)),
    o: hsvToHex(avatar.eyeColor),
    r,
    R,
    l,
    b: l,
    d: hsvToHex(avatar.bottomColor),
    D: hsvToHex(shadeOf(avatar.bottomColor)),
    '3': darkerHex(R, 0.72),
    x: '#b05848',
    f: '#d888b4',
    y: '#d4b060',
    v: '#87956b',
    V: '#586b46',
    p: '#b28c60',
    P: '#77563e',
    ...(avatar.accColor ? {
      x: hsvToHex(shadeOf(avatar.accColor)),
      f: hsvToHex(avatar.accColor),
      v: hsvToHex(avatar.accColor),
      V: hsvToHex(shadeOf(avatar.accColor)),
      p: hsvToHex(avatar.accColor),
      P: hsvToHex(shadeOf(avatar.accColor)),
      y: hsvToHex([avatar.accColor[0], Math.max(0, avatar.accColor[1] - 15), Math.min(100, avatar.accColor[2] + 18)]),
    } : {}),
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
  // 꾸미기 재료 (계획 14): 크림색 종이 한 장(접힌 귀), 푸른 염료 병, 좋은 실 타래(나무 실패)
  creamPaper: ['........', '.aaaaaa.', '.aaaaaa.', '.aaaaaW.', '.aaaaWW.', '.aaaaaa.', '.cccccc.', '........'],
  blueDye: ['...kk...', '...WW...', '..kbbk..', '.kbBbbk.', '.kbbbbk.', '.kbbBbk.', '..kkkk..', '........'],
  fineThread: ['........', '.NNNNNN.', '..aaaa..', '..aWaa..', '..aaWa..', '..aaaa..', '.NNNNNN.', '........'],
  // 아이와 같이 만든 것 (계획 12): 흔들 받침 위의 작은 나무 말, 분홍 옷의 헝겊 인형
  woodToy: ['........', '.....nN.', '....nnnk', '.nnnnnN.', '.nNnnnn.', '.n.n.n..', 'NNNNNNN.', '........'],
  clothDoll: ['...NN...', '..NssN..', '..sksk..', '..ffff..', '.ffwfff.', '..ffff..', '..s..s..', '........'],
}

/**
 * 필사 화면에서 손에 쥔 펜 (계획 14 — 좋은 펜은 속도 대신 쓰는 느낌을 바꾸는 꾸미기 물건):
 * plain 갈대 펜(나무빛 줄기, 검은 촉), good 좋은 펜(금빛 줄기 — 가방 아이콘과 같은 그림). ICON_PALETTE로 그린다
 */
export const COPY_PEN: Record<'plain' | 'good', SpriteRows> = {
  plain: ['.......n', '......nN', '.....nN.', '....nN..', '...nN...', '..nN....', '.kN.....', 'kk......'],
  good: ICONS.goodPen,
}

/**
 * 필사 화면의 가족 (계획 14 작업 10): 곁에 앉은 아이(그림 그리기·책 넘겨 보기·졸다 잠들기)와 같은 방에서 책을 읽는 배우자.
 * 16×12, ICON_PALETTE로 그린다 (종이는 'K' 크림 — 'a'·'V'는 가구 색이 덮어쓴다). 아이 옷 'g'는 모습대로 바꾼다
 * (사내아이 풀빛, 여자아이는 'q' 연보랏빛 — 계획 12 그림과 같게)
 */
export const FAMILY_DESK: Record<'draw' | 'book' | 'doze' | 'spouse', SpriteRows> = {
  draw: [
    '................',
    '..NNNN..........',
    '.NNNNNN.........',
    '.NNssss.........',
    '.Nsskss.........',
    '..ssss..........',
    '..gggg..........',
    '.gggggg.........',
    '.ggggggss.......',
    '.BBBBBBBfKKKKK..',
    'BBBBBBBB.KfKbK..',
    '.........KKKKK..',
  ],
  book: [
    '................',
    '..NNNN..........',
    '.NNNNNN.........',
    '.NNssss.........',
    '.Nsskss.........',
    '..ssss.KKKK.....',
    '..ggggKKWKK.....',
    '.ggggggKKKK.....',
    '.ggggssrrrrr....',
    '.BBBBBBB........',
    'BBBBBBBB........',
    '................',
  ],
  doze: [
    '.........BBB....',
    '..........B.....',
    '.........BBB....',
    '...NNNN.........',
    '..NNNNNN........',
    '..NNssss........',
    '..Nskkss........',
    '...ssss.........',
    '.bbbbbbbb.......',
    'bbBbbBbbbb......',
    'bbbbbbbbbb......',
    'WWWWWWWWWWW.....',
  ],
  spouse: [
    '...NNNN.........',
    '..NNNNNN........',
    '..NNssss........',
    '..Nsskss........',
    '...ssss.........',
    '..cccccc........',
    '.ccccccc.KKKK...',
    '.cccccccKKWKK...',
    '.ccccccsrrrrr...',
    '.cccccc.........',
    '..N..N..........',
    '..N..N..........',
  ],
}

// 가구 20종은 그림을 줄여 아이콘으로
for (const [id, a] of Object.entries(FURNITURE_ART)) ICONS[id] = iconFromArt(a)
