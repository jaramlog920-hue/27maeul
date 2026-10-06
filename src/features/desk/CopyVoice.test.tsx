// 필사 소리 내어 읽기 (2026-10-05): 마이크로 한 절씩 — 손으로 쓴 것과 똑같이 기록한다. 음성 인식은 흉내 낸다.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, versesOf } from '../../content/catalog'
import { sfx } from '../../audio/sound'
import { newGame, type GameState } from '../../engine/game'
import { checkVoice, normalizeCopy, VOICE_ACCEPT } from '../../engine/copying'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Settings } from '../play/Settings'
import { reloadCopyFeel } from './copy-feel'
import { copyVoiceOn } from './copy-voice'

vi.mock('../../audio/sound', async (orig) => ({ ...(await orig<typeof import('../../audio/sound')>()), sfx: vi.fn() }))
const sfxMock = vi.mocked(sfx)

/** 흉내 낸 음성 인식: 만들어진 것을 모아 두고, say로 결과를 보낸다 */
class FakeRec {
  static made: FakeRec[] = []
  lang = ''
  interimResults = false
  continuous = true
  maxAlternatives = 1
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  started = false
  aborted = false
  constructor() {
    FakeRec.made.push(this)
  }
  start() {
    this.started = true
  }
  stop() {}
  abort() {
    this.aborted = true
  }
  say(texts: string | string[], final = true) {
    const alts = (Array.isArray(texts) ? texts : [texts]).map((transcript) => ({ transcript }))
    act(() => this.onresult?.({ resultIndex: 0, results: { length: 1, 0: Object.assign(alts, { isFinal: final }) } }))
  }
}
const rec = () => FakeRec.made[FakeRec.made.length - 1]

function withApi(on: boolean) {
  const w = globalThis as unknown as Record<string, unknown>
  delete w.SpeechRecognition
  delete w.webkitSpeechRecognition
  if (on) w.webkitSpeechRecognition = FakeRec
}
const writing = (book: 'lk' | 'mt', chapter = 1, verse = 1): Partial<GameState> => ({ copy: { book, at: { [book]: { chapter, verse } }, legacy: {} } })
function openWrite(game: Partial<GameState>) {
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], clock: { day: 9, minute: 9 * 60 }, ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
}
const voiceBtn = () => screen.queryByRole('button', { name: /소리 내어 읽기|다시 읽기|듣기 멈추기/ })
const box = () => screen.getByLabelText('따라 적기') as HTMLTextAreaElement
const lk1 = versesOf('눅 1:1-80')
const mt5 = versesOf('마 5:1-48')

beforeEach(() => {
  localStorage.clear()
  reloadCopyFeel()
  sfxMock.mockClear()
  FakeRec.made = []
  withApi(true)
})
afterEach(() => withApi(false))

describe('소리 내어 읽기 — 견주기 (checkVoice)', () => {
  it('띄어쓰기·문장부호를 떼고 글자 단위로 견준다 — 같으면 1, 0.9 이상이면 받는다', () => {
    const t = lk1[0].text
    expect(checkVoice(t.replace(/[\s,.]/g, ''), t)).toEqual({ similarity: 1, ok: true, miss: [] })
    const chars = [...normalizeCopy(t)]
    // 한 글자 잘못 들음 → 받는다, 그 글자 자리가 표시된다
    const one = [...chars]
    one[3] = '뷁'
    const r1 = checkVoice(one.join(''), t)
    expect(r1.similarity).toBeGreaterThanOrEqual(VOICE_ACCEPT)
    expect(r1.ok).toBe(true)
    expect(r1.miss).toEqual([3])
    // 절반만 읽음 → 받지 않는다, 읽지 않은 뒤쪽이 모두 표시된다
    const half = chars.slice(0, Math.floor(chars.length / 2))
    const r2 = checkVoice(half.join(''), t)
    expect(r2.ok).toBe(false)
    expect(r2.miss).toEqual(chars.map((_, i) => i).slice(half.length))
    expect(checkVoice('', t).ok).toBe(false)
  })
})

describe('소리 내어 읽기 — 단추가 보이는 때', () => {
  it('처음엔 켜져 있고, 끄면 단추가 없다', () => {
    expect(copyVoiceOn()).toBe(true)
    localStorage.setItem('twenty-seven/copy-voice', '0')
    expect(copyVoiceOn()).toBe(false)
    openWrite(writing('lk'))
    expect(voiceBtn()).toBeNull()
  })

  it('음성 인식이 없는 브라우저면 설정을 켜 두어도 단추가 없고, 설정 줄도 보이지 않는다', () => {
    localStorage.setItem('twenty-seven/copy-voice', '1')
    withApi(false)
    openWrite(writing('lk'))
    expect(voiceBtn()).toBeNull()
    cleanup()
    render(<Settings />)
    expect(screen.queryByText('소리 내어 읽기(마이크)')).toBeNull()
  })

  it('설정 › 필사에서 켜면 기기에 남고, 한 줄 안내가 있다. 필사 화면에 단추가 생기지만 저절로 듣지 않는다', () => {
    render(<Settings />)
    expect(screen.getByText('소리 내어 읽기(마이크)')).toBeInTheDocument()
    expect(screen.getByText(/음성은 브라우저의 음성 인식 서버를 거쳐요\./)).toBeInTheDocument()
    fireEvent.click(document.querySelector('[data-copy-feel="voice-on"]')!)
    expect(copyVoiceOn()).toBe(true)
    cleanup()
    openWrite(writing('lk'))
    expect(voiceBtn()).toHaveTextContent('소리 내어 읽기')
    expect(FakeRec.made).toHaveLength(0)
  })
})

describe('소리 내어 읽기 — 받기·안 받기', () => {
  beforeEach(() => localStorage.setItem('twenty-seven/copy-voice', '1'))

  it('누르면 한국어·중간 결과·한 번 듣기로 듣고, 듣는 동안 작은 표시가 있다', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    const r = rec()
    expect(r.started).toBe(true)
    expect(r.lang).toBe('ko-KR')
    expect(r.interimResults).toBe(true)
    expect(r.continuous).toBe(false)
    expect(document.querySelector('.copy-voice-dot')).not.toBeNull()
    expect(voiceBtn()).toHaveAttribute('aria-pressed', 'true')
  })

  it('0.9 이상 비슷하게 읽으면 본문 그대로 기록 — 손으로 다 쓴 것과 상태·소리가 똑같다 (장 완료·하나님 기록까지)', () => {
    const text = mt5[47].text
    // 손으로 한 글자씩
    openWrite(writing('mt', 5, 48))
    for (let i = 1; i <= text.length; i++) fireEvent.change(box(), { target: { value: text.slice(0, i) } })
    const typed = useGame.getState()
    const typedSfx = sfxMock.mock.calls.filter(([n]) => n !== 'quill').map(([n]) => n)
    cleanup()
    sfxMock.mockClear()
    // 소리 내어 (한 글자 잘못 들림)
    openWrite(writing('mt', 5, 48))
    fireEvent.click(voiceBtn()!)
    const chars = [...normalizeCopy(text)]
    chars[1] = '뷁'
    rec().say(chars.join(''))
    const voiced = useGame.getState()
    const voicedSfx = sfxMock.mock.calls.filter(([n]) => n !== 'quill').map(([n]) => n)
    expect(voiced.modal).toEqual(typed.modal)
    expect(voiced.game).toEqual(typed.game)
    expect(voiced.game.copyStats.verses).toBe(1)
    expect(voiced.game.copyStats.chars).toBe(mt5[47].text.replace(/[\s\p{P}\p{S}]/gu, '').length)
    expect(voiced.game.progress.mt.completed).toContain(5)
    expect(voicedSfx).toEqual(typedSfx)
    expect(JSON.stringify(voiced.game)).not.toContain('뷁')
  })

  it('장 중간 절: 도장이 찍히고 다음 절로 — 통계가 손으로 쓴 것과 같다', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    rec().say(lk1[0].text)
    const g = useGame.getState().game
    expect(g.copyStats).toMatchObject({ verses: 1, chars: [...normalizeCopy(lk1[0].text)].length })
    expect(g.copy.at.lk).toEqual({ chapter: 1, verse: 2 })
    expect(document.querySelector('.copy-stamp')).toHaveTextContent('1:1')
    expect(screen.getByLabelText('본문 누가복음 1:2')).toBeInTheDocument()
    expect(sfxMock).toHaveBeenCalledWith('stamp')
  })

  it('여러 후보 중 본문과 가장 가까운 것으로 견준다', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    rec().say(['전혀 다른 말', lk1[0].text])
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('많이 다르면 기록하지 않고 다른 글자를 살짝 표시 — [다시 읽기]와 입력칸은 그대로 쓸 수 있다', () => {
    openWrite(writing('lk'))
    const before = useGame.getState().game
    fireEvent.click(voiceBtn()!)
    const chars = [...normalizeCopy(lk1[0].text)]
    rec().say(chars.slice(0, 10).join(''))
    expect(useGame.getState().game).toBe(before)
    const verse = screen.getByLabelText('본문 누가복음 1:1')
    const marks = verse.querySelectorAll('[data-voice-miss]')
    expect(marks.length).toBe(chars.length - 10)
    expect(marks[0]).toHaveClass('copy-typo')
    expect(marks[0].getAttribute('data-voice-miss')).toBe('10')
    expect(verse).toHaveTextContent(lk1[0].text.replace(/\s+/g, ' ').trim())
    expect(screen.getByText(/조금 다르게 들렸어요/)).toBeInTheDocument()
    expect(voiceBtn()).toHaveTextContent('다시 읽기')
    // 손으로 적으면 표시가 사라지고 평소대로
    fireEvent.change(box(), { target: { value: lk1[0].text.slice(0, 2) } })
    expect(verse.querySelector('[data-voice-miss]')).toBeNull()
    // 다시 읽기 → 새로 듣는다
    fireEvent.click(voiceBtn()!)
    expect(FakeRec.made).toHaveLength(2)
    rec().say(lk1[0].text)
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('중간 결과만으로는 기록하지 않는다 (확정되거나 듣기가 끝날 때 견준다)', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    rec().say(lk1[0].text, false)
    expect(useGame.getState().game.copyStats.verses).toBe(0)
    act(() => rec().onend?.())
    expect(useGame.getState().game.copyStats.verses).toBe(1)
  })

  it('마이크를 허락하지 않으면 한 줄 안내만 — 기록하지 않는다', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    act(() => rec().onerror?.({ error: 'not-allowed' }))
    expect(screen.getByText(/마이크를 쓸 수 없어요/)).toBeInTheDocument()
    expect(document.querySelector('.copy-voice-dot')).toBeNull()
    expect(useGame.getState().game.copyStats.verses).toBe(0)
  })

  it('나가면 듣기를 멈추고, 그 뒤에 온 결과는 기록하지 않는다', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    const r = rec()
    fireEvent.click(screen.getByRole('button', { name: '나가기' }))
    expect(useGame.getState().modal).toBeNull()
    expect(r.aborted).toBe(true)
    expect(r.onresult).toBeNull()
    expect(useGame.getState().copyVoice(lk1[0].text)).toBeNull()
    expect(useGame.getState().game.copyStats.verses).toBe(0)
  })

  it('단추를 다시 누르면 듣기를 멈춘다', () => {
    openWrite(writing('lk'))
    fireEvent.click(voiceBtn()!)
    const r = rec()
    fireEvent.click(voiceBtn()!)
    expect(r.aborted).toBe(true)
    expect(voiceBtn()).toHaveTextContent('소리 내어 읽기')
  })

  it('손으로 쓰는 길은 그대로 — 붙여넣기·본문과 맞지 않는 뭉치는 여전히 받지 않는다', () => {
    openWrite(writing('lk'))
    const { copyType } = useGame.getState()
    expect(copyType(lk1[0].text, { pasted: true })).toBe(false)
    expect(copyType(lk1[0].text, { inputType: 'insertFromPaste' })).toBe(false)
    expect(copyType(lk1[0].text, { inputType: 'insertReplacementText' })).toBe(false)
    expect(copyType('전혀 다른 긴 낱말 뭉치')).toBe(false)
    // 소리 내어 읽기처럼 0.9만 비슷한 글은 손으로는 받지 않는다 (한 글자 틀리면 절을 마치지 않는다)
    const chars = [...normalizeCopy(lk1[0].text)]
    chars[chars.length - 1] = '뷁'
    const wrong = chars.join('')
    expect(checkVoice(wrong, lk1[0].text).ok).toBe(true)
    for (let i = 1; i <= wrong.length; i++) fireEvent.change(box(), { target: { value: wrong.slice(0, i) } })
    expect(useGame.getState().game.copyStats.verses).toBe(0)
  })
})
