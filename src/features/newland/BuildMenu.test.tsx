// 계획 20 작업 6: 터 가꾸기 창 — 땅이 드러난 뒤에만, 놓기·취소 흐름, 이유 한 줄
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, syncHome, type GameState } from '../../engine/game'
import { setActiveMap } from '../../engine/maps'
import { setNewlandOpen } from '../../engine/newland'
import { buildsOf } from '../../engine/newland-build'
import { useGame } from '../../store/game-store'
import { TravelMenu } from '../map/TravelMenu'
import { BuildMenu } from './BuildMenu'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

function reset(revealed: boolean, extra: Partial<GameState> = {}) {
  const g = newGame(CONTENT)
  const game: GameState = {
    ...g,
    scenes: [],
    coins: 500,
    inv: { olive: 9, papyrus: 9, reed: 9 },
    map: 'newland',
    flags: { ...g.flags, newlandGift: 1, ...(revealed ? { newlandRevealed: 1 } : {}) },
    ...extra,
  }
  syncHome(game)
  useGame.setState({ game, modal: null, rng: () => 0, decorating: null, toast: null })
}

describe('입구 표지', () => {
  it('땅을 둘러보기 전에는 "땅 둘러보기"만, 뒤에는 "터 가꾸기"', () => {
    reset(false)
    const { unmount } = render(<TravelMenu to="village" />)
    expect(screen.getByRole('button', { name: T.newland.look })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: T.build.open })).toBeNull()
    unmount()
    reset(true)
    render(<TravelMenu to="village" />)
    expect(screen.queryByRole('button', { name: T.newland.look })).toBeNull()
    expect(screen.getByRole('button', { name: T.build.open })).toBeInTheDocument()
  })

  it('땅이 드러나기 전에는 건축 메뉴를 열 수 없다', () => {
    reset(false)
    useGame.getState().openBuild()
    expect(useGame.getState().modal).toBeNull()
    reset(true)
    useGame.getState().openBuild()
    expect(useGame.getState().modal).toEqual({ kind: 'build' })
  })
})

describe('터 가꾸기 창', () => {
  it('네 가지와 걷어내기가 이름·쓰임·드는 것과 함께 보이고, 내부 이름은 보이지 않는다', () => {
    reset(true)
    render(<BuildMenu />)
    for (const name of ['길', '정원 칸', '공동 마당', '입주 주택', T.build.eraser]) expect(screen.getByText(name)).toBeInTheDocument()
    expect(screen.getByText(/150닢 · 올리브 4 · 파피루스 3/)).toBeInTheDocument()
    expect(screen.queryByText(/courtyard|home|path|garden|ordered/)).toBeNull()
  })

  it('입주 주택: 미리보기에서 놓으면 주문되고, 지은 것 목록에서 확인 한 번 뒤 취소하면 모두 돌아온다', () => {
    reset(true)
    render(<BuildMenu />)
    fireEvent.click(screen.getByRole('button', { name: /입주 주택/ }))
    expect(screen.getByRole('button', { name: T.build.place })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: T.build.place }))
    const g = useGame.getState().game
    expect(buildsOf(g)).toHaveLength(1)
    expect(g.coins).toBe(350)
    // 놓고 나면 지은 것 칸이 열려 "주문함"이 보인다
    expect(screen.getByText(/입주 주택 · 주문함/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: T.build.cancel }))
    // 확인 한 번: 바로 지워지지 않는다
    expect(buildsOf(useGame.getState().game)).toHaveLength(1)
    expect(screen.getByText(new RegExp(T.build.refundAll))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: T.build.yes }))
    const after = useGame.getState().game
    expect(buildsOf(after)).toHaveLength(0)
    expect(after.coins).toBe(500)
    expect(after.inv).toEqual({ olive: 9, papyrus: 9, reed: 9 })
  })

  it('확인에서 "아니요"를 누르면 아무것도 바뀌지 않는다', () => {
    reset(true)
    render(<BuildMenu />)
    fireEvent.click(screen.getByRole('button', { name: /입주 주택/ }))
    fireEvent.click(screen.getByRole('button', { name: T.build.place }))
    fireEvent.click(screen.getByRole('button', { name: T.build.cancel }))
    fireEvent.click(screen.getByRole('button', { name: T.build.no }))
    expect(buildsOf(useGame.getState().game)).toHaveLength(1)
    expect(screen.getByRole('button', { name: T.build.cancel })).toBeInTheDocument()
  })

  it('놓을 수 없으면 그 자리에서 이유 한 줄이 보이고 놓기 단추가 막힌다', () => {
    reset(true, { coins: 10 })
    render(<BuildMenu />)
    fireEvent.click(screen.getByRole('button', { name: /입주 주택/ }))
    expect(screen.getByRole('status')).toHaveTextContent(T.build.blockCoins)
    expect(screen.getByRole('button', { name: T.build.place })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: T.build.place }))
    expect(buildsOf(useGame.getState().game)).toHaveLength(0)
    expect(useGame.getState().game.coins).toBe(10)
  })

  it('길은 한 칸씩 바로 깔리고 같은 칸에는 "이미 깔려 있어요"', () => {
    reset(true)
    render(<BuildMenu />)
    fireEvent.click(screen.getByRole('button', { name: /^길/ }))
    fireEvent.click(screen.getByRole('button', { name: T.build.place }))
    expect(Object.keys(useGame.getState().game.newland!.tiles)).toHaveLength(1)
    expect(useGame.getState().game.coins).toBe(499)
    expect(screen.getByRole('status')).toHaveTextContent(T.build.blockSame)
    expect(screen.getByRole('button', { name: T.build.place })).toBeDisabled()
  })

  it('집은 문 방향을 고를 수 있다 (뒤쪽은 없다)', () => {
    reset(true)
    render(<BuildMenu />)
    fireEvent.click(screen.getByRole('button', { name: /입주 주택/ }))
    const group = screen.getByRole('group', { name: T.build.facing })
    expect(group.querySelectorAll('button')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: T.build.faceLeft }))
    fireEvent.click(screen.getByRole('button', { name: T.build.place }))
    expect(buildsOf(useGame.getState().game)[0].facing).toBe('left')
  })
})
