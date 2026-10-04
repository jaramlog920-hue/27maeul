// 필사 손맛 (2026-10-04): 잉크 번짐 · 펜 소리 · 절마다 도장 · 차오르는 쪽 · 접히는 쪽 · 설정 · 움직임 줄이기
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, GOD_RECORDS, versesOf } from '../../content/catalog'
import { sfx } from '../../audio/sound'
import { newGame, type GameState } from '../../engine/game'
import { copyVerses } from '../../engine/copying'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Settings } from '../play/Settings'
import { BLOOM_MS, FOLD_MS, GHOST_MS } from './CopyDesk'
import { copySoundOn, copyVibrateOn, quillScratch, QUILL_GAP_MS, reloadCopyFeel, verseBuzz } from './copy-feel'

vi.mock('../../audio/sound', async (orig) => ({ ...(await orig<typeof import('../../audio/sound')>()), sfx: vi.fn() }))
const sfxMock = vi.mocked(sfx)
const quills = () => sfxMock.mock.calls.filter(([n]) => n === 'quill')

const lk1 = versesOf('눅 1:1-80')
const box = () => screen.getByLabelText('따라 적기') as HTMLTextAreaElement
const writing = (book: 'lk' | 'mt' | 'rev', chapter = 1, verse = 1): Partial<GameState> => ({ copy: { book, at: { [book]: { chapter, verse } }, legacy: {} } })
let vibrate: ReturnType<typeof vi.fn>

function setStill(still: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({ matches: still && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }),
  })
}
function openWrite(game: Partial<GameState>) {
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
}
/** 타자 한 번 (입력칸 전체 값을 바꾼다 — 조합 없음). 펜 소리 사이 틈을 넘기려고 시계를 조금 민다 */
function typeTo(value: string) {
  fireEvent.change(box(), { target: { value } })
  act(() => void vi.advanceTimersByTime(QUILL_GAP_MS + 10))
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  reloadCopyFeel()
  sfxMock.mockClear()
  vibrate = vi.fn()
  Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: vibrate })
  setStill(false)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('필사 손맛 — 글자마다 잉크 번짐과 펜 소리', () => {
  it('새로 맞게 쓴 글자만 번졌다가(0.2초쯤) 번짐이 사라진다 — 본문 쪽에 그리고 입력칸 값은 그대로', () => {
    openWrite(writing('lk'))
    const text = lk1[0].text
    typeTo(text.slice(0, 1))
    const verse = screen.getByLabelText('본문 누가복음 1:1')
    // 시계를 민 뒤라 이미 사라졌다 — 다음 글자로 다시 본다
    fireEvent.change(box(), { target: { value: text.slice(0, 2) } })
    const bloom = verse.querySelector('.copy-bloom')
    expect(bloom).not.toBeNull()
    expect(bloom).toHaveTextContent(text.slice(1, 2))
    expect(verse.querySelector('.copy-done-part')).toHaveTextContent(text.slice(0, 2))
    expect(box().value).toBe(text.slice(0, 2))
    act(() => void vi.advanceTimersByTime(BLOOM_MS))
    expect(verse.querySelector('.copy-bloom')).toBeNull()
    expect(verse.querySelector('.copy-done-part')).toHaveTextContent(text.slice(0, 2))
  })

  it('틀린 글자는 번지지 않고, 지웠다 다시 쓴 글자도 다시 번지지 않는다 (조합 중 오르내림)', () => {
    openWrite(writing('lk'))
    const text = lk1[0].text
    typeTo(text.slice(0, 2))
    act(() => void vi.advanceTimersByTime(BLOOM_MS))
    const before = quills().length
    fireEvent.change(box(), { target: { value: text.slice(0, 2) + '뷁' } })
    expect(document.querySelector('.copy-bloom')).toBeNull()
    act(() => void vi.advanceTimersByTime(200))
    fireEvent.change(box(), { target: { value: text.slice(0, 1) } })
    act(() => void vi.advanceTimersByTime(200))
    fireEvent.change(box(), { target: { value: text.slice(0, 2) } })
    expect(document.querySelector('.copy-bloom')).toBeNull()
    expect(quills().length).toBe(before)
  })

  it('맞게 쓴 글자마다 아주 작은 펜 소리 — 높이가 조금씩 다르고, 빠르게 쓰면 겹치지 않게 건너뛴다', () => {
    openWrite(writing('lk'))
    const text = lk1[0].text.replace(/\s/g, '')
    typeTo(text.slice(0, 1))
    typeTo(text.slice(0, 2))
    expect(quills().length).toBe(2)
    for (const [, pitch] of quills()) {
      expect(pitch).toBeGreaterThanOrEqual(0.88)
      expect(pitch).toBeLessThanOrEqual(1.12)
    }
    // 틈 없이 몰아 쓰면 한 번만
    fireEvent.change(box(), { target: { value: text.slice(0, 3) } })
    fireEvent.change(box(), { target: { value: text.slice(0, 4) } })
    fireEvent.change(box(), { target: { value: text.slice(0, 5) } })
    expect(quills().length).toBe(3)
  })

  it('quillScratch: 틈(70ms) 안의 소리는 버리고, 높이는 0.88~1.12배', () => {
    quillScratch(1000, () => 0)
    quillScratch(1000 + QUILL_GAP_MS - 1, () => 0.5)
    quillScratch(1000 + QUILL_GAP_MS, () => 1)
    expect(quills().map(([, p]) => p)).toEqual([0.88, 1.12])
  })
})

describe('필사 손맛 — 한 절을 마치면 도장과 차오르는 쪽', () => {
  it('절 끝에 도장 "1:1"이 찍히고(누르는 움직임), 짧은 진동, 마친 줄이 날아가 위의 쪽에 한 줄이 생긴다', () => {
    openWrite(writing('lk'))
    const page = () => screen.getByRole('img', { name: /이 장에 적은 쪽/ })
    expect(page()).toHaveAttribute('data-lines', '0')
    expect(page()).toHaveAccessibleName(`이 장에 적은 쪽 · 0/${lk1.length}절`)
    fireEvent.change(box(), { target: { value: lk1[0].text } })
    const stamp = document.querySelector('.copy-stamp')
    expect(stamp).toHaveTextContent('1:1')
    expect(stamp).toHaveClass('copy-stamp-press')
    expect(document.querySelector('.copy-ghost')).toHaveClass('copy-ghost-fly')
    expect(document.querySelector('.copy-ghost')).toHaveAttribute('aria-hidden', 'true')
    expect(vibrate).toHaveBeenCalledWith(10)
    expect(sfxMock).toHaveBeenCalledWith('stamp')
    // 다음 절은 그대로 읽힌다 (마친 절은 그 위에 잠깐 겹쳐 있을 뿐)
    expect(screen.getByLabelText('본문 누가복음 1:2')).toHaveTextContent(lk1[1].text)
    expect(page()).toHaveAttribute('data-lines', '1')
    // 80절 장 = 여덟 줄, 한 줄에 열 절 — 첫 줄이 한 절만큼(10%) 늘어난다
    const inks = () => [...page().querySelectorAll<HTMLElement>('.copy-page-ink')].map((e) => e.style.width)
    expect(inks()).toEqual(['10%', '0%', '0%', '0%', '0%', '0%', '0%', '0%'])
    expect(page().querySelector('.copy-page-new')).toBe(page().querySelector('.copy-page-row'))
    act(() => void vi.advanceTimersByTime(GHOST_MS))
    expect(document.querySelector('.copy-ghost')).toBeNull()
    expect(document.querySelector('.copy-stamp')).toBeNull()
    expect(page().querySelector('.copy-page-new')).toBeNull()
    // 두 번째 절 → 두 줄
    fireEvent.change(box(), { target: { value: lk1[1].text } })
    expect(document.querySelector('.copy-stamp')).toHaveTextContent('1:2')
    expect(page()).toHaveAttribute('data-lines', '2')
    expect(inks()[0]).toBe('20%')
    expect(vibrate).toHaveBeenCalledTimes(2)
  })

  it('짧은 장은 절마다 한 줄씩 찬다 (계시록 15장 · 8절)', () => {
    const vs = copyVerses('rev', 15, CONTENT)
    expect(vs).toHaveLength(8)
    openWrite(writing('rev', 15, 3))
    const page = screen.getByRole('img', { name: /이 장에 적은 쪽/ })
    expect(page.querySelectorAll('.copy-page-row')).toHaveLength(8)
    expect([...page.querySelectorAll<HTMLElement>('.copy-page-ink')].map((e) => e.style.width).filter((w) => w !== '0%')).toEqual(['100%', '92%'])
  })

  it('이어 쓰는 장이면 이미 마친 절만큼 쪽이 차 있다 (도장·진동 없이)', () => {
    openWrite(writing('lk', 1, 15))
    const page = screen.getByRole('img', { name: /이 장에 적은 쪽/ })
    expect(page).toHaveAttribute('data-lines', '14')
    expect([...page.querySelectorAll<HTMLElement>('.copy-page-ink')].slice(0, 3).map((e) => e.style.width)).toEqual(['100%', '37%', '0%'])
    expect(document.querySelector('.copy-stamp')).toBeNull()
    expect(vibrate).not.toHaveBeenCalled()
  })
})

describe('필사 손맛 — 장을 마치면 쪽이 접힌다', () => {
  it('마지막 절 → 꽉 찬 쪽이 접히고 책장 넘기는 소리, 장 완료 화면은 그 뒤로 떠오르며 새 하나님 기록은 은은하게 반짝', () => {
    const mt5 = copyVerses('mt', 5, CONTENT)
    openWrite({ ...writing('mt', 5, 48), clock: { day: 9, minute: 9 * 60 } })
    fireEvent.change(box(), { target: { value: mt5[mt5.length - 1].text } })
    const fold = document.querySelector('.copy-page-fold')
    expect(fold).not.toBeNull()
    expect(fold).toHaveAttribute('data-lines', String(mt5.length))
    expect(sfxMock).toHaveBeenCalledWith('page')
    expect(vibrate).toHaveBeenCalledWith(10)
    const done = document.querySelector('.copy-done')
    expect(done).toHaveClass('copy-after-fold')
    const finds = GOD_RECORDS.filter((r) => r.book === 'mt' && r.chapter === 5)
    expect(document.querySelectorAll('.copy-god-new')).toHaveLength(finds.length)
    act(() => void vi.advanceTimersByTime(FOLD_MS))
    expect(document.querySelector('.copy-page-fold')).toBeNull()
    expect(document.querySelector('.copy-done')).not.toHaveClass('copy-after-fold')
  })
})

describe('필사 손맛 — 설정', () => {
  it('펜 긁는 소리·절마다 진동은 기본 켬, 끄면 기기에 남고 소리·진동이 멈춘다', () => {
    expect(copySoundOn()).toBe(true)
    expect(copyVibrateOn()).toBe(true)
    render(<Settings />)
    expect(screen.getByRole('group', { name: '펜 긁는 소리' }).querySelector('[aria-pressed="true"]')).toHaveTextContent('켬')
    fireEvent.click(document.querySelector('[data-copy-feel="sound-off"]')!)
    fireEvent.click(document.querySelector('[data-copy-feel="vibrate-off"]')!)
    expect(localStorage.getItem('twenty-seven/copy-sound')).toBe('0')
    expect(localStorage.getItem('twenty-seven/copy-vibrate')).toBe('0')
    expect(document.querySelector('[data-copy-feel="sound-off"]')).toHaveAttribute('aria-pressed', 'true')
    // 다시 불러와도 꺼져 있다
    reloadCopyFeel()
    expect(copySoundOn()).toBe(false)
    expect(copyVibrateOn()).toBe(false)
    quillScratch(5000)
    verseBuzz()
    expect(quills()).toHaveLength(0)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('끈 채로 필사하면 글자 펜 소리·진동 없이 쓴다 (도장 그림은 그대로)', () => {
    localStorage.setItem('twenty-seven/copy-sound', '0')
    localStorage.setItem('twenty-seven/copy-vibrate', '0')
    reloadCopyFeel()
    openWrite(writing('lk'))
    typeTo(lk1[0].text.slice(0, 3))
    fireEvent.change(box(), { target: { value: lk1[0].text } })
    expect(quills()).toHaveLength(0)
    expect(vibrate).not.toHaveBeenCalled()
    expect(document.querySelector('.copy-stamp')).toHaveTextContent('1:1')
  })

  it('진동이 없는 기기에서도 아무 일 없이 지나간다', () => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, writable: true, value: undefined })
    expect(() => verseBuzz()).not.toThrow()
  })
})

describe('필사 손맛 — 움직임 줄이기', () => {
  it('흔들림·날아가기·접기 없이: 도장은 살짝 나타나고, 마친 줄은 제자리에서 사라진다', () => {
    setStill(true)
    openWrite(writing('lk'))
    expect(document.querySelector('.copy-focus')).toHaveClass('copy-still')
    fireEvent.change(box(), { target: { value: lk1[0].text } })
    const stamp = document.querySelector('.copy-stamp')
    expect(stamp).toHaveClass('copy-stamp-fade')
    expect(stamp).not.toHaveClass('copy-stamp-press')
    const ghost = document.querySelector('.copy-ghost')
    expect(ghost).toHaveClass('copy-ghost-fade')
    expect(ghost).not.toHaveClass('copy-ghost-fly')
    expect((ghost as HTMLElement).style.getPropertyValue('--fly-y')).toBe('')
    expect(screen.getByRole('img', { name: /이 장에 적은 쪽/ })).toHaveAttribute('data-lines', '1')
  })

  it('장을 마칠 때도 접는 대신 살짝 사라진다', () => {
    setStill(true)
    const mt5 = copyVerses('mt', 5, CONTENT)
    openWrite(writing('mt', 5, 48))
    fireEvent.change(box(), { target: { value: mt5[mt5.length - 1].text } })
    expect(document.querySelector('.copy-page-fold')).toHaveClass('copy-page-fold-still')
  })
})
