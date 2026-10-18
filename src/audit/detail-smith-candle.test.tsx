import { CONTENT, PEOPLE } from '../content/catalog'
import { T } from '../content/text'
import { fulfillRequest, isStorage, moveFurniture, placeFurniture, removeFurniture, syncHome, tapTile } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { lanternLights } from '../render/decor'
import { facingArt } from '../render/furniture-facing'
import { useGame } from '../store/game-store'

const at = { x: 22, y: 112 }, to = { x: 22, y: 113 }
function ready(candles = 0) {
  const base = legacyGame(CONTENT)
  const game = { ...base, clock: { day: 20, minute: 1320 }, scenes: [], hearts: { ...base.hearts, smith: 70 },
    inv: { olive: 2, bread: 1, ...(candles ? { candle: candles } : {}) },
    life: { ...base.life, seen: [...base.life.seen, ...(PEOPLE.people.smith.events?.map(e => e.id) ?? [])] },
    flags: { ...base.flags, 'req:smith:1': 2, 'req:smith:2': 1 },
    player: { ...base.player, x: 20, y: 114, path: [] } }
  syncHome(game)
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'talk', neighborId: 'smith', line: '검사용 대화' }, toast: null, piecePopups: [], copyResult: null })
  return game
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1') })

describe('013 대장장이 두 번째 부탁의 촛대 실제 사용', () => {
  it('보상 수령은 재료를 정확히 쓰고 촛대 한 개와 길가 등불을 함께 해금한다', () => {
    const before = ready()
    expect(lanternLights(before)).toEqual([])
    useGame.getState().requestGive('smith')
    const next = useGame.getState().game
    expect(next.inv.olive ?? 0).toBe(0)
    expect(next.inv.bread ?? 0).toBe(0)
    expect(next.inv.candle).toBe(1)
    expect(next.flags['req:smith:2']).toBe(2)
    expect(next.flags['unlock:lanterns']).toBe(1)
    expect(next.giftsGot).toContain('candle')
    expect(lanternLights(next).length).toBeGreaterThan(0)
    expect(fulfillRequest(next, 'smith')).toBeNull()
  })

  it('촛대 99개로 못 받으면 재료·부탁·등불을 보존하고 안내하며 여유를 만든 뒤 받을 수 있다', () => {
    const before = ready(99)
    useGame.getState().requestGive('smith')
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().toast?.text).toBe(T.ui.bagFull)
    expect(lanternLights(before)).toEqual([])
    useGame.setState({ game: { ...before, inv: { ...before.inv, candle: 98 } } })
    useGame.getState().requestGive('smith')
    expect(useGame.getState().game.inv.candle).toBe(99)
    expect(useGame.getState().game.flags['req:smith:2']).toBe(2)
  })

  it('보상 촛대는 설치·직접 이동·회수·복원·재설치에서 한 개를 유지한다', () => {
    const got = fulfillRequest(ready(), 'smith')!
    const placed = placeFurniture(got, 'candle', at)!
    expect(placed.inv.candle ?? 0).toBe(0)
    const moved = moveFurniture(placed, placed.room.find(f => f.item === 'candle')!, to)!
    expect(moved.room.find(f => f.item === 'candle')).toMatchObject(to)
    const back = deserialize(serialize(removeFurniture(moved, to)), CONTENT)!
    expect(back.inv.candle).toBe(1)
    const reused = deserialize(serialize(placeFurniture(back, 'candle', at)!), CONTENT)!
    expect(reused.room.filter(f => f.item === 'candle')).toHaveLength(1)
    expect(reused.inv.candle ?? 0).toBe(0)
    expect(reused.flags['req:smith:2']).toBe(2)
  })

  it('길가 등불은 부탁 완료의 영구 해금이며 촛대 회수로 꺼지지 않는다', () => {
    const got = fulfillRequest(ready(), 'smith')!
    const expected = lanternLights(got)
    const placed = placeFurniture(got, 'candle', at)!
    const back = deserialize(serialize(removeFurniture(placed, at)), CONTENT)!
    expect(lanternLights(back)).toEqual(expected)
  })

  it('일반 촛대는 불꽃 그림을 표시하지만 직접 탭이 소모나 점등 동작을 만들지는 않는다', () => {
    const placed = placeFurniture(fulfillRequest(ready(), 'smith')!, 'candle', at)!
    expect(facingArt('candle', 'down')!.rows.join('')).toMatch(/[yY]/)
    expect(isStorage('candle')).toBe(false)
    const tapped = tapTile(placed, at)
    expect(tapped.inv).toEqual(placed.inv)
    expect(tapped.act).toEqual(placed.act)
    expect(tapped.flags).toEqual(placed.flags)
  })
})
