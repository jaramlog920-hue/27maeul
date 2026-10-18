// 은퇴한 이웃의 후계자와 결혼했으면 27권 완성 화면 가족 줄에 후계자 이름 (2026-10-18 감사 L-48)
import { render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame, type GameState } from '../../engine/game'
import { newGenState } from '../../engine/gen'
import { NO_ROMANCE } from '../../engine/romance'
import { useGame } from '../../store/game-store'
import { ShelfDone } from './ShelfDone'

it('가족 줄에 후계자 아론이 나오고 은퇴한 부모 이름은 나오지 않는다', () => {
  const base = newGame(CONTENT)
  const gen = newGenState(CONTENT, 7, 134)
  gen.persons['g-0001'] = { id: 'g-0001', origin: 'born', born: 10, stage: 'adult', look: 'm', name: '아론', parents: ['rudy'], spouse: null, household: null } as never
  gen.retired = { rudy: { heir: 'g-0001', day: 120 } } as never
  const s = { ...base, gen, scenes: [], romance: { ...NO_ROMANCE, partner: 'rudy', stage: 'married' as const, since: 130, marriedDay: 140 } } as GameState
  useGame.getState().load(s)
  useGame.setState({ modal: { kind: 'shelfDone' } as never, piecePopups: [] })
  render(<ShelfDone />)
  const txt = document.body.textContent ?? ''
  expect(txt).toContain('아론')
  expect(txt).not.toContain(CONTENT.neighbors.find((n) => n.id === 'rudy')!.role)
})
