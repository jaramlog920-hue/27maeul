// 신약 키워드 계승 (계획 18 B18-6, 2026-10-08): 원본 보존·돌아보기·대표 사례(사랑)·못 만나도 고를 수 있음·점수 없음
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import type { Build } from './newland-build'
import type { GodFind } from './god-records'
import { canMendQuarrel, keywordRecall, MEND_GAIN, memoriesOf, mendQuarrel, quarrelPair } from './newland-life'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

const yard: Build = { id: 'b1', kind: 'courtyard', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
const finds: GodFind[] = [
  { keyword: 'love', ref: '롬 5:8', book: 'rom', chapter: 5, day: 30 },
  { keyword: 'love', ref: '요 3:16', book: 'jn', chapter: 3, day: 12 },
  { keyword: 'holy', ref: '벧전 1:16', book: '1pe', chapter: 1, day: 40 },
]
function land(godRecords: GodFind[] = []): GameState {
  const base = newGame(CONTENT)
  return {
    ...base,
    clock: { day: 50, minute: 16 * 60 },
    godRecords,
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    newland: { builds: [yard], tiles: {}, nextId: 2, settledDay: 50 },
  }
}

describe('신약 키워드 계승', () => {
  it('돌아보기: 키워드마다 횟수와 처음 만난 구절, 원본은 그대로', () => {
    const copy = JSON.parse(JSON.stringify(finds))
    const r = keywordRecall(finds)
    expect(r.map((k) => [k.keyword, k.n, k.first.ref])).toEqual([['love', 2, '요 3:16'], ['holy', 1, '벧전 1:16']])
    expect(finds).toEqual(copy)
  })

  it('다툰 두 이웃에게 함께 쓰는 자리: 한 번, 둘 다 마음이 조금, 기억에 남고, 키워드 기록은 그대로', () => {
    const pair = quarrelPair(CONTENT.neighbors)!
    expect(pair).toHaveLength(2)
    const s = land(finds)
    expect(canMendQuarrel(s)).toBe(true)
    const t = mendQuarrel(s, pair)
    for (const id of pair) expect(t.hearts[id]).toBe(Math.min(100, (s.hearts[id] ?? 0) + MEND_GAIN))
    expect(canMendQuarrel(t)).toBe(false)
    expect(mendQuarrel(t, pair)).toBe(t)
    expect(t.godRecords).toBe(s.godRecords)
    expect(memoriesOf(t).some((m) => m.kind === 'reconcile' && m.day === 50)).toBe(true)
  })

  it('사랑을 만났으면 그 구절이 곁에 보이고, 못 만났어도 고를 수 있다', () => {
    useGame.setState({ game: land(finds), modal: { kind: 'facility', id: 'courtyard' } as never })
    const { unmount } = render(<ModalLayer />)
    expect(screen.getByText('사랑 · 요 3:16')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '말씀에서 만난 기록 돌아보기' }))
    expect(screen.getByText('2번 · 처음 요 3:16')).toBeInTheDocument()
    unmount()
    useGame.setState({ game: land([]), modal: { kind: 'facility', id: 'courtyard' } as never })
    render(<ModalLayer />)
    expect(screen.queryByText(/ · 요 3:16/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '함께 쓰는 자리 마련하기' }))
    expect(useGame.getState().game.flags.loveCase).toBe(50)
  })
})
