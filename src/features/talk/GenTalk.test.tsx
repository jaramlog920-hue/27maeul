// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from '../../engine/growth-test-support'
// 계획 20 2부 작업 D·E·F 화면: 결혼 상담·준비 돕기·다시 생각·아기 침대, 수첩 '마을' 칸, 설정
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { type GameState } from '../../engine/game'
import { newGenState, relationId, type GenState, type Household } from '../../engine/gen'
import { withPairs } from '../../engine/gen-settle'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Settings } from '../play/Settings'
import { PlaceMenu } from '../menus/PlaceMenu'
import { makeBakerCrib } from '../../engine/baker-baby'

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
  it('아기인 마지막 날에는 부탁하지만 어린이가 되는 날 열린 대화에서도 부탁과 단추가 사라진다', () => {
    const game = base(g => ({ ...g, on: false }), { clock: { day: 21, minute: 600 }, inv: { reed: 3, blanket: 1 } })
    talk(game, 'baker')
    expect(screen.getByText(T.gen.bakerCribAsk)).toBeInTheDocument()
    const grown = { ...game, clock: { day: 22, minute: 600 } }
    // 같은 대화 컴포넌트가 남아 있어도 현재 날짜를 다시 판정한다.
    act(() => useGame.setState({ game: grown }))
    expect(screen.queryByText(T.gen.bakerCribAsk)).toBeNull()
    expect(screen.queryByRole('button', { name: '아기 침대 만들어 주기' })).toBeNull()
    expect(useGame.getState().game.inv).toEqual({ reed: 3, blanket: 1 })
  })
  it('헤이즐은 자율 가족이 꺼져 있어도 부탁하고 재료로 한 번 만들어 줄 수 있다', () => {
    const game = base(g => ({ ...g, on: false }), { inv: { reed: 3, blanket: 1 } })
    const { unmount } = talk(game, 'baker')
    expect(screen.getByText(T.gen.bakerCribAsk)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '아기 침대 만들어 주기' }))
    expect(useGame.getState().game.flags.bakerCribGiven).toBe(10)
    expect(useGame.getState().game.recipesKnown).toContain('homeCradle')
    expect(useGame.getState().game.inv.reed ?? 0).toBe(0)
    expect(screen.getByText(T.gen.bakerCribThanks)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '아기 침대 만들어 주기' })).toBeNull()
    unmount()
    talk(useGame.getState().game, 'baker')
    expect(screen.queryByText(T.gen.bakerCribAsk)).toBeNull()
  })
  it('계보가 없는 옛 저장에서도 부탁하되 재료 없이는 만들기 단추가 잠긴다', () => {
    talk(base(g => g, { gen: undefined, inv: {} }), 'baker')
    expect(screen.getByRole('button', { name: '아기 침대 만들어 주기' })).toBeDisabled()
  })
  it('전달 보상으로 배운 뒤에만 작업대에 제작 단추가 생기고 손일을 시작한다', () => {
    const s = base(g => g, { inv: { reed: 6, blanket: 2 } })
    useGame.setState({ game: s, modal: null })
    const view = render(<PlaceMenu place="workbench" />)
    expect(screen.queryByRole('button', { name: /아기 침대/ })).toBeNull()
    view.unmount()
    const learned = makeBakerCrib(s)!
    useGame.setState({ game: learned, modal: null, rng: () => .5 })
    render(<PlaceMenu place="workbench" />)
    // 제작대는 아이콘 칸 — 칸을 고르면 자세히 칸에 만들기 단추 (2026-10-12)
    fireEvent.click(screen.getByRole('button', { name: /아기 침대/ }))
    const button = document.querySelector('.bag-detail .actions button') as HTMLButtonElement
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(useGame.getState().modal).toMatchObject({ kind: 'mini', pending: { kind: 'craft', recipe: 'homeCradle' } })
  })
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
  it('마을 칸에는 소식만 보이고 가계도는 없다', () => {
    const game = base((g) => ({ ...g, affinity: { ...g.affinity, [RP]: 64 }, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'lover', since: 9 } }, log: [{ day: 9, kind: 'lover', who: ['poppy', 'rudy'] }] }))
    useGame.setState({ game, modal: { kind: 'journal', tab: 'village' } as never })
    const { unmount } = render(<ModalLayer />)
    fireEvent.click(screen.getByRole('tab', { name: '마을' }))
    expect(screen.getByText(/사귀기 시작했대요/)).toBeInTheDocument()
    expect(screen.queryByText('가계도')).toBeNull()
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
