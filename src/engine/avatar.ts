// 주인공: 플레이어가 고른 모습과 이름 (가상 인물, exclusion-list §1-1)
// 스타듀밸리 생성창처럼 ◀ ▶로 고르는 항목과, 색조·채도·밝기 막대로 고르는 색이 있다.
import { forbiddenIn } from '../content/forbidden'

export type Look = 'f' | 'm'
/** 색조 0~360, 채도 0~100, 밝기 0~100 */
export type Hsv = [number, number, number]

export interface Avatar {
  look: Look
  name: string
  /** 아래 항목은 옛 저장에 없을 수 있다 — 쓸 때는 withLookDefaults로 채운다 */
  skin?: number
  hairFront?: number
  hairBack?: number
  top?: number
  bottom?: number
  acc?: number
  eyeColor?: Hsv
  hairColor?: Hsv
  bottomColor?: Hsv
  /** null은 기존 액세서리별 배색을 유지한다. */
  accColor?: Hsv | null
}
export type FullAvatar = Required<Avatar>

export const SKINS = ['#f8dcc0', '#f8d0a8', '#e8b890', '#d0a078', '#b88460', '#98684a', '#785038', '#5c3c2c'] as const
// 앞머리 × 뒷머리를 따로 골라 몇 가지만으로도 여러 모양이 나온다
export const HAIR_FRONTS = ['넘긴 머리', '가벼운 앞머리', '옆 가르마', '짧게 깎음', '부스스', '물결 앞머리', '삐죽 머리', '가운데 가르마', '둥근 앞머리', '비껴 내린 앞머리', '짧은 곱슬 앞머리', '넓게 넘긴 머리'] as const
export const HAIR_BACKS = ['짧은 머리', '긴 머리', '단발', '올린 머리', '낮게 묶은 머리', '양갈래', '낮게 땋은 머리', '어깨 물결 머리', '높게 묶은 머리', '쌍둥이 쪽머리', '양쪽 땋은 머리'] as const
/** 윗옷: [이름, 바탕, 그늘, 무늬/띠, 무늬 모양] */
export const TOPS: readonly (readonly [string, string, string, string, 'plain' | 'stripe' | 'apron' | 'vest' | 'collar' | 'cross' | 'pocket'])[] = [
  ['흙빛 겉옷', '#ac8967', '#795b44', '#ead3a2', 'plain'],
  ['올리브 겉옷', '#85936a', '#57684d', '#dbc9a4', 'plain'],
  ['포도빛 겉옷', '#a27b89', '#705663', '#d8bc8c', 'plain'],
  ['바다빛 겉옷', '#75949e', '#506976', '#e1d8c0', 'plain'],
  ['베 줄무늬', '#e6d5b3', '#aa9070', '#957c61', 'stripe'],
  ['하늘 줄무늬', '#afc4c2', '#788e91', '#e5dfcc', 'stripe'],
  ['붉은 줄무늬', '#b98570', '#805b4d', '#e4c4a0', 'stripe'],
  ['앞치마 (흰)', '#96806d', '#695748', '#eee3cc', 'apron'],
  ['앞치마 (풀빛)', '#c5ab86', '#94785a', '#7e906b', 'apron'],
  ['조끼 (갈색)', '#ddc9a6', '#aa9474', '#78533e', 'vest'],
  ['조끼 (쪽빛)', '#ded9c8', '#a5a495', '#566f80', 'vest'],
  ['목동 옷', '#c4b18b', '#8f7b5b', '#e7dbc0', 'vest'],
  ['크림빛 깃옷', '#eee0bf', '#bca789', '#846d55', 'collar'],
  ['장밋빛 깃옷', '#bc8b87', '#865d60', '#eed9be', 'collar'],
  ['풀빛 여밈옷', '#8d9c77', '#5a6c50', '#daccac', 'cross'],
  ['쪽빛 여밈옷', '#728b9d', '#495f73', '#e2cda8', 'cross'],
  ['공방 주머니 옷', '#b29473', '#7d624d', '#e9d7b5', 'pocket'],
  ['자주빛 주머니 옷', '#9b7b92', '#685466', '#dfcbb4', 'pocket'],
]
export const BOTTOMS = ['긴 치마', '짧은 치마', '바지', '반바지', '주름 치마', '단이 있는 치마', '넓은 바지', '접어 올린 바지'] as const
export const ACCS = ['없음', '머리띠', '꽃 핀', '목걸이', '귀걸이', '머릿수건', '리본 핀', '나뭇잎 핀', '구슬 머리띠', '둥근 브로치', '목수건', '허리 주머니', '작은 어깨 가방', '꽃 화관'] as const

export const NAME_MAX = 8
export type NameProblem = 'empty' | 'long' | 'forbidden' | null

export function cleanAvatarName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

export function nameProblem(raw: string): NameProblem {
  const n = cleanAvatarName(raw)
  if (!n) return 'empty'
  if ([...n].length > NAME_MAX) return 'long'
  if (forbiddenIn(n)) return 'forbidden'
  return null
}

/** 모습(여자/남자)에 맞는 처음 모양. 옛 저장의 {look, name}도 여기로 채운다 */
export function withLookDefaults(a: Avatar): FullAvatar {
  return {
    skin: 1,
    hairFront: 0,
    hairBack: a.look === 'f' ? 1 : 0,
    top: 0,
    bottom: a.look === 'f' ? 0 : 2,
    acc: 0,
    eyeColor: [25, 45, 25],
    hairColor: [25, 62, 35],
    bottomColor: a.look === 'f' ? [30, 45, 42] : [30, 40, 34],
    accColor: null,
    ...a,
  }
}

/** ◀ ▶: 목록 끝에서 처음으로 돌아간다 */
export function cycle(i: number, delta: number, n: number): number {
  return (((i + delta) % n) + n) % n
}

export function randomAvatar(look: Look, name: string, rand: () => number = Math.random): FullAvatar {
  const pick = (n: number) => Math.floor(rand() * n)
  const hsv = (sMin: number, sMax: number, vMin: number, vMax: number): Hsv => [
    pick(360),
    Math.round(sMin + rand() * (sMax - sMin)),
    Math.round(vMin + rand() * (vMax - vMin)),
  ]
  return {
    look,
    name,
    skin: pick(SKINS.length),
    hairFront: pick(HAIR_FRONTS.length),
    hairBack: pick(HAIR_BACKS.length),
    top: pick(TOPS.length),
    bottom: pick(BOTTOMS.length),
    acc: pick(ACCS.length),
    eyeColor: hsv(30, 80, 20, 60),
    hairColor: hsv(20, 70, 15, 85),
    bottomColor: hsv(20, 60, 25, 70),
    accColor: hsv(20, 70, 35, 85),
  }
}

export function hsvToHex([h, s, v]: Hsv): string {
  const S = s / 100
  const V = v / 100
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return V - V * S * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

/** 같은 색의 그늘 (밝기를 낮춘다) */
export function shadeOf([h, s, v]: Hsv): Hsv {
  return [h, Math.min(100, s + 5), Math.max(0, v - 18)]
}

/** 스프라이트 캐시에 쓰는 짧은 열쇠 */
export function avatarKey(a: FullAvatar): string {
  return [a.skin, a.hairFront, a.hairBack, a.top, a.bottom, a.acc, ...a.eyeColor, ...a.hairColor, ...a.bottomColor, ...(a.accColor ?? ['original'])].join(',')
}
