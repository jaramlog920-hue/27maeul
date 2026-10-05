// 반려동물 반응 글 (계획 16 작업 21) — 행동만 적는다: 자세·이동·작은 소리. 속마음·감정은 단정하지 않는다.
import { neighborById } from './catalog'
import { fill, T, withSubject } from './text'
import { petHabit, type Companion, type PetHabit } from '../engine/companion'
import { weatherOf } from '../engine/calendar'
import type { PetEvent } from '../engine/pet-life'

type ByKind = string | { cat: string; dog: string }
const byKind = (v: ByKind, kind: 'cat' | 'dog') => (typeof v === 'string' ? v : v[kind])

/** 동물 쪽 반응 한 줄 (이웃·장소·아이 이름을 채운다) */
export function petEventText(e: PetEvent, c: Pick<Companion, 'name' | 'kind'>): string {
  const ev = T.pet.events as unknown as Record<string, ByKind | Record<string, { first: string; again: string }>>
  const vars = {
    pet: withSubject(c.name),
    place: e.place ? (T.pet.places as Record<string, string>)[e.place] ?? '' : '',
    who: e.npc ? withSubject(neighborById(e.npc)?.role ?? '') : '',
  }
  if (e.npc && (e.key === 'neighborFirst' || e.key === 'neighborAgain')) {
    const n = (ev.neighbors as Record<string, { first: string; again: string }>)[e.npc]
    return n ? fill(e.key === 'neighborFirst' ? n.first : n.again, vars) : ''
  }
  const v = ev[e.key] as ByKind | undefined
  return v ? fill(byKind(v, c.kind), vars) : ''
}

/** 지금 습관 한 줄 (집에 둔 동물을 볼 때) */
export function petHabitText(c: Pick<Companion, 'kind'>, habit: PetHabit): string {
  const h = (T.pet.habits as Record<string, { cat: string; dog: string }>)[habit.key]
  return h ? h[c.kind] : ''
}

export function petHabitNow(c: Companion, day: number, minute: number): PetHabit {
  return petHabit(c, day, minute, weatherOf(day))
}
