// 계획 14 작업 6: 위 줄에 지금 필사 자리
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { copyVerses } from '../../engine/copying'
import { newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { Hud } from './Hud'

function show(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
  return render(<Hud />)
}
const mtDone = (completed: number[]) => ({ ...newGame(CONTENT).progress, mt: { completed, arrangement: {} } })

describe('위 줄: 지금 필사 자리', () => {
  it('직업과 지금 쓰는 장의 절 진행: "✒ 견습 필사가 · 📖 마태복음 2장 0/23"', () => {
    show({ progress: mtDone([1]), copy: { book: 'mt', at: { mt: { chapter: 2, verse: 1 } }, legacy: {} } })
    const all = copyVerses('mt', 2, CONTENT).length
    expect(screen.getByText(`✒ ${T.jobs[0]}`)).toBeInTheDocument()
    expect(screen.getByText(`📖 마태복음 2장 0/${all}`)).toBeInTheDocument()
  })

  it('쓴 절만큼 앞 숫자가 오른다 (4절부터 쓸 차례면 3)', () => {
    show({ progress: mtDone([1]), copy: { book: 'mt', at: { mt: { chapter: 2, verse: 4 } }, legacy: {} } })
    expect(screen.getByText(`📖 마태복음 2장 3/${copyVerses('mt', 2, CONTENT).length}`)).toBeInTheDocument()
  })

  it('고른 책이 없으면 책상에서 고르기 — 재촉하는 표시(빛) 없이', () => {
    const { container } = show()
    expect(screen.getByText(T.ui.hudCopyNone)).toBeInTheDocument()
    expect(container.querySelector('.hud-chapter.hint')).toBeNull()
  })

  it('다 쓴 책이면 마쳤다고만', () => {
    show({ progress: { ...newGame(CONTENT).progress, phm: { completed: [1], arrangement: {} } }, copy: { book: 'phm', at: {}, legacy: {} } })
    expect(screen.getByText('📖 빌레몬서 필사를 마침')).toBeInTheDocument()
  })

  it('능력치는 위 줄에 보이지 않는다 (가방 안에만)', () => {
    const { container } = show({ progress: mtDone([1]), copy: { book: 'mt', at: {}, legacy: {} } })
    for (const name of Object.values(T.stats.names)) expect(container.textContent).not.toContain(name)
  })
})
