// 계획 16 작업 12b: 추가 연애 후보 셋 (기획 24) — 떠돌이 상인·기름 짜는 이웃·편지 나르는 이웃
import { CONTENT, PEOPLE } from '../content/catalog'
import { SCENES } from '../content/text'
import designs from '../content/spouse-rooms.json'
import lifeText from '../content/life-text.json'
import {
  chooseInEvent,
  eventNow,
  isSuitor,
  newGame,
  openEvent,
  partnerFree,
  settle,
  spouseGift,
  type GameState,
} from './game'
import { NO_LIFE, setPeopleData, type SceneLine } from './people'
import { CANDIDATE_IDS, NO_ROMANCE, PARTNER_WORK, sanitizeRomance, type Romance } from './romance'
import { isWet, weatherOf, isMarketDay } from './calendar'
import { deserialize, serialize } from './save'
import type { Tile } from './types'

beforeEach(() => setPeopleData(PEOPLE))

const THREE = ['merchant', 'presser', 'postman'] as const
const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id)!
const days = (from: number) => Array.from({ length: 400 }, (_, i) => from + i)
const dry = (from: number, ok: (d: number) => boolean = () => true) => days(from).find((d) => !isWet(weatherOf(d)) && ok(d))!
const stand = (s: GameState, npc: string, t: Tile): GameState => ({ ...s, npcs: { ...s.npcs, [npc]: { ...s.npcs[npc], x: t.x, y: t.y, visible: true, path: [] } } })
const step = (s: GameState, npc: string, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, npc, t)
function ready(hearts: Record<string, number>, seen: string[], flags: Record<string, number> = {}, romance: Romance = NO_ROMANCE, look?: 'f' | 'm'): GameState {
  const s = settle(newGame(CONTENT, look ? { look, name: '하늘' } as never : undefined), CONTENT)
  return { ...s, hearts, flags: { ...s.flags, 'movedIn:carpenter': 1, ...flags }, life: { ...NO_LIFE, seen }, romance, clock: { ...s.clock, day: 40, minute: 600 } }
}
const allEvents = (id: string) => (PEOPLE.people[id].events ?? []).map((e) => e.id)
const dating = (partner: string): Romance => ({ ...NO_ROMANCE, partner, stage: 'dating', since: 1 })
const engaged = (partner: string): Romance => ({ ...NO_ROMANCE, partner, stage: 'engaged', since: 1, weddingDay: 999 })
const married = (partner: string): Romance => ({ ...NO_ROMANCE, partner, stage: 'married', since: 1, marriedDay: 2 })
const CHAIR = { x: 45, y: 17 }, PRESS = { x: 46, y: 21 }, STALL = { x: 21, y: 14 }, TEA = { x: 45, y: 62 }, STEPS = { x: 27, y: 14 }

describe('후보 목록과 모습', () => {
  it('후보는 기존 열 명 + 세 명, neighbors.json romanceable과 같고 지금 그림 그대로 남자 모습 — 기혼·자녀가 있는 주민은 후보가 아니다', () => {
    expect(CANDIDATE_IDS).toHaveLength(13)
    expect(CONTENT.neighbors.filter((n) => n.romanceable).map((n) => n.id).sort()).toEqual([...CANDIDATE_IDS].sort())
    for (const id of THREE) {
      expect(def(id).look, id).toBe('m')
      expect(def(id).gender, id).toBe('m')
      expect(def(id).avatar, id).toBeUndefined() // 고정 커플 그림을 새로 만들지 않고 지금 모습 그대로
      expect(designs.some((d) => d.id === id), id).toBe(true)
      expect(PARTNER_WORK[id]).toBeDefined()
    }
    for (const id of ['baker', 'smith', 'shepherd', 'weaver', 'beekeeper', 'apothecary', 'fisher', 'carpenter', 'grandpa', 'child']) expect(def(id).romanceable, id).toBeFalsy()
  })
  it('주인공과 다른 모습일 때만 연애할 수 있다 (모습 고르기 규칙은 그대로)', () => {
    for (const id of THREE) {
      expect(isSuitor({ avatar: null }, def(id)), id).toBe(true)
      expect(isSuitor({ avatar: { look: 'm' } as never }, def(id)), id).toBe(false)
    }
  })
  it('마음 4·6 옛이야기·들꽃 다발·약속의 끈·결혼 잔치 장면이 있다', () => {
    for (const id of THREE) for (const k of ['romance1', 'romance2', 'confess', 'propose', 'wedding']) expect(SCENES[`${k}:${id}`], `${k}:${id}`).toBeDefined()
  })
  it('옛 저장: 기존 후보·새 후보의 연애와 마음은 그대로 불러온다', () => {
    expect(sanitizeRomance(dating('postman'))).toMatchObject({ partner: 'postman', stage: 'dating' })
    expect(sanitizeRomance(married('wendell'))).toMatchObject({ partner: 'wendell', stage: 'married' })
    const s = { ...ready({ merchant: 44, poppy: 70 }, []), romance: married('poppy') }
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.romance).toMatchObject({ partner: 'poppy', stage: 'married' })
    expect(back.hearts).toMatchObject({ merchant: 44, poppy: 70 })
  })
})

describe('기름 짜는 이웃 — 오래 앉아도 되는 자리', () => {
  const old = allEvents('presser').filter((id) => !id.startsWith('romance:') && !id.includes(':short:spouseHabit'))
  it('개인 이야기(손님 의자) 뒤 친밀 장면 둘 → 마음이 가는 사이에서 고백, "친구로"를 고르면 연인이 되지 않고 서먹함도 없다', () => {
    const day = dry(70)
    // 손님 의자 이야기 전에는 열리지 않는다
    expect(eventNow(step(ready({ presser: 40 }, old), 'presser', day, 1100, CHAIR), 'presser')?.id).not.toBe('romance:presser:extraMinutes')
    let s = step(ready({ presser: 40 }, old, { 'story:presserBench': 1 }), 'presser', day, 1100, CHAIR)
    expect(eventNow(s, 'presser')?.id).toBe('romance:presser:extraMinutes')
    s = chooseInEvent(openEvent(s, 'presser')!, 'romance:presser:extraMinutes', 0)
    expect(eventNow(step(s, 'presser', dry(day + 1), 1100, CHAIR), 'presser')?.id).not.toBe('romance:presser:untimedTea') // 사흘 뒤부터
    s = chooseInEvent(openEvent(step({ ...s, hearts: { presser: 60 } }, 'presser', dry(day + 3), 1100, CHAIR), 'presser')!, 'romance:presser:untimedTea', 1)
    const confessDay = dry(s.clock.day + 3)
    s = step({ ...s, hearts: { presser: 80 } }, 'presser', confessDay, 1100, CHAIR)
    expect(eventNow(s, 'presser')?.id).toBe('romance:presser:confess')
    const friends = chooseInEvent(openEvent(s, 'presser')!, 'romance:presser:confess', 2)
    expect(friends.romance?.partner ?? null).toBeNull()
    expect(friends.life.cool.presser).toBeUndefined()
    expect(friends.hearts.presser).toBeGreaterThanOrEqual(80)
    // 다시 묻지 않는다 (들꽃 다발은 플레이어가 원할 때)
    expect(eventNow(step(friends, 'presser', dry(confessDay + 1), 1100, CHAIR), 'presser')?.id).not.toBe('romance:presser:confess')
    const yes = chooseInEvent(openEvent(s, 'presser')!, 'romance:presser:confess', 0)
    expect(yes.romance).toMatchObject({ partner: 'presser', stage: 'dating' })
  })
  it('같은 모습의 주인공에게는 고백 장면이 없고, 친밀 장면은 친구로 본다', () => {
    const s = step(ready({ presser: 80 }, [...old, 'romance:presser:extraMinutes', 'romance:presser:untimedTea'], { 'story:presserBench': 1 }, NO_ROMANCE, 'm'), 'presser', dry(80), 1100, CHAIR)
    expect(eventNow(s, 'presser')?.id).not.toBe('romance:presser:confess')
    const f = step(ready({ presser: 40 }, old, { 'story:presserBench': 1 }, NO_ROMANCE, 'm'), 'presser', dry(80), 1100, CHAIR)
    expect(eventNow(f, 'presser')?.id).toBe('romance:presser:extraMinutes')
  })
  it('연인 장면은 연인일 때, 집 정하기는 약혼 중에만, 결혼 뒤엔 빈칸 습관과 일과 그대로 — 매일 선물(무료 재료)은 없다', () => {
    const seen = [...old, 'romance:presser:extraMinutes', 'romance:presser:untimedTea', 'romance:presser:confess']
    const day = dry(80, (d) => !isMarketDay(d))
    expect(eventNow(step(ready({ presser: 90 }, seen), 'presser', day, 1000, PRESS), 'presser')?.id).not.toBe('romance:presser:invitation')
    expect(eventNow(step(ready({ presser: 90 }, seen, {}, dating('presser')), 'presser', day, 1000, PRESS), 'presser')?.id).toBe('romance:presser:invitation')
    const both = [...seen, 'romance:presser:invitation']
    expect(eventNow(step(ready({ presser: 90 }, both, {}, dating('presser')), 'presser', day, 600, PRESS), 'presser')?.id).not.toBe('romance:presser:imperfectHouse')
    expect(eventNow(step(ready({ presser: 90 }, both, {}, engaged('presser')), 'presser', day, 600, PRESS), 'presser')?.id).toBe('romance:presser:imperfectHouse')
    const m = step(ready({ presser: 90 }, [...both, 'romance:presser:imperfectHouse'], {}, married('presser')), 'presser', day, 600, PRESS)
    expect(eventNow(m, 'presser')?.id).toBe('presser:short:spouseHabit')
    expect(spouseGift(m, def('presser'))).toBeNull()
    expect(spouseGift({ ...m, romance: married('poppy') }, def('poppy'))).not.toBeNull()
  })
})

describe('떠돌이 상인 — 떠나는 길보다 돌아오는 길', () => {
  const old = allEvents('merchant').filter((id) => !id.startsWith('romance:') && !id.includes(':short:spouseHabit'))
  it('장날에만 — 놓쳐도 다음 장날에 이어지고, 남겨 둔 자리는 장을 닫고 함께 차를 마신 뒤(개인 상자 이야기)', () => {
    const notMarket = dry(70, (d) => !isMarketDay(d))
    const market = dry(70, isMarketDay)
    expect(eventNow(step(ready({ merchant: 40 }, old), 'merchant', notMarket, 1060, STALL), 'merchant')).toBeNull()
    let s = step(ready({ merchant: 40 }, old), 'merchant', market, 1060, STALL)
    expect(eventNow(s, 'merchant')?.id).toBe('romance:merchant:noSale')
    s = chooseInEvent(openEvent(s, 'merchant')!, 'romance:merchant:noSale', 1)
    // 장날 몇 번을 건너뛰어도 마음은 그대로 — 다음 장날 자리
    const later = dry(market + 21, isMarketDay)
    const noBox = step({ ...s, hearts: { merchant: 60 } }, 'merchant', later, 1100, TEA)
    expect(eventNow(stand(noBox, 'poppy', { x: 44, y: 62 }), 'merchant')?.id).not.toBe('romance:merchant:savedSeat')
    const box = stand(step({ ...s, hearts: { merchant: 60 }, flags: { ...s.flags, 'story:merchantBox': 1 } }, 'merchant', later, 1100, TEA), 'poppy', { x: 44, y: 62 })
    expect(eventNow(box, 'merchant')?.id).toBe('romance:merchant:savedSeat')
  })
  it('연인이어도 장날이 아니면 마을에 없고, 결혼 뒤엔 밤에 집으로 돌아오고 장날 아닌 낮엔 장사 길에 — 매일 선물은 없다', () => {
    const notMarket = dry(70, (d) => !isMarketDay(d))
    const d = ready({ merchant: 90 }, old, {}, dating('merchant'))
    expect(partnerFree({ ...d, clock: { ...d.clock, day: notMarket, minute: 600 } }, CONTENT, 'tea')).toBe('away')
    const m = ready({ merchant: 90 }, old, {}, married('merchant'))
    const night = settle({ ...m, homeLevel: 1, clock: { ...m.clock, day: notMarket, minute: 20 * 60 } }, CONTENT)
    expect(night.npcs.merchant.visible).toBe(true)
    const noon = settle({ ...m, homeLevel: 1, clock: { ...m.clock, day: notMarket, minute: 12 * 60 } }, CONTENT)
    expect(noon.npcs.merchant.visible).toBe(false)
    expect(spouseGift(m, def('merchant'))).toBeNull()
  })
  it('상인은 편한 반말 — 존댓말 끝·"당신"·"~소/~오/~군"이 없다', () => {
    const says = (lines: SceneLine[]) => lines.filter((l) => l.speaker === 'merchant').map((l) => l.text)
    const p = PEOPLE.people.merchant
    const mine = [
      ...p.lines.map((l) => l.text),
      ...p.routines.flatMap((r) => r.mutter ?? []),
      ...(p.events ?? []).flatMap((e) => [...says(e.lines), ...(e.choices ?? []).flatMap((c) => says(c.reply))]),
      ...Object.values(SCENES).flatMap((sc) => says(sc.lines as SceneLine[])),
    ]
    const nb = (lifeText as unknown as { neighbors?: Record<string, unknown> }).neighbors
    const talk = JSON.stringify(nb?.merchant ?? {})
    expect(mine.length).toBeGreaterThan(30)
    for (const t of [...mine, talk]) {
      expect(t, t).not.toMatch(/요[.!?"…]|요$|당신|습니다|[소오]\.|군요|시네요|세요/)
    }
  })
})

describe('편지 나르는 이웃 — 배달 목록에 없는 약속', () => {
  const old = allEvents('postman').filter((id) => !id.startsWith('romance:') && !id.includes(':short:spouseHabit'))
  it('가방 이야기·내 약속 적기 뒤 배달 끝난 저녁에만 — 남의 편지·우편물은 장면에 없다', () => {
    const day = dry(70)
    expect(eventNow(step(ready({ postman: 40 }, old.filter((x) => x !== 'postman:small:ownAppt'), { 'story:postmanBag': 1 }), 'postman', day, 1040, STEPS), 'postman')?.id).not.toBe('romance:postman:blankLine')
    let s = step(ready({ postman: 40 }, old, { 'story:postmanBag': 1 }), 'postman', day, 1040, STEPS)
    expect(eventNow(s, 'postman')?.id).toBe('romance:postman:blankLine')
    expect(eventNow({ ...s, clock: { ...s.clock, minute: 700 } }, 'postman')?.id).not.toBe('romance:postman:blankLine')
    s = chooseInEvent(openEvent(s, 'postman')!, 'romance:postman:blankLine', 1)
    expect(s.life.memories.postman.some((m) => m.tag === 'blankRest')).toBe(true)
    const text = JSON.stringify((PEOPLE.people.postman.events ?? []).filter((e) => e.id.startsWith('romance:'))) + ['romance1', 'romance2', 'confess', 'propose', 'wedding'].map((k) => JSON.stringify(SCENES[`${k}:postman`])).join()
    for (const w of ['말씀', '조각', '누구 편지', '편지 내용', '소포', '받는 분']) expect(text, w).not.toContain(w)
  })
})
