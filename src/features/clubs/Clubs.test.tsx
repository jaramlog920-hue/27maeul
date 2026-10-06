import { act, fireEvent, render } from '@testing-library/react'
import { CONTENT, PEOPLE } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, settle, type GameState } from '../../engine/game'
import { appointmentSpots } from '../../engine/plans'
import { chooseClub, clubWeaveDone, createClub, joinClub, type ClubInput } from '../../engine/clubs'
import { clubPerson } from '../../engine/club-life'
import { useGame } from '../../store/game-store'
import { ClubForm } from './ClubForm'
import { ClubList } from './ClubList'
import { ClubSession } from './ClubSession'

const C = T.clubs
function ready(): GameState {
  const s = newGame(CONTENT)
  return { ...s, clock: { day: 2, minute: 480 }, scenes: [], notebook: { ...s.notebook, met: CONTENT.neighbors.map((n) => n.id) }, flags: { ...s.flags, villageLevel: 10, ...Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1])) }, life: { ...s.life, seen: Object.values(PEOPLE.people).flatMap((p) => (p.events ?? []).map((e) => e.id)) } }
}
const config: ClubInput = { name: '천 한 올 모임', place: 'hallTable', members: ['baker'], weekday: 2, slot: 'morning', activity: 'sew', alt: 'hallTable' }

describe('소모임 화면', () => {
  it('이웃 고르기 칸은 글 앞에 한 줄로 놓인다 (칸이 가로로 늘어나지 않는다)', () => {
    useGame.setState({ game: ready() })
    const { getByText, container } = render(<ClubForm onClose={() => {}} />)
    act(() => fireEvent.click(getByText(C.nextButton)))
    act(() => fireEvent.click(getByText(C.nextButton)))
    const boxes = container.querySelectorAll('input[type="checkbox"]')
    expect(boxes.length).toBeGreaterThan(5)
    for (const box of boxes) expect(box.closest('label')?.classList.contains('check-row')).toBe(true)
    expect(container.querySelector('.dialog')?.classList.contains('fest-form')).toBe(true)
  })

  function sewing(): { s: GameState; id: string } {
    let s = createClub(ready(), config, CONTENT).state
    s = settle({ ...s, clock: { day: 2, minute: 600 } }, CONTENT)
    const id = s.plans.appts[0].id
    s = joinClub({ ...s, player: { ...s.player, ...appointmentSpots(s).baker } }, id, 'direct')
    return { s: { ...s, inv: { ...s.inv, wool: 2 } }, id }
  }

  it('모임 현장에서 방석을 만든 뒤 집에 두기와 모임 자리에 남기기가 모두 보이고, 주민마다 하는 일이 보인다', () => {
    const { s, id } = sewing()
    useGame.setState({ game: clubWeaveDone(chooseClub(s, id, '파랑'), id) })
    const { container, getByText } = render(<ClubSession id={id} />)
    expect(container.textContent).toContain(C.home)
    expect(container.textContent).toContain(C.leave)
    expect(container.textContent).toContain(clubPerson('baker', 'sew')!.does)
    act(() => fireEvent.click(getByText(C.leave)))
    expect(useGame.getState().game.clubWorks['club:1']).toMatchObject({ color: '파랑', place: 'hallTable' })
  })

  it('방석을 만들기 전에 재료와 결과를 먼저 알려 주고, 모임 자리가 없으면 남기기를 보이지 않는다', () => {
    const { s, id } = sewing()
    useGame.setState({ game: s })
    const first = render(<ClubSession id={id} />)
    expect(first.container.textContent).toContain(C.wool)
    first.unmount()
    const crowded = { ...clubWeaveDone(chooseClub(s, id, '파랑'), id), clubs: [...s.clubs, ...[8, 9, 10, 11].map((n) => ({ ...s.clubs[0], id: `club:${n}` }))], clubWorks: Object.fromEntries([8, 9, 10, 11].map((n) => [`club:${n}`, { item: 'cushion' as const, color: '노랑', place: 'hallTable' as const }])) }
    useGame.setState({ game: crowded })
    const second = render(<ClubSession id={id} />)
    expect(second.container.textContent).toContain(C.home)
    expect(second.container.textContent).not.toContain(C.leave)
  })

  it('목록은 플레이어 없이 마친 회차에 실제 있었던 일만 전하고 탓하는 말이 없다', () => {
    let s = createClub(ready(), config, CONTENT).state
    s = settle({ ...s, clock: { day: 2, minute: 600 } }, CONTENT)
    s = settle({ ...s, clock: { day: 2, minute: 740 } }, CONTENT)
    useGame.setState({ game: { ...s, clock: { day: 3, minute: 480 } } })
    const { container } = render(<ClubList />)
    expect(container.textContent).toContain(C.summary)
    expect(container.textContent).toContain(clubPerson('baker', 'sew')!.does)
    expect(container.textContent).not.toMatch(/(왜|못 왔|안 왔|미안)/)
  })
})
