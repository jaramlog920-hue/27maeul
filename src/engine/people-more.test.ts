// 2026-10-12 사용자: 하트 수에 따라 열리는 말, 연인·부부 사건과 말, 같은 모습 후보의 친구 말, 이야기 장면 동작
import { legacyGame as newGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { NEIGHBOR_LINES, SCENES } from '../content/text'
import { PEOPLE_MORE } from '../content/people-all'
import { personLine, sameLookCandidate, settle, type GameState } from './game'
import { NO_LIFE, personOf, reqMet, setPeopleData } from './people'
import { npcEventMotion, playerEventMotion } from './event-scene'
import { EVENT_ACTIONS } from '../render/event-life-motion'
import { CANDIDATE_IDS, NO_ROMANCE } from './romance'

beforeEach(() => setPeopleData(PEOPLE))

const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id)!
function game(look: 'f' | 'm'): GameState {
  return settle(newGame(CONTENT, { look, name: '하늘' } as never), CONTENT)
}
const ctx = (hearts: number) => ({ life: NO_LIFE, npc: 'wendell', day: 40, lover: false, suitor: false, threads: [], hearts })

describe('하트 수에 따라 열리는 말', () => {
  it('하트가 모자라면 그 말은 나오지 않는다', () => {
    expect(reqMet({ hearts: 6 }, ctx(5))).toBe(false)
    expect(reqMet({ hearts: 6 }, ctx(6))).toBe(true)
  })
  it('원래 이웃과 연애 후보 모두 하트 2~10 말이 있다', () => {
    for (const id of [...CANDIDATE_IDS, 'baker', 'smith', 'fisher', 'carpenter', 'shepherd', 'beekeeper', 'grandpa', 'weaver', 'apothecary', 'child']) {
      const hs = personOf(id)!.lines.filter((l) => l.req?.hearts !== undefined).map((l) => l.req!.hearts)
      expect(hs, id).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10])
    }
  })
  it('하트 6 이상 말은 깊은 사이(깊이 2), 그 아래는 깊이 1', () => {
    for (const p of Object.values(PEOPLE.people)) for (const l of p.lines) if (l.req?.hearts !== undefined) expect(l.depth, l.id).toBe(l.req.hearts >= 6 ? 2 : 1)
  })
})

describe('연인·부부 사이', () => {
  it('후보마다 연인 사건 둘·부부 사건 둘이 앞 사건 뒤에 이어진다', () => {
    for (const id of CANDIDATE_IDS) {
      const evs = personOf(id)!.events!
      for (const key of ['love:1', 'love:2', 'home:1', 'home:2']) {
        const e = evs.find((x) => x.id === `${id}:${key}`)
        expect(e, `${id}:${key}`).toBeDefined()
        expect(e!.req?.after, `${id}:${key}`).toBeDefined()
        expect(evs.some((x) => x.id === e!.req!.after!.event), `${id}:${key} after`).toBe(true)
        expect(e!.choices!.every((c) => c.memory), `${id}:${key} memory`).toBe(true)
        // 그 기억 뒤에 하는 말이 있다
        const mem = e!.choices![0].memory!
        expect(personOf(id)!.lines.some((l) => l.req?.memory?.includes(mem)), `${id}:${key} follow`).toBe(true)
      }
    }
  })
  it('연인 말은 연인일 때만, 부부 말은 부부일 때만', () => {
    for (const id of CANDIDATE_IDS) {
      const lines = personOf(id)!.lines
      expect(lines.filter((l) => l.id.startsWith(`${id}:love:line`)).every((l) => l.req?.rel?.join() === 'lover'), id).toBe(true)
      expect(lines.filter((l) => l.id.startsWith(`${id}:home:line`)).every((l) => l.req?.rel?.join() === 'spouse'), id).toBe(true)
    }
  })
  it('부부가 되면 부부 말 중 하나를 한다', () => {
    const s0 = game('f')
    const s: GameState = { ...s0, hearts: { ...s0.hearts, wendell: 100 }, romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'married', since: 1, marriedDay: 2 }, clock: { ...s0.clock, day: 41, minute: 900 } }
    const said = new Set<string>()
    let g = s
    for (let i = 0; i < 40; i++) {
      const r = personLine(g, 'wendell', (i % 10) / 10)
      if (!r) break
      said.add(r.text)
      g = r.state
    }
    expect([...said].some((t) => PEOPLE_MORE.lines.wendell.some((l) => l.id.startsWith('wendell:home:line') && l.text === t))).toBe(true)
  })
})

describe('같은 모습의 연애 후보는 친구 말로', () => {
  it('주인공과 같은 모습이면 친구, 다르면 후보', () => {
    expect(sameLookCandidate(game('m'), def('wendell'))).toBe(true)
    expect(sameLookCandidate(game('f'), def('wendell'))).toBe(false)
    expect(sameLookCandidate(game('f'), def('juniper'))).toBe(true)
    // 원래 이웃(연애 후보 아님)은 해당 없음
    expect(sameLookCandidate(game('m'), def('smith'))).toBe(false)
  })
  it('마음 6 옛이야기 친구판과 가까운 사이 친구 말이 있다', () => {
    for (const id of ['juniper', 'marigold', 'basil', 'penelope', 'presser', 'postman', 'dexter', 'tilly']) expect(SCENES[`romance2:${id}:friend`], id).toBeDefined()
    for (const id of ['wendell', 'juniper', 'merchant']) expect(NEIGHBOR_LINES[id].closeFriend?.length, id).toBeGreaterThan(0)
  })
})

describe('이야기 장면 동작', () => {
  it('모든 사건에 그린 동작 이름이 붙어 있다', () => {
    const ok = new Set<string>(EVENT_ACTIONS)
    for (const p of Object.values(PEOPLE.people))
      for (const e of p.events ?? []) {
        expect(e.motion, e.id).toBeDefined()
        expect(ok.has(e.motion!.npc), `${e.id} ${e.motion!.npc}`).toBe(true)
        if (e.motion!.player) expect(ok.has(e.motion!.player), `${e.id} ${e.motion!.player}`).toBe(true)
      }
  })
  it('장면이 떠 있는 동안 주인과 기록자가 마주 보고 동작한다', () => {
    const s0 = game('f')
    const e = personOf('juniper')!.events!.find((x) => x.id === 'juniper:love:2')!
    const near = { x: e.at.x + 1, y: e.at.y }
    const s: GameState = {
      ...s0,
      scenes: [`ev:${e.id}`],
      player: { ...s0.player, x: near.x, y: near.y, path: [] },
      npcs: { ...s0.npcs, juniper: { ...s0.npcs.juniper, x: e.at.x, y: e.at.y, visible: true, path: [] } },
    }
    const npc = npcEventMotion(s, 'juniper', 1)
    expect(npc?.action).toBe('dance')
    expect(npc?.facing).toBe('right')
    const me = playerEventMotion(s, 1)
    expect(me?.action).toBe('dance')
    expect(me?.facing).toBe('left')
    // 장면을 닫으면 평소대로
    expect(npcEventMotion({ ...s, scenes: [] }, 'juniper', 1)).toBeNull()
  })
})
