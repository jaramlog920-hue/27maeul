import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, pieceById } from '../../content/catalog'
import { newGame, READ_MINUTES } from '../../engine/game'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

const id = 'mk-002-001'
const other = 'mk-001-001'
function openRead(collected: string[]) {
  localStorage.clear()
  const s = newGame(CONTENT)
  useGame.getState().load({ ...s, scenes: [], collected, rereads: [id, other], needs: { ...s.needs, fatigue: 80 } })
  useGame.setState({ modal: { kind: 'readPick' }, piecePopups: [], copyResult: null })
  render(<ModalLayer />)
}

describe('벤치의 다시 읽을 구절', () => {
  it('퀴즈에서 틀린 조각은 아직 수집하지 않아도 읽고 해당 표시만 지울 수 있다', () => {
    openRead([])
    const before = useGame.getState().game
    fireEvent.click(screen.getByRole('button', { name: new RegExp(pieceById(id).title) }))
    const after = useGame.getState().game
    expect(useGame.getState().modal).toMatchObject({ kind: 'passage', pieceId: id })
    expect(screen.getByRole('dialog', { name: pieceById(id).title })).toBeInTheDocument()
    expect(after.rereads).toEqual([other])
    expect(after.collected).toEqual([])
    expect(after.clock.minute).toBe(before.clock.minute + READ_MINUTES)
    const back = deserialize(serialize(after), CONTENT)!
    expect(back.rereads).toEqual([other])
    expect(back.collected).toEqual([])
  })

  it('본문을 읽고 난 뒤 늦은 선택 입력은 시간을 더 쓰거나 다른 다시 읽기 표시를 지우지 않는다', () => {
    openRead([id, other])
    fireEvent.click(screen.getByRole('button', { name: new RegExp(pieceById(id).title) }))
    const after = useGame.getState().game
    const modal = useGame.getState().modal
    act(() => { useGame.getState().readAt(id); useGame.getState().readAt(other) })
    expect(useGame.getState().game).toBe(after)
    expect(useGame.getState().modal).toBe(modal)
    expect(after.rereads).toEqual([other])
    act(() => useGame.getState().closeModal())
    act(() => useGame.getState().readAt(other))
    expect(useGame.getState().game).toBe(after)
  })
})
