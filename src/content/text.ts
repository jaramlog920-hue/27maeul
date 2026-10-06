import { FIXTURES } from '../engine/home-layout'
import { SPOUSE_FURNITURE } from '../engine/furniture-defs'
// 게임이 지어낸 문장의 단일 입구 (exclusion-list §0). 성경 문장은 여기 두지 않는다.
import lifeText from './life-text.json'
import peopleRaw from './people.json'
import type { PeopleData } from '../engine/people'
import type { ItemId } from '../engine/types'
import { isOtBook, otRow, type CopyBook } from '../engine/ot-books'

export interface Line {
  speaker: string
  text: string
}

export interface NeighborLines {
  offer: Line[]
  idle: Line[]
  warm: Line[]
  /** 마음 7 이상 */
  close: Line[]
  wet: Line[]
  /** 아침에 들렀을 때 */
  visit: Line[]
  help: { label: string; thanks: string }
  helpSeason?: { label: string; thanks: string }
  lesson?: string
  giftLiked: string
  giftPlain: string
}

export interface Scene {
  title: string
  lines: Line[]
  album?: string
  /** 고르는 말 (정답 없음 — 고른 것이 기억과 관계의 색으로 남는다). 고르면 reply가 이어진다 (계획 6b) */
  choices?: { label: string; reply: Line[] }[]
  /** 이 장면을 볼 때의 화면을 다른 장면의 앨범 사진으로 남긴다 (앨범 칸은 그 장면 하나) */
  photoFor?: string
}

export const T = lifeText
/** 필사하는 책의 화면 이름 — 신약 27권과 구약 39권 */
export const copyBookName = (b: CopyBook): string => (isOtBook(b) ? otRow(b).name : (lifeText.quiz.books as Record<string, string>)[b])
export const NEIGHBOR_LINES = lifeText.neighbors as Record<string, NeighborLines>
export const SCENES = lifeText.scenes as Record<string, Scene>
// 살아 움직이는 사람들 (계획 6b): 이벤트는 ev:<id>, 목격은 saw:<id> 장면으로
{
  const data = peopleRaw as unknown as PeopleData
  for (const p of Object.values(data.people)) {
    for (const e of p.events ?? []) SCENES[`ev:${e.id}`] = { title: e.title, lines: e.lines, album: e.album, choices: e.choices?.map((c) => ({ label: c.label, reply: c.reply })) }
    for (const s of p.sightings ?? []) SCENES[`saw:${s.id}`] = { title: s.title, lines: s.lines }
  }
  for (const th of data.threads) for (const ph of th.phases) for (const s of ph.sightings ?? []) SCENES[`saw:${s.id}`] = { title: s.title, lines: s.lines }
}
export const ITEM_TEXT = lifeText.items as Record<ItemId, { name: string; desc: string }>
for (const [id, f] of Object.entries(FIXTURES)) ITEM_TEXT[id as ItemId] = { name: f.name, desc: '집의 어느 방으로든 옮길 수 있다.' }
ITEM_TEXT.homeCradle = { name: '아기 요람', desc: '아이방과 다른 방 사이로 자유롭게 옮길 수 있다.' }
const propNames: Record<string, string> = { signature: '취향 가구', desk: '취향 탁자', keepsake: '기념품', wall: '벽 장식', rug: '깔개', cushion: '방석', curtain: '커튼', personal: '개인 소품', sideboard: '수납장', bookcase: '책장', chair: '의자', stool: '작은 의자', lampStand: '등불' }
for (const [id, p] of Object.entries(SPOUSE_FURNITURE)) {
  const base = p.id.split('-').at(-1)!
  ITEM_TEXT[id as ItemId] = { name: `${p.owner}의 ${propNames[base] ?? ITEM_TEXT[p.id as ItemId]?.name ?? '생활 소품'}`, desc: '방 구별 없이 옮길 수 있는 배우자의 가구.' }
}
export const JOURNAL_NOTES = lifeText.journal.notes as Record<string, string>

/** 앨범에 남는 장면 id */
export const ALBUM_IDS: readonly string[] = Object.entries(SCENES)
  .filter(([, s]) => s.album)
  .map(([id]) => id)

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

/** 낱말 뒤에 받침에 맞는 목적격 조사를 붙인다 (마가복음을 / 빌레몬서를) */
export function withObject(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasFinal ? '을' : '를')
}

/** 이웃이 부르는 이름: 문장 속 {player}를 주인공이 정한 이름으로 (정하지 않았으면 '필사가') */
export function callName(text: string, name: string | undefined | null): string {
  return text.includes('{player}') ? text.replaceAll('{player}', name?.trim() || '필사가') : text
}

/** 낱말 뒤에 받침에 맞는 '이/가'를 붙인다 (웬델이 / 파피가) */
export function withSubject(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasFinal ? '이' : '가')
}

/** 낱말 뒤에 받침에 맞는 '와/과'를 붙인다 (양치기와 / 빵 굽는 이웃과) */
export function withAnd(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasFinal ? '과' : '와')
}

/**
 * 우리 아이 이름 넣기 (계획 12): {childSubj} 이/가, {childAnd} 와/과, {child} 이름만 (조사를 받침에 맞춘다).
 * 이름이 없으면 '아이'
 */
export function kidFill(text: string, name: string | undefined | null): string {
  const n = name?.trim() || '아이'
  return text.replaceAll('{childSubj}', withSubject(n)).replaceAll('{childAnd}', withAnd(n)).replaceAll('{child}', n)
}

/** 배우자 이름 넣기: {spouseSubj} 이/가, {spouseAnd} 와/과, {spouse} 이름만 (없으면 '곁의 사람') */
export function spouseFill(text: string, name: string | undefined | null): string {
  if (!text.includes('{spouse')) return text
  const n = name?.trim() || '곁의 사람'
  return text.replaceAll('{spouseSubj}', withSubject(n)).replaceAll('{spouseAnd}', withAnd(n)).replaceAll('{spouse}', n)
}

/** 연인 이름 넣기 (함께 가기 장면, 계획 10 작업 4): {partnerSubj} 이/가, {partnerAnd} 와/과, {partner} 이름만 (없으면 '곁의 사람') */
export function partnerFill(text: string, name: string | undefined | null): string {
  if (!text.includes('{partner')) return text
  const n = name?.trim() || '곁의 사람'
  return text.replaceAll('{partnerSubj}', withSubject(n)).replaceAll('{partnerAnd}', withAnd(n)).replaceAll('{partner}', n)
}

export function itemName(id: ItemId): string {
  return ITEM_TEXT[id]?.name ?? id
}

/** { water: 1, bread: 2 } → "물 1 · 빵 2" */
export function itemList(items: Partial<Record<ItemId, number>>): string {
  return (Object.entries(items) as [ItemId, number][]).map(([id, n]) => `${itemName(id)} ${n}`).join(' · ')
}

/** 서고 방의 이름 (책 범위 — 분류 이름을 쓰지 않는다): 복음서 방은 library.gospelRoom, 그 뒤 방은 잠긴 문 순서의 lockedRooms */
export function roomTitle(room: { door: number | null }): string {
  return room.door === null ? lifeText.library.gospelRoom : lifeText.library.lockedRooms[room.door]
}

/** 어른이 된 아이의 일 이름 (계획 12 뒤, 2026-09-30) */
export const JOB_NAME = (lifeText as unknown as { adultChild: { jobs: Record<string, string> } }).adultChild.jobs
export const KID_LETTERS = (lifeText as unknown as { adultChild: { letters: string[] } }).adultChild.letters
