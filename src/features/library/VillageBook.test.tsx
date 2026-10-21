import { render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { newChild } from '../../engine/child'
import { useGame } from '../../store/game-store'
import { VillageBook, villageRecords } from './VillageBook'

describe('마을 기록 책', () => {
  it('우리 집 결혼·아이·잔치를 날짜 순서로', () => {
    const s = newGame(CONTENT)
    const g = { ...s, romance: { partner: 'cosmo', stage: 'married' as const, since: 1, weddingDay: null, marriedDay: 20 }, child: { ...newChild(40, s.stats, undefined), born: 40, name: '하나' }, flags: { ...s.flags, allFeastDay: 90 } }
    const rows = villageRecords(g)
    expect(rows.map((r) => r.day)).toEqual([20, 40, 90])
    useGame.setState({ game: g })
    render(<VillageBook />)
    expect(screen.getByText(/하나/)).toBeTruthy()
  })
})
