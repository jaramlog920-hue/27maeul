import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { familyTreeLayout } from '../../engine/family-tree'
import { newGenState, type GenPerson } from '../../engine/gen'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

describe('이웃 수첩의 가계도', () => {
  it.each([[22, '어린이'], [50, '청소년'], [92, '어른']] as const)('%i일째 옛 저장도 가계도에 자란 자녀와 단계 %s를 보여 준다', (day, stage) => {
    const base = newGame(CONTENT)
    useGame.getState().load({ ...base, scenes: [], clock: { day, minute: 600 }, notebook: { ...base.notebook, met: ['baker', 'wendell'] } })
    useGame.getState().open({ kind: 'familyTree', personId: 'baker', neighborId: 'baker' })
    render(<ModalLayer />)
    const child = screen.getByRole('button', { name: '헤이즐의 자녀 · 자녀' })
    expect(within(child).getByText(`자녀 · ${stage}`)).toBeInTheDocument()
    fireEvent.click(child)
    expect(screen.getByRole('button', { name: '헤이즐 · 부모' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '웬델 · 형제자매' })).toBeInTheDocument()
  })
  it('계보가 없는 옛 저장도 8일 이후에는 헤이즐의 아기와 웬델을 함께 보여 준다', () => {
    const base = newGame(CONTENT)
    useGame.getState().load({ ...base, clock: { day: 8, minute: 600 }, notebook: { ...base.notebook, met: ['baker', 'wendell'] } })
    useGame.getState().open({ kind: 'familyTree', personId: 'baker', neighborId: 'baker' })
    render(<ModalLayer />)
    expect(screen.getByRole('button', { name: '아기 · 자녀' })).toBeInTheDocument()
    const wendell = screen.getByRole('button', { name: '웬델 · 자녀' })
    fireEvent.click(wendell)
    expect(screen.getByRole('button', { name: '아기 · 형제자매' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '헤이즐 · 부모' })).toBeInTheDocument()
  })

  it('태어난 아이는 이름변경 단추로 이름을 바꾸고, 어른 이웃에게는 단추가 없다', () => {
    const base = newGame(CONTENT)
    useGame.getState().load({ ...base, scenes: [], clock: { day: 92, minute: 600 }, notebook: { ...base.notebook, met: ['baker', 'wendell'] } })
    useGame.getState().open({ kind: 'familyTree', personId: 'baker', neighborId: 'baker' })
    render(<ModalLayer />)
    expect(screen.queryByRole('button', { name: '이름변경' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '헤이즐의 자녀 · 자녀' }))
    fireEvent.click(screen.getByRole('button', { name: '이름변경' }))
    fireEvent.change(screen.getByRole('textbox', { name: '이름변경' }), { target: { value: '  보리  ' } })
    fireEvent.click(screen.getByRole('button', { name: '이름변경' }))
    expect(screen.getByRole('button', { name: '보리 · 선택한 인물' })).toBeInTheDocument()
    expect(useGame.getState().game.gen?.persons['baker-baby'].name).toBe('보리')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('해당 이웃 상세에서 열고 인물을 누르면 중심을 바꾸며 뒤로 가면 같은 상세로 돌아온다', () => {
    const base = newGame(CONTENT)
    useGame.getState().load({ ...base, scenes: [], flags: { ...base.flags, 'movedIn:carpenter': 1 }, notebook: { ...base.notebook, met: ['rudy', 'carpenter'] } })
    useGame.getState().open({ kind: 'journal', tab: 'neighbors', neighbor: 'rudy' })
    render(<ModalLayer />)
    fireEvent.click(screen.getByRole('button', { name: '가계도 보기' }))
    expect(useGame.getState().modal).toMatchObject({ kind: 'familyTree', personId: 'rudy' })
    const parent = screen.getByRole('button', { name: /부모$/ })
    fireEvent.click(parent)
    expect(parent).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /자녀$/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '이웃 수첩으로' }))
    expect(useGame.getState().modal).toEqual({ kind: 'journal', tab: 'neighbors', neighbor: 'rudy' })
    expect(screen.getByRole('button', { name: '가계도 보기' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: '마을' }))
    expect(screen.queryByText('가계도')).toBeNull()
  })
  it('알 수 없는 부모는 이름을 숨기면서 연결 관계를 보존한다', () => {
    const base = newGame(CONTENT)
    useGame.getState().load({ ...base, notebook: { ...base.notebook, met: ['rudy'] } })
    useGame.getState().open({ kind: 'familyTree', personId: 'rudy', neighborId: 'rudy' })
    render(<ModalLayer />)
    expect(screen.getByRole('button', { name: '? · 부모' })).toBeInTheDocument()
    expect(within(screen.getByRole('region')).queryByText(CONTENT.neighbors.find(n => n.id === 'carpenter')!.role)).toBeNull()
  })
  it('부모는 위, 배우자는 옆, 자녀·손주는 아래로 놓고 저장된 관계만 연결한다', () => {
    const person = (id: string, parents: string[], spouse: string | null = null): GenPerson => ({ id, origin: 'born', born: 1, stage: 'adult', name: id, parents, spouse, household: null })
    const initial = newGenState(CONTENT, 0, 1)
    const g = { ...initial, persons: { ...initial.persons, parent: person('parent', []), focus: person('focus', ['parent'], 'partner'), partner: person('partner', [], 'focus'), child: person('child', ['focus', 'partner']), grandchild: person('grandchild', ['child']) } }
    const layout = familyTreeLayout(g, 'focus')
    const node = (id: string) => layout.nodes.find(node => node.id === id)!
    expect(node('parent').y).toBeLessThan(node('focus').y)
    expect(node('focus').y).toBe(node('partner').y)
    expect(node('child').y).toBeGreaterThan(node('focus').y)
    expect(node('grandchild').y).toBeGreaterThan(node('child').y)
    expect(layout.edges).toContainEqual({ from: 'focus', to: 'partner', kind: 'spouse' })
    expect(layout.edges).toContainEqual({ from: 'focus', to: 'child', kind: 'parent' })
    expect(layout.nodes).toHaveLength(5)
  })
  it('조부모 기록을 부모로 지어내지 않고 친척선으로 연결한다', () => {
    const g = newGenState(CONTENT, 0, 1)
    const layout = familyTreeLayout(g, 'marigold')
    expect(layout.edges).toContainEqual({ from: 'grandpa', to: 'marigold', kind: 'kin' })
    expect(layout.edges).not.toContainEqual({ from: 'grandpa', to: 'marigold', kind: 'parent' })
  })
})
