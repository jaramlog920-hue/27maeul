import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, GOD_KEYWORDS, GOD_RECORDS, versesOf } from '../../content/catalog'
import { isQuiet } from '../../audio/sound'
import { newGame, type GameState } from '../../engine/game'
import { copySpot } from '../../engine/copying'
import { PLACES } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Play } from '../play/Play'
import { StatusPanel } from '../play/StatusPanel'
import { T } from '../../content/text'
import { ensureOtBook } from '../../content/ot-catalog'
import { OT_BOOK_TABLE } from '../../engine/ot-books'

// 구약 책 불러오기는 그대로 부르되, 실패하는 경우를 시험에서 한 번씩 끼워 넣는다 (계획 20 작업 5)
vi.mock('../../content/ot-catalog', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../content/ot-catalog')>()
  return { ...m, ensureOtBook: vi.fn(m.ensureOtBook) }
})

function reset(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
}
/** 책상에 걸어가 앉는다 */
function sit() {
  act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
  act(() => {
    for (let i = 0; i < 2400 && !useGame.getState().modal; i++) useGame.getState().frame(0.05)
  })
}
/** 이 책을 쓰는 중인 상태로 쓰기 화면을 연다 */
function openWrite(game: Partial<GameState>) {
  reset(game)
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
}
const lk1 = versesOf('눅 1:1-80')
const box = () => screen.getByLabelText('따라 적기') as HTMLTextAreaElement
const draft = (book: 'lk' | 'mt' = 'lk') => copySpot(useGame.getState().game, book, CONTENT)!.draft
const writing = (book: 'lk' | 'mt', chapter = 1, verse = 1): Partial<GameState> => ({ copy: { book, at: { [book]: { chapter, verse } }, legacy: {} } })

describe('필사 집중 화면 — 쓰기', () => {
  it('위에 "누가복음 1장 · 1/80절", 본문 한 절(명조 칸), 입력칸은 자동완성·맞춤법·대문자를 끈다', () => {
    openWrite(writing('lk'))
    expect(screen.getByRole('heading')).toHaveTextContent(`누가복음 1장 · 1/${lk1.length}절`)
    expect(screen.getByLabelText('본문 누가복음 1:1')).toHaveClass('copy-focus-verse')
    expect(box()).toHaveAttribute('autocomplete', 'off')
    expect(box()).toHaveAttribute('autocorrect', 'off')
    expect(box()).toHaveAttribute('autocapitalize', 'off')
    expect(box()).toHaveAttribute('spellcheck', 'false')
    expect(screen.getByRole('progressbar', { name: '누가복음 1장 진행' })).toHaveAttribute('aria-valuenow', '0')
  })

  it('맞게 쓴 부분만 진해지고, 틀린 글자는 그 자리에 살짝 표시되며 고치면 사라진다', async () => {
    openWrite(writing('lk'))
    const user = userEvent.setup()
    const text = lk1[0].text
    await user.type(box(), text.slice(0, 5))
    const verse = screen.getByLabelText('본문 누가복음 1:1')
    expect(verse.querySelector('.copy-done-part')).toHaveTextContent(text.slice(0, 5).trim())
    expect(verse.querySelector('[data-typo]')).toBeNull()
    // 틀린 글자 하나
    await user.type(box(), '뷁')
    expect(verse.querySelector('[data-typo]')).not.toBeNull()
    expect(box()).toHaveAttribute('aria-invalid', 'true')
    // 지우고 고치면 다시 맞는다
    await user.type(box(), '{Backspace}')
    expect(verse.querySelector('[data-typo]')).toBeNull()
  })

  it('한 절을 다 쓰면 조용히 "✓ 누가복음 1:1 기록", 다음 절이 올라오고 진행 막대가 찬다', async () => {
    openWrite(writing('lk'))
    const user = userEvent.setup()
    await user.type(box(), lk1[0].text)
    expect(screen.getByRole('status')).toHaveTextContent('✓ 누가복음 1:1 기록')
    expect(screen.getByRole('heading')).toHaveTextContent(`누가복음 1장 · 2/${lk1.length}절`)
    expect(screen.getByLabelText('본문 누가복음 1:2')).toHaveTextContent(lk1[1].text)
    expect(box().value).toBe('')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })

  it('띄어쓰기·문장부호를 빼고 써도 절이 기록된다', async () => {
    openWrite(writing('lk'))
    const user = userEvent.setup()
    await user.type(box(), lk1[0].text.replace(/[\s,.]/g, ''))
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('붙여넣기는 받지 않는다', async () => {
    openWrite(writing('lk'))
    const user = userEvent.setup()
    box().focus()
    await user.paste(lk1[0].text)
    expect(box().value).toBe('')
    expect(useGame.getState().game.copyStats.verses).toBe(0)
  })
})

describe('필사 집중 화면 — 장 완료', () => {
  it('마지막 절을 쓰면 장 완료 화면: 절·글자, 하나님에 대한 새로운 기록(키워드 — 구절, 본문), 능력치, [책 덮기] [6장 계속 쓰기]', async () => {
    const mt5 = versesOf('마 5:1-48')
    openWrite({ ...writing('mt', 5, 48), clock: { day: 9, minute: 9 * 60 } })
    const user = userEvent.setup()
    await user.type(box(), mt5[47].text)
    const g = useGame.getState().game
    const m = useGame.getState().modal
    if (m?.kind !== 'copy' || m.last?.kind !== 'chapter') throw new Error('장 완료가 아님')
    const chars = mt5.reduce((n, v) => n + v.text.replace(/[\s\p{P}\p{S}]/gu, '').length, 0)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`마태복음 5장을 기록했습니다 · 48절 · ${chars}자`)
    const finds = GOD_RECORDS.filter((r) => r.book === 'mt' && r.chapter === 5)
    expect(finds.length).toBeGreaterThan(0)
    const god = screen.getByRole('region', { name: `✦ 하나님에 대한 새로운 기록 ${finds.length}` })
    for (const f of finds) {
      expect(god).toHaveTextContent(`${GOD_KEYWORDS[f.keyword].name} — ${f.ref}`)
      expect(god).toHaveTextContent(versesOf(f.ref)[0].text)
    }
    // 발견한 날과 함께 상태에 남는다
    expect(g.godRecords).toEqual(finds.map((f) => ({ keyword: f.keyword, ref: f.ref, book: 'mt', chapter: 5, day: 9 })))
    // 능력치 (오른 만큼)
    const parts = [m.last.gains.wit > 0 && `지능 +${m.last.gains.wit}`, m.last.gains.hand > 0 && `손재주 +${m.last.gains.hand}`].filter(Boolean)
    expect(parts.length).toBeGreaterThan(0)
    expect(screen.getByText(parts.join(' · '))).toBeInTheDocument()
    expect(g.progress.mt.completed).toContain(5)
    // 지쳐 있어도 쓸 수 있고, 피로는 장을 마칠 때 붙는다
    expect(g.needs.fatigue).toBeGreaterThan(newGame(CONTENT).needs.fatigue)
    await user.click(screen.getByRole('button', { name: '6장 계속 쓰기' }))
    expect(screen.getByRole('heading')).toHaveTextContent('마태복음 6장 · 1/34절')
  })

  it('하나님 기록이 없는 장이면 그 줄은 보이지 않는다. [책 덮기]는 마을로', async () => {
    const without = [1, 2, 3, 4].find((c) => !GOD_RECORDS.some((r) => r.book === 'mt' && r.chapter === c))!
    const vs = versesOf(`마 ${without}:1-${CONTENT.chapterText!('mt', without).at(-1)!.verse}`)
    openWrite(writing('mt', without, vs.at(-1)!.verse))
    const user = userEvent.setup()
    await user.type(box(), vs.at(-1)!.text)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`마태복음 ${without}장을 기록했습니다`)
    expect(screen.queryByText(/하나님에 대한 새로운 기록/)).toBeNull()
    await user.click(screen.getByRole('button', { name: '책 덮기' }))
    expect(useGame.getState().modal).toBeNull()
  })

  it('지쳐 있어도 필사할 수 있다', async () => {
    openWrite({ ...writing('lk'), needs: { ...newGame(CONTENT).needs, fatigue: 100 } })
    const user = userEvent.setup()
    await user.type(box(), lk1[0].text)
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })
})

describe('필사 집중 화면 — 책상 메뉴·나가기·이어 쓰기', () => {
  it('나갔다 오면 메뉴에 지금 자리, [이어서 필사]로 "누가복음 1장 2절부터 이어집니다."와 쓰다 만 입력', async () => {
    reset(writing('lk'))
    const user = userEvent.setup()
    render(<ModalLayer />)
    sit()
    expect(screen.getByRole('heading')).toHaveTextContent('필사 책상')
    await user.click(screen.getByRole('button', { name: '이어서 필사' }))
    await user.type(box(), lk1[0].text)
    await user.type(box(), lk1[1].text.slice(0, 3))
    await user.click(screen.getByRole('button', { name: '나가기' }))
    expect(useGame.getState().modal).toBeNull()
    // 나갈 때 쓰다 만 입력까지 저장된다
    expect(JSON.parse(localStorage.getItem('twenty-seven/save')!).copy.at.lk).toEqual({ chapter: 1, verse: 2, draft: lk1[1].text.slice(0, 3) })
    sit()
    expect(screen.getByText('누가복음 1장 2절')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '이어서 필사' }))
    expect(screen.getByRole('status')).toHaveTextContent('누가복음 1장 2절부터 이어집니다.')
    expect(box().value).toBe(lk1[1].text.slice(0, 3))
  })

  it('[다른 책 선택]은 27권을 서고 방별로 — 고른 책을 이미 쓰던 중이면 이어지는 자리를 알려 준다', async () => {
    reset({ copy: { book: 'lk', at: { mt: { chapter: 7, verse: 13 } }, legacy: {} } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    sit()
    await user.click(screen.getByRole('button', { name: '다른 책 선택' }))
    expect(screen.getByText('어느 책을 필사할까요?')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /· \d+\/\d+장$/ })).toHaveLength(27)
    await user.click(screen.getByRole('button', { name: /^마태복음 · / }))
    expect(screen.getByRole('heading')).toHaveTextContent('마태복음 7장 · ')
    expect(screen.getByRole('status')).toHaveTextContent('마태복음 7장 13절부터 이어집니다.')
  })

  it('처음 쓰는 책은 "이어집니다"를 보이지 않는다', async () => {
    reset()
    const user = userEvent.setup()
    render(<ModalLayer />)
    sit()
    await user.click(screen.getByRole('button', { name: /^요한복음 · / }))
    expect(screen.getByRole('heading')).toHaveTextContent('요한복음 1장 · 1/')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})

describe('필사 집중 화면 — 마을이 사라진다', () => {
  it('책상에 앉아 있는 동안 위 줄·마을·조작판은 감춰지고 마을 소리는 꺼진다. 나가면 돌아온다', async () => {
    reset(writing('lk'))
    const user = userEvent.setup()
    const { container } = render(<Play />)
    const village = container.querySelector('.village')!
    expect(village).not.toHaveAttribute('hidden')
    act(() => useGame.getState().open({ kind: 'copy', view: 'menu' }))
    expect(village).toHaveAttribute('hidden')
    expect(screen.getByLabelText('마을')).not.toBeVisible()
    expect(screen.getByRole('dialog', { name: '필사' })).toBeVisible()
    expect(isQuiet()).toBe(true)
    await user.click(screen.getByRole('button', { name: '나가기' }))
    expect(village).not.toHaveAttribute('hidden')
    expect(isQuiet()).toBe(false)
  })
})

describe('필사 집중 화면 — 휴대폰 한글 키보드 (조합)', () => {
  const text = lk1[0].text

  it('조합 중인 글자는 되돌리지 않는다 — 본문과 맞지 않는 뭉치도 조합이 끝난 뒤에야 지운다', () => {
    openWrite(writing('lk'))
    const wrong = text.slice(0, 4) + 'ㅋㅋㅋㅋㅋ'
    fireEvent.compositionStart(box())
    fireEvent.change(box(), { target: { value: wrong } })
    expect(box().value).toBe(wrong)
    expect(draft()).toBe('')
    fireEvent.compositionEnd(box())
    expect(box().value).toBe('')
  })

  it('조합 중인 마지막 글자는 오타로 깜빡이지 않는다 — 조합이 끝나도 틀리면 그때 표시', () => {
    openWrite(writing('lk'))
    // 본문 다음 글자의 앞부분이 아닌 글자 (천지인 자판의 중간 글자처럼)
    const next = [...text.replace(/\s/g, '')][2]
    const odd = next === '뷁' ? '꿻' : '뷁'
    const typed = [...text.replace(/\s/g, '')].slice(0, 2).join('') + odd
    fireEvent.compositionStart(box())
    fireEvent.change(box(), { target: { value: typed } })
    expect(document.querySelector('[data-typo]')).toBeNull()
    expect(box()).not.toHaveAttribute('aria-invalid')
    fireEvent.compositionEnd(box())
    expect(document.querySelector('[data-typo]')).not.toBeNull()
  })

  it('조합 중에 절을 다 맞게 써도 조합이 끝난 뒤에 기록한다 (마지막 글자가 아직 바뀔 수 있으므로)', () => {
    openWrite(writing('lk'))
    fireEvent.compositionStart(box())
    fireEvent.change(box(), { target: { value: text } })
    expect(useGame.getState().game.copyStats.verses).toBe(0)
    expect(screen.getByLabelText('본문 누가복음 1:1').querySelector('.copy-done-part')).toHaveTextContent(text)
    fireEvent.compositionEnd(box())
    expect(useGame.getState().game.copyStats.verses).toBe(1)
    expect(screen.getByRole('heading')).toHaveTextContent('누가복음 1장 · 2/')
    // 조합이 끝난 뒤 따라오는 같은 입력(사파리)은 다음 절의 입력칸을 덮지 않는다
    fireEvent.change(box(), { target: { value: text } })
    expect(draft()).toBe('')
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('키보드가 여러 글자를 한꺼번에 확정해도 본문 앞부분과 맞으면 받는다', () => {
    openWrite(writing('lk'))
    const chunk = text.slice(0, 8)
    fireEvent.change(box(), { target: { value: chunk } })
    expect(draft()).toBe(chunk)
    // 본문과 맞지 않는 뭉치(자동완성 낱말)는 받지 않는다
    fireEvent.change(box(), { target: { value: chunk + '자동완성낱말' } })
    expect(draft()).toBe(chunk)
    expect(box().value).toBe(chunk)
    // 같은 뭉치가 다시 들어와도 또 지운다 (입력칸과 저장이 어긋나지 않게)
    fireEvent.change(box(), { target: { value: chunk + '자동완성낱말' } })
    expect(draft()).toBe(chunk)
    expect(box().value).toBe(chunk)
  })

  describe('조합 중인 마지막 글자에서 멈추지 않는다', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('절을 다 맞게 쓰고 조합 중인 채로 잠깐 멈추면 조합을 확정해 절을 마친다 (늦게 온 compositionend는 받지 않는다)', () => {
      openWrite(writing('lk'))
      fireEvent.compositionStart(box())
      fireEvent.change(box(), { target: { value: text } })
      act(() => void vi.advanceTimersByTime(699))
      expect(useGame.getState().game.copyStats.verses).toBe(0)
      act(() => void vi.advanceTimersByTime(1))
      expect(useGame.getState().game.copyStats.verses).toBe(1)
      expect(screen.getByRole('heading')).toHaveTextContent('누가복음 1장 · 2/')
      expect(box().value).toBe('')
      expect(document.activeElement).toBe(box())
      // 브라우저가 늦게 보낸 compositionend가 다음 절 입력칸을 앞 절 글로 덮지 않는다
      fireEvent.compositionEnd(box())
      expect(box().value).toBe('')
      expect(draft()).toBe('')
      expect(useGame.getState().game.copyStats.verses).toBe(1)
    })

    it('아직 절을 다 쓰지 않았으면 멈춰도 조합을 건드리지 않는다', () => {
      openWrite(writing('lk'))
      fireEvent.compositionStart(box())
      fireEvent.change(box(), { target: { value: text.slice(0, 5) } })
      act(() => void vi.advanceTimersByTime(3000))
      expect(useGame.getState().game.copyStats.verses).toBe(0)
      expect(box().value).toBe(text.slice(0, 5))
    })
  })

  it('붙여넣기·끌어 놓기·고쳐 쓰기 제안 입력은 들어오기 전에 막는다', () => {
    openWrite(writing('lk'))
    const fire = (inputType: string) => {
      const e = new InputEvent('beforeinput', { inputType, data: '태초에', cancelable: true, bubbles: true })
      box().dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(fire('insertFromPaste')).toBe(true)
    expect(fire('insertFromDrop')).toBe(true)
    expect(fire('insertReplacementText')).toBe(true)
    expect(fire('insertText')).toBe(false)
    expect(fire('insertCompositionText')).toBe(false)
  })
})

describe('재료 없는 필사에 맞춰 — 펜·책상은 꾸미기, 밤에도 언제든', () => {
  it('손에 쥔 펜 그림: 좋은 펜이 없으면 갈대 펜, 있으면 좋은 펜 (쓰는 느낌만 바뀐다)', () => {
    openWrite(writing('lk'))
    expect(screen.getByRole('img', { name: '손에 쥔 갈대 펜' })).toHaveClass('copy-pen-plain')
    act(() => useGame.setState((s) => ({ game: { ...s.game, inv: { goodPen: 1 } } })))
    expect(screen.getByRole('img', { name: '손에 쥔 좋은 펜' })).toHaveClass('copy-pen-good')
  })

  it('좋은 펜이 있어도 한 장에 드는 시간·능력치는 같다 (이미 산 펜은 그대로 가진다)', async () => {
    const user = userEvent.setup()
    openWrite({ ...writing('lk'), inv: { goodPen: 1 } })
    await user.type(box(), lk1[0].text)
    expect(useGame.getState().game.inv.goodPen).toBe(1)
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('밤에 등잔 기름이 없어도 책상에 앉아 필사 화면이 열리고 한 절을 적는다', async () => {
    reset({ clock: { day: 1, minute: 22 * 60 }, inv: {}, ...writing('lk') })
    render(<ModalLayer />)
    sit()
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'menu' })
    act(() => useGame.getState().copyView('write', true))
    const user = userEvent.setup()
    await user.type(box(), lk1[0].text)
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('아래 상태 판에는 파피루스·잉크 수가 없다 (먹을 것·물·기름만)', () => {
    reset({ inv: { papyrus: 3, ink: 2, bread: 1 } })
    render(<StatusPanel />)
    const panel = screen.getByRole('region', { name: T.ui.statusTitle })
    expect(within(panel).queryByRole('img', { name: '파피루스' })).toBeNull()
    expect(within(panel).queryByRole('img', { name: '잉크' })).toBeNull()
    for (const name of ['빵', '물', '기름']) expect(within(panel).getByRole('img', { name })).toBeInTheDocument()
  })
})

// ── 구약 필사 (계획 20 작업 5) ──
describe('필사 책상 — 구약 칸', () => {
  const gifted = (extra: Partial<GameState> = {}): Partial<GameState> => ({ flags: { ...newGame(CONTENT).flags, newlandGift: 1 }, ...extra })
  const gen1 = () => versesOf('창 1:1-31')
  beforeAll(async () => {
    await ensureOtBook('gen')
  })

  it('새 터를 받기 전에는 구약 칸이 없다 — 책 고르기는 신약 27권만, 지금 화면 그대로', () => {
    reset()
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'pick' }))
    expect(screen.queryByRole('tablist', { name: T.ot.tabs })).toBeNull()
    expect(screen.getByRole('button', { name: /^마태복음/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^창세기/ })).toBeNull()
  })

  it('새 터를 받은 뒤에는 신약·구약 두 칸. 구약 칸은 책 범위 이름의 네 방에 39권 (분류 이름 없음)', () => {
    reset(gifted())
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'pick' }))
    const tabs = screen.getByRole('tablist', { name: T.ot.tabs })
    expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['신약', '구약'])
    expect(screen.getByRole('tab', { name: '신약' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: '구약' }))
    for (const label of ['창세기–신명기', '여호수아–에스더', '욥기–아가', '이사야–말라기']) expect(screen.getByText(label)).toBeInTheDocument()
    for (const word of ['율법서', '역사서', '시가서', '예언서']) expect(screen.queryByText(word)).toBeNull()
    for (const r of OT_BOOK_TABLE) expect(screen.getByRole('button', { name: `${r.name} · 0/${r.chapters}${r.id === 'psa' ? '편' : '장'}` })).toBeInTheDocument()
  })

  it('새 터 책상에서 열면 처음부터 구약 칸이고, 진행한 장 수가 보인다', () => {
    reset(gifted({ otProgress: { rut: { completed: [1, 2], arrangement: {} } } }))
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'pick', tab: 'ot' }))
    expect(screen.getByRole('tab', { name: '구약' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: '룻기 · 2/4장' })).toBeInTheDocument()
  })

  it('불러온 책을 고르면 곧바로 쓰기 화면: 헤더·한 절·안내 상자(2026-10-07 공개), 곁의 가족 없음', () => {
    reset(gifted())
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'pick', tab: 'ot' }))
    fireEvent.click(screen.getByRole('button', { name: '창세기 · 0/50장' }))
    expect(screen.getByRole('heading')).toHaveTextContent(`창세기 1장 · 1/${gen1().length}절`)
    expect(screen.getByLabelText('본문 창세기 1:1')).toHaveTextContent('태초에 하나님이 천지를 창조하시니라')
    expect(useGame.getState().game.copy.book).toBe('gen')
    // 안내 상자(chapterGuide): 구약 길잡이도 책과 함께 불러와 보인다 (사용자 결정 ④)
    expect(document.querySelector('.copy-guide')).not.toBeNull()
    expect(document.querySelector('.copy-family')).toBeNull()
  })

  it('한글 입력: 한 절을 쓰면 기록되고(otCopyStats) 다음 절이 올라온다 — 신약 기록은 그대로', async () => {
    reset(gifted({ copy: { book: 'gen', at: { gen: { chapter: 1, verse: 1 } }, legacy: {} } }))
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
    const user = userEvent.setup()
    await user.type(box(), gen1()[0].text)
    expect(screen.getByRole('status')).toHaveTextContent('✓ 창세기 1:1 기록')
    expect(screen.getByRole('heading')).toHaveTextContent(`창세기 1장 · 2/${gen1().length}절`)
    const g = useGame.getState().game
    expect(g.otCopyStats?.verses).toBe(1)
    expect(g.copyStats.verses).toBe(0)
    expect(g.flags.newlandRevealed).toBe(1)
  })

  it('휴대폰 한글 키보드(조합)도 같다: 조합이 끝난 뒤에 절을 기록한다', () => {
    reset(gifted({ copy: { book: 'gen', at: { gen: { chapter: 1, verse: 1 } }, legacy: {} } }))
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
    const text = gen1()[0].text
    fireEvent.compositionStart(box())
    fireEvent.change(box(), { target: { value: text } })
    expect(useGame.getState().game.otCopyStats).toBeUndefined()
    fireEvent.compositionEnd(box())
    expect(useGame.getState().game.otCopyStats?.verses).toBe(1)
  })

  it('장을 마치면 장 완료 화면: 능력치·기록 줄·제본 단추 없이 [책 덮기]', async () => {
    await ensureOtBook('oba')
    reset(gifted({ copy: { book: 'oba', at: { oba: { chapter: 1, verse: 1 } }, legacy: {} } }))
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
    // 한 번에 들어오는 입력 (휴대폰 키보드 확정과 같다) — 본문과 맞으면 받는다
    for (const v of versesOf('옵 1:1-21')) fireEvent.change(box(), { target: { value: v.text } })
    expect(screen.getByRole('heading')).toHaveTextContent('오바댜 1장')
    expect(screen.queryByText(T.copyFocus.bind)).toBeNull()
    expect(document.querySelector('.copy-gains')).toBeNull()
    expect(document.querySelector('.copy-god')).toBeNull()
    expect(screen.getByRole('button', { name: T.copyFocus.closeBook })).toBeInTheDocument()
    const g = useGame.getState().game
    expect(g.otProgress?.oba?.completed).toEqual([1])
    expect(g.stats).toEqual(newGame(CONTENT).stats)
    expect(g.godRecords).toEqual([])
  })

  it('안 불러온 책을 고르면 "책을 펼치는 중" 한 줄이 보이다가 불러온 뒤 쓰기 화면', async () => {
    reset(gifted())
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'pick', tab: 'ot' }))
    fireEvent.click(screen.getByRole('button', { name: '레위기 · 0/27장' }))
    expect(screen.getByRole('status')).toHaveTextContent('책을 펼치는 중')
    expect(await screen.findByRole('heading', { name: /레위기 1장 · 1\// })).toBeInTheDocument()
    expect(useGame.getState().game.copy.book).toBe('lev')
  })

  it('불러오기에 실패하면 그 줄을 지우고 단추만 남긴다 (오류 문구 없음)', async () => {
    reset(gifted())
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'pick', tab: 'ot' }))
    vi.mocked(ensureOtBook).mockRejectedValueOnce(new Error('network'))
    fireEvent.click(screen.getByRole('button', { name: '민수기 · 0/36장' }))
    expect(screen.getByRole('status')).toHaveTextContent('책을 펼치는 중')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(screen.queryByText(/오류|실패|network/)).toBeNull()
    expect(screen.getByRole('button', { name: '민수기 · 0/36장' })).toBeInTheDocument()
    expect(useGame.getState().game.copy.book).toBeNull()
  })

  it('이어 쓰던 구약 책을 책상에서 열었는데 본문이 아직 없으면 같은 처리: 줄 → (실패하면) 줄 지우고 단추만', async () => {
    reset(gifted({ copy: { book: 'deu', at: { deu: { chapter: 2, verse: 1 } }, legacy: {} } }))
    vi.mocked(ensureOtBook).mockRejectedValueOnce(new Error('offline'))
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'menu' }))
    expect(screen.getByRole('status')).toHaveTextContent('책을 펼치는 중')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(screen.getByRole('button', { name: T.copyFocus.pickOther })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: T.copyFocus.exit })).toBeInTheDocument()
  })

  it('쓰기 중에는 필사창이 그대로 열려 있다 (프레임이 흘러도 다른 창이 끼어들지 않는다)', () => {
    reset(gifted({ copy: { book: 'gen', at: { gen: { chapter: 1, verse: 1 } }, legacy: {} } }))
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
    for (let i = 0; i < 20; i++) act(() => useGame.getState().frame(0.1))
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'write' })
  })
})
