import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { SCENES } from '../../content/text'
import { newGame } from '../../engine/game'
import { albumPrefix, deserialize, serialize, setActiveSlot } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { Journal } from './Journal'

const id = 'done:baker:1'
const title = SCENES[id].album!
beforeEach(() => {
  localStorage.clear()
  setActiveSlot('1')
  useGame.getState().load({ ...newGame(CONTENT), scenes: [id], clock: { day: 6, minute: 600 } })
  useGame.setState({ piecePopups: [], capture: null, modal: null })
})
afterEach(() => { useGame.setState({ capture: null }); setActiveSlot('1'); vi.restoreAllMocks() })

it('장면을 보기 전엔 앨범이 비고 본 뒤 저장 복원해도 날짜/기록이 한 번만 남는다', () => {
  expect(useGame.getState().game.album).toEqual([])
  useGame.getState().frame(0)
  expect(useGame.getState().modal).toEqual({ kind: 'scene', id })
  expect(useGame.getState().game.album).toEqual([])
  useGame.getState().nextScene()
  const done = useGame.getState().game
  expect(done.album).toEqual([{ id, day: 6 }])
  useGame.getState().nextScene()
  expect(useGame.getState().game).toBe(done)
  useGame.getState().load(deserialize(serialize(done), CONTENT)!)
  render(<Journal />)
  fireEvent.click(screen.getByRole('tab', { name: '앨범' }))
  expect(screen.getByText(new RegExp(title))).toHaveTextContent('6')
  expect(screen.queryAllByRole('img')).toHaveLength(0)
})

it.each(['1', '2'])('저장 칸 %s의 사진만 표시하고 다른 칸 사진과 섞지 않는다', slot => {
  setActiveSlot(slot)
  const data = `data:image/png;base64,${slot === '1' ? 'MQ==' : 'Mg=='}`
  const other = slot === '1' ? '2' : '1'
  localStorage.setItem(`${albumPrefix(other)}${id}`, 'data:image/png;base64,b3RoZXI=')
  useGame.setState({ capture: () => data })
  useGame.getState().frame(0)
  useGame.getState().nextScene()
  const saved = deserialize(serialize(useGame.getState().game), CONTENT)!
  useGame.getState().load(saved)
  render(<Journal tab="album" />)
  expect(screen.getByRole('img', { name: title })).toHaveAttribute('src', data)
  expect(localStorage.getItem(`${albumPrefix(other)}${id}`)).toBe('data:image/png;base64,b3RoZXI=')
})

it('사진 저장이 실패해도 장면 진행과 글로 된 앨범 기록은 남는다', () => {
  const original = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key.startsWith(albumPrefix())) throw new DOMException('quota', 'QuotaExceededError')
    original.call(this, key, value)
  })
  useGame.setState({ capture: () => 'data:image/png;base64,MQ==' })
  expect(() => useGame.getState().frame(0)).not.toThrow()
  useGame.getState().nextScene()
  const done = deserialize(serialize(useGame.getState().game), CONTENT)!
  expect(done.album).toEqual([{ id, day: 6 }])
  useGame.getState().load(done)
  render(<Journal tab="album" />)
  expect(screen.getByText(new RegExp(title))).toBeInTheDocument()
  expect(screen.queryByRole('img')).toBeNull()
})

it('사진은 한 번 더 물은 뒤에만 지워지고, 지우면 사진도 저장소에서 빠진다 (2026-10-13)', () => {
  useGame.setState({ capture: () => 'data:image/png;base64,MQ==' })
  useGame.getState().frame(0)
  useGame.getState().nextScene()
  expect(localStorage.getItem(`${albumPrefix()}${id}`)).not.toBeNull()
  render(<Journal />)
  fireEvent.click(screen.getByRole('tab', { name: '앨범' }))
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${title} 지우기`) }))
  fireEvent.click(screen.getByRole('button', { name: '그대로' }))
  expect(useGame.getState().game.album).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${title} 지우기`) }))
  fireEvent.click(screen.getByRole('button', { name: '지울게요' }))
  expect(useGame.getState().game.album).toEqual([])
  expect(localStorage.getItem(`${albumPrefix()}${id}`)).toBeNull()
})
