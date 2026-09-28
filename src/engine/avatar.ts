// 주인공: 플레이어가 고른 모습과 이름 (가상 인물, exclusion-list §1-1)
import { forbiddenIn } from '../content/forbidden'

export type Look = 'f' | 'm'
export interface Avatar {
  look: Look
  name: string
}

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
