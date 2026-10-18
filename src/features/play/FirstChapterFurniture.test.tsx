import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { copyVerses } from '../../engine/copying'
import { newGame, placeFurniture, writeVerse } from '../../engine/game'
import { facingOf } from '../../engine/room'
import { deserialize, serialize } from '../../engine/save'
import { HOME_ENTRY } from '../../engine/world'
import { facingArt } from '../../render/furniture-facing'
import { useGame } from '../../store/game-store'
import { DecorateBar } from './DecorateBar'

it('첫 장을 마쳐 받은 가구를 놓고 회전 단추로 네 모습을 바꾸며 저장한다', () => {
  const fresh = newGame(CONTENT)
  const last = copyVerses('phm', 1, CONTENT).at(-1)!
  const done = writeVerse({ ...fresh, copy: { ...fresh.copy, at: { phm: { chapter: 1, verse: last.verse } } } }, 'phm', last.text, CONTENT)
  expect(done.state.inv.stool).toBe(1)
  const placed = placeFurniture({ ...done.state, player: { ...done.state.player, ...HOME_ENTRY, path: [] }, scenes: [] }, 'stool', { x: 20, y: 112 })!
  expect(placed).not.toBeNull()
  const stool = placed.room.find(f => f.item === 'stool')!
  useGame.setState({ game: placed, decorating: 'pick', decorSel: stool, modal: null, piecePopups: [], copyResult: null })
  render(<DecorateBar />)
  const seen: string[] = []
  for (const facing of ['right', 'up', 'left', 'down']) {
    fireEvent.click(screen.getByRole('button', { name: T.ui.decorateTurn }))
    const game = useGame.getState().game
    const turned = game.room.find(f => f.item === 'stool')!
    expect(facingOf(turned)).toBe(facing)
    expect(turned).toMatchObject({ x: stool.x, y: stool.y })
    seen.push(facingArt('stool', facingOf(turned))!.rows.join('\n'))
    expect(facingOf(deserialize(serialize(game), CONTENT)!.room.find(f => f.item === 'stool')!)).toBe(facing)
  }
  expect(new Set(seen).size).toBe(4)
})


it('설치하기 전에 고른 방향이 설치·미리보기·저장에 반영된다', () => {
  const fresh = newGame(CONTENT)
  const game = { ...fresh, scenes: [], flags: { ...fresh.flags, growthLegacy: 1 }, inv: { table: 4 }, player: { ...fresh.player, ...HOME_ENTRY, path: [] } }
  useGame.setState({ game, decorating: null, decorSel: null, modal: null, piecePopups: [], copyResult: null })
  act(() => useGame.getState().startDecorate('table'))
  render(<DecorateBar />)
  const directions = screen.getByRole('group', { name: '설치할 가구 방향' })
  fireEvent.click(within(directions).getByRole('button', { name: '오른쪽' }))
  expect(within(directions).getByRole('button', { name: '오른쪽' })).toHaveAttribute('aria-pressed', 'true')
  expect(directions.querySelector('canvas')).toHaveAttribute('width', '16')
  expect(directions.querySelector('canvas')).toHaveAttribute('height', '32')
  // 식탁은 아래쪽 벽에서 가로로는 놓여도 오른쪽(세로 2칸)으로는 벽 밖이라 실패한다.
  act(() => useGame.getState().tap({ x: 20, y: 114 }))
  expect(useGame.getState().game.inv.table).toBe(4)
  act(() => useGame.getState().tap({ x: 21, y: 112 }))
  const placed = useGame.getState().game
  const table = placed.room.find(f => f.item === 'table')!
  expect(table).toMatchObject({ x: 21, y: 112, facing: 'right' })
  expect(placed.inv.table).toBe(3)
  expect(deserialize(serialize(placed), CONTENT)!.room.find(f => f.item === 'table')?.facing).toBe('right')
})


it.each(['homeShelf', 'homeCoolCupboard'] as const)('%s를 설치할 때 네 방향을 고를 수 있다', (item) => {
  const fresh = newGame(CONTENT)
  useGame.setState({ game: { ...fresh, scenes: [], flags: { ...fresh.flags, growthLegacy: 1 }, inv: { [item]: 1 } }, decorating: null, decorSel: null, modal: null, piecePopups: [], copyResult: null })
  act(() => useGame.getState().startDecorate(item))
  render(<DecorateBar />)
  const group = screen.getByRole('group', { name: '설치할 가구 방향' })
  expect(within(group).getAllByRole('button')).toHaveLength(4)
  for (const name of ['아래', '오른쪽', '위', '왼쪽']) {
    fireEvent.click(within(group).getByRole('button', { name }))
    expect(within(group).getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
  }
})
