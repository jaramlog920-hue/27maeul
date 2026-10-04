import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, GOD_KEYWORDS, GOD_RECORDS, versesOf } from '../../content/catalog'
import { isQuiet } from '../../audio/sound'
import { newGame, type GameState } from '../../engine/game'
import { copySpot } from '../../engine/copying'
import { PLACES } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Play } from '../play/Play'

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
