// 계획 20 2부 작업 B: 쉬는 이웃끼리 만남 — 하루 세 번·30분 간격·맞닿은 칸·둘 다 쉬는 중, 결과는 결정적
import { CONTENT } from '../content/catalog'
import { affinityOf, newGenState, relationId, type GenState } from './gen'
import { withPairs } from './gen-settle'
import { checkMeets, meetResult, MEET_GAIN, tickEmotes } from './meet'

const likes = (id: string) => CONTENT.neighbors.find((d) => d.id === id)?.likes ?? []
const fresh = (): GenState => newGenState(CONTENT, 5, 1, withPairs())
const at = { rudy: { x: 12, y: 11 }, poppy: { x: 13, y: 11 }, cosmo: { x: 20, y: 20 } }
const all = new Set(['rudy', 'poppy', 'cosmo'])

describe('만남', () => {
  it('맞닿은 쉬는 둘만 만나고, 두 사람 머리 위에 같은 표정', () => {
    const { g, emotes } = checkMeets(fresh(), at, all, 3, 600, likes)
    expect(emotes.map((e) => e.npc).sort()).toEqual(['poppy', 'rudy'])
    expect(emotes[0].kind).toBe(emotes[1].kind)
    expect(affinityOf(g, 'rudy', 'poppy')).toBe(Math.max(0, MEET_GAIN[emotes[0].kind]))
    expect(g.meets[relationId('rudy', 'poppy')]).toEqual({ day: 3, n: 1, last: 600 })
  })
  it('한쪽이 쉬는 중이 아니면 만나지 않는다', () => {
    expect(checkMeets(fresh(), at, new Set(['rudy']), 3, 600, likes).emotes).toEqual([])
  })
  it('30분 간격, 하루 세 번까지', () => {
    let g = fresh()
    let n = 0
    for (let m = 600; m < 900; m++) {
      const r = checkMeets(g, at, all, 3, m, likes)
      g = r.g
      if (r.emotes.length) n++
    }
    expect(n).toBe(3)
    const times = g.meets[relationId('rudy', 'poppy')]
    expect(times.n).toBe(3)
    // 다음 날은 다시
    expect(checkMeets(g, at, all, 4, 600, likes).emotes).toHaveLength(2)
  })
  it('친한 사이가 아니면 하트는 나오지 않고, 헤어진 지 7일 안은 이야기·머쓱만', () => {
    const g = fresh()
    for (let n = 0; n < 60; n++) expect(meetResult(g, 'rudy', 'juniper', 3, n, 3)).not.toBe('heart')
    const broke = { ...g, breakup: { [relationId('rudy', 'juniper')]: 2 } }
    for (let n = 0; n < 60; n++) expect(['talk', 'sweat']).toContain(meetResult(broke, 'rudy', 'juniper', 5, n, 3))
  })
  it('같은 씨앗이면 같은 결과', () => {
    expect(checkMeets(fresh(), at, all, 3, 600, likes)).toEqual(checkMeets(fresh(), at, all, 3, 600, likes))
  })
  it('표정은 2초쯤 뒤 사라진다', () => {
    const list = [{ npc: 'rudy', kind: 'laugh' as const, left: 2 }]
    expect(tickEmotes(list, 1)?.[0].left).toBe(1)
    expect(tickEmotes(list, 2.5)).toBeUndefined()
  })
})
