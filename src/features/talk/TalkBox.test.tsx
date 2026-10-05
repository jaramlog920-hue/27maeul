// 편지 나르는 이웃: 말을 걸면 편지를 바로 건넨다 (2026-10-05, 편지 받기 단추 없음). 아침 방문 말이 있어도 편지 말이 가려지지 않는다 (계획 7 작업 2 검토 이월, 계획 14 작업 5 드문 편지)
import { act, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame } from '../../engine/game'
import { POSTMAN } from '../../engine/post'
import { postLine, useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

/** 오늘 편지(말씀 조각 하나)가 온 날 */
function withPost() {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], post: ['rom-001'] }
}

describe('편지 나르는 이웃과의 대화', () => {
  it('말을 걸면 편지를 바로 받는다 — 편지 받기 단추 없이, 대화에 편지 말 한 줄', () => {
    const game = withPost()
    expect(postLine(game, POSTMAN)).toBe(T.word.letterBring)
    useGame.getState().load(game)
    render(<ModalLayer />)
    act(() => useGame.getState().talkTo(POSTMAN))
    const g = useGame.getState().game
    expect(g.post).toEqual([])
    expect(g.collected).toContain('rom-001')
    expect(useGame.getState().modal).toMatchObject({ kind: 'talk', neighborId: POSTMAN, letter: T.word.letterBring })
    expect(screen.getByText(T.word.letterBring)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /편지 받기/ })).not.toBeInTheDocument()
    expect(useGame.getState().toast?.text).toContain('말씀 탭에 담겼어요')
    // 다시 말을 걸어도 두 번 받지 않고, 편지 말도 없다
    act(() => useGame.getState().talkTo(POSTMAN))
    expect(useGame.getState().game.collected.filter((id) => id === 'rom-001')).toHaveLength(1)
    expect(useGame.getState().modal).not.toHaveProperty('letter')
  })

  it('편지 책이 아닌 조각 하나짜리 편지는 그 말과 함께 본문 창이 바로 열린다', () => {
    useGame.getState().load({ ...withPost(), post: ['lk-001-001'] })
    act(() => useGame.getState().talkTo(POSTMAN))
    expect(useGame.getState().game.collected).toContain('lk-001-001')
    const m = useGame.getState().modal
    expect(m).toMatchObject({ kind: 'passage', pieceId: 'lk-001-001' })
    expect(m && 'said' in m ? m.said : '').toContain(T.word.letterBring)
  })

  it('방문 말과 편지 말이 둘 다 보인다', () => {
    useGame.setState({ game: withPost(), modal: { kind: 'talk', neighborId: POSTMAN, line: '아침 방문 인사', letter: T.word.letterBring } })
    render(<ModalLayer />)
    expect(screen.getByText('아침 방문 인사')).toBeInTheDocument()
    expect(screen.getByText(T.word.letterBring)).toBeInTheDocument()
  })

  it('말이 곧 편지 말이면 한 번만 보인다', () => {
    useGame.setState({ game: withPost(), modal: { kind: 'talk', neighborId: POSTMAN, line: T.word.letterBring, letter: T.word.letterBring } })
    render(<ModalLayer />)
    expect(screen.getAllByText(T.word.letterBring)).toHaveLength(1)
  })
})

describe('이웃 대화 단추 (2026-10-05 정리)', () => {
  it('이웃마다 있던 사기·팔기·받기 단추가 없다 — 돕기·선물하기·닫기는 그대로', () => {
    for (const n of CONTENT.neighbors) {
      const game = { ...newGame(CONTENT), scenes: [], offers: { [n.id]: 'lk-001-001' } }
      useGame.setState({ game, modal: { kind: 'talk', neighborId: n.id, line: '…' } })
      const { unmount } = render(<ModalLayer />)
      const names = screen.getAllByRole('button').map((b) => b.textContent ?? '')
      for (const name of names) expect(name, `${n.id}: ${name}`).not.toMatch(/사기|팔기|받기|짜 받기|엮어 받기|가르쳐 주기/)
      expect(names).toContain(T.ui.talkGift)
      expect(names).toContain(T.ui.close)
      unmount()
    }
  })
})

describe('함께 일하기를 여는 동안 (2026-10-05 사용자)', () => {
  it('함께 일하는 화면을 열면 선물하기 등 다른 단추가 사라지고, 잠깐 쉬기로 돌아온다', () => {
    const s = newGame(CONTENT)
    const workDay = { id: `work:carpenter:${s.clock.day}`, npc: 'carpenter', day: s.clock.day, startedAt: s.clock.minute, step: 0, choices: ['sort'], used: false, paid: false }
    useGame.setState({ game: { ...s, scenes: [], workDay } as typeof s, modal: { kind: 'talk', neighborId: 'carpenter', line: '' } })
    render(<ModalLayer />)
    act(() => screen.getByRole('button', { name: T.work.resume }).click())
    expect(screen.getByRole('region', { name: T.work.title })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: T.ui.talkGift })).not.toBeInTheDocument()
    act(() => screen.getByRole('button', { name: T.work.pause }).click())
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toBeInTheDocument()
  })

  it('오늘 이미 도운 이웃에게 "이미 도왔습니다"·"이미 함께 수고했어요" 줄이 나오지 않는다 (단추는 막혀 있다)', () => {
    const s = newGame(CONTENT)
    useGame.setState({ game: { ...s, scenes: [], helped: ['carpenter'] }, modal: { kind: 'talk', neighborId: 'carpenter', line: '' } })
    render(<ModalLayer />)
    expect(screen.queryByText(T.ui.helpDone)).not.toBeInTheDocument()
    expect(screen.queryByText(T.work.blocks.done)).not.toBeInTheDocument()
  })
})
