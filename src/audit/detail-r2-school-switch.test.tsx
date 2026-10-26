import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newChild } from '../engine/child'
import { canSchool, SCHOOL_FEE } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { PLACES } from '../engine/world'
import { SchoolView } from '../features/child/SchoolView'
import { useGame } from '../store/game-store'

function ready() {
  const base = legacyGame(CONTENT)
  const game = { ...base, scenes: [], clock: { day: 100, minute: 600 }, coins: 100,
    child: { ...newChild(40, base.stats, undefined), name: '가람' },
    siblings: [{ ...newChild(50, base.stats, undefined), name: '나래' }],
    flags: { ...base.flags, schoolDay: 100 }, player: { ...base.player, ...PLACES.learnTable.stand!, path: [] } }
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'school' }, toast: null })
  return game
}
function clickFirst() { fireEvent.click(screen.getAllByRole('button', { name: '맡기기' })[0]) }
beforeEach(() => { localStorage.clear(); setActiveSlot('1') })
afterEach(cleanup)

describe('R2 school sibling attendance boundary', () => {
  it('fixture-only switch under an open school view updates name, disabled state and payment target', () => {
    const initial = ready()
    render(<SchoolView />)
    const staleButton = screen.getAllByRole('button', { name: '맡기기' })[0]
    expect(staleButton).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('오늘은 이미 맡겼어요.')).toBeVisible()
    act(() => useGame.getState().selectKid(50))
    expect(canSchool(useGame.getState().game)).toBeNull()
    expect(staleButton).toBeEnabled()
    expect(document.querySelector('.school')).toHaveTextContent('나래')
    expect(document.querySelector('.school')).not.toHaveTextContent('가람')
    fireEvent.click(staleButton)
    const paid = useGame.getState().game
    expect(paid.coins).toBe(100 - SCHOOL_FEE)
    expect(paid.child?.born).toBe(50)
    expect(paid.child!.stats.wit.xp).toBeGreaterThan(initial.siblings[0].stats.wit.xp)
    expect(paid.child!.stats.strength).toEqual(initial.siblings[0].stats.strength)
    expect(paid.siblings?.find(k => k.born === 40)?.stats).toEqual(initial.child.stats)
    expect(paid.flags.schoolDay).toBe(100)
  })

  it('switching to an already enrolled sibling keeps fee and both children unchanged on stale action', () => {
    ready(); useGame.getState().selectKid(50)
    render(<SchoolView />)
    const button = screen.getAllByRole('button', { name: '맡기기' })[0]
    expect(button).toBeEnabled()
    act(() => useGame.getState().selectKid(40))
    expect(button).toHaveAttribute('aria-disabled', 'true')
    clickFirst()
    useGame.getState().goSchool('strength')
    expect(useGame.getState().game.coins).toBe(100)
    expect(canSchool(useGame.getState().game)).toBe('done')
  })

  it('cancel after switching and save/reload retain separate attendance markers', () => {
    ready(); useGame.getState().selectKid(50)
    render(<SchoolView />)
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().game.coins).toBe(100)
    const restored = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(restored.child?.born).toBe(50)
    expect(restored.flags.schoolDay).toBeUndefined()
    expect(restored.siblings?.find(k => k.born === 40)?.kidFlags?.schoolDay).toBe(100)
    act(() => useGame.getState().load(restored))
    expect(canSchool(useGame.getState().game)).toBeNull()
    act(() => useGame.getState().selectKid(40))
    expect(canSchool(useGame.getState().game)).toBe('done')
  })

  it('enroll second child only once and restore both days with no duplicate payment', () => {
    ready(); useGame.getState().selectKid(50); useGame.getState().goSchool('strength')
    useGame.getState().goSchool('hand')
    expect(useGame.getState().game.coins).toBe(100 - SCHOOL_FEE)
    const restored = deserialize(serialize(useGame.getState().game), CONTENT)!
    act(() => useGame.getState().load(restored))
    expect(canSchool(useGame.getState().game)).toBe('done')
    act(() => useGame.getState().selectKid(40))
    expect(canSchool(useGame.getState().game)).toBe('done')
    expect(useGame.getState().game.coins).toBe(100 - SCHOOL_FEE)
  })

  it('fixture-only next day reopens attendance for each sibling independently', () => {
    ready(); useGame.getState().selectKid(50); useGame.getState().goSchool('strength')
    const g = useGame.getState().game
    act(() => useGame.setState({ game: { ...g, clock: { day: 101, minute: 600 } } }))
    render(<SchoolView />)
    expect(screen.getAllByRole('button', { name: '맡기기' })[0]).toBeEnabled()
    clickFirst()
    expect(useGame.getState().game.coins).toBe(100 - 2 * SCHOOL_FEE)
    act(() => useGame.getState().selectKid(40))
    expect(canSchool(useGame.getState().game)).toBeNull()
    clickFirst()
    expect(useGame.getState().game.coins).toBe(100 - 3 * SCHOOL_FEE)
    expect(useGame.getState().game.flags.schoolDay).toBe(101)
  })
})
