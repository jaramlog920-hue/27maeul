// 행사 도트 (계획 17 작업 4·5): 지금 놓이는 소품과 사람들의 행사 동작 — 그림만, 보상·결혼 판정은 그대로
import { CONTENT } from '../content/catalog'
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { eventPropsNow, npcEventMotion, playerEventMotion, WEDDING_BEATS, WEDDING_LAYOUT, weddingBeat, weddingEvening, type EventProp } from './event-scene'
import { newGame, settle, type GameState } from './game'
import { FESTIVAL_SPOTS, FIRE } from './neighbors'
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
