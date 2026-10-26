import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { copyRequestsToday, newGame as createGame, notYet } from '../../engine/game'
import { deserialize, serialize } from '../../engine/save'
import { ModalLayer } from '../ModalLayer'
import { REQUEST_PRESETS } from '../../engine/request-presets'
import { useGame } from '../../store/game-store'
import { BoardView } from './BoardView'

// 게시판 동작 검사는 정식 해금(마친 장 12장, 2026-10-13 장 수 기준) 상태에서 시작한다.
function newGame(content: typeof CONTENT) {
  const game = createGame(content)
  game.progress.mt = { completed: Array.from({ length: 12 }, (_, i) => i + 1), arrangement: {} }
  return game
}

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), collected: [], scenes: [] })
})

describe('새 저장의 게시판 성장 안내', () => {
  it('진행이 없으면 해금 목표를 보여 주고 의뢰를 전달할 수 없다', () => {
    useGame.getState().load({ ...createGame(CONTENT), scenes: [] })
    render(<BoardView />)
    expect(screen.getByRole('status')).toHaveTextContent('10장을 마치면 첫 부탁')
    expect(document.querySelectorAll('button.row')).toHaveLength(0)
  })

  it('10장을 마치면 기한 없는 첫 부탁 하나를 표시한다', () => {
    const game = createGame(CONTENT)
    game.progress.mt.completed = Array.from({ length: 10 }, (_, i) => i + 1)
    useGame.getState().load({ ...game, scenes: [] })
    render(<BoardView />)
    expect(screen.getByRole('status')).toHaveTextContent('한 번 체험')
    expect(document.querySelectorAll('button.row')).toHaveLength(1)
    expect(screen.getByText('첫 부탁 · 기한 없음')).toBeInTheDocument()
  })
})

describe('게시판 직접 필사', () => {
  it('필사 입력 중 다른 저장을 불러오면 창과 초안이 닫히고 새 저장에서 다시 선택한다', () => {
    const base = useGame.getState().game
    const req = copyRequestsToday(base, CONTENT)[0]
    act(() => useGame.setState({ modal: { kind: 'board' } }))
    render(<ModalLayer />)
    fireEvent.click(screen.getAllByRole('button').find(b => b.classList.contains('row') && b.getAttribute('aria-disabled') !== 'true')!)
    fireEvent.click(within(screen.getByRole('list', { name: '필사할 구절 5개' })).getAllByRole('button')[0])
    fireEvent.change(screen.getByRole('textbox', { name: '구절 필사' }), { target: { value: REQUEST_PRESETS[req.kind][0].text } })
    const oldButton = screen.getByRole('button', { name: '필사본 전달하기' })
    const restored = deserialize(serialize({ ...base, clock: { day: 30, minute: 600 }, coins: 123 }), CONTENT)!
    act(() => useGame.getState().load(restored))
    expect(screen.queryByRole('textbox', { name: '구절 필사' })).toBeNull()
    expect(useGame.getState().modal).toBeNull()
    fireEvent.click(oldButton)
    expect(useGame.getState().game).toBe(restored)
    act(() => useGame.setState({ modal: { kind: 'board' } }))
    expect(screen.queryByRole('textbox')).toBeNull()
    const list = copyRequestsToday(restored, CONTENT)
    expect(screen.getAllByRole('button').filter(b => b.classList.contains('row'))).toHaveLength(list.length)
    expect(useGame.getState().game.flags[`req:${req.id}`]).toBeUndefined()
  })

  it('입주 전후 저장 복원에서도 의뢰의 사람은 바뀌지 않고 미입주 이웃은 숨긴다', () => {
    const base = newGame(CONTENT)
    for (const day of [1, 10, 30, 100]) {
      const locked = deserialize(serialize({ ...base, clock: { day, minute: 600 } }), CONTENT)!
      const open = deserialize(serialize({ ...locked, flags: { ...locked.flags, villageLevel: 27,
        ...Object.fromEntries(CONTENT.neighbors.map(n => [`movedIn:${n.id}`, 1])) } }), CONTENT)!
      const before = copyRequestsToday(locked, CONTENT)
      const after = copyRequestsToday(open, CONTENT)
      for (const r of before) {
        const def = CONTENT.neighbors.find(n => n.id === r.npc)!
        expect(notYet(def, locked.flags.villageLevel ?? 0, locked.flags)).toBe(false)
        expect(def.marketOnly).toBeFalsy()
        expect(after.find(x => x.id === r.id)).toEqual(r)
      }
      expect(copyRequestsToday(deserialize(serialize(locked), CONTENT)!, CONTENT)).toEqual(before)
    }
  })
  it.each(['expired', 'done'] as const)('선택한 부탁이 %s 상태로 바뀌면 전달 단추도 비활성화한다', (reason) => {
    const base = useGame.getState().game
    const req = copyRequestsToday(base, CONTENT)[0]
    render(<BoardView />)
    fireEvent.click(screen.getAllByRole('button').find(b => b.classList.contains('row') && b.getAttribute('aria-disabled') !== 'true')!)
    fireEvent.click(within(screen.getByRole('list', { name: '필사할 구절 5개' })).getAllByRole('button')[0])
    fireEvent.change(screen.getByRole('textbox', { name: '구절 필사' }), { target: { value: REQUEST_PRESETS[req.kind][0].text } })
    expect(screen.getByRole('button', { name: '필사본 전달하기' })).toBeEnabled()
    const changed = reason === 'expired'
      ? { ...base, clock: { ...base.clock, day: req.until + 1 } }
      : { ...base, flags: { ...base.flags, [`req:${req.id}`]: 3 } }
    act(() => useGame.setState({ game: changed }))
    expect(screen.getByRole('button', { name: '필사본 전달하기' })).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByRole('button', { name: '필사본 전달하기' }))
    expect(useGame.getState().game).toBe(changed)
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.queryByRole('textbox')).toBeNull()
  })
  it('말씀조각이 있어도 대체 전달은 없고 마을 일의 설명 문구도 없다', () => {
    let base = useGame.getState().game
    for(let day=1;day<=30&&!copyRequestsToday(base,CONTENT).some(r=>!r.cond);day++)base={...base,clock:{...base.clock,day}}
    const req=copyRequestsToday(base,CONTENT).find(r=>!r.cond)!
    const flags=Object.fromEntries(copyRequestsToday(base,CONTENT).filter(r=>r.id!==req.id).map(r=>[`req:${r.id}`,3]))
    useGame.getState().load({...base,collected:[CONTENT.pieces[0].id],flags:{...base.flags,...flags}})
    render(<BoardView />)
    fireEvent.click(screen.getAllByRole('button').find(b=>b.classList.contains('row')&&b.getAttribute('aria-disabled')!=='true')!)
    expect(screen.queryByText('모은 말씀조각으로 전달하기')).toBeNull()
    expect(screen.getByRole('list',{name:'필사할 구절 5개'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'뒤로'}))
    fireEvent.click(screen.getByRole('button',{name:'마을 일'}))
    expect(screen.queryByText('안을 누르면 이웃들의 의견과 필요한 일을 볼 수 있어요.')).toBeNull()
  })
  it('조건 의뢰에서 다섯 구절 → 직접 입력 → 실제 호감도 표시, 재전달 방지', () => {
    let base = useGame.getState().game
    for (let day = 1; day <= 30 && !copyRequestsToday(base, CONTENT).some((r) => r.cond); day++) {
      base = { ...base, clock: { ...base.clock, day } }
    }
    const req = copyRequestsToday(base, CONTENT).find((r) => r.cond)!
    const otherFlags = Object.fromEntries(copyRequestsToday(base, CONTENT).filter((r) => r.id !== req.id).map((r) => [`req:${r.id}`, 3]))
    useGame.getState().load({ ...base, flags: { ...base.flags, ...otherFlags } })
    render(<BoardView />)
    fireEvent.click(screen.getAllByRole('button').find((b) => b.classList.contains('row') && b.getAttribute('aria-disabled') !== 'true')!)
    const list = screen.getByRole('list', { name: '필사할 구절 5개' })
    expect(within(list).getAllByRole('button')).toHaveLength(5)
    fireEvent.click(within(list).getAllByRole('button')[0])
    const submit = screen.getByRole('button', { name: '필사본 전달하기' })
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByText('위 구절을 직접 입력해 주세요')).toBeNull()
    expect(screen.queryByText(/띄어쓰기와 줄바꿈/)).toBeNull()
    fireEvent.change(screen.getByRole('textbox', { name: '구절 필사' }), { target: { value: '오타' } })
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    // 막힌 채 누르면 어디가 다른지 알려 준다 (2026-10-26 감사 A09)
    fireEvent.click(submit)
    expect(useGame.getState().toast?.text).toBe('1번째 글자가 본문과 달라요.')
    // 붙여넣기는 받지 않는다 (A14)
    const pasted = fireEvent.paste(screen.getByRole('textbox', { name: '구절 필사' }))
    expect(pasted).toBe(false)
    const before = useGame.getState().game.hearts[req.npc] ?? 0
    fireEvent.change(screen.getByRole('textbox', { name: '구절 필사' }), { target: { value: REQUEST_PRESETS[req.kind][0].text } })
    expect(submit).not.toHaveAttribute('aria-disabled')
    fireEvent.click(submit)
    const gain = (useGame.getState().game.hearts[req.npc] ?? 0) - before
    expect(screen.getByRole('status')).toHaveTextContent(`호감도 +${gain}`)
    expect(screen.getByRole('dialog')).not.toHaveTextContent('★')
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getAllByRole('button').filter((b) => b.classList.contains('row')).every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true)
  })
})
