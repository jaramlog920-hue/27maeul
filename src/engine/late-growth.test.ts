import { CONTENT } from '../content/catalog'
import { canDate, canOrderWork, guestMorning, isSuitor, newGame, rankMorning, stageWith, trade, TRADES } from './game'
import { establishedGame, legacyGame, gameAtChapters } from './growth-test-support'
import { cancelFest, createFest, type FestInput } from './fest'
import { answerDesk, canKidAct, spouseReading } from './family'
import { newGenState } from './gen'
import { setGenOn, settleOneDay } from './gen-settle'
import { RETIRE_AFTER } from './gen-growth'
import { STAGE_AT } from './gen-config'
import { freshStats } from './stats'

it('잠긴 생활 행동은 재료·닢·일정과 보상을 바꾸지 않는다', () => {
  const s = newGame(CONTENT)
  s.coins = 1000
  s.clock.day = 21
  s.flags['movedIn:carpenter'] = 1
  expect(canOrderWork(s, 'reedRack')).toBe('locked')
  expect(trade(s, TRADES.find(t => t.id === 'rainJar')!)).toBeNull()
  expect(rankMorning(s, CONTENT)).toBe(s)
  expect(guestMorning(s)).toBe(s)
  const input = { kind: 'festival', day: 21, role: 'tidy', members: [] } as FestInput
  expect(createFest(s, input, CONTENT)).toEqual({ state: s, error: 'locked' })
})
it('9·11·12·13권에 기존 생활 조건을 다시 검사한다', () => {
  const s = establishedGame(CONTENT, 9)
  s.clock.day = 21
  s.coins = 1000
  s.flags['movedIn:carpenter'] = 1
  expect(canOrderWork(s, 'reedRack')).toBeNull()
  expect(trade(s, TRADES.find(t => t.id === 'rainJar')!)?.coins).toBe(960)
  const guest = establishedGame(CONTENT, 11)
  guest.clock.day = 21
  expect(guestMorning(guest).guestbook?.at(-1)?.kind).toBe('scribe')
  const rank = establishedGame(CONTENT, 12)
  rank.clock.day = 21
  const ranked = rankMorning(rank, CONTENT)
  expect(ranked.ranks).toHaveLength(1)
  expect(rankMorning(ranked, CONTENT)).toBe(ranked)
  expect(createFest(establishedGame(CONTENT, 13), { kind: 'festival', day: -1, members: [] } as FestInput, CONTENT).error).toBe('date')
})
it('깊은 관계와 후보는 점수를 지우지 않고 45·50장에 열린다', () => {
  const s = gameAtChapters(CONTENT, 44)
  const candidate = CONTENT.neighbors.find(n => n.romanceable && n.look !== (s.avatar?.look ?? 'f'))!
  s.hearts[candidate.id] = 100
  expect(stageWith(s, candidate.id)).toBe(3)
  expect(isSuitor(s, candidate)).toBe(false)
  const deep = { ...gameAtChapters(CONTENT, 45), hearts: s.hearts }
  expect(stageWith(deep, candidate.id)).toBe(5)
  // 2026-10-21: 연애 후보는 연애(60장)와 함께 열린다
  expect(isSuitor(gameAtChapters(CONTENT, 59), candidate)).toBe(false)
  expect(isSuitor(gameAtChapters(CONTENT, 60), candidate)).toBe(true)
  expect(s.hearts[candidate.id]).toBe(100)
})
// 2026-10-21: 배우자 생활은 결혼(19번째)과 같은 날 열리고, 결혼해도 데이트는 연애 조건 그대로
it('배우자 활동은 결혼과 함께, 아이 활동은 23권에서 기존 조건으로 넘어간다', () => {
  const s = establishedGame(CONTENT, 18)
  s.romance = { ...s.romance, stage: 'married', partner: 'rudy' }
  s.clock.minute = 1200
  expect(spouseReading(s)).toBe(false)
  expect(canDate(s, 'tea', CONTENT)).not.toBe('locked')
  const unlocked = { ...s, progress: establishedGame(CONTENT, 19).progress }
  expect(spouseReading(unlocked)).toBe(true)
  expect(canDate(unlocked, 'tea', CONTENT)).not.toBe('locked')
  const withChild: typeof s = { ...s, child: { name: '아이', look: 'girl', born: 0, stats: freshStats(), lean: null, close: 0 } }
  expect(canKidAct(withChild, 'story')).toBe('locked')
  expect(answerDesk(withChild, true)).toBe(withChild)
  expect(canKidAct({ ...withChild, progress: establishedGame(CONTENT, 23).progress }, 'story')).not.toBe('locked')
})
// 2026-10-21 사용자: 은퇴를 없앴다 — 주민은 자라지만 견습·은퇴는 어느 진행에서도 생기지 않고, 다음 세대(180장)부터 '스스로 일을 찾았다' 소식
it('주민은 잠겨 있어도 자라며, 견습·은퇴는 없고 다음 세대가 열리면 스스로 일을 찾은 소식이 남는다', () => {
  const s = newGame(CONTENT)
  let g = newGenState(CONTENT, 7, 1)
  g = { ...g, persons: { ...g.persons, child: { id: 'child', origin: 'born', born: 0, stage: 'baby', look: 'm', name: '아론', avatar: {}, parents: ['rudy', 'poppy'], spouse: null, household: 'h' } }, households: { h: { id: 'h', home: 'rudy', members: ['rudy', 'poppy'], children: ['child'], since: 1, lastBirth: 0 } } }
  g = settleOneDay(g, STAGE_AT.adult - 1, establishedGame(CONTENT, 25), CONTENT, {})
  g = settleOneDay(g, STAGE_AT.adult, establishedGame(CONTENT, 25), CONTENT, {})
  expect(g.persons.child.stage).toBe('adult')
  expect(g.log.some((l) => l.kind === 'ownJob' && l.who.includes('child'))).toBe(true)
  for (let d = STAGE_AT.adult + 1; d < STAGE_AT.adult + 1 + RETIRE_AFTER + 5; d++) g = settleOneDay(g, d, establishedGame(CONTENT, 26), CONTENT, {})
  expect(g.heirs?.rudy).toBeUndefined()
  expect(g.retired?.rudy).toBeUndefined()
  void s
})
it('기존 저장은 원래 권한을 유지하고 잠긴 자율 생활은 켜지지 않는다', () => {
  const old = legacyGame(CONTENT)
  old.coins = 1000
  old.flags['movedIn:carpenter'] = 1
  expect(canOrderWork(old, 'reedRack')).toBeNull()
  const s = newGame(CONTENT)
  s.gen = { ...newGenState(CONTENT, 7, 1), on: false }
  expect(setGenOn(s, true)).toBe(s)
  const open = { ...s, progress: establishedGame(CONTENT, 14).progress }
  expect(setGenOn(open, true).gen?.on).toBe(true)
})

it('이미 예약한 행사는 잠긴 상태에서도 취소하여 재료를 되찾을 수 있다', () => {
  const s = establishedGame(CONTENT, 13)
  s.clock.day = 15
  s.inv.bread = 2
  const made = createFest(s, { kind: 'festival', day: 20, role: 'food', snack: 'bread', members: [] }, CONTENT)
  expect(made.error).toBeUndefined()
  expect(made.state.inv.bread).toBe(1)
  const locked = { ...made.state, progress: newGame(CONTENT).progress }
  const cancelled = cancelFest(locked, made.id!)
  expect(cancelled.inv.bread).toBe(2)
  expect(cancelFest(cancelled, made.id!)).toBe(cancelled)
})
