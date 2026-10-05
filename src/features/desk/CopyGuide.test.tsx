import { deserialize, serialize } from '../../engine/save'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { chapterGuide, CONTENT, versesOf } from '../../content/catalog'
import { newGame, type GameState } from '../../engine/game'
import { sanitizeCopy, withGuideFolded, NO_COPY } from '../../engine/copying'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function openWrite(game: Partial<GameState>) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
}
const writing = (book: 'mt' | 'lk', chapter = 1, verse = 1): Partial<GameState> => ({ copy: { book, at: { [book]: { chapter, verse } }, legacy: {} } })
const guideBox = () => screen.getByRole('region', { name: '필사 길잡이' })
const box = () => screen.getByLabelText('따라 적기') as HTMLTextAreaElement

describe('필사 길잡이 — 필사 화면', () => {
  it('지금 장의 말씀의 배경·필사하며 살펴보기를 본문과 다른 상자에 보인다 (검토용 본문 근거는 없다)', () => {
    openWrite(writing('mt'))
    const g = chapterGuide('mt', 1)!
    const el = guideBox()
    expect(el).toHaveClass('copy-guide')
    expect(el).not.toHaveClass('copy-focus-verse')
    expect(within(el).getByText('말씀의 배경')).toHaveClass('copy-guide-label')
    expect(within(el).getByText('필사하며 살펴보기')).toHaveClass('copy-guide-label')
    expect(el).toHaveTextContent(g.background)
    expect(el).toHaveTextContent(g.look)
    expect(el).not.toHaveTextContent('본문을 바탕으로 쓴 설명이에요.')
    // 원본의 검토용 칸 ("배경: 1:1–18 — …")은 화면 어디에도 없다
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveTextContent('검토용')
    expect(dialog).not.toHaveTextContent('1:1–18')
    // 본문 칸에는 길잡이 글이 섞이지 않는다
    expect(screen.getByLabelText('본문 마태복음 1:1')).not.toHaveTextContent(g.background)
  })

  it('장 안에서는 절이 바뀌어도 같은 길잡이 — 다른 장이면 그 장의 길잡이', async () => {
    openWrite(writing('lk', 2, 1))
    const g2 = chapterGuide('lk', 2)!
    expect(guideBox()).toHaveTextContent(g2.background)
    const user = userEvent.setup()
    await user.type(box(), versesOf('눅 2:1')[0].text)
    expect(screen.getByLabelText('본문 누가복음 2:2')).toBeInTheDocument()
    expect(guideBox()).toHaveTextContent(g2.background)
    expect(guideBox()).toHaveAttribute('data-guide', 'lk:2')
  })

  it('접기·펼치기: 접으면 두 칸이 숨고 저장에 남으며, 다시 펼칠 수 있다 — 입력칸 초점은 그대로', () => {
    openWrite(writing('mt'))
    const g = chapterGuide('mt', 1)!
    box().focus()
    const fold = within(guideBox()).getByRole('button', { name: '접기' })
    expect(fold).toHaveAttribute('aria-expanded', 'true')
    fireEvent.mouseDown(fold)
    expect(document.activeElement).toBe(box())
    fireEvent.click(fold)
    expect(guideBox()).not.toHaveTextContent(g.background)
    expect(useGame.getState().game.copy.guideFolded).toBe(true)
    const open = within(guideBox()).getByRole('button', { name: '펼치기' })
    expect(open).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(open)
    expect(guideBox()).toHaveTextContent(g.look)
    expect(useGame.getState().game.copy.guideFolded).toBeUndefined()
  })

  it('접어 둔 상태로 다시 앉으면 접힌 채로 (플레이어마다 기억)', () => {
    openWrite({ copy: { book: 'mt', at: { mt: { chapter: 1, verse: 1 } }, legacy: {}, guideFolded: true } })
    expect(within(guideBox()).getByRole('button', { name: '펼치기' })).toBeInTheDocument()
    expect(guideBox()).not.toHaveTextContent(chapterGuide('mt', 1)!.background)
  })
})

describe('길잡이 접기 저장', () => {
  it('withGuideFolded는 접을 때만 칸을 두고, 펼치면 지운다', () => {
    const folded = withGuideFolded(NO_COPY, true)
    expect(folded.guideFolded).toBe(true)
    expect(withGuideFolded(folded, true)).toBe(folded)
    expect(withGuideFolded(folded, false)).toEqual(NO_COPY)
  })
  it('저장 정리: true만 남기고 다른 값은 버린다', () => {
    const progress = newGame(CONTENT).progress
    expect(sanitizeCopy({ book: null, at: {}, legacy: {}, guideFolded: true }, progress).guideFolded).toBe(true)
    expect(sanitizeCopy({ book: null, at: {}, legacy: {}, guideFolded: 'yes' }, progress)).toEqual({ book: null, at: {}, legacy: {} })
  })

  it('한 줄 기록하기: 적고 저장하면 나의 한 줄에 남고 필사 화면은 그대로', () => {
    openWrite(writing('mt'))
    fireEvent.click(within(guideBox()).getByRole('button', { name: /한 줄 기록하기/ }))
    fireEvent.change(within(guideBox()).getByRole('textbox', { name: '한 줄 기록하기' }), { target: { value: '세 시기로 나뉜다' } })
    fireEvent.click(within(guideBox()).getByRole('button', { name: '저장' }))
    expect(useGame.getState().game.myLines['guide:mt:1']).toBe('세 시기로 나뉜다')
    expect(useGame.getState().modal).not.toBeNull()
    expect(within(guideBox()).getByRole('button', { name: /한 줄 기록 고치기/ })).toBeInTheDocument()
    // 다시 불러와도 남는다
    const back = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(back.myLines['guide:mt:1']).toBe('세 시기로 나뉜다')
  })
})
