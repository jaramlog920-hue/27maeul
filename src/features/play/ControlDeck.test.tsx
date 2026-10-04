import { act, fireEvent, render } from '@testing-library/react'
import { vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { HOME_FRONT } from '../../engine/world'
import { loadDeck, useGame } from '../../store/game-store'
import { ControlDeck } from './ControlDeck'
import { Joystick } from './Joystick'

beforeEach(() => {
  localStorage.clear()
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null, deck: true, joystick: true })
})

describe('아래 조작판', () => {
  it('처음엔 켜져 있고, 끄면 끈 채로 불러온다', () => {
    expect(loadDeck()).toBe(true)
    act(() => useGame.getState().setDeck(false))
    expect(loadDeck()).toBe(false)
  })
  it('십자 단추·확인·메뉴(가방/일지/설정), 몸 상태 눈금이 있다', () => {
    const { container, getByText } = render(<ControlDeck />)
    expect(container.querySelector('.deck-pad [data-zone="up"]')).not.toBeNull()
    expect(container.querySelectorAll('.deck-need').length).toBeGreaterThanOrEqual(3)
    act(() => getByText('메뉴').click())
    act(() => getByText('가방').click())
    expect(useGame.getState().modal).toEqual({ kind: 'bag' })
  })
  it('메뉴는 말씀·가방·일지·가족·설정 (+집 안이면 집 꾸미기) — 선반은 없다', () => {
    const { getByText, getAllByRole } = render(<ControlDeck />)
    act(() => getByText('메뉴').click())
    expect(getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['말씀', '가방', '일지', '가족', '집 꾸미기', '설정'])
    act(() => getByText('메뉴').click())
    act(() => useGame.setState((s) => ({ game: { ...s.game, player: { ...s.game.player, ...HOME_FRONT, path: [] } } })))
    act(() => getByText('메뉴').click())
    const items = getAllByRole('menuitem').map((b) => b.textContent)
    expect(items).toEqual(['말씀', '가방', '일지', '가족', '설정'])
    expect(items.join()).not.toContain('선반')
  })
  it('메뉴의 말씀만 아이콘 없이 진한 색 단추 (다른 메뉴는 보통 색)', () => {
    const { getByText, getAllByRole } = render(<ControlDeck />)
    act(() => getByText('메뉴').click())
    const [word, ...rest] = getAllByRole('menuitem')
    expect(word.textContent).toBe('말씀')
    expect(word).toHaveClass('menu-word')
    for (const b of rest) expect(b).not.toHaveClass('menu-word')
  })
  it('확인 단추는 바라보는 앞을 누른다', () => {
    const press = vi.fn()
    useGame.setState({ press })
    const { container } = render(<ControlDeck />)
    fireEvent.pointerDown(container.querySelector('.deck-seal')!)
    expect(press).toHaveBeenCalledTimes(1)
  })
  it('조작판을 쓰면 떠 있는 조이스틱은 숨는다', () => {
    const { container } = render(<Joystick />)
    expect(container.querySelector('.joystick')).toBeNull()
  })
})
