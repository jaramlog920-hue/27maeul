import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame } from '../../engine/game'
import { GARDEN_TILES } from '../../engine/garden'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { GardenMenu } from './GardenMenu'

const at = GARDEN_TILES[0]
const other = GARDEN_TILES[1]
const key = (t: typeof at) => `${t.x},${t.y}`

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), inv: { seedHerb: 2 } })
  useGame.setState({ piecePopups: [], toast: null })
})

describe('텃밭 작업 창', () => {
  it.each(['plant', 'water', 'harvest'] as const)('%s 완료 뒤 남은 다른 칸 입력은 작업하지 않는다', kind => {
    const base = useGame.getState().game
    const garden = kind === 'plant' ? {} : Object.fromEntries([at, other].map(t => [key(t), {
      crop: 'herb' as const, grown: kind === 'harvest' ? 3 : 0, wateredDay: null,
    }]))
    useGame.getState().load({ ...base, garden })
    useGame.setState({ modal: { kind: 'garden', at }, piecePopups: [] })
    render(<GardenMenu at={at} />)
    const name = kind === 'plant' ? new RegExp(T.ui.gardenPlantHerb)
      : kind === 'water' ? T.ui.gardenWater : new RegExp(T.ui.gardenHarvest)
    fireEvent.click(screen.getByRole('button', { name }))
    const done = useGame.getState().game
    expect(useGame.getState().modal).toBeNull()
    expect(done.clock.minute).toBe(base.clock.minute + 10)
    const toast = useGame.getState().toast
    act(() => {
      if (kind === 'plant') useGame.getState().plantAt(other, 'herb')
      else if (kind === 'water') useGame.getState().waterAt(other)
      else {
        useGame.getState().harvestAt(at)
        useGame.getState().harvestAt(other)
      }
    })
    expect(useGame.getState().game).toBe(done)
    expect(useGame.getState().toast).toBe(toast)
    const restored = deserialize(serialize(done), CONTENT)!
    expect(restored.garden).toEqual(done.garden)
    expect(restored.inv).toEqual(done.inv)
  })

  it('다른 칸의 작업 창에서는 씨앗을 쓰지 않는다', () => {
    useGame.setState({ modal: { kind: 'garden', at } })
    const before = useGame.getState().game
    useGame.getState().plantAt(other, 'herb')
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().modal).toEqual({ kind: 'garden', at })
  })
})
