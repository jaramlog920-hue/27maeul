import { act, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { newGame } from '../engine/game'
import { useGame } from '../store/game-store'
import { ModalLayer } from './ModalLayer'

/** jsdom은 배치를 하지 않으므로 창의 크기와 스크롤 위치를 정해 준다 */
function size(el: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
}
function scrollTo(el: HTMLElement, top: number) {
  el.scrollTop = top
  fireEvent.scroll(el)
}

beforeEach(() => {
  localStorage.clear()
  useGame.setState({ game: newGame(CONTENT), modal: null, decorating: null, toast: null })
})

describe('창에 아래로 더 있다는 표시', () => {
  for (const kind of ['settings', 'guide', 'journal'] as const)
    it(`${kind}: 내용이 넘치면 표시가 보이고, 끝까지 내리면 사라진다`, () => {
      useGame.setState({ modal: { kind } })
      const { container } = render(<ModalLayer />)
      const dialog = container.querySelector('.dialog') as HTMLElement
      size(dialog, 1000, 400)
      scrollTo(dialog, 0)
      expect(dialog.classList.contains('more-below')).toBe(true)
      expect(dialog.dataset.more).toBe(T.ui.moreBelow)
      scrollTo(dialog, 300)
      expect(dialog.classList.contains('more-below')).toBe(true)
      scrollTo(dialog, 600)
      expect(dialog.classList.contains('more-below')).toBe(false)
      // 다시 올리면 또 보인다
      scrollTo(dialog, 100)
      expect(dialog.classList.contains('more-below')).toBe(true)
    })

  it('선반도 같다', () => {
    useGame.setState({ modal: { kind: 'shelf' } })
    const { container } = render(<ModalLayer />)
    const dialog = container.querySelector('.dialog') as HTMLElement
    size(dialog, 900, 300)
    scrollTo(dialog, 0)
    expect(dialog.classList.contains('more-below')).toBe(true)
    scrollTo(dialog, 600)
    expect(dialog.classList.contains('more-below')).toBe(false)
  })

  it('넘치지 않는 창에는 표시가 없다', () => {
    useGame.setState({ modal: { kind: 'settings' } })
    const { container } = render(<ModalLayer />)
    const dialog = container.querySelector('.dialog') as HTMLElement
    size(dialog, 300, 300)
    scrollTo(dialog, 0)
    expect(dialog.classList.contains('more-below')).toBe(false)
  })

  it('창의 내용이 바뀌어 길어지면 다시 살핀다', async () => {
    useGame.setState({ modal: { kind: 'settings' } })
    const { container } = render(<ModalLayer />)
    const dialog = container.querySelector('.dialog') as HTMLElement
    size(dialog, 300, 300)
    scrollTo(dialog, 0)
    expect(dialog.classList.contains('more-below')).toBe(false)
    size(dialog, 800, 300)
    // 기록 초기화를 누르면 확인 문구가 더해진다
    await act(async () => {
      ;[...dialog.querySelectorAll('button')].find((b) => b.textContent === '처음부터')!.click()
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(dialog.classList.contains('more-below')).toBe(true)
  })
})
