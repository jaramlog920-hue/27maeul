import { afterEach, describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { SCENES } from '../content/text'
import { establishedGame, legacyGame } from './growth-test-support'
import { breakUp, canDate, canGiveCord, dailyHeartGain, finishHelp, giveBouquet, giveGift, goOnDate, greetNeighbor, heartProgressBlock, heartUp, isSuitor, newGame, openEvent, relationshipHeartCap, sceneSeen, type GameState } from './game'
import { DAILY_HEART_CAP, GAIN, sanitizeHeartDay } from './hearts'
import { fullHeartBond, NO_ROMANCE, sanitizeRomance } from './romance'
import { deserialize, serialize } from './save'
import { setPeopleData } from './people'

afterEach(() => setPeopleData(PEOPLE))
const def = (id: string) => CONTENT.neighbors.find(n => n.id === id)!
function unlocked(s: GameState, id = 'poppy'): GameState {
  return { ...s, life: { ...s.life, seen: PEOPLE.people[id].events?.map(e => e.id) ?? [] } }
}
const tomorrow = (s: GameState): GameState => ({ ...s, clock: { ...s.clock, day: s.clock.day + 1 } })

describe('하루 교류와 매력', () => {
  it('인사·돕기·좋아하는 선물이 합계6점이고 다른 보상을 겹쳐도 넘지 않는다', () => {
    const s = newGame(CONTENT)
    const talk = greetNeighbor(s, 'baker')
    const help = finishHelp(talk, def('baker'))
    const liked = def('baker').likes[0]
    const gift = giveGift({ ...help, inv: { ...help.inv, [liked]: 1 } }, def('baker'), liked)!.state
    expect([talk.hearts.baker, help.hearts.baker, gift.hearts.baker]).toEqual([1, 3, 6])
    expect(heartUp(gift, 'baker', GAIN.work).hearts.baker).toBe(6)
    expect(heartProgressBlock(gift, 'baker')).toBe('daily')
    expect(heartUp(tomorrow(gift), 'baker', 2).hearts.baker).toBe(8)
  })

  it('매력 최고 단계도 같은 주민에게 한 번만 적용하고 주민별로 독립적이다', () => {
    let s = newGame(CONTENT)
    s = { ...s, stats: { ...s.stats, charm: { ...s.stats.charm, level: 5 } } }
    s = heartUp(s, 'baker', 1)
    expect(s.hearts.baker).toBe(3)
    s = heartUp(s, 'baker', 1)
    expect(s.hearts.baker).toBe(4)
    s = heartUp(s, 'smith', 1)
    expect(s.hearts.smith).toBe(3)
    expect(heartUp(tomorrow(s), 'baker', 1).hearts.baker).toBe(7)
  })

  it('완료한 첫 이야기는 하루 총량 밖에서 보상하고 같은 사건은 다시 주지 않는다', () => {
    const at = { x: 5, y: 17 }
    setPeopleData({ ...PEOPLE, people: { ...PEOPLE.people, baker: { ...PEOPLE.people.baker, events: [{ id: 'balance:story', title: '이야기', stage: 0, at, gain: 8, lines: [] }] } } })
    let s = heartUp(newGame(CONTENT), 'baker', 20)
    s = { ...s, player: { ...s.player, x: 5, y: 18 }, npcs: { ...s.npcs, baker: { ...s.npcs.baker, ...at, visible: true, path: [] } } }
    const seen = openEvent(s, 'baker')!
    expect(seen.hearts.baker).toBe(14)
    expect(dailyHeartGain(seen, 'baker')).toBe(6)
    expect(openEvent(seen, 'baker')).toBeNull()
    expect(heartUp(seen, 'baker', 20).hearts.baker).toBe(14)
  })

  it('저장·불러오기 뒤에도 총량과 매력 사용이 남는다', () => {
    let s = newGame(CONTENT)
    s = { ...s, stats: { ...s.stats, charm: { ...s.stats.charm, level: 5 } } }
    s = heartUp(s, 'baker', 1)
    const loaded = deserialize(serialize(s), CONTENT)!
    expect(heartUp(loaded, 'baker', 1).hearts.baker).toBe(4)
    const full = deserialize(serialize(heartUp(loaded, 'baker', 20)), CONTENT)!
    expect(heartUp(full, 'baker', 1).hearts.baker).toBe(DAILY_HEART_CAP)
  })

  it('잘못된 일일 저장을 정리하고 전날 기록을 새 날에 적용하지 않는다', () => {
    expect(sanitizeHeartDay({ day: 2, gains: { baker: 7, smith: 3, unknown: 1 }, charm: ['smith', 'smith', 'unknown'] }, 2, ['baker', 'smith'])).toEqual({ day: 2, gains: { smith: 3 }, charm: ['smith'] })
    expect(sanitizeHeartDay({ day: 1, gains: { baker: 6 }, charm: [] }, 2, ['baker'])).toBeUndefined()
  })
})

describe('필사와 관계 단계', () => {
  it.each([[0, 50], [15, 70], [17, 80]] as const)('%i권에서 연애 후보의 상한은%i점이며 이야기 보상도 넘지 않는다', (books, cap) => {
    let s = unlocked(establishedGame(CONTENT, books))
    s = { ...s, hearts: { poppy: cap - 1 } }
    expect(relationshipHeartCap(s, 'poppy')).toBe(cap)
    expect(heartUp(s, 'poppy', 20, Infinity, 'story').hearts.poppy).toBe(cap)
    expect(heartUp(tomorrow(heartUp(s, 'poppy', 20)), 'poppy', 20).hearts.poppy).toBe(cap)
  })

  it('일반 주민과 같은 모습의 친구는 연애 조건 없이100점까지 간다', () => {
    const s = { ...unlocked(newGame(CONTENT), 'penelope'), hearts: { penelope: 99, baker: 99 } }
    expect(heartUp(s, 'penelope', 3).hearts.penelope).toBe(100)
    expect(heartUp(s, 'baker', 3).hearts.baker).toBe(100)
  })

  it('친구로 지내기로 정한 후보는100점까지 가고 나중에 다발을 줄 선택도 남는다', () => {
    const s = unlocked(establishedGame(CONTENT, 19))
    const friends = { ...s, flags: { ...s.flags, 'friendsOnly:poppy': 1 }, hearts: { poppy: 99 } }
    expect(isSuitor(friends, def('poppy'))).toBe(true)
    expect(heartUp(friends, 'poppy', 3).hearts.poppy).toBe(100)
    const dating = giveBouquet({ ...friends, hearts: { poppy: 100 }, inv: { bouquet: 1, promiseCord: 1 } }, def('poppy'))
    expect(dating.flags['friendsOnly:poppy']).toBe(0)
    const weekLater = { ...dating, clock: { day: dating.clock.day + 7, minute: 840 }, homeLevel: 1 as const }
    expect(canGiveCord(weekLater, def('poppy'))).toBe('bond')
  })

  it('8하트에서 꽃다발을 줄 수 있고 연애 후9하트까지 오른다', () => {
    const s = unlocked(establishedGame(CONTENT, 17))
    const dating = giveBouquet({ ...s, hearts: { poppy: 80 }, inv: { bouquet: 1 } }, def('poppy'))
    expect(dating.romance.stage).toBe('dating')
    expect(relationshipHeartCap(dating, 'poppy')).toBe(90)
    expect(dating.hearts.poppy).toBeGreaterThan(80)
  })

  it('새 상한 때문에 기존 점수와 이미 결혼한 관계를 낮추지 않는다', () => {
    const s = unlocked(newGame(CONTENT))
    expect(heartUp({ ...s, hearts: { poppy: 100 } }, 'poppy', 5).hearts.poppy).toBe(100)
    const married = { ...s, romance: { ...NO_ROMANCE, partner: 'poppy', stage: 'married' as const, marriedDay: 1 }, hearts: { poppy: 99 } }
    expect(heartUp(married, 'poppy', 5).hearts.poppy).toBe(100)
  })
})

describe('10하트와 이번 연애의 경험', () => {
  const bond = { ...NO_ROMANCE, partner: 'poppy', stage: 'dating' as const, since: 1, dates: 3, storyRead: true }
  it('14일·3회·이야기를 모두 충족해야100점 상한이 열린다', () => {
    expect(fullHeartBond(bond, 14)).toBe(false)
    expect(fullHeartBond({ ...bond, dates: 2 }, 15)).toBe(false)
    expect(fullHeartBond({ ...bond, storyRead: false }, 15)).toBe(false)
    expect(fullHeartBond(bond, 15)).toBe(true)
    const s = { ...unlocked(legacyGame(CONTENT)), clock: { day: 15, minute: 840 }, romance: bond, hearts: { poppy: 90 } }
    expect(relationshipHeartCap(s, 'poppy')).toBe(100)
    const gained = heartUp(s, 'poppy', 5)
    expect(gained.hearts.poppy).toBe(96) // 파피(id poppy)의 마음 빠르기 1.2 — 2026-10-13 웬델·파피 모습을 맞바꿈
  })

  it('세 번째 데이트에 이야기 한 번을 예약하고 읽기 전에는 완료로 세지 않는다', () => {
    let s = unlocked(legacyGame(CONTENT))
    s = { ...s, clock: { day: 15, minute: 840 }, coins: 50, scenes: [], romance: { ...bond, dates: 2, storyRead: false }, hearts: { poppy: 89 } }
    expect(canDate(s, 'tea', CONTENT)).toBeNull()
    const dated = goOnDate(s, 'tea', CONTENT)
    expect(dated.romance.dates).toBe(3)
    expect(dated.romance.storyRead).toBe(false)
    expect(dated.scenes).toContain('loverTrust:poppy')
    expect(SCENES['loverTrust:poppy']?.lines.length).toBeGreaterThan(1)
    expect(relationshipHeartCap(dated, 'poppy')).toBe(90)
    expect(goOnDate(dated, 'tea', CONTENT)).toBe(dated)
    const read = sceneSeen(dated, 'loverTrust:poppy', [])
    expect(read.romance.storyRead).toBe(true)
    expect(relationshipHeartCap(read, 'poppy')).toBe(100)
    const loaded = deserialize(serialize(read), CONTENT)!
    expect(loaded.romance).toMatchObject({ dates: 3, storyRead: true, storyQueued: false })
    const fourth = goOnDate({ ...loaded, clock: { day: 16, minute: 840 } }, 'tea', CONTENT)
    expect(fourth.scenes).not.toContain('loverTrust:poppy')
  })

  it('예약되지 않은 장면이나 이전 연애의 데이트로 조건을 채우지 못한다', () => {
    const s = { ...unlocked(legacyGame(CONTENT)), romance: { ...bond, dates: 0, storyRead: false }, scenes: [], flags: { dateTeas: 30, dateWalks: 30 } }
    expect(sceneSeen(s, 'loverTrust:poppy', []).romance.storyRead).toBe(false)
    expect(fullHeartBond(s.romance, 100)).toBe(false)
    const ended = breakUp({ ...s, scenes: ['loverTrust:poppy'] }, 'poppy')
    expect(ended.scenes).not.toContain('loverTrust:poppy')
    expect(ended.romance.partner).toBeNull()
  })

  it('연애 저장의 잘못된 횟수·진행 표식을 정리한다', () => {
    expect(sanitizeRomance({ ...bond, dates: -5, storyRead: 'true' })).toMatchObject({ dates: 0, storyRead: false })
  })
})
