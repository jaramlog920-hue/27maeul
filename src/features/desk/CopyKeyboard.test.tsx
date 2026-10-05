import { act, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { KB_CLASS, KB_SETTLE_MS } from './copy-keyboard'

/** 휴대폰의 보이는 화면 (키보드가 올라오면 height가 준다) */
class FakeViewport extends EventTarget {
  height = 812
  offsetTop = 0
  width = 375
}
let vv: FakeViewport

function openWrite(game: Partial<GameState>) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
}
const writing: Partial<GameState> = { copy: { book: 'mt', at: { mt: { chapter: 1, verse: 1 } }, legacy: {} } }
const box = () => screen.getByLabelText('따라 적기') as HTMLTextAreaElement
const dialog = () => screen.getByRole('dialog')
/** 키보드가 올라오거나 내려간다 */
function keyboard(height: number, offsetTop = 0) {
  act(() => {
    vv.height = height
    vv.offsetTop = offsetTop
    vv.dispatchEvent(new Event('resize'))
  })
}

describe('필사 화면 — 휴대폰 키보드 맞춤', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vv = new FakeViewport()
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 812, configurable: true })
  })
  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true })
  })

  it('입력칸을 눌러 키보드가 올라오면 화면을 보이는 높이로 줄이고, 다 올라온 뒤 본문이 위에 오게 스크롤을 되돌린다', () => {
    openWrite(writing)
    const el = dialog()
    act(() => box().focus())
    // 아직 키보드가 없으면 그대로
    expect(el).not.toHaveClass(KB_CLASS)
    keyboard(420, 30)
    expect(el).toHaveClass(KB_CLASS)
    expect(el.style.getPropertyValue('--vvh')).toBe('420px')
    expect(el.style.getPropertyValue('--vvtop')).toBe('30px')
    // 브라우저가 입력칸을 가운데로 끌어내린 스크롤 → 키보드가 다 올라온 뒤 맨 위(본문)로
    el.scrollTop = 260
    act(() => vi.advanceTimersByTime(KB_SETTLE_MS))
    expect(el.scrollTop).toBe(0)
    // 본문과 입력칸은 같은 쓰는 자리 칸에, 본문이 입력칸 바로 위에 있다
    const work = el.querySelector('.copy-work')!
    const verse = screen.getByLabelText('본문 마태복음 1:1')
    expect(work).toContainElement(verse)
    expect(work).toContainElement(box())
    expect(verse.closest('.copy-verse-wrap')!.nextElementSibling).toBe(box())
    // 길잡이는 쓰는 자리 밖, 그 아래
    expect(work).not.toContainElement(screen.getByRole('region', { name: '필사 길잡이' }))
  })

  it('키보드가 내려가거나 입력칸을 떠나면 원래 화면으로 돌아온다', () => {
    openWrite(writing)
    const el = dialog()
    act(() => box().focus())
    keyboard(400)
    expect(el).toHaveClass(KB_CLASS)
    keyboard(812)
    expect(el).not.toHaveClass(KB_CLASS)
    expect(el.style.getPropertyValue('--vvh')).toBe('')
    keyboard(400)
    expect(el).toHaveClass(KB_CLASS)
    act(() => box().blur())
    expect(el).not.toHaveClass(KB_CLASS)
  })

  it('주소창이 숨고 나타나는 정도의 높이 변화는 키보드로 보지 않는다', () => {
    openWrite(writing)
    act(() => box().focus())
    keyboard(760)
    expect(dialog()).not.toHaveClass(KB_CLASS)
  })

  it('입력칸이 아닌 곳(길잡이 한 줄 기록)에 키보드가 올라오면 맞추지 않는다', () => {
    openWrite(writing)
    act(() => screen.getByRole('button', { name: /한 줄 기록하기/ }).click())
    act(() => screen.getByRole('textbox', { name: '한 줄 기록하기' }).focus())
    keyboard(400)
    expect(dialog()).not.toHaveClass(KB_CLASS)
  })

  it('필사 화면을 나가면 맞춤을 거둔다', () => {
    openWrite(writing)
    const el = dialog()
    act(() => box().focus())
    keyboard(400)
    expect(el).toHaveClass(KB_CLASS)
    act(() => useGame.getState().copyView('menu'))
    expect(el).not.toHaveClass(KB_CLASS)
    expect(el.style.getPropertyValue('--vvh')).toBe('')
  })
})
