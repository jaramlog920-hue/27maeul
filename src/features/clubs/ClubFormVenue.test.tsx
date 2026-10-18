// 소모임 만들기: 활동을 바꾸면 장소를 그 활동의 장소로 맞추고, 열 수 없는 장소로는 넘어가지 않는다 (2026-10-18 감사 L-37)
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, PEOPLE } from '../../content/catalog'
import { T } from '../../content/text'
import { clubVenues } from '../../engine/clubs'
import { type GameState } from '../../engine/game'
import { establishedGame } from '../../engine/growth-test-support'
import { useGame } from '../../store/game-store'
import { ClubForm } from './ClubForm'

vi.mock('../../render/renderer', () => ({ drawGroupPreview: vi.fn() }))
beforeEach(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))

it('텃밭 → 장소 텃밭 → 활동을 차로 바꾸면 차 장소가 골라져 있고, 저장에서 장소 오류가 나지 않는다', () => {
  const s0 = establishedGame(CONTENT)
  const s: GameState = {
    ...s0,
    clock: { day: 2, minute: 480 },
    scenes: [],
    garden: { '14,3': { crop: 'herb', grown: 0, wateredDay: null } } as never,
    notebook: { ...s0.notebook, met: CONTENT.neighbors.map((n) => n.id) },
    flags: { ...s0.flags, villageLevel: 10, ...Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1])) },
    life: { ...s0.life, seen: Object.values(PEOPLE.people).flatMap((p) => (p.events ?? []).map((e) => e.id)) },
  }
  useGame.setState({ game: s })
  const C = T.clubs
  render(<ClubForm onClose={() => {}} />)
  fireEvent.click(screen.getByText(T.plans.activity.garden))
  fireEvent.click(screen.getByText(C.nextButton))
  fireEvent.click(screen.getByText(T.plans.place.garden))
  fireEvent.click(screen.getByText(C.back))
  fireEvent.click(screen.getByText(T.plans.activity.tea))
  fireEvent.click(screen.getByText(C.nextButton))
  const picked = [...document.querySelectorAll('.actions.menu.column button.primary')].map((b) => b.textContent)
  expect(picked).toHaveLength(1)
  expect(clubVenues(s, 'tea').map((p) => T.plans.place[p as keyof typeof T.plans.place])).toContain(picked[0])
  fireEvent.click(screen.getByText(C.nextButton))
  fireEvent.click(document.querySelector('input[type="checkbox"]:not([disabled])') as HTMLInputElement)
  fireEvent.click(screen.getByText(C.nextButton))
  fireEvent.click(screen.getByText(C.nextButton))
  fireEvent.click(screen.getByText(C.save))
  expect(screen.queryByRole('alert')?.textContent).not.toBe(C.errors.venue)
})
