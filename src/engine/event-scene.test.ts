// 행사 도트 (계획 17 작업 4·5): 지금 놓이는 소품과 사람들의 행사 동작 — 그림만, 보상·결혼 판정은 그대로
import { CONTENT } from '../content/catalog'
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { BABY_PARTY_SPOTS, HILL_SPOTS } from './bonds'
import {
  birthdayBreads,
  candleKey,
  candleToBlow,
  eventPropsNow,
  festivalLayout,
  npcEventMotion,
  PICNIC_CLOTH,
  playerEventMotion,
  WEDDING_BEATS,
  WEDDING_LAYOUT,
  weddingBeat,
  weddingEvening,
  WELCOME_BASKET,
  type EventProp,
} from './event-scene'
import { ACT_SECONDS, newGame, settle, tick, type GameState } from './game'
import { FESTIVAL_SPOTS, FIRE, npcTile } from './neighbors'
import { WEDDING_SPOT } from './romance'
import { isWalkable, key, tileAt } from './world'

const day = 14
const engaged = (s: GameState, minute: number): GameState => ({
  ...s,
  clock: { ...s.clock, day, minute },
  romance: { partner: 'basil', stage: 'engaged', since: 1, weddingDay: day, marriedDay: null },
})
const married = (s: GameState, minute: number): GameState => ({
  ...s,
  clock: { ...s.clock, day, minute },
  romance: { partner: 'basil', stage: 'married', since: 1, weddingDay: null, marriedDay: day },
})
const standing = (s: GameState, id: string, x: number, y: number): GameState => ({
  ...s,
  npcs: { ...s.npcs, [id]: { id, x, y, path: [], facing: 'down', walkTime: 0, visible: true, goal: { x, y } } },
})
const playerAt = (s: GameState, x: number, y: number): GameState => ({ ...s, player: { ...s.player, x, y, path: [] } })

/** 소품이 땅에 닿는 칸은 걸을 수 있는 칸, 문·모닥불·사람이 서는 자리와 겹치지 않고, 서로 겹치지 않는다 */
function checkFoot(props: readonly EventProp[], spots: readonly { x: number; y: number }[]) {
  const taken = new Set(spots.map(key))
  const seen = new Set<string>()
  for (const p of props)
    for (const t of p.foot) {
      expect(isWalkable(t), `${p.art} ${key(t)}`).toBe(true)
      expect(tileAt(t.x, t.y), `${p.art} ${key(t)}`).not.toBe('D')
      expect(taken.has(key(t)), `${p.art} ${key(t)} 사람 자리`).toBe(false)
      expect(seen.has(key(t)), `${p.art} ${key(t)} 겹침`).toBe(false)
      seen.add(key(t))
    }
}

describe('결혼식 도트 (계획 17 작업 4)', () => {
  it('결혼 잔치 저녁: 약혼한 결혼 날 18~21시, 그날 결혼한 뒤에도 잔치 시간 동안', () => {
    const s = newGame(CONTENT)
    expect(weddingEvening(engaged(s, FESTIVAL_FROM - 1))).toBe(false)
    expect(weddingEvening(engaged(s, FESTIVAL_FROM))).toBe(true)
    expect(weddingEvening(married(s, FESTIVAL_FROM + 60))).toBe(true)
    expect(weddingEvening(married(s, FESTIVAL_TO))).toBe(false)
    // 다음 날은 아니다
    expect(weddingEvening({ ...married(s, FESTIVAL_FROM + 60), clock: { day: day + 1, minute: FESTIVAL_FROM + 60 } })).toBe(false)
  })

  it('소품은 잔치 저녁에만 놓이고 끝나면 걷는다', () => {
    const s = newGame(CONTENT)
    expect(eventPropsNow(engaged(s, FESTIVAL_FROM + 10)).map((p) => p.art)).toEqual(expect.arrayContaining(['weddingArch', 'aisle', 'feastTable', 'feastTray', 'candlePair']))
    expect(eventPropsNow(married(s, FESTIVAL_TO))).toEqual([])
    expect(eventPropsNow({ ...s, clock: { ...s.clock, minute: FESTIVAL_FROM + 10 } })).toEqual([])
  })

  it('지도: 결혼 소품은 걷는 칸 위, 문·모닥불·서는 자리를 막지 않는다', () => {
    checkFoot(WEDDING_LAYOUT, [FIRE, WEDDING_SPOT, ...Object.values(FESTIVAL_SPOTS)])
    // 모두 광장 모닥불 가까이 (열 걸음 안)
    for (const p of WEDDING_LAYOUT) expect(Math.abs(p.at.x - FIRE.x) + Math.abs(p.at.y + p.h - 1 - FIRE.y), p.art).toBeLessThanOrEqual(10)
  })

  it('결혼식 동작 차례: 입장 → 인사 → 꽃다발 → 반지 → 손잡기 → 축하 → 다시 처음', () => {
    const order: string[] = []
    let t = 0
    for (const b of WEDDING_BEATS) {
      order.push(weddingBeat(t + 0.01).action)
      t += b.seconds
    }
    expect(order).toEqual(['arrive', 'bow', 'offerFlowers', 'exchange', 'holdHands', 'celebrate'])
    expect(weddingBeat(t + 0.01).action).toBe('arrive')
    // 단발 동작(인사)은 마지막 장에서 멈춘다
    expect(weddingBeat(WEDDING_BEATS[0].seconds + 1.35)).toEqual({ action: 'bow', frame: 3 })
  })

  it('짝은 결혼 자리에서, 기록자는 모닥불 곁에서 결혼식 동작 — 둘레 이웃은 박수·웃기', () => {
    let s = standing(married(newGame(CONTENT), FESTIVAL_FROM + 40), 'basil', WEDDING_SPOT.x, WEDDING_SPOT.y)
    s = standing(s, 'baker', FESTIVAL_SPOTS.baker.x, FESTIVAL_SPOTS.baker.y)
    s = playerAt(s, WEDDING_SPOT.x + 1, WEDDING_SPOT.y)
    expect(npcEventMotion(s, 'basil', 0)).toEqual({ set: 'wedding', action: 'arrive', frame: 0, facing: 'right' })
    expect(playerEventMotion(s, 0)).toEqual({ set: 'wedding', action: 'arrive', frame: 0, facing: 'left' })
    expect(['clap', 'smile']).toContain(npcEventMotion(s, 'baker', 5)!.action)
    // 걷는 중, 가구 동작 중, 모닥불에서 먼 곳이면 평소 그림
    expect(playerEventMotion(playerAt(s, 5, 8), 0)).toBeNull()
    expect(playerEventMotion({ ...s, act: { kind: 'sit' as const, left: 1, total: 1, facing: 'down' as const } } as GameState, 0)).toBeNull()
    // 잔치가 끝나면 아무 동작도 없다
    const after = { ...s, clock: { ...s.clock, minute: FESTIVAL_TO } }
    expect(npcEventMotion(after, 'basil', 0)).toBeNull()
    expect(playerEventMotion(after, 0)).toBeNull()
  })

  it('결혼한 뒤에도 그날 잔치 시간에는 짝이 결혼 자리에 남는다 (결혼 판정·보상은 그대로)', () => {
    const base = newGame(CONTENT)
    const s = settle({ ...married(base, FESTIVAL_FROM + 90), flags: { ...base.flags, villageLevel: 3 } }, CONTENT)
    expect(s.npcs.basil?.goal).toEqual(WEDDING_SPOT)
  })
})

describe('생일·잔치·모임 도트 (계획 17 작업 5)', () => {
  const BAKER_BIRTHDAY = 10 // 봄 10일
  const zero = () => 0
  const birthdayMorning = (gifted: string[]): GameState => {
    const base = newGame(CONTENT)
    return settle({ ...base, clock: { ...base.clock, day: BAKER_BIRTHDAY, minute: 10 * 60 }, gifted }, CONTENT)
  }

  it('생일 빵은 그날 선물한 생일 이웃 곁에만', () => {
    const s = birthdayMorning(['baker'])
    const [b] = birthdayBreads(s)
    expect(b).toMatchObject({ id: 'baker', out: false })
    expect(Math.abs(b.at.x - npcTile(s.npcs.baker).x) + Math.abs(b.at.y - npcTile(s.npcs.baker).y)).toBe(1)
    expect(eventPropsNow(s).map((p) => p.art)).toContain('birthdayBread')
    // 선물하지 않았거나 생일이 아니면 없다
    expect(birthdayBreads(birthdayMorning([]))).toEqual([])
    expect(birthdayBreads({ ...s, clock: { ...s.clock, day: BAKER_BIRTHDAY + 1 } })).toEqual([])
  })

  it('빵 곁에 서면 그날 처음 한 번 촛불을 불고, 꺼진 초로 바뀐다 — 보상은 없다', () => {
    const s0 = birthdayMorning(['baker'])
    const [b] = birthdayBreads(s0)
    const n = npcTile(s0.npcs.baker)
    // 빵 곁, 이웃과 겹치지 않는 칸
    const spot = [{ x: b.at.x + 1, y: b.at.y }, { x: b.at.x - 1, y: b.at.y }, { x: b.at.x, y: b.at.y + 1 }, { x: b.at.x, y: b.at.y - 1 }].find((t) => !(t.x === n.x && t.y === n.y))!
    const s = { ...s0, player: { ...s0.player, x: spot.x, y: spot.y, path: [] } }
    expect(candleToBlow(s)).toEqual({ id: 'baker', at: b.at })
    const r = tick(s, 0.05, zero, CONTENT).state
    expect(r.flags[candleKey('baker')]).toBe(BAKER_BIRTHDAY)
    expect(r.act).toMatchObject({ kind: 'blowCandle', left: ACT_SECONDS.blowCandle })
    expect(r.coins).toBe(s.coins)
    expect(r.hearts).toEqual(s.hearts)
    // 부는 동안 이웃은 박수, 빵은 기록자 손에 (땅의 빵은 잠시 숨긴다)
    expect(npcEventMotion(r, 'baker', 0)?.action).toBe('clap')
    expect(eventPropsNow(r).some((p) => p.art === 'birthdayBread' || p.art === 'candleOut')).toBe(false)
    // 다 불고 나면 꺼진 초, 다시 불지 않는다
    const done = tick(r, ACT_SECONDS.blowCandle + 0.1, zero, CONTENT).state
    expect(done.act).toBeUndefined()
    expect(eventPropsNow(done).map((p) => p.art)).toContain('candleOut')
    expect(candleToBlow(done)).toBeNull()
  })

  it('마을 잔치 저녁: 그 계절 장식과 행사 안내판, 끝나면 걷는다', () => {
    const s = newGame(CONTENT)
    const at = (day: number, minute: number) => ({ ...s, clock: { ...s.clock, day, minute } })
    expect(eventPropsNow(at(20, FESTIVAL_FROM + 30)).map((p) => p.art).sort()).toEqual(['feastBoard', 'springGarland'])
    expect(eventPropsNow(at(65, FESTIVAL_FROM + 30)).map((p) => p.art)).toContain('summerShadeDecor')
    expect(eventPropsNow(at(110, FESTIVAL_FROM + 30)).map((p) => p.art)).toContain('autumnHarvest')
    expect(eventPropsNow(at(140, FESTIVAL_FROM + 30)).filter((p) => p.art === 'winterLantern')).toHaveLength(2)
    expect(eventPropsNow(at(20, FESTIVAL_TO))).toEqual([])
    expect(eventPropsNow(at(20, FESTIVAL_FROM - 1))).toEqual([])
  })

  it('잔치 둘레 이웃은 춤·맛보기·박수를 돌아가며', () => {
    const s = standing({ ...newGame(CONTENT), clock: { day: 20, minute: FESTIVAL_FROM + 30 } }, 'baker', FESTIVAL_SPOTS.baker.x, FESTIVAL_SPOTS.baker.y)
    const seen = new Set<string>()
    for (let t = 0; t < 40; t += 0.5) seen.add(npcEventMotion(s, 'baker', t)!.action)
    expect([...seen].sort()).toEqual(['clap', 'dance', 'taste'])
  })

  it('모임: 소풍은 나들이 천과 음식 나누기, 아기 잔치는 바구니와 접시 놓기, 별 보는 밤은 그대로', () => {
    const base = newGame(CONTENT)
    const on = (gathering: 'picnic' | 'babyParty' | 'starNight', minute: number) => ({ ...base, clock: { ...base.clock, day: 30, minute }, today: { ...base.today, gathering } })
    const picnic = standing(on('picnic', 12 * 60), 'baker', HILL_SPOTS.baker.x, HILL_SPOTS.baker.y)
    expect(eventPropsNow(picnic).map((p) => p.art)).toEqual(['picnicCloth'])
    expect(npcEventMotion(picnic, 'baker', 0)?.action).toBe('shareFood')
    const party = standing(on('babyParty', 18 * 60 + 30), 'grandpa', BABY_PARTY_SPOTS.grandpa.x, BABY_PARTY_SPOTS.grandpa.y)
    expect(eventPropsNow(party).map((p) => p.art)).toEqual(['welcomeBasket'])
    expect(npcEventMotion(party, 'grandpa', 0)?.action).toBe('placePlate')
    const stars = standing(on('starNight', 21 * 60), 'baker', HILL_SPOTS.baker.x, HILL_SPOTS.baker.y)
    expect(eventPropsNow(stars)).toEqual([])
    expect(npcEventMotion(stars, 'baker', 0)).toBeNull()
    // 모임 시간이 지나면 걷는다
    expect(eventPropsNow(on('picnic', 14 * 60))).toEqual([])
  })

  it('지도: 잔치·모임 소품도 걷는 칸 위, 서 있는 소품은 사람 자리를 막지 않는다', () => {
    const fire = [FIRE, ...Object.values(FESTIVAL_SPOTS)]
    for (const f of ['blossom', 'barley', 'grapes', 'hearth'] as const) checkFoot(festivalLayout(f), fire)
    checkFoot([WELCOME_BASKET], Object.values(BABY_PARTY_SPOTS))
    // 나들이 천은 바닥에 깔아 사람이 그 위에 앉는다 — 걷는 칸이기만 하면 된다
    checkFoot([PICNIC_CLOTH], [])
    expect(PICNIC_CLOTH.ground).toBe(true)
  })
})
