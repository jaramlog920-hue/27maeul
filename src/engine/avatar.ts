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
  hair?: number
  top?: number
  bottom?: number
  acc?: number
  eyeColor?: Hsv
  hairColor?: Hsv
  bottomColor?: Hsv
}
export type FullAvatar = Required<Avatar>

export const SKINS = ['#f6d7c3', '#eab996', '#e0a57e', '#c98b62', '#b07550', '#8d5a3b', '#6e4430', '#553425'] as const
export const HAIRS = ['짧은 머리', '긴 머리', '올린 머리', '묶은 머리', '곱슬머리', '앞머리'] as const
/** 윗옷: [이름, 바탕, 그늘, 무늬/띠, 무늬 모양] */
export const TOPS: readonly (readonly [string, string, string, string, 'plain' | 'stripe' | 'apron' | 'vest'])[] = [
  ['흙빛 겉옷', '#8a6a4a', '#6d5238', '#c9a15a', 'plain'],
  ['올리브 겉옷', '#6f7a3f', '#55602f', '#d8c98a', 'plain'],
  ['포도빛 겉옷', '#7a4a6b', '#5c3651', '#e0c878', 'plain'],
  ['바다빛 겉옷', '#4f7896', '#3c5d75', '#e8e4dc', 'plain'],
  ['베 줄무늬', '#d8cfae', '#b3a987', '#8a6a4a', 'stripe'],
  ['하늘 줄무늬', '#9cc0d8', '#7b9fb8', '#f1e6cf', 'stripe'],
  ['붉은 줄무늬', '#b4533f', '#8e3f30', '#f1e6cf', 'stripe'],
  ['앞치마 (흰)', '#8a6a4a', '#6d5238', '#f1e6cf', 'apron'],
  ['앞치마 (풀빛)', '#bfa27a', '#9c825e', '#6f8f3f', 'apron'],
  ['조끼 (갈색)', '#e8d9a8', '#c9b98a', '#6e4329', 'vest'],
  ['조끼 (쪽빛)', '#e8e4dc', '#c8c2b6', '#3f4f7a', 'vest'],
  ['목동 옷', '#d8cfae', '#b3a987', '#7c6a4f', 'vest'],
]
export const BOTTOMS = ['긴 치마', '짧은 치마', '바지', '반바지'] as const
export const ACCS = ['없음', '머리띠', '꽃 핀', '목걸이', '귀걸이', '머릿수건'] as const

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
    hair: a.look === 'f' ? 1 : 0,
    top: 0,
    bottom: a.look === 'f' ? 0 : 2,
    acc: 0,
    eyeColor: [25, 45, 25],
    hairColor: [25, 62, 35],
    bottomColor: a.look === 'f' ? [30, 45, 42] : [30, 40, 34],
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
    hair: pick(HAIRS.length),
    top: pick(TOPS.length),
    bottom: pick(BOTTOMS.length),
    acc: pick(ACCS.length),
    eyeColor: hsv(30, 80, 20, 60),
    hairColor: hsv(20, 70, 15, 85),
    bottomColor: hsv(20, 60, 25, 70),
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
  return [a.skin, a.hair, a.top, a.bottom, a.acc, ...a.eyeColor, ...a.hairColor, ...a.bottomColor].join(',')
}
