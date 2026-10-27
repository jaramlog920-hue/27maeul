// 2026-10-26 출시 전 감사(A01~A21)에서 고친 것들의 회귀 시험
import { describe, expect, it, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, sameOtLook, type GameState } from '../engine/game'
import { attendWhy } from '../engine/plans'
import { copiedChapters } from '../engine/blank-quiz'
import { cleanName } from '../engine/companion'
import { cleanCatch } from '../engine/persona'
import { useGame } from '../store/game-store'
import { BlockedButton } from '../shared/BlockedButton'
import { Bag } from './bag/Bag'
import { ModalLayer } from './ModalLayer'
import { newChild } from '../engine/child'
import { freshStats } from '../engine/stats'
import { legacyGame } from '../engine/growth-test-support'
import { t } from '../shared/i18n'
import { AvatarForm } from './intro/AvatarForm'

const base = (): GameState => newGame(CONTENT)

beforeEach(() => {
  act(() => useGame.setState({ game: base(), modal: null, toast: null }))
})

describe('A01 시각 맞춤 시계', () => {
  it('가방에서 골라도 화면이 깨지지 않고 넘길 시각이 보인다', () => {
    const g = base()
    act(() => useGame.setState({ game: { ...g, inv: { ...g.inv, setClock: 1 } }, modal: { kind: 'bag' } }))
    render(<Bag />)
    fireEvent.click(screen.getByRole('button', { name: /시각 맞춤 시계/ }))
    expect(screen.getByRole('group', { name: '넘어갈 시각' })).toBeInTheDocument()
  })
})

describe('A02 막힌 단추', () => {
  it('까닭이 있으면 흐리게 두고, 누르면 동작 대신 까닭을 알린다', () => {
    let pressed = 0
    render(<BlockedButton why="닢이 모자라요." onClick={() => pressed++}>사기</BlockedButton>)
    const b = screen.getByRole('button', { name: '사기' })
    expect(b).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(b)
    expect(pressed).toBe(0)
    expect(useGame.getState().toast?.text).toBe('닢이 모자라요.')
  })
  it('빈 까닭도 막힌 단추로 보고 두루 쓰는 한 줄을 띄운다', () => {
    render(<BlockedButton why="" onClick={() => {}}>하기</BlockedButton>)
    fireEvent.click(screen.getByRole('button', { name: '하기' }))
    expect(useGame.getState().toast?.text).toBe(t('why.notNow'))
  })
  it('까닭이 없으면 그대로 눌린다', () => {
    let pressed = 0
    render(<BlockedButton why={null} onClick={() => pressed++}>하기</BlockedButton>)
    const b = screen.getByRole('button', { name: '하기' })
    expect(b).not.toHaveAttribute('aria-disabled')
    fireEvent.click(b)
    expect(pressed).toBe(1)
  })
  it('새로 넣은 까닭 열쇠는 모두 문구가 있다', () => {
    for (const k of ['why.festNear', 'why.work.done', 'why.project.few', 'why.scroll.notMarket', 'why.request.expired', 'why.draftWrong', 'confirm.retry', 'confirm.keep'])
      expect(t(k)).not.toBe(k)
  })
})

describe('A04 행사·모임에 함께할 수 없는 까닭', () => {
  it('마을 밖·열리는 때가 아님·멀리 있음을 나눈다', () => {
    const g = base()
    const appt = { id: 'a1', day: g.clock.day, from: g.clock.minute - 10, to: g.clock.minute + 60, state: 'running', place: 'hallTable' } as unknown as GameState['plans']['appts'][number]
    const s: GameState = { ...g, plans: { ...g.plans, appts: [appt] } }
    expect(attendWhy({ ...s, map: 'newland' } as GameState, 'a1')).toBe('away')
    expect(attendWhy({ ...s, clock: { ...s.clock, minute: appt.to + 5 } }, 'a1')).toBe('time')
    expect(attendWhy({ ...s, player: { ...s.player, x: 0, y: 0 } }, 'a1')).toBe('far')
  })
})

describe('A17 빈칸 퀴즈 장 목록', () => {
  it('마친 순서가 아니라 성경 차례대로', () => {
    const g = base()
    const s = { ...g, copy: { ...g.copy, copied: { jn: [3, 1], mt: [2], mk: [1] } } } as GameState
    expect(copiedChapters(s).map((c) => `${c.book}${c.chapter}`)).toEqual(['mt2', 'mk1', 'jn1', 'jn3'])
  })
})

describe('A20 구약 책 꾸미기', () => {
  it('지금 모습과 같으면 같은 꾸밈으로 본다 (덧장식 없음 = none)', () => {
    const g = base()
    const special = { color: 'cream', pattern: 'lines', deco: 'leather' } as const
    const s = { ...g, otBound: { gen: { day: 1, special } } } as unknown as GameState
    expect(sameOtLook(s, 'gen', { ...special, detail: 'none' })).toBe(true)
    expect(sameOtLook(s, 'gen', { ...special, color: 'sky' } as never)).toBe(false)
  })
})

describe('A21 이름·말버릇 자르기', () => {
  it('이모지를 반쪽으로 자르지 않는다', () => {
    const name = cleanName('나비나비나비나😺😺', 'cat')
    expect(name).toBe('나비나비나비나😺')
    expect(name.isWellFormed()).toBe(true)
  })
  it('금지어가 든 말버릇은 받지 않는다', () => {
    expect(cleanCatch('예수님')).toBeUndefined()
    expect(cleanCatch('그렇지')).toBe('그렇지')
  })
})

describe('아이와 함께하기 (2026-10-26 중후반 점검)', () => {
  it('아기라서 모두 막혔으면 까닭은 활동마다가 아니라 한 번만', () => {
    const g = legacyGame(CONTENT)
    const child = { ...newChild(g.clock.day, freshStats(), undefined), name: '오티스', look: 'boy' as const }
    act(() => useGame.setState({ game: { ...g, scenes: [], child }, modal: { kind: 'kidTime' } }))
    render(<ModalLayer />)
    const why = screen.queryAllByText(/요람에서 자요/)
    expect(why.length).toBeGreaterThan(0)
    expect(why.length).toBeLessThanOrEqual(2) // 위 안내 한 줄 (+ 배우자 칸 한 줄)
    expect(screen.getByRole('button', { name: /같이 책 읽기/ })).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('주인공 만들기 (2026-10-27 출시 전 검토)', () => {
  it('이름 없이 시작을 누르면 넘어가지 않고 까닭을 한 줄로 보인다', () => {
    let done = 0
    render(<AvatarForm onDone={() => done++} onBack={() => {}} />)
    const start = screen.getByRole('button', { name: '이대로 시작' })
    expect(start).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(start)
    expect(done).toBe(0)
    expect(screen.getByRole('status')).toHaveTextContent('이름을 적어 주세요.')
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '민준' } })
    expect(start).not.toHaveAttribute('aria-disabled')
    fireEvent.click(start)
    expect(done).toBe(1)
  })
})

describe('서고 문 누르기 (2026-10-27 플레이 점검)', () => {
  it('양옆 방 문을 누르면 어느 방인지 잠깐 알린다', async () => {
    const { LOCKED_DOORS } = await import('../engine/world')
    const g = base()
    act(() => useGame.setState({ game: { ...g, player: { ...g.player, x: 36, y: 54, path: [] } }, modal: null, toast: null }))
    act(() => useGame.getState().tap(LOCKED_DOORS[3]))
    expect(useGame.getState().toast?.text).toBe('요한계시록 방')
  })
})

describe('육아·새 터 플레이 점검 (2026-10-27)', () => {
  it('아기는 상태에 맞는 돌보기만 가까워진다', async () => {
    const { babyMood, BABY_MOOD_CARE, careBaby } = await import('../engine/game')
    const g = legacyGame(CONTENT)
    const crib = { item: 'homeCradle' as const, x: 4, y: 4 }
    const s = { ...g, scenes: [], room: [crib], clock: { day: 3, minute: 10 * 60 }, child: { ...newChild(3, freshStats(), undefined), close: 0 }, player: { ...g.player, x: 5, y: 4, path: [] } }
    const fit = BABY_MOOD_CARE[babyMood(s)]
    const wrong = (['hold', 'soothe', 'tuck'] as const).find((a) => a !== fit)!
    expect(careBaby(s, wrong)!.child!.close).toBe(0)
    expect(careBaby(s, fit)!.child!.close).toBe(2)
    // 안으면 졸려서 눕히기가 맞는 돌보기가 된다
    const held = careBaby({ ...s, flags: { ...s.flags, babyCare: 3 } }, 'hold')!
    expect(babyMood(held)).toBe('drowsy')
  })
  it('함께하기는 하루 첫 활동만 가까워진다', async () => {
    const { doKidAct } = await import('../engine/family')
    const g = legacyGame(CONTENT)
    const s = { ...g, scenes: [], clock: { day: 40, minute: 10 * 60 }, child: { ...newChild(10, freshStats(), undefined), name: '봄', close: 0 } }
    const a = doKidAct(s, 'read', CONTENT)!.state
    const b = doKidAct(a, 'ball', CONTENT)!.state
    expect(a.child!.close).toBeGreaterThan(0)
    expect(b.child!.close).toBe(a.child!.close)
  })
  it('도시락은 하루 한 번, 빵이 있어야', async () => {
    const { giveKidLunch, kidLunchBlock } = await import('../engine/newland-life')
    const g = legacyGame(CONTENT)
    const s = { ...g, inv: {}, child: { ...newChild(1, freshStats(), undefined), close: 10 } }
    expect(kidLunchBlock(s)).toBe('noBread')
    const fed = giveKidLunch({ ...s, inv: { bread: 1 } })!
    expect(fed.child!.close).toBe(11)
    expect(fed.inv.bread).toBe(0)
    expect(kidLunchBlock({ ...fed, inv: { bread: 1 } })).toBe('done')
  })
})
