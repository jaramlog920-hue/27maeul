// 계획 16 작업 12: 연애 후보마다 친구·연인·배우자 말이 서로 섞이지 않는지, 배우자도 낮엔 제 일과가 있는지, 연애 없이도 큰 이야기를 끝낼 수 있는지
import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, routineOf, settle, type GameState } from './game'
import { depthOf, NO_LIFE, reqMet, setPeopleData, type ReqCtx, type Rel, type Stage } from './people'
import { CANDIDATE_IDS, NO_ROMANCE } from './romance'
import { isMarketDay, isWet, weatherOf } from './calendar'
import { SPOUSE_ROOM_STAND } from './spouse-room'

beforeEach(() => setPeopleData(PEOPLE))

/** 이 사람의 사건·이야기를 모두 겪은 저장 (말 조건이 가장 많이 열린 상태) */
function everything(npc: string) {
  const p = PEOPLE.people[npc]
  const seen = [...(p.events ?? []).map((e) => e.id), ...(p.sightings ?? []).map((w) => w.id)]
  const experiences: Record<string, { id: string; kind: 'choice'; with: string[]; first: number; last: number; count: number }> = {}
  const flags: Record<string, number> = {}
  for (const q of Object.values(PEOPLE.people))
    for (const e of q.events ?? []) {
      experiences[`choice:${e.id}`] = { id: `choice:${e.id}`, kind: 'choice', with: [npc], first: 1, last: 1, count: 1 }
      if (e.completes) {
        flags[`story:${e.completes}`] = 1
        experiences[`story:${e.completes}`] = { id: `story:${e.completes}`, kind: 'choice', with: [npc], first: 1, last: 1, count: 1 }
      }
    }
  return { life: { ...NO_LIFE, seen, experiences }, flags }
}

const STATES: { rel: Rel; romance: 'dating' | 'engaged' | 'married' | null; stage: Stage }[] = [
  { rel: 'friend', romance: null, stage: 3 },
  { rel: 'close', romance: null, stage: 5 },
  { rel: 'lover', romance: 'dating', stage: 5 },
  { rel: 'lover', romance: 'engaged', stage: 5 },
  { rel: 'spouse', romance: 'married', stage: 5 },
]

describe('연애 후보의 사이별 말', () => {
  it.each([...CANDIDATE_IDS])('%s: 친구·연인·배우자 말이 하나씩 있고 그 사이에서만 맞는다', (npc) => {
    const { life, flags } = everything(npc)
    for (const st of STATES) {
      const ctx: ReqCtx = { life, npc, day: 10, threads: [], lover: !!st.romance, suitor: true, flags, stage: st.stage, romance: st.romance }
      const want = st.rel === 'close' ? 'friend' : st.rel
      const got = (['friend', 'lover', 'spouse'] as const).filter((r) => reqMet(PEOPLE.people[npc].lines.find((l) => l.id === `${npc}:rel:${r}`)?.req, ctx))
      // 메리골드처럼 이야기를 마친 뒤 친구 말이 다른 말(friendRest)로 바뀌는 경우는 친구 말이 없어도 된다
      if (want === 'friend' && got.length === 0) expect(PEOPLE.people[npc].lines.some((l) => l.id.startsWith(`${npc}:rel:friend`) && reqMet(l.req, ctx)), `${npc} ${st.rel}`).toBe(true)
      else expect(got, `${npc} ${st.rel}`).toEqual([want])
    }
  })

  it.each([...CANDIDATE_IDS])('%s: 지금 사이에 맞지 않는 말은 고를 후보에 들지 않는다 (사이 조건·연인 조건·연인 깊이)', (npc) => {
    const { life, flags } = everything(npc)
    for (const st of STATES) {
      const lover = !!st.romance
      const ctx: ReqCtx = { life, npc, day: 10, threads: [], lover, suitor: true, flags, stage: st.stage, romance: st.romance }
      const depth = depthOf(st.stage, lover)
      const ok = PEOPLE.people[npc].lines.filter((l) => l.depth <= depth && !l.cool && reqMet(l.req, ctx))
      for (const l of ok) {
        if (l.req?.rel) expect(l.req.rel, `${npc} ${st.rel} ${l.id}`).toContain(st.rel)
        if (!lover) {
          expect(l.depth, `${npc} ${st.rel} ${l.id}`).toBeLessThan(3)
          expect(l.req?.lover, `${npc} ${st.rel} ${l.id}`).not.toBe(true)
        }
        if (st.rel !== 'spouse') expect(l.id, `${npc} ${st.rel} ${l.id}`).not.toMatch(/:spouse:|:rel:spouse/)
      }
      // 배우자 습관 장면은 배우자일 때만
      const habit = PEOPLE.people[npc].events?.find((e) => e.id === `${npc}:short:spouseHabit`)
      expect(habit, npc).toBeDefined()
      expect(reqMet(habit!.req, ctx), `${npc} ${st.rel}`).toBe(st.rel === 'spouse')
    }
  })

  it.each([...CANDIDATE_IDS])('%s: 연애 없이도 큰 이야기를 끝낼 수 있다 — 완료 사건은 연인·사이·고백 조건이 없다', (npc) => {
    const done = (PEOPLE.people[npc].events ?? []).filter((e) => e.completes)
    expect(done.length, npc).toBeGreaterThan(0)
    for (const e of done) {
      expect(e.confess, e.id).toBeUndefined()
      expect(e.req?.lover, e.id).toBeUndefined()
      expect(e.req?.rel, e.id).toBeUndefined()
    }
  })
})

describe('배우자의 낮', () => {
  const moved = Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1]))
  it.each([...CANDIDATE_IDS])('%s: 결혼해도 낮에는 집 밖에서 제 일과를 한다 (저녁에만 집으로)', (npc) => {
    const def = CONTENT.neighbors.find((n) => n.id === npc)!
    const day = Array.from({ length: 200 }, (_, i) => 30 + i).find((d) => !isWet(weatherOf(d)) && (def.marketOnly ? isMarketDay(d) : d % 7 === 1))!
    const base = newGame(CONTENT)
    const married: GameState = { ...base, homeLevel: 1, flags: { ...base.flags, ...moved }, romance: { ...NO_ROMANCE, partner: npc, stage: 'married', since: 1, marriedDay: 2 }, clock: { ...base.clock, day, minute: 600 } }
    const s = settle(married, CONTENT)
    const r = routineOf(s, npc)
    expect(r, npc).not.toBeNull()
    expect(r?.away, npc).toBeUndefined()
    expect(s.npcs[npc].visible, npc).toBe(true)
    expect(s.npcs[npc].goal, npc).not.toEqual(SPOUSE_ROOM_STAND)
    // 저녁 여덟 시엔 집에
    const night = settle({ ...married, clock: { ...married.clock, minute: 20 * 60 } }, CONTENT)
    expect(night.npcs[npc].goal, npc).not.toEqual(r?.at)
  })
})
