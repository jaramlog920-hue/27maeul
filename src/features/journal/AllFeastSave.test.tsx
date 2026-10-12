import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { SCENES, T } from '../../content/text'
import { goToSleep, newGame, type GameState } from '../../engine/game'
import { chaptersOf } from '../../engine/books'
import { allShelved } from '../../engine/library'
import { deserialize, serialize } from '../../engine/save'
import { BOOKS } from '../../engine/types'
import { albumImage, useGame } from '../../store/game-store'
import { SceneView } from '../scene/SceneView'

const reload = (s: GameState) => deserialize(serialize(s), CONTENT)!
beforeEach(() => { localStorage.clear(); useGame.setState({ capture: null }) })
afterEach(() => useGame.setState({ capture: null }))

it('27권 완료 저장에서 아침·저녁 잔치를 보고 복원해도 앨범 한 장과 진행을 보존한다', () => {
  const base = newGame(CONTENT)
  const completed = Object.fromEntries(BOOKS.map(b => [b, { completed: chaptersOf(b, CONTENT), arrangement: {} }])) as GameState['progress']
  const ready = reload({ ...base, progress: completed, shelved: Object.fromEntries(BOOKS.map(b => [b, 1])) as GameState['shelved'],
    scenes: [], clock: { day: 2, minute: 1320 }, flags: { ...base.flags, gospelFeast: 2, churchesDone: 1 } })
  expect(allShelved(ready)).toBe(true)
  let morning = reload(goToSleep(ready, CONTENT))
  expect(morning.flags.allFeast).toBe(1)
  expect(morning.flags.allFeastDay).toBe(3)
  expect(morning.scenes).toContain('allFeast')
  useGame.getState().load({ ...morning, scenes: ['allFeast'] })
  useGame.setState({ piecePopups: [], capture: () => 'data:image/png;base64,bW9ybmluZw==' })
  useGame.getState().frame(0)
  const seen = (id: string) => {
    const view = render(<SceneView id={id} />)
    for (let i = 1; i < SCENES[id].lines.length; i++) fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    view.unmount()
  }
  seen('allFeast')
  morning = reload(useGame.getState().game)
  expect(morning.album.filter(a => a.id === 'allFeast')).toEqual([{ id: 'allFeast', day: 3 }])
  const evening = { ...morning, scenes: [], clock: { day: 3, minute: 1111 }, player: { ...morning.player, x: 24, y: 19, path: [] } }
  useGame.getState().load(evening)
  useGame.setState({ piecePopups: [], capture: () => 'data:image/png;base64,ZmlyZQ==' })
  act(() => useGame.getState().frame(0.05))
  expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'allFeastFire' })
  seen('allFeastFire')
  const after = reload(useGame.getState().game)
  expect(after.album.filter(a => a.id.startsWith('allFeast'))).toEqual([{ id: 'allFeast', day: 3 }])
  expect(albumImage('allFeast')).toBe('data:image/png;base64,ZmlyZQ==')
  expect(after.todayNotes).toContain('allFeastFire')
  let later = after
  for (let days = 0; days < 3; days++) {
    later = reload(goToSleep({ ...later, scenes: [] }, CONTENT))
    expect(later.flags.allFeast).toBe(2)
    expect(later.scenes.some(id => id.startsWith('allFeast'))).toBe(false)
    expect(allShelved(later)).toBe(true)
    expect(later.progress).toEqual(ready.progress)
  }
  useGame.setState({ capture: null })
})
