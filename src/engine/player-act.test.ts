// 가구 쓰는 동작 (계획 17 작업 3): 그림만 — 동작을 정하고, 걸으면 끝나고, 저장하지 않는다
import { CONTENT } from '../content/catalog'
import { ACT_SECONDS, drinkTea, finishCraft, goToSleep, newGame, readScripture, restAt, tick, walkDirection, warmByHearth, type GameState } from './game'
import { deserialize, serialize } from './save'
import { HEARTH_STAND, HOME_BENCH, PLACES } from './world'

const zero = () => 0
const at = (s: GameState, x: number, y: number, facing: GameState['player']['facing']): GameState => ({ ...s, player: { ...s.player, x, y, path: [], facing } })

describe('가구 쓰는 동작', () => {
  it('벤치 곁에서 쉬면 벤치 칸 위에 앉아 앞을 본다', () => {
    const s = at(newGame(CONTENT), HOME_BENCH.x + 1, HOME_BENCH.y, 'left')
    const r = restAt(s)
    expect(r.act).toEqual({ kind: 'sit', left: ACT_SECONDS.sit, total: ACT_SECONDS.sit, facing: 'down', at: HOME_BENCH })
    // 쉬기의 피로·시간은 그대로
    expect(r.needs).toEqual(restAt({ ...s }).needs)
  })

  it('벤치에서 읽기는 read, 화덕 쬐기는 서 있는 칸에서 화덕을 보고 sit', () => {
    const base = newGame(CONTENT)
    const id = CONTENT.pieces[0].id
    const s = at({ ...base, collected: [id] }, HOME_BENCH.x + 1, HOME_BENCH.y, 'left')
    expect(readScripture(s, id)!.state.act?.kind).toBe('read')
    const w = warmByHearth(at(base, HEARTH_STAND.x, HEARTH_STAND.y, 'up'))
    expect(w.act).toMatchObject({ kind: 'sit', facing: 'up' })
    expect(w.act?.at).toBeUndefined()
  })

  it('만들기: 화덕은 반죽, 작업대는 손일 / 찻집 차는 drink', () => {
    const s = newGame(CONTENT)
    expect(finishCraft({ ...s, inv: { barley: 1, water: 1 } }, 'bread').act?.kind).toBe('knead')
    expect(finishCraft({ ...s, inv: { oil: 1, wool: 1 } }, 'scentCandle').act?.kind).toBe('craft')
    // 못 만들면 동작도 없다
    expect(finishCraft(s, 'scentCandle').act).toBeUndefined()
    const tea = drinkTea({ ...s, coins: 50, clock: { ...s.clock, minute: 14 * 60 } })
    expect(tea.act?.kind).toBe('drink')
  })

  it('자고 일어나면 침대 위에서 일어나기', () => {
    const s = newGame(CONTENT)
    const next = goToSleep({ ...s, clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
    expect(next.act).toMatchObject({ kind: 'rise', at: PLACES.bed.tiles[0], left: ACT_SECONDS.rise })
  })

  it('시간이 지나면 끝나고, 걷기 시작하면 바로 끝난다', () => {
    const s = restAt(at(newGame(CONTENT), HOME_BENCH.x + 1, HOME_BENCH.y, 'left'))
    const half = tick(s, 0.5, zero, CONTENT).state
    expect(half.act?.left).toBeCloseTo(ACT_SECONDS.sit - 0.5)
    expect(tick(half, ACT_SECONDS.sit, zero, CONTENT).state.act).toBeUndefined()
    const walked = walkDirection(s, 1, 0)
    expect(walked.player.path.length).toBe(1)
    expect(walked.act).toBeUndefined()
    // 길이 생긴 다음 박자에도 없다
    expect(tick({ ...s, player: { ...s.player, path: [{ x: HOME_BENCH.x + 2, y: HOME_BENCH.y }] } }, 0.05, zero, CONTENT).state.act).toBeUndefined()
  })

  it('저장에는 들어가지 않는다', () => {
    const s = restAt(at(newGame(CONTENT), HOME_BENCH.x + 1, HOME_BENCH.y, 'left'))
    expect(s.act).toBeDefined()
    const text = serialize(s)
    expect(JSON.parse(text)).not.toHaveProperty('act')
    expect(deserialize(text, CONTENT)!.act).toBeUndefined()
  })
})
