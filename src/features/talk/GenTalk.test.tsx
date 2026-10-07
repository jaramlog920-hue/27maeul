// 계획 20 2부 작업 D·E·F 화면: 결혼 상담·준비 돕기·다시 생각·아기 침대, 수첩 '마을' 칸, 설정
import { fireEvent, render, screen, within } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, type GameState } from '../../engine/game'
import { newGenState, relationId, type GenState, type Household } from '../../engine/gen'
import { withPairs } from '../../engine/gen-settle'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Settings } from '../play/Settings'

const RP = relationId('rudy', 'poppy')
const met = CONTENT.neighbors.map((n) => n.id)

function base(gen: (g: GenState) => GenState, extra: Partial<GameState> = {}): GameState {
  const s = newGame(CONTENT)
  const g = gen(newGenState(CONTENT, 3, 10, withPairs()))
  return { ...s, scenes: [], clock: { day: 10, minute: 10 * 60 }, notebook: { ...s.notebook, met }, hearts: { ...s.hearts, poppy: 30, rudy: 10 }, gen: g, ...extra }
}
const talk = (game: GameState, npc: string) => {
  useGame.setState({ game, modal: { kind: 'talk', neighborId: npc, line: '…' }, rng: () => 0.5 })
  return render(<ModalLayer />)
}

describe('결혼 상담 (D31)', () => {
  it('마음이 더 깊은 쪽이 털어놓고, 응원하면 답이 쌓인다', () => {
    const game = base((g) => ({ ...g, affinity: { ...g.affinity, [RP]: 85 }, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'lover', since: 1, consult: { asked: [], answers: [], nextAsk: 10, round: 10 } } } }))
    talk(game, 'poppy')
    fireEvent.click(screen.getByRole('button', { name: '이야기 들어 주기' }))
    fireEvent.click(screen.getByRole('button', { name: T.gen.answers.cheer }))
    expect(useGame.getState().game.gen!.relations[RP].consult!.answers).toEqual(['cheer'])
    expect(screen.getByText(T.gen.replies.cheer)).toBeInTheDocument()
    // 오늘은 더 묻지 않는다
    expect(screen.queryByRole('button', { name: '이야기 들어 주기' })).toBeNull()
  })
  it('마음이 얕은 쪽은 상담을 꺼내지 않는다', () => {
    const game = base((g) => ({ ...g, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'lover', since: 1, consult: { asked: [], answers: [], nextAsk: 10, round: 10 } } } }))
    talk(game, 'rudy')
    expect(screen.queryByRole('button', { name: '이야기 들어 주기' })).toBeNull()
  })
})

describe('결혼 준비 돕기·다시 생각 (D31·P9)', () => {
  const preparing = (inv: GameState['inv'] = {}) =>
    base((g) => ({ ...g, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'preparing', since: 8, prep: { tasks: ['bread', 'oil'], done: [], wedding: 15 } } } }), { inv })
  it('물건이 있으면 준비 하나를 돕고 마음이 오른다, 없으면 단추가 막힌다', () => {
    const { unmount } = talk(preparing(), 'rudy')
    expect(screen.getByRole('button', { name: '준비 돕기' })).toBeDisabled()
    unmount()
    talk(preparing({ bread: 2 }), 'rudy')
    fireEvent.click(screen.getByRole('button', { name: '준비 돕기' }))
    const g = useGame.getState().game
    expect(g.gen!.relations[RP].prep!.done).toEqual(['bread'])
    expect(g.inv.bread ?? 0).toBe(0)
    expect(g.hearts.rudy).toBeGreaterThan(10)
  })
  it('다시 생각해 보라고 하면 한 번 더 묻고, 연인으로 돌아간다', () => {
    talk(preparing(), 'poppy')
    fireEvent.click(screen.getByRole('button', { name: '다시 생각해 보라고 하기' }))
    fireEvent.click(screen.getByRole('button', { name: '그래도 말하기' }))
    expect(useGame.getState().game.gen!.relations[RP].stage).toBe('lover')
    expect(screen.getByText(T.gen.reconsidered)).toBeInTheDocument()
  })
})

describe('아기 침대 (D32)', () => {
  const married = (inv: GameState['inv'] = {}) =>
    base((g) => {
      const h: Household = { id: 'h-0001', members: ['poppy', 'rudy'], home: 'poppy', children: [], lastBirth: null, since: 5, wedAffinity: 70, cribAsk: { day: 9, given: false } }
      return {
        ...g,
        persons: { ...g.persons, poppy: { ...g.persons.poppy, spouse: 'rudy', household: 'h-0001' }, rudy: { ...g.persons.rudy, spouse: 'poppy', household: 'h-0001' } },
        relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'spouse', since: 5 } },
        households: { 'h-0001': h },
      }
    }, { inv })
  it('집 주인이 아닌 쪽이 부탁하고, 재료가 있으면 건네 28일 기다림이 시작된다', () => {
    const { unmount } = talk(married(), 'poppy')
    expect(screen.queryByRole('button', { name: '아기 침대 건네기' })).toBeNull()
    unmount()
    talk(married({ reed: 3, blanket: 1 }), 'rudy')
    fireEvent.click(screen.getByRole('button', { name: '아기 침대 건네기' }))
    const h = useGame.getState().game.gen!.households['h-0001']
    expect(h.cribAsk?.given).toBe(true)
    expect(h.birthDue).toBe(10 + 28)
  })
})

describe('수첩 마을 칸·관계 줄과 설정 (D27·D33·P14)', () => {
  it('마을 칸에 소식과 가계도, 이웃 쪽에 관계 줄', () => {
    const game = base((g) => ({ ...g, affinity: { ...g.affinity, [RP]: 64 }, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'lover', since: 9 } }, log: [{ day: 9, kind: 'lover', who: ['poppy', 'rudy'] }] }))
    useGame.setState({ game, modal: { kind: 'journal', tab: 'village' } as never })
    const { unmount } = render(<ModalLayer />)
    fireEvent.click(screen.getByRole('tab', { name: '마을' }))
    expect(screen.getByText(/사귀기 시작했대요/)).toBeInTheDocument()
    expect(screen.getByText('가계도')).toBeInTheDocument()
    unmount()
  })
  it('설정에서 주민 자율 생활을 끄고 켠다 (다시 켜도 밀린 기간 없음)', () => {
    const game = base((g) => g)
    useGame.setState({ game })
    render(<Settings />)
    const group = within(screen.getByRole('group', { name: '주민 자율 생활' }))
    fireEvent.click(group.getByRole('button', { name: '끔' }))
    expect(useGame.getState().game.gen!.on).toBe(false)
    fireEvent.click(group.getByRole('button', { name: '켬' }))
    expect(useGame.getState().game.gen!.on).toBe(true)
    expect(useGame.getState().game.gen!.settledDay).toBe(10)
  })
})
