import {INVITE_DOORS} from '../engine/bonds'
import {FACILITY_IDS} from '../engine/village-sites'
import {LIVING_KINDS,PROGRESS_KINDS} from '../engine/scenic-kinds'
import { FAMILY_KINDS } from '../engine/scenic-kinds'
import { FIXTURES } from '../engine/home-layout'
import { SPOUSE_FURNITURE } from '../engine/furniture-defs'
// 게임이 지어낸 문장의 단일 입구 (exclusion-list §0). 성경 문장은 여기 두지 않는다.
import lifeText from './life-text.json'
import {WEDDING_ATTIRE} from '../engine/wedding-attire'
import scenicMoments from './scenic-moments.json'
import heartBalanceText from './heart-balance-text.json'
import { CANDIDATE_IDS } from '../engine/romance'
import { PEOPLE_DATA, PEOPLE_MORE } from './people-all'
import { ADDITION_FURNITURE, type AdditionUse } from '../engine/furniture-additions'
/** 생활 가구 설명: 놓고 눌러서 하는 일 */
const ADDITION_DESC: Record<AdditionUse, string> = { copyFurniture: '가구의 쓰임에 맞춰 사용한다.', rock: '앉아서 천천히 흔들며 쉰다.', sew: '바늘과 실로 천을 깁는다.', knead: '반죽을 누르고 접는다.', washFace: '물을 떠서 얼굴을 씻는다.', harp: '현을 번갈아 뜯는다.', paint: '붓으로 꽃을 그린다.', washDishes: '그릇을 문지르고 헹군다.', mill: '손잡이를 돌려 곡식을 간다.', waterPlant: '화분에 물을 주고 잎을 살핀다.', tuckDoll: '인형을 눕히고 이불을 덮는다.', pushCart: '방 안에서 밀며 논다.', open: '문을 열고 닫으며 살림을 정리한다.', sit: '앉아서 쉰다.', drink: '찻잔을 놓고 차를 마신다.', read: '종이를 펼쳐 놓고 살펴본다.', reach: '방에 놓아 두는 살림.' }
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
  /** 같은 모습의 연애 후보가 대신 하는 가까운 사이 말 (people-more.json) */
  closeFriend?: Line[]
  wet: Line[]
  /** 아침에 들렀을 때 */
  visit: Line[]
  help: { label: string; thanks: string }
  helpSeason?: { label: string; thanks: string }
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
for (const id of ['rainCopy', 'babySleep', 'marketEvening', 'lastManuscript', 'bibleLastLetter', 'completeBible', ...FAMILY_KINDS] as const) {
  const m = scenicMoments[id]
  SCENES[id] = { title: m.title, lines: [{ speaker: 'narration', text: m.caption }], album: id === 'rainbowRest' ? undefined : m.album }
}
for(const id of PROGRESS_KINDS) if(id!=='childLeaves'&&id!=='childStays') {
  const m=scenicMoments[id]
  SCENES[id]={title:m.title,lines:[{speaker:'narration',text:m.caption}],album:m.album}
}
for(const id of Object.keys(lifeText.neighbors))SCENES[`workSuccession:${id}`]=SCENES.workSuccession
for(const id of LIVING_KINDS){const m=scenicMoments[id];SCENES[id]={title:m.title,lines:[{speaker:'narration',text:m.caption}],album:m.album}}
for(const id of Object.keys(INVITE_DOORS))SCENES[`firstDinner:${id}`]=SCENES.firstDinner
for(const id of FACILITY_IDS)SCENES[`facilityFinished:${id}`]=SCENES.facilityFinished
export const HEART_HINTS = heartBalanceText.hints
for (const [i,speaker,text] of [
  [0,'grandpa','서고에서 한 장을 읽고 돌아왔네. 네가 오래 써 온 책이 내 조용한 오후를 채워 주었어. 내일도 조금 더 읽어 보려네.'],
  [1,'child','책을 펼쳤는데 혼자 읽기 아까웠어요. 옆자리에 앉은 이웃하고 함께 읽었어요. 다음 이야기도 여기서 읽을래요.'],
  [2,'baker','일을 마치고 서고에 들렀어요. 읽던 곳에 책갈피를 끼워 두었지요. {player}님이 채운 책장 덕분에 돌아올 자리가 하나 더 생겼어요.'],
] as const) SCENES[`bibleReadingLetter:${i}`]={title:'서고에서 온 독서 편지',lines:[{speaker,text}],album:'서고에서 온 독서 편지'}

for (const id of CANDIDATE_IDS) SCENES[`loverTrust:${id}`] = {
  title: heartBalanceText.loverStory.title,
  lines: heartBalanceText.loverStory.lines.map((line, i) => ({ ...line, speaker: line.speaker === 'partner' ? id : line.speaker,
    text: id === 'merchant' && line.speaker === 'partner' ? heartBalanceText.loverStory.merchantLines[i - 1] : line.text })),
}
// 같은 모습의 연애 후보가 대신 하는 장면·가까운 사이 말 (people-more.json)
Object.assign(SCENES, PEOPLE_MORE.scenes)
for (const [id, lines] of Object.entries(PEOPLE_MORE.closeFriend)) if (NEIGHBOR_LINES[id]) NEIGHBOR_LINES[id].closeFriend = lines
// 살아 움직이는 사람들 (계획 6b): 이벤트는 ev:<id>, 목격은 saw:<id> 장면으로
{
  const data = PEOPLE_DATA
  for (const p of Object.values(data.people)) {
    for (const e of p.events ?? []) SCENES[`ev:${e.id}`] = { title: e.title, lines: e.lines, album: e.album, choices: e.choices?.map((c) => ({ label: c.label, reply: c.reply })) }
    for (const s of p.sightings ?? []) SCENES[`saw:${s.id}`] = { title: s.title, lines: s.lines }
  }
  for (const th of data.threads) for (const ph of th.phases) for (const s of ph.sightings ?? []) SCENES[`saw:${s.id}`] = { title: s.title, lines: s.lines }
}
export const ITEM_TEXT = lifeText.items as Record<ItemId, { name: string; desc: string }>
for(const a of WEDDING_ATTIRE)ITEM_TEXT[a.item]={name:a.name,desc:'장날에 산 결혼 예복. 약혼자에게 선물하면 결혼식에 입고 온다. 내 가방에 있으면 결혼식에서 골라 입을 수 있다.'}
for (const [id, f] of Object.entries(FIXTURES)) ITEM_TEXT[id as ItemId] = { name: f.name, desc: '집의 어느 방으로든 옮길 수 있다.' }
// 생활 가구 48종 (2026-10-12): 장날 생활 가구 줄 이름도 같이
for (const [id, a] of Object.entries(ADDITION_FURNITURE)) {
  ITEM_TEXT[id as ItemId] = { name: a.name, desc: a.desc ?? ADDITION_DESC[a.use] }
  ;(lifeText.trades as Record<string, string>)[`add:${id}`] = a.name
}
ITEM_TEXT.homeCradle = { name: '아기 요람', desc: '아이방과 다른 방 사이로 자유롭게 옮길 수 있다.' }
ITEM_TEXT.coupleBed = {name:'부부 침대',desc:'베개 두 개와 넓은 이불이 있는 두 사람용 침대. 2×2칸을 차지한다.'}
const propNames: Record<string, string> = { signature: '취향 가구', desk: '취향 탁자', keepsake: '기념품', wall: '벽 장식', rug: '깔개', cushion: '방석', curtain: '커튼', personal: '개인 소품', sideboard: '수납장', bookcase: '책장', chair: '의자', stool: '작은 의자', lampStand: '등불' }
for (const [id, p] of Object.entries(SPOUSE_FURNITURE)) {
  const base = p.id.split('-').at(-1)!
  ITEM_TEXT[id as ItemId] = { name: `${p.owner}의 ${propNames[base] ?? ITEM_TEXT[p.id as ItemId]?.name ?? '생활 소품'}`, desc: '방 구별 없이 옮길 수 있는 배우자의 가구.' }
}
export const JOURNAL_NOTES = lifeText.journal.notes as Record<string, string>
for (const id of FAMILY_KINDS) JOURNAL_NOTES[id] = scenicMoments[id].caption
for (let i=0;i<3;i++) JOURNAL_NOTES[`bibleReadingLetter:${i}`] = '서고에서 책을 읽은 이웃이 짧은 편지를 보내왔다.'
for(const id of PROGRESS_KINDS)JOURNAL_NOTES[id]=scenicMoments[id].caption
for(const id of Object.keys(lifeText.neighbors))JOURNAL_NOTES[`workSuccession:${id}`]=scenicMoments.workSuccession.caption
for(const id of LIVING_KINDS)JOURNAL_NOTES[id]=scenicMoments[id].caption
for(const id of Object.keys(INVITE_DOORS))JOURNAL_NOTES[`firstDinner:${id}`]=scenicMoments.firstDinner.caption
for(const id of FACILITY_IDS)JOURNAL_NOTES[`facilityFinished:${id}`]=scenicMoments.facilityFinished.caption
JOURNAL_NOTES.bibleLastLetter = scenicMoments.bibleLastLetter.caption
JOURNAL_NOTES.completeBible = scenicMoments.completeBible.caption
JOURNAL_NOTES.lastManuscript = scenicMoments.lastManuscript.caption
JOURNAL_NOTES.rainCopy = scenicMoments.rainCopy.caption
JOURNAL_NOTES.babySleep = scenicMoments.babySleep.caption
JOURNAL_NOTES.marketEvening = scenicMoments.marketEvening.caption
for (const id of CANDIDATE_IDS) JOURNAL_NOTES[`loverTrust:${id}`] = heartBalanceText.loverStory.journal

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

/** 낱말 뒤에 받침에 맞는 '이/가'를 붙인다 (파피가 / 웬델이) */
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
