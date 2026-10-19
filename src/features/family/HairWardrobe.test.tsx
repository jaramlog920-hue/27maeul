import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { HAIR_BACKS, HAIR_FRONTS, withLookDefaults } from '../../engine/avatar'
import { newGame } from '../../engine/game'
import { loadGame, saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { AvatarForm } from '../intro/AvatarForm'
import { Wardrobe } from './Wardrobe'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: vi.fn(), fillRect: vi.fn() } as unknown as CanvasRenderingContext2D)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('주인공 만들기에서 마지막 새 앞머리·뒷머리까지 고르고 확정한다', () => {
  const onDone = vi.fn()
  render(<AvatarForm onDone={onDone} onBack={vi.fn()} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '새봄' } })
  fireEvent.click(screen.getByRole('button', { name: `${T.avatar.rows.hairFront} 이전` }))
  // 기본 여자 뒷머리는 1번이므로 이전을 두 번 누르면 마지막으로 돌아간다.
  fireEvent.click(screen.getByRole('button', { name: `${T.avatar.rows.hairBack} 이전` }))
  fireEvent.click(screen.getByRole('button', { name: `${T.avatar.rows.hairBack} 이전` }))
  expect(screen.getByText(HAIR_FRONTS.at(-1)!)).toBeTruthy()
  expect(screen.getByText(HAIR_BACKS.at(-1)!)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: T.avatar.ok }))
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ name: '새봄', hairFront: 21, hairBack: 20 }))
})

it('옷장에서 새 스타일 전체를 차례로 선택하고 입힌 뒤 저장·불러오기로 유지한다', () => {
  useGame.setState({ game: newGame(CONTENT, withLookDefaults({ name: '새봄', look: 'm', hairFront: 11, hairBack: 10 })), modal: null })
  render(<Wardrobe who="me" />)
  for (let i = 0; i < 10; i++) {
    fireEvent.click(screen.getByRole('button', { name: `${T.avatar.rows.hairFront} 다음` }))
    fireEvent.click(screen.getByRole('button', { name: `${T.avatar.rows.hairBack} 다음` }))
    expect(screen.getByText(HAIR_FRONTS[12 + i])).toBeTruthy()
    expect(screen.getByText(HAIR_BACKS[11 + i])).toBeTruthy()
  }
  fireEvent.click(screen.getByRole('button', { name: '이대로 입기' }))
  const game = useGame.getState().game
  expect(game.avatar).toMatchObject({ hairFront: 21, hairBack: 20, name: '새봄', look: 'm' })
  expect(saveGame(game, localStorage)).toBe(true)
  expect(loadGame(CONTENT, localStorage)?.avatar).toMatchObject({ hairFront: 21, hairBack: 20, name: '새봄', look: 'm' })
})
