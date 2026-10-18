import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { HOLD_DOWN, HOLD_UP, startMini } from '../../engine/minigame'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { MiniGame } from './MiniGame'

vi.mock('../../shared/ItemIcon', () => ({
  ItemIcon: ({ id }: { id: ItemId }) => <span role="img" aria-label={id} />,
}))

beforeEach(() => useGame.getState().load(newGame(CONTENT)))

it.each([
  ['child', 'water'],
  ['baker', 'bread'],
  ['poppy', 'herbTea'],
  ['presser', 'oil'],
  ['shepherd', 'wool'],
  ['beekeeper', 'honey'],
])('이웃 %s 돕기는 작업 결과물 %s 그림을 표시한다', (neighborId, icon) => {
  render(<MiniGame state={startMini('hold', () => 0)} pending={{ kind: 'help', neighborId }} />)
  expect(screen.getByRole('img', { name: icon })).toBeInTheDocument()
  if (icon !== 'wool') expect(screen.queryByRole('img', { name: 'wool' })).toBeNull()
})

it('윌로 물 그림 버튼은 기존 누르기·떼기 동작을 유지한다', () => {
  const miniTap = vi.fn()
  const original = useGame.getState().miniTap
  useGame.setState({ miniTap })
  try {
    render(<MiniGame state={startMini('hold', () => 0)} pending={{ kind: 'help', neighborId: 'child' }} />)
    const button = screen.getByRole('img', { name: 'water' }).closest('button')!
    fireEvent.pointerDown(button)
    fireEvent.pointerUp(button)
    expect(miniTap.mock.calls).toEqual([[HOLD_DOWN], [HOLD_UP]])
  } finally {
    useGame.setState({ miniTap: original })
  }
})

it('우물 채집과 빵 만들기의 기존 그림은 바뀌지 않는다', () => {
  const { rerender } = render(<MiniGame state={startMini('hold', () => 0)} pending={{ kind: 'gather', place: 'well' }} />)
  expect(screen.getByRole('img', { name: 'water' })).toBeInTheDocument()
  rerender(<MiniGame state={startMini('mash', () => 0)} pending={{ kind: 'craft', recipe: 'bread' }} />)
  expect(screen.getByRole('img', { name: 'bread' })).toBeInTheDocument()
})
