// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from '../../engine/growth-test-support'
// 편지 나르는 이웃: 말을 걸면 편지를 바로 건넨다 (2026-10-05, 편지 받기 단추 없음). 아침 방문 말이 있어도 편지 말이 가려지지 않는다 (계획 7 작업 2 검토 이월, 계획 14 작업 5 드문 편지)
import { act, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { CONTENT } from '../../content/catalog'
import { fill, itemList, T } from '../../content/text'

import { POSTMAN } from '../../engine/post'
import { deserialize, serialize } from '../../engine/save'
import { unseenTalkPopups } from '../../engine/talk-popups'
import { postLine, useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

beforeEach(() => {
  localStorage.clear()
  useGame.setState({ piecePopups: [], copyResult: null, toast: null })
})

/** 오늘 편지(말씀 조각 하나)가 온 날 */
function withPost() {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], post: ['rom-001'] }
}

describe('빨간 특별 대화는 같은 대사마다 처음 한 번만', () => {
  const first = '함께 빵을 구웠던 이야기'
  const second = '새로 배운 제작법 이야기'
  const dialogue = (popup = [first]) => ({ kind: 'talk' as const, neighborId: 'baker', line: first, popup })
  beforeEach(() => {
    localStorage.clear()
    useGame.setState({ game: { ...newGame(CONTENT), scenes: [] }, modal: dialogue(), piecePopups: [], copyResult: null })
  })
  it('한 번 보여 준 말은 다시 열면 일반 대화에 남는다', () => {
    const { container } = render(<ModalLayer />)
    expect(container.querySelector('.talk-popup-line')).toHaveTextContent(first)
    act(() => useGame.getState().closeModal())
    act(() => useGame.getState().open(dialogue()))
    expect(container.querySelector('.talk-popup')).toBeNull()
    expect(screen.getByText(first)).toHaveClass('talk-line')
    expect(screen.getByRole('button', { name: T.ui.talkHelp })).toBeInTheDocument()
  })
  it('저장 후 불러오거나 날짜가 바뀌어도 다시 강조하지 않는다', () => {
    const { container } = render(<ModalLayer />)
    const loaded = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(unseenTalkPopups(loaded, 'baker', [first])).toEqual([])
    act(() => useGame.getState().closeModal())
    act(() => useGame.setState({ game: { ...loaded, clock: { ...loaded.clock, day: loaded.clock.day + 1 } }, modal: dialogue() }))
    expect(container.querySelector('.talk-popup-line')).toBeNull()
    expect(screen.getByText(first)).toHaveClass('talk-line')
  })
  it('첫 장만 보고 닫으면 아직 안 본 다음 장은 다음에 강조한다', () => {
    act(() => useGame.getState().open(dialogue([first, second])))
    const { container } = render(<ModalLayer />)
    expect(container.querySelector('.talk-popup-line')).toHaveTextContent(first)
    expect(unseenTalkPopups(useGame.getState().game, 'baker', [first, second])).toEqual([second])
    act(() => useGame.getState().closeModal())
    act(() => useGame.getState().open(dialogue([first, second])))
    expect(container.querySelector('.talk-popup-line')).toHaveTextContent(second)
    act(() => screen.getByRole('button', { name: T.ui.next }).click())
    expect(container.querySelector('.talk-popup')).toBeNull()
    expect(screen.getByText(first)).toHaveClass('talk-line')
    expect(screen.getByText(second)).toHaveClass('talk-line')
  })
  it('같은 창에서 대사가 바뀌어도 새 대사는 정상적으로 강조한다', () => {
    const { container } = render(<ModalLayer />)
    act(() => useGame.getState().open({ ...dialogue([second]), line: second }))
    expect(container.querySelector('.talk-popup-line')).toHaveTextContent(second)
    expect(unseenTalkPopups(useGame.getState().game, 'baker', [first, second])).toEqual([])
  })
  it('StrictMode에서도 여러 새 대사를 건너뛰지 않고 중복은 한 번만 보여 준다', () => {
    act(() => useGame.getState().open(dialogue([first, first, second])))
    const { container } = render(<StrictMode><ModalLayer /></StrictMode>)
    expect(container.querySelector('.talk-popup-line')).toHaveTextContent(first)
    act(() => screen.getByRole('button', { name: T.ui.next }).click())
    expect(container.querySelector('.talk-popup-line')).toHaveTextContent(second)
    act(() => screen.getByRole('button', { name: T.ui.next }).click())
    expect(container.querySelector('.talk-popup')).toBeNull()
  })
})

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
    // 새 말씀조각 본문을 먼저 보고 닫은 다음, 그 뒤의 편지 대화를 확인한다.
    act(() => useGame.getState().piecePopups.forEach(() => useGame.getState().dismissPiecePopup()))
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

  it('방문 말과 편지 말이 둘 다 보인다 — 편지 말은 팝업으로 먼저', () => {
    useGame.setState({ game: withPost(), modal: { kind: 'talk', neighborId: POSTMAN, line: '아침 방문 인사', letter: T.word.letterBring } })
    render(<ModalLayer />)
    expect(screen.getByText(T.word.letterBring)).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: T.ui.next }).click())
    expect(screen.getByText('아침 방문 인사')).toBeInTheDocument()
  })

  it('특별한 말은 팝업으로 한 장씩 보고, 다 보면 이름 밑에 호감도와 단추가 보인다', () => {
    useGame.setState({ game: withPost(), modal: { kind: 'talk', neighborId: 'baker', line: '', popup: ['레시피 말', '혼잣말'] } })
    render(<ModalLayer />)
    expect(screen.getByText('레시피 말')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: T.ui.talkHelp })).not.toBeInTheDocument()
    act(() => screen.getByRole('button', { name: T.ui.next }).click())
    expect(screen.getByText('혼잣말')).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: T.ui.next }).click())
    expect(screen.getByRole('button', { name: T.ui.talkHelp })).toBeInTheDocument()
    expect(screen.getByLabelText(new RegExp(T.ui.hearts))).toBeInTheDocument()
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
      // 닫기는 오른쪽 위 ✕ (이름은 '닫기')
      expect(screen.getByRole('button', { name: T.ui.close })).toHaveTextContent('✕')
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
    expect(screen.queryByText(T.ui.giftDone)).not.toBeInTheDocument()
  })
})

describe('짧은 까닭은 누르면 알림으로 (2026-10-05 사용자)', () => {
  it('물이 없을 때 빵 굽는 이웃 돕기: 대화칸에 "필요한 것" 줄이 없고, 누르면 알림이 뜬다', () => {
    const s = newGame(CONTENT)
    useGame.setState({ game: { ...s, scenes: [], inv: {} }, modal: { kind: 'talk', neighborId: 'baker', line: '' }, toast: null })
    render(<ModalLayer />)
    const note = fill(T.ui.helpNeeds, { items: itemList({ water: 1 }) })
    expect(screen.queryByText(note)).not.toBeInTheDocument()
    const btn = screen.getByRole('button', { name: T.ui.talkHelp })
    expect(btn).not.toBeDisabled()
    act(() => btn.click())
    expect(useGame.getState().toast?.text).toBe(note)
    expect(useGame.getState().game.helped).not.toContain('baker')
  })
})
