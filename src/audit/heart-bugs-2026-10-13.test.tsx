// 발견된 호감도·연애 결함의 회귀 검사.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, PEOPLE } from '../content/catalog'
import { HEART_HINTS, T } from '../content/text'
import { establishedGame } from '../engine/growth-test-support'
import { canGiveBouquet, canGiveCord, chooseInEvent, eventNow, heartProgressBlock, openEvent, type GameState } from '../engine/game'
import { isWet, weatherOf } from '../engine/calendar'
import { personOf, setPeopleData } from '../engine/people'
import { NO_ROMANCE } from '../engine/romance'
import { TalkBox, bondLabel } from '../features/talk/TalkBox'
import { useGame } from '../store/game-store'

const def = (id: string) => CONTENT.neighbors.find(n => n.id === id)!
beforeEach(() => {
  setPeopleData(PEOPLE)
  localStorage.clear()
  useGame.setState({ modal: null, toast: null, piecePopups: [], copyResult: null })
})

function ready(id = 'wendell'): GameState {
  const s = establishedGame(CONTENT, 19)
  return { ...s, scenes: [], clock: { day: 80, minute: 840 },
    life: { ...s.life, seen: PEOPLE.people[id].events?.map(e => e.id) ?? [] } }
}

it('친구로 지낸 뒤에도 조건을 갖추면 다시 고백할 수 있다', () => {
  const s = ready()
  const game = { ...s, hearts: { wendell: 100 }, inv: { bouquet: 1 }, flags: { ...s.flags, 'friendsOnly:wendell': 1 } }
  expect(canGiveBouquet(game, def('wendell'))).toBeNull()
  expect(eventNow(game, 'wendell')).toBeNull()
  act(() => useGame.setState({ game }))
  render(<TalkBox modal={{ kind: 'talk', neighborId: 'wendell', line: '' }} />)
  expect(screen.getByRole('button', { name: T.romance.giveBouquet })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: T.romance.giveBouquet }))
  expect(useGame.getState().game.romance).toMatchObject({ partner: 'wendell', stage: 'dating', bondRequired: true })
  expect(useGame.getState().game.flags['friendsOnly:wendell']).toBe(0)
  expect(useGame.getState().game.inv.bouquet ?? 0).toBe(0)
})

it('14일·데이트3회·이야기·10하트·방·끈이 갖춰지면 화면에서 청혼할 수 있다', () => {
  const s = ready()
  const game = { ...s, hearts: { wendell: 100 }, homeLevel: 1 as const, inv: { promiseCord: 1 },
    romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'dating' as const, since: 1, dates: 3, storyRead: true, bondRequired: true } }
  expect(canGiveCord(game, def('wendell'))).toBeNull()
  act(() => useGame.setState({ game }))
  render(<TalkBox modal={{ kind: 'talk', neighborId: 'wendell', line: '' }} />)
  expect(screen.getByRole('button', { name: T.romance.giveCord })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: T.romance.giveCord }))
  expect(useGame.getState().game.romance.stage).toBe('engaged')
  expect(useGame.getState().game.scenes).toContain('propose:wendell')
  expect(useGame.getState().game.inv.promiseCord ?? 0).toBe(0)
})

it('서먹한 상태의 NPC 고백도8하트부터 연애를 시작한다', () => {
  const s = ready('rudy')
  const e = personOf('rudy')!.events!.find(e => e.id === 'rudy:confess')!
  const day = Array.from({ length: 30 }, (_, i) => 80 + i).find(d => !isWet(weatherOf(d)))!
  const game = { ...s, hearts: { rudy: 75 }, clock: { day, minute: 1021 },
    flags: { ...s.flags, 'movedIn:carpenter': 1 },
    life: { ...s.life, seen: s.life.seen.filter(id => id !== e.id), cool: { rudy: day + 3 } },
    player: { ...s.player, x: e.at.x, y: e.at.y + 1 },
    npcs: { ...s.npcs, rudy: { ...s.npcs.rudy, ...e.at, visible: true, path: [] } } }
  expect(eventNow(game, 'rudy')?.id).not.toBe(e.id)
  expect(chooseInEvent({ ...game, hearts: { rudy: 77 } }, e.id, 0).romance.partner).toBeNull()
  const eligible = { ...game, hearts: { rudy: 80 } }
  expect(eventNow(eligible, 'rudy')?.id).toBe(e.id)
  const opened = openEvent(eligible, 'rudy')!
  const accepted = chooseInEvent(opened, e.id, 0)
  expect(accepted.romance.stage).toBe('dating')
  expect(accepted.hearts.rudy).toBeGreaterThanOrEqual(80)
})

it('친구로 정한 관계의 이름은 연애를 암시하는5단계로 표시하지 않는다', () => {
  const s = ready()
  const game = { ...s, hearts: { wendell: 100 }, flags: { ...s.flags, 'friendsOnly:wendell': 1 } }
  expect(bondLabel(game, 'wendell')).toBe(T.people.stages[4])
})

it('다른 연인이 있을 때 다른 후보에게 다발을 줄 수 있다고 안내하지 않는다', () => {
  const s = ready()
  const game = { ...s, hearts: { wendell: 80 },
    romance: { ...NO_ROMANCE, partner: 'rudy', stage: 'dating' as const, since: 70 } }
  expect(canGiveBouquet(game, def('wendell'))).toBe('taken')
  expect(heartProgressBlock(game, 'wendell')).toBe('taken')
})

it('재고백 유예 중에는 다발을 소비하지 않고 기다릴 기간을 안내한다', () => {
  const s = ready()
  const game = { ...s, hearts: { wendell: 80 }, inv: { bouquet: 1 }, flags: { ...s.flags, 'exPartner:wendell': 79 } }
  expect(heartProgressBlock(game, 'wendell')).toBe('cooling')
  act(() => useGame.setState({ game }))
  render(<TalkBox modal={{ kind: 'talk', neighborId: 'wendell', line: '' }} />)
  fireEvent.click(screen.getByRole('button', { name: T.romance.giveBouquet }))
  expect(useGame.getState().game.romance.partner).toBeNull()
  expect(useGame.getState().game.inv.bouquet).toBe(1)
  expect(useGame.getState().toast?.text).toBe(HEART_HINTS.cooling)
})

it('NPC 고백으로도 재고백14일 유예를 우회하지 못한다', () => {
  const s = ready()
  const e = { id: 'audit:confess', title: '고백', stage: 0 as const, at: { x: 1, y: 1 }, confess: true, lines: [],
    choices: [{ label: '수락', color: 'warm' as const, reply: [] }] }
  setPeopleData({ ...PEOPLE, people: { ...PEOPLE.people, wendell: { ...PEOPLE.people.wendell, events: [e] } } })
  const game = { ...s, hearts: { wendell: 80 }, flags: { ...s.flags, 'exPartner:wendell': 79 } }
  expect(eventNow(game, 'wendell')).toBeNull()
  expect(chooseInEvent(game, e.id, 0).romance.partner).toBeNull()
  const later = { ...game, clock: { day: 93, minute: 840 } }
  expect(eventNow(later, 'wendell')?.id).toBe(e.id)
  expect(chooseInEvent(later, e.id, 0).romance.partner).toBe('wendell')
})

it.each([
  ['기간', (s: GameState): GameState => ({ ...s, clock: { day: 5, minute: 840 } }), HEART_HINTS.bond],
  ['마음', (s: GameState): GameState => ({ ...s, hearts: { wendell: 90 } }), T.romance.cordHearts],
  ['이야기', (s: GameState): GameState => ({ ...s, romance: { ...s.romance, storyRead: false } }), HEART_HINTS.bond],
  ['방', (s: GameState): GameState => ({ ...s, homeLevel: 0 }), T.romance.cordRoom],
  ['끈', (s: GameState): GameState => ({ ...s, inv: {} }), T.romance.cordNoItem],
] as const)('청혼에 %s 조건이 부족하면 안내하고 관계·아이템을 유지한다', (_name, change, note) => {
  const s = ready()
  const game = change({ ...s, hearts: { wendell: 100 }, homeLevel: 1, inv: { promiseCord: 1 },
    romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'dating', since: 1, dates: 3, storyRead: true, bondRequired: true } })
  act(() => useGame.setState({ game }))
  render(<TalkBox modal={{ kind: 'talk', neighborId: 'wendell', line: '' }} />)
  fireEvent.click(screen.getByRole('button', { name: T.romance.giveCord }))
  expect(useGame.getState().game).toBe(game)
  expect(useGame.getState().toast?.text).toBe(note)
})
