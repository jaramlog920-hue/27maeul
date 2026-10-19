// 2026-10-19 감사 남은 안내 부족: 선물 단추(L-65), 아이 일터 접시(L-46), 저장 칸(L-3), 수첩 직업(L-54), 저장 못 하는 설정(L-50)
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, neighborById } from '../content/catalog'
import { T } from '../content/text'
import { newChild } from '../engine/child'
import { newGame } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { copyAlwaysWrite, setCopyAlwaysWrite } from '../features/desk/copy-way-setting'
import { copyVoiceOn, setCopyVoice } from '../features/desk/copy-voice'
import { SaveSlots } from '../features/intro/SaveSlots'
import { jobOf } from '../features/journal/Journal'
import { FacilityView } from '../features/newland/FacilityView'
import { ModalLayer } from '../features/ModalLayer'
import { useGame } from '../store/game-store'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useGame.setState({ piecePopups: [], copyResult: null, toast: null })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('선물 단추 (L-65)', () => {
  it('오늘 이미 선물한 이웃: 단추를 누르면 까닭과 다시 되는 때를 알린다', () => {
    const s = legacyGame(CONTENT)
    useGame.setState({ game: { ...s, scenes: [], inv: { bread: 2 }, gifted: ['baker'] }, modal: { kind: 'talk', neighborId: 'baker', line: '안녕' } })
    render(<ModalLayer />)
    const button = screen.getByRole('button', { name: T.ui.talkGift })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(button)
    expect(useGame.getState().toast?.text).toBe(T.ui.giftedToday)
    expect(useGame.getState().modal?.kind).toBe('talk')
  })

  it('줄 물건이 없으면 그렇다고 알린다', () => {
    const s = legacyGame(CONTENT)
    useGame.setState({ game: { ...s, scenes: [], inv: {}, gifted: [] }, modal: { kind: 'talk', neighborId: 'baker', line: '안녕' } })
    render(<ModalLayer />)
    fireEvent.click(screen.getByRole('button', { name: T.ui.talkGift }))
    expect(useGame.getState().toast?.text).toBe(T.ui.giftNothing)
  })
})

describe('요리사 아이 일터 (L-46)', () => {
  it('세 번째 들른 날에도 접시를 받았다고 알린다', () => {
    const fresh = newGame(CONTENT)
    const child = { ...newChild(1, fresh.stats, 'wit'), name: '첫째', job: 'cook' as const }
    const build = { id: 'b1', kind: 'kidWork' as const, x: 4, y: 12, facing: 'down' as const, state: 'done' as const, orderedDay: 1, paid: { coins: 1000, items: {} }, refunded: false, owner: 'me:1' }
    const game = { ...fresh, clock: { day: 1000, minute: 600 }, child, flags: { ...fresh.flags, kidWorkVisits: 2 }, newland: { builds: [build], tiles: {}, nextId: 2, settledDay: 1000 }, map: 'newland' as const, player: { ...fresh.player, x: 6, y: 16 } }
    useGame.setState({ game, modal: { kind: 'facility', id: 'kidWork', at: { x: 6, y: 16 } } as never })
    render(<FacilityView id="kidWork" at={{ x: 6, y: 16 }} />)
    expect(useGame.getState().game.flags.kidWorkVisits).toBe(3)
    expect(useGame.getState().toast?.text).toContain('첫째')
  })
})

describe('불러오기 칸 (L-3)', () => {
  it('열 수 없는 칸을 눌렀을 때의 안내를 보인다', () => {
    render(<SaveSlots onPick={() => {}} onBack={() => {}} notice="이 칸은 열 수 없어요." />)
    expect(screen.getByRole('alert')).toHaveTextContent('이 칸은 열 수 없어요.')
  })
})

describe('이웃 수첩 (L-54)', () => {
  it('찻집 후보도 직업 줄이 있다', () => {
    expect(jobOf(neighborById('poppy')!)).toBe('찻집')
  })
})

describe('저장소에 쓸 수 없는 필사 설정 (L-50)', () => {
  it('이번 실행 동안은 바꾼 값이 적용된다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('막힘') })
    setCopyAlwaysWrite(true)
    expect(copyAlwaysWrite()).toBe(true)
    setCopyVoice(false)
    expect(copyVoiceOn()).toBe(false)
    vi.restoreAllMocks()
    setCopyAlwaysWrite(false)
    setCopyVoice(true)
    expect(copyAlwaysWrite()).toBe(false)
    expect(copyVoiceOn()).toBe(true)
  })
})
