// 계획 21 R1·R2: 필사 퍼즐로 절을 마치면 본문 그대로 기록, 정성 도장은 모두 직접 쓰고 틀린 글자 둘 이하인 장
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame, type GameState } from '../../engine/game'
import { copySpot, copyVerses } from '../../engine/copying'
import { copyLevel, wayFor } from '../../engine/copy-ways'
import { freshStats, addXp } from '../../engine/stats'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

// 짧은 장: 유다서 1장은 25절이라 길다 — 빌레몬서는 편지라 필사 대상이 아닐 수 있어, 누가복음 첫 장의 앞부분만 쓴다
const writing = (chapter = 1, verse = 1): Partial<GameState> => ({ copy: { book: 'lk', at: { lk: { chapter, verse } }, legacy: {} } })
function open(game: Partial<GameState>) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'copy', view: 'write' }))
}
const master = () => {
  let st = freshStats()
  for (let i = 0; i < 40; i++) st = addXp(addXp(st, 'wit', 20), 'hand', 20)
  return st
}

describe('필사 퍼즐 (R1)', () => {
  it('처음(실력 2)에는 퍼즐이 나오지 않는다', () => {
    open(writing())
    expect(screen.getByLabelText('따라 적기')).toBeVisible()
    expect(screen.queryByRole('button', { name: '직접 쓸게요' })).toBeNull()
  })
  it('실력이 오르면 퍼즐 절이 나오고, 다 맞추면 본문 그대로 다음 절로, "직접 쓸게요"로 손으로 쓸 수 있다', () => {
    const stats = master()
    const level = copyLevel(stats)
    const seed = 1234
    const verses = copyVerses('lk', 1, CONTENT)
    const v = verses.find((x) => wayFor(seed, 'lk', 1, x.verse, level) !== 'write')!
    open({ ...writing(1, v.verse), stats, flags: { ...newGame(CONTENT).flags, copySeed: seed } })
    expect(screen.getByRole('button', { name: '직접 쓸게요' })).toBeInTheDocument()
    act(() => {
      useGame.getState().copyPuzzle()
    })
    const spot = copySpot(useGame.getState().game, 'lk', CONTENT)!
    expect(spot.verse.verse).toBe(v.verse + 1)
    expect(useGame.getState().game.copyStats.verses).toBe(1)
    expect(useGame.getState().game.copyCare?.puzzle).toBe(true)
  })
  it('"직접 쓸게요"를 누르면 그 절은 입력칸으로', () => {
    const stats = master()
    const level = copyLevel(stats)
    const v = copyVerses('lk', 1, CONTENT).find((x) => wayFor(77, 'lk', 1, x.verse, level) !== 'write')!
    open({ ...writing(1, v.verse), stats, flags: { ...newGame(CONTENT).flags, copySeed: 77 } })
    fireEvent.click(screen.getByRole('button', { name: '직접 쓸게요' }))
    expect(screen.getByLabelText('따라 적기')).toBeVisible()
  })
})

describe('정성 도장 (R2)', () => {
  const finishChapter = () => {
    const verses = copyVerses('lk', 24, CONTENT)
    for (const v of verses) {
      const g = useGame.getState().game
      if (copySpot(g, 'lk', CONTENT)?.chapter !== 24) break
      act(() => {
        useGame.getState().copyVoice(v.text)
      })
    }
  }
  it('모두 직접 쓰고 틀린 글자가 없으면 그 장에 도장', () => {
    open(writing(24, 1))
    finishChapter()
    expect(useGame.getState().game.careDone).toContain('lk:24')
  })
  it('틀린 글자가 셋이면 도장이 없다', () => {
    open(writing(24, 1))
    act(() => {
      for (let i = 0; i < 3; i++) useGame.getState().copyTypo()
    })
    finishChapter()
    expect(useGame.getState().game.careDone ?? []).not.toContain('lk:24')
  })
})
