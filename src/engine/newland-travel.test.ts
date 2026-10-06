// 계획 20 작업 3: 두 지도 왕래 — 시간·진행 보존, 이웃 동결, 잠, 입구 상호작용
import { CONTENT } from '../content/catalog'
import { useGame } from '../store/game-store'
import { formatTime } from './clock'
import { canTravel, goToSleep, interactTile, neighborBeside, newGame, playerTile, settle, tapTile, tick, travel, walkDirection, type GameState } from './game'
import { findPath } from './movement'
import { setActiveMap } from './maps'
import { portalAt, setNewlandOpen } from './newland'
import { ARCHIVE, INTERIOR_ENTRY, NEWLAND_PORTAL, NEWLAND_PORTAL_FRONT, VILLAGE_PORTAL, VILLAGE_PORTAL_FRONT } from './newland-config'
import { deserialize, serialize } from './save'
import { npcTile } from './neighbors'
import { HOME_FRONT, isHome, lockedTiles, PLACES, roomAt, tileAt } from './world'
import { syncHome } from './game'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

const zero = () => 0

/** 새 터가 열린 저장 (새 게임에 선물 표식만 세우고, 문 앞 큰길 끝에 세운다) */
function opened(extra: Partial<GameState> = {}, minute = 10 * 60): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 5, minute },
    flags: { ...base.flags, newlandGift: 1 },
    player: { ...base.player, x: VILLAGE_PORTAL_FRONT.x, y: VILLAGE_PORTAL_FRONT.y, path: [] },
    ...extra,
  }
  syncHome(g)
  return g
}

const visibleAt = (s: GameState) => Object.values(s.npcs).filter((n) => n.visible)

describe('왕래 조건', () => {
  it('새 터가 열리지 않았으면 건너갈 수 없다 (입구 칸도 표식이 아니다)', () => {
    const closed = { ...opened(), flags: { ...opened().flags, newlandGift: 0 } }
    syncHome(closed)
    expect(canTravel(closed, 'newland')).toBe('locked')
    expect(travel(closed, 'newland', CONTENT)).toBe(closed)
    expect(portalAt(VILLAGE_PORTAL)).toBeNull()
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe(',')
    // 입구 칸을 눌러도 그냥 길을 걷는다 — 건너가는 표적이 아니다
    const tapped = tapTile(closed, VILLAGE_PORTAL)
    expect(tapped.target?.kind).not.toBe('portal')
  })

  it('열린 뒤에는 입구 칸을 누르면 표식 앞까지 걸어가 서고, 닿으면 건너가는 표적이 도착한다', () => {
    let s = opened({ player: { ...opened().player, x: VILLAGE_PORTAL_FRONT.x - 6, y: VILLAGE_PORTAL_FRONT.y } })
    s = tapTile(s, VILLAGE_PORTAL)
    expect(s.target).toEqual({ kind: 'portal', to: 'newland' })
    expect(s.player.path.length).toBeGreaterThan(0)
    // 표식 위로 올라서지 않고 바로 앞(서쪽 칸)에서 멈춘다
    expect(s.player.path[s.player.path.length - 1]).toEqual(VILLAGE_PORTAL_FRONT)
    const arrived: string[] = []
    for (let i = 0; i < 60 && !arrived.length; i++) {
      const r = tick(s, 0.2, zero, CONTENT)
      s = r.state
      for (const e of r.events) if (e.type === 'arrived') arrived.push(e.target.kind)
    }
    expect(arrived).toEqual(['portal'])
    expect(playerTile(s)).toEqual(VILLAGE_PORTAL_FRONT)
    expect(s.target).toBeNull()
  })

  it('곁에서 키보드 상호작용(스페이스)을 해도 입구를 누른 것과 같다', () => {
    const s = opened()
    syncHome(s)
    expect(interactTile(s)).toEqual(VILLAGE_PORTAL)
  })

  it('장면이 남아 있거나 필사창이 열려 있으면 건너갈 수 없다', () => {
    const s = opened()
    expect(canTravel(s, 'newland')).toBeNull()
    expect(canTravel({ ...s, scenes: ['x'] }, 'newland')).toBe('scene')
    expect(canTravel(s, 'newland', { copyOpen: true })).toBe('copy')
    expect(travel(s, 'newland', CONTENT, { copyOpen: true })).toBe(s)
    expect(canTravel(s, 'village')).toBe('here')
  })

  it('필사창이 열려 있을 때 입구를 눌러도 아무 일도 없다 (화면)', () => {
    const g = opened()
    syncHome(g)
    useGame.setState({ game: g, modal: { kind: 'copy', view: 'menu' }, rng: zero, decorating: null, decorSel: null, toast: null })
    useGame.getState().tap(VILLAGE_PORTAL)
    expect(useGame.getState().game).toBe(g)
    expect(useGame.getState().modal).toEqual({ kind: 'copy', view: 'menu' })
    // 필사창이 닫힌 뒤에는 같은 표식이 걸어가기 시작한다
    useGame.setState({ modal: null })
    useGame.getState().tap(VILLAGE_PORTAL)
    expect(useGame.getState().game.target).toEqual({ kind: 'portal', to: 'newland' })
  })
})

describe('시간 — 06:00–21:30 출발, 돌아가기는 언제든', () => {
  it('21:30은 떠나고 21:31은 날이 저물어 거절한다 (06:00은 되고 05:59는 안 된다)', () => {
    expect(canTravel(opened({}, 21 * 60 + 30), 'newland')).toBeNull()
    expect(canTravel(opened({}, 21 * 60 + 31), 'newland')).toBe('late')
    expect(canTravel(opened({}, 6 * 60), 'newland')).toBeNull()
    expect(canTravel(opened({}, 6 * 60 - 1), 'newland')).toBe('late')
    expect(canTravel(opened({}, 25 * 60), 'newland')).toBe('late')
    const late = opened({}, 21 * 60 + 31)
    expect(travel(late, 'newland', CONTENT)).toBe(late)
  })

  it('늦은 밤에도 새 터에서 첫 마을로 돌아갈 수 있고, 23:50에 출발해도 자정을 안전하게 넘는다', () => {
    const there = travel(opened({}, 10 * 60), 'newland', CONTENT)
    const night = { ...there, clock: { day: 5, minute: 23 * 60 + 50 } }
    expect(canTravel(night, 'village')).toBeNull()
    const home = travel(night, 'village', CONTENT)
    expect(home.map).toBe('village')
    expect(home.clock.day).toBe(5)
    expect(home.clock.minute).toBe(23 * 60 + 50 + 30)
    expect(formatTime(home.clock.minute)).toBe('00:20')
    // 시간 상한(02:00)에서 시작해도 멈추기만 할 뿐 오류가 없다
    const cap = travel({ ...there, clock: { day: 5, minute: 26 * 60 } }, 'village', CONTENT)
    expect(cap.clock).toEqual({ day: 5, minute: 26 * 60 })
    expect(cap.map).toBe('village')
  })

  it('한 번 건널 때마다 30분, 같은 날 두 번 왔다 갔다 해도 날짜는 그대로', () => {
    let s = opened({}, 10 * 60)
    const day = s.clock.day
    s = travel(s, 'newland', CONTENT)
    expect([s.map, s.clock.minute]).toEqual(['newland', 10 * 60 + 30])
    s = travel(s, 'village', CONTENT)
    expect([s.map, s.clock.minute]).toEqual(['village', 11 * 60])
    s = travel(s, 'newland', CONTENT)
    s = travel(s, 'village', CONTENT)
    expect(s.clock).toEqual({ day, minute: 12 * 60 })
    expect(s.journal.length).toBe(0)
  })
})

describe('왕래 때 그대로인 것', () => {
  it('날짜·소지품·돈·관계·필사 진행·가구·집 단계가 그대로다', () => {
    const base = opened({
      coins: 77,
      inv: { water: 2, bread: 1, papyrus: 3 },
      hearts: { baker: 40, child: 12 },
      progress: { ...opened().progress, mt: { ...opened().progress.mt, completed: [1, 2, 3] } },
      copy: { ...opened().copy, book: 'mt', at: { mt: { chapter: 4, verse: 2, draft: '태초' } } },
      talked: ['baker'],
      collected: [],
    })
    const there = travel(base, 'newland', CONTENT)
    const back = travel(there, 'village', CONTENT)
    for (const s of [there, back]) {
      expect(s.clock.day).toBe(base.clock.day)
      expect(s.coins).toBe(77)
      expect(s.inv).toEqual(base.inv)
      expect(s.hearts).toEqual(base.hearts)
      expect(s.progress).toEqual(base.progress)
      expect(s.copy).toEqual(base.copy)
      expect(s.room).toEqual(base.room)
      expect(s.homeLevel).toBe(base.homeLevel)
      expect(s.romance).toEqual(base.romance)
      expect(s.shelved).toEqual(base.shelved)
      expect(s.flags).toEqual(base.flags)
    }
    expect(back.clock.minute).toBe(base.clock.minute + 60)
  })

  it('떠난 지도의 자리를 mapAt에 적고, 건너오면 그 지도의 입구 앞에 선다', () => {
    const base = opened({ player: { ...opened().player, x: 20, y: 17 } })
    const there = travel(base, 'newland', CONTENT)
    expect(playerTile(there)).toEqual(NEWLAND_PORTAL_FRONT)
    expect(there.mapAt?.village).toEqual({ x: 20, y: 17 })
    expect(there.player.path).toEqual([])
    expect(there.target).toBeNull()
    expect(there.act).toBeUndefined()
    const back = travel({ ...there, player: { ...there.player, x: 20, y: 12 } }, 'village', CONTENT)
    expect(playerTile(back)).toEqual(VILLAGE_PORTAL_FRONT)
    expect(back.mapAt).toEqual({ village: { x: 20, y: 17 }, newland: { x: 20, y: 12 } })
  })
})

describe('새 터에 있는 동안 첫 마을은 멈춘다', () => {
  it('이웃은 움직이지 않고, 곁에 있어도 말 걸 수 없으며, 건너가도 이웃 상태가 그대로다', () => {
    const base = opened({}, 10 * 60)
    const there = travel(base, 'newland', CONTENT)
    const frozen = there.npcs
    expect(Object.values(frozen).filter((n) => n.visible).length).toBeGreaterThan(0)
    let s = there
    for (let i = 0; i < 200; i++) s = tick(s, 1, zero, CONTENT).state
    // 6분이 아니라 200분이 흘러도 (날은 바뀌지 않고 시각만) 이웃은 한 걸음도 움직이지 않았다
    expect(s.npcs).toBe(frozen)
    expect(s.clock.minute).toBeGreaterThan(there.clock.minute)
    // 이웃 한 명 바로 곁에 서 있어도 새 터에서는 대화 단추도 상호작용도 없다
    const someone = Object.values(frozen).filter((n) => n.visible)[0]
    const beside = { ...s, player: { ...s.player, x: npcTile(someone).x, y: npcTile(someone).y + 1, path: [] } }
    expect(neighborBeside(beside)).toBeNull()
    expect(interactTile(beside)).toBeNull()
    const tapped = tapTile(beside, npcTile(someone))
    expect(tapped.target?.kind).not.toBe('neighbor')
    // 키보드로도 이 지도의 땅만 걷는다
    expect(walkDirection(there, 1, 0).player.path.length).toBe(1)
  })

  it('돌아오면 이웃을 그 시각의 자리에 한 번 놓는다 (같은 이웃이 중복되지 않는다)', () => {
    const base = opened({}, 10 * 60)
    const there = travel(base, 'newland', CONTENT)
    let s = there
    for (let i = 0; i < 90; i++) s = tick(s, 1, zero, CONTENT).state
    const back = travel(s, 'village', CONTENT)
    const ids = Object.keys(back.npcs)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.sort()).toEqual(Object.keys(base.npcs).sort())
    // 돌아온 시각(11:00 + 30분 + 90분)의 하루 일과 자리 — 새로 놓은 것과 같다
    const fresh = settle({ ...back, npcs: {} }, CONTENT)
    expect(back.npcs).toEqual(fresh.npcs)
    // 같은 자리에 둘이 겹쳐 서 있지 않다
    const tiles = visibleAt(back).map((n) => `${npcTile(n).x},${npcTile(n).y}`)
    expect(new Set(tiles).size).toBe(tiles.length)
  })
})

describe('새 터에서 잠들기', () => {
  it('새 터에서 잠들면 첫 마을 침대에서 깬다', () => {
    const there = { ...travel(opened({}, 20 * 60), 'newland', CONTENT), clock: { day: 5, minute: 22 * 60 } }
    const woke = goToSleep(there, CONTENT)
    expect(woke.map).toBe('village')
    expect(woke.clock.day).toBe(6)
    const bed = PLACES.bed.stand!
    expect(playerTile(woke)).toEqual(bed)
    expect(isHome(playerTile(woke))).toBe(true)
    expect(woke.flags.newlandGift).toBe(1)
    // 지도(모듈 전역)도 첫 마을로 맞춰진다
    expect(tileAt(VILLAGE_PORTAL.x, VILLAGE_PORTAL.y)).toBe('>')
  })
})

describe('화면 흐름 (store)', () => {
  it('입구를 눌러 걸어가면 건너가는 창이 열리고, 건너가면 새 터, 새 터 입구에서 다시 돌아온다', () => {
    const g = opened({ player: { ...opened().player, x: VILLAGE_PORTAL_FRONT.x - 3, y: VILLAGE_PORTAL_FRONT.y } })
    syncHome(g)
    useGame.setState({ game: g, modal: null, rng: zero, decorating: null, decorSel: null, toast: null })
    useGame.getState().tap(VILLAGE_PORTAL)
    for (let i = 0; i < 60 && !useGame.getState().modal; i++) useGame.getState().frame(0.2)
    expect(useGame.getState().modal).toEqual({ kind: 'crossing', to: 'newland' })
    const before = useGame.getState().game.clock.minute
    useGame.getState().travelTo('newland')
    let st = useGame.getState()
    expect(st.modal).toBeNull()
    expect(st.game.map).toBe('newland')
    expect(Math.round(st.game.clock.minute - before)).toBeGreaterThanOrEqual(30)
    expect(playerTile(st.game)).toEqual(NEWLAND_PORTAL_FRONT)
    // 새 터에서 한참 걸어도 이웃·창이 생기지 않는다
    for (let i = 0; i < 30; i++) useGame.getState().frame(0.5)
    expect(useGame.getState().modal).toBeNull()
    // 새 터의 입구를 누르면 첫 마을로 돌아가는 창
    useGame.getState().tap(NEWLAND_PORTAL)
    for (let i = 0; i < 20 && !useGame.getState().modal; i++) useGame.getState().frame(0.2)
    expect(useGame.getState().modal).toEqual({ kind: 'crossing', to: 'village' })
    useGame.getState().travelTo('village')
    st = useGame.getState()
    expect(st.game.map).toBe('village')
    expect(playerTile(st.game)).toEqual(VILLAGE_PORTAL_FRONT)
  })

  it('날이 저문 뒤에는 창 없이 한 줄만 (새 터로는)', () => {
    const g = opened({ player: { ...opened().player, x: VILLAGE_PORTAL_FRONT.x - 1, y: VILLAGE_PORTAL_FRONT.y } }, 22 * 60)
    syncHome(g)
    useGame.setState({ game: g, modal: null, rng: zero, decorating: null, decorSel: null, toast: null })
    useGame.getState().tap(VILLAGE_PORTAL)
    let said: string | undefined
    for (let i = 0; i < 20; i++) {
      useGame.getState().frame(0.2)
      said ??= useGame.getState().toast?.text
    }
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.map).toBeUndefined()
    expect(said).toBe('날이 저물었어요.')
  })
})

describe('새 터 안에서 걷기', () => {
  it('서고 문을 밟으면 서고 안으로, 안의 문깔개를 밟으면 문 앞으로 나온다', () => {
    let s = travel(opened(), 'newland', CONTENT)
    s = { ...s, player: { ...s.player, x: ARCHIVE.front.x, y: ARCHIVE.front.y, path: [] } }
    // 문 칸으로 한 걸음
    s = walkDirection(s, 0, -1)
    for (let i = 0; i < 20 && !isInside(s); i++) s = tick(s, 0.1, zero, CONTENT).state
    expect(playerTile(s)).toEqual(INTERIOR_ENTRY)
    // 문깔개로 나가기
    s = tapTile(s, { x: INTERIOR_ENTRY.x, y: INTERIOR_ENTRY.y + 1 })
    for (let i = 0; i < 20 && isInside(s); i++) s = tick(s, 0.1, zero, CONTENT).state
    expect(playerTile(s)).toEqual(ARCHIVE.front)
    expect(findPath(playerTile(s), NEWLAND_PORTAL_FRONT)).not.toBeNull()
  })
})

function isInside(s: GameState): boolean {
  const t = playerTile(s)
  return t.y >= 30
}

describe('저장·불러오기', () => {
  it('새 터에서 저장했다 불러오면 새 터의 같은 칸', () => {
    const there = travel(opened(), 'newland', CONTENT)
    const moved = { ...there, player: { ...there.player, x: 20, y: 9, path: [] } }
    const back = deserialize(serialize(moved), CONTENT)!
    expect(back.map).toBe('newland')
    expect(playerTile(back)).toEqual({ x: 20, y: 9 })
    expect(back.mapAt).toEqual(there.mapAt)
    expect(roomAt(playerTile(back))).toBeNull()
    // 불러온 뒤 지도(모듈 전역)도 새 터 — 걸을 수 있는 곳이다
    expect(tileAt(20, 9)).toBe(',')
  })
  it('잘못된 칸에서 시작하지 않는다', () => {
    const there = travel(opened(), 'newland', CONTENT)
    const bad = { ...there, player: { ...there.player, x: 0, y: 0, path: [] } }
    const back = deserialize(serialize(bad), CONTENT)!
    expect(back.map).toBe('newland')
    expect(playerTile(back)).toEqual(NEWLAND_PORTAL_FRONT)
    expect(locked(back)).toBe(false)
  })
})

function locked(s: GameState): boolean {
  return lockedTiles(0).has(`${s.player.x},${s.player.y}`)
}

void HOME_FRONT
