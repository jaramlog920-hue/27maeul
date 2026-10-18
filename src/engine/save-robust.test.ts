// 깨진 저장·가져온 파일 견고성 (2026-10-18 감사 M-19·M-20·L-1·L-6·L-58·L-59·L-60)
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { freshStats } from './stats'
import { deserialize, serialize } from './save'

const base = (): Record<string, unknown> => JSON.parse(serialize({ ...newGame(CONTENT), scenes: [] }))
const load = (o: Record<string, unknown>) => deserialize(JSON.stringify(o), CONTENT)
/** 저장 → 불러오기를 두 번 거쳐도 같은가 */
const twice = (g: GameState) => deserialize(serialize(deserialize(serialize(g), CONTENT)!), CONTENT)!

describe('깨진 저장 불러오기', () => {
  it('무한대 시각은 처음부터 받지 않는다 (열렸다가 다음에 못 여는 칸이 생기지 않게)', () => {
    const o = base()
    expect(deserialize(JSON.stringify(o).replace('"minute":360', '"minute":1e999'), CONTENT)).toBeNull()
  })

  it('무한대 flags·몸 상태·업적 날은 걸러 내고, 두 번 불러와도 같다', () => {
    const raw = JSON.stringify({ ...base(), flags: { newlandGift: 0, villageLevel: 2 }, needs: { hunger: 10, fatigue: 0, cold: 0 }, achieved: [{ id: 'coins500', day: 3 }] })
      .replace('"newlandGift":0', '"newlandGift":-1e999')
      .replace('"cold":0', '"cold":1e999')
      .replace('"day":3}', '"day":1e999}')
    const g = deserialize(raw, CONTENT)!
    expect(g.flags.newlandGift).toBeUndefined()
    expect(g.flags.villageLevel).toBe(2)
    expect(g.needs.cold).toBe(0)
    expect(g.needs.heat).toBe(0)
    expect(g.achieved).toEqual([])
    const again = twice(g)
    expect(again.flags).toEqual(g.flags)
    expect(again.needs).toEqual(g.needs)
  })

  it('목록이어야 할 칸이 목록이 아니면 빈 목록으로 (게임 루프·자동 저장·가방이 멈추지 않게)', () => {
    const g = load({ ...base(), gifted: 7, giftsGot: 7, recipesKnown: {}, talked: 'x', helped: null, todayNotes: 3, listened: true })!
    expect(g).not.toBeNull()
    for (const k of ['gifted', 'giftsGot', 'recipesKnown', 'talked', 'helped', 'todayNotes', 'listened'] as const) expect(g[k]).toEqual([])
  })

  it('선택 칸 하나가 깨져도 저장 전체를 버리지 않는다', () => {
    const cases: Record<string, unknown>[] = [
      { rereads: 'x' },
      { achieved: [null] },
      { achieved: {} },
      { scenes: [1, null, 'welcome'] },
      { progress: { ...(base().progress as object), mt: { completed: 5, arrangement: {} } } },
      { journal: [{ day: 1, heard: 'x', notes: [] }, null] },
      { room: [...(base().room as unknown[]), null, { item: 'chair', x: 'a', y: 1 }] },
    ]
    for (const c of cases) expect(load({ ...base(), ...c }), JSON.stringify(c)).not.toBeNull()
  })

  it('닢·마음이 글자면 이어 붙이지 않는다 (닢은 0, 마음은 버린다)', () => {
    const g = load({ ...base(), coins: '50', hearts: { baker: '20', smith: 40, poppy: 1e9 } })!
    expect(g.coins).toBe(0)
    expect(g.hearts.baker).toBeUndefined()
    expect(g.hearts.smith).toBe(40)
    expect(g.hearts.poppy).toBe(100)
  })

  it('첫째 아이 기록이 깨져도 동생이 사라지지 않는다 (첫 동생이 첫째 자리로)', () => {
    const kid = (name: string, born: number) => ({ name, look: 'girl', born, stats: freshStats(), lean: null, close: 0 })
    const g = load({ ...base(), child: { ...kid('첫째', 3), look: 'zz' }, siblings: [kid('다온', 9)] })!
    expect(g.child?.name).toBe('다온')
    const again = twice(g)
    expect(again.child?.name).toBe('다온')
  })

  it('약속 제목이 글자가 아니면 버린다', () => {
    const appt = { id: 'appt:1', kind: 'event', day: 5, from: 600, to: 660, place: 'hallTable', members: ['baker'], state: 'planned', title: { x: 1 } }
    const g = load({ ...base(), plans: { appts: [appt], nextId: 2 } })!
    expect(g.plans.appts).toHaveLength(1)
    expect(g.plans.appts[0].title).toBeUndefined()
  })
})

describe('이웃 기억 정리 (2026-10-18 감사 L-26)', () => {
  it('기억·최근 말·서먹함·약속의 모양이 틀린 항목은 버리고, 맞는 항목은 남긴다', async () => {
    const { sanitizeLife, hasMemory } = await import('./people')
    const life = sanitizeLife({
      memories: { baker: 'oops', smith: [{ tag: 'warm', day: 3 }, null, { tag: 5 }] },
      recent: { baker: 'x', smith: ['a', 1] },
      cool: { baker: 'x', smith: 4 },
      promises: [{ id: 'p1', npc: 'baker', day: 5, at: { x: 1, y: 2 }, from: 600, to: 660 }, { id: 'p2', npc: 'baker' }],
    })
    expect(life.memories.baker).toEqual([])
    expect(life.memories.smith).toEqual([{ tag: 'warm', day: 3 }])
    expect(life.recent).toEqual({ baker: [], smith: ['a'] })
    expect(life.cool).toEqual({ smith: 4 })
    expect(life.promises.map((p) => p.id)).toEqual(['p1'])
    expect(() => hasMemory(life, 'baker', 'warm')).not.toThrow()
  })
})
