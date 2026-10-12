import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { ensureOtBook } from '../../content/ot-catalog'
import { T } from '../../content/text'
import { copiedChapters } from '../../engine/copied-reading'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), scenes: [] })
})

describe('정자에서 내가 필사한 모든 말씀 읽기', () => {
  it('모은 조각이 없어도 완성한 장과 쓰는 중인 장의 기록한 절을 읽는다', async () => {
    const base = useGame.getState().game
    useGame.getState().load({ ...base, progress: { ...base.progress, mt: { ...base.progress.mt, completed: [5] } }, copy: { ...base.copy, book: 'eph', copied: { mt: [5] }, at: { eph: { chapter: 1, verse: 4, draft: '미완성 입력' } } } })
    useGame.getState().open({ kind: 'menu', place: 'pavilion' })
    render(<ModalLayer />)
    expect(screen.queryByRole('button', { name: T.places.sit })).toBeNull()
    const read = screen.getByRole('button', { name: T.ui.readScripture })
    expect(read).toBeEnabled()
    fireEvent.click(read)
    expect(screen.getByRole('button', { name: /마태복음 5장/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /에베소서 1장/ }))
    const passage = await screen.findByRole('region', { name: '필사한 본문 · 에베소서 1장' })
    expect(passage.querySelectorAll('p')).toHaveLength(3)
    expect(passage).not.toHaveTextContent('미완성 입력')
    fireEvent.click(screen.getByRole('button', { name: '필사 목록으로' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mt' } })
    expect(screen.queryByRole('button', { name: /에베소서/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /마태복음 5장/ }))
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveAccessibleName('마태복음 5장'))
    expect(screen.getByRole('region').querySelectorAll('p')).toHaveLength(48)
  })
  it('구약 필사도 펼칠 때 본문을 불러와 마친 절까지만 보여 준다', async () => {
    const base = useGame.getState().game
    useGame.getState().load({ ...base, flags: { ...base.flags, newlandGift: 1 }, copy: { ...base.copy, book: 'gen', at: { gen: { chapter: 1, verse: 3 } } } })
    useGame.getState().open({ kind: 'readPick', source: 'copied' })
    render(<ModalLayer />)
    fireEvent.click(screen.getByRole('button', { name: /창세기 1장/ }))
    const passage = await screen.findByRole('region', { name: '필사한 본문 · 창세기 1장' })
    expect(passage).toHaveTextContent('태초에 하나님이 천지를 창조하시니라')
    expect(passage.querySelectorAll('p')).toHaveLength(2)
  })
  it('옛 조각 엮기로 마친 장을 직접 필사했다고 표시하지 않는다', () => {
    const base = useGame.getState().game
    expect(copiedChapters({ ...base, progress: { ...base.progress, mt: { ...base.progress.mt, completed: [1] } } }, CONTENT)).toEqual([])
  })
  it('캐릭터에서는 쉬기 버튼을 숨기고 피로만으로 돌봄 메뉴를 열지 않는다', () => {
    const base = useGame.getState().game
    useGame.getState().load({ ...base, needs: { ...base.needs, hunger: 0, fatigue: 80, cold: 0, heat: 0 } })
    act(() => useGame.getState().tap({ x: Math.round(base.player.x), y: Math.round(base.player.y) }))
    expect(useGame.getState().modal).toBeNull()
    act(() => useGame.getState().open({ kind: 'care' }))
    render(<ModalLayer />)
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: T.ui.careRest })).toBeNull()
    const fatigue = useGame.getState().game.needs.fatigue
    act(() => useGame.getState().rest())
    expect(useGame.getState().game.needs.fatigue).toBe(fatigue)
  })
  it('구약 본문 없는 절은 목록에 억지로 넣지 않는다', async () => {
    await ensureOtBook('deu')
    const base = useGame.getState().game
    const next = { ...base, copy: { ...base.copy, at: { deu: { chapter: 6, verse: 20 } } } }
    useGame.getState().load(next)
    useGame.getState().open({ kind: 'readPick', source: 'copied' })
    render(<ModalLayer />)
    fireEvent.click(screen.getByRole('button', { name: /신명기 6장/ }))
    const passage = await screen.findByRole('region')
    expect(passage.querySelectorAll('sup')).toHaveLength(18)
  })
})
