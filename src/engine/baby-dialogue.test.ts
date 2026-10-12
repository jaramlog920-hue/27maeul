import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, personLine } from './game'
import { NO_LIFE, pickLine, reqMet, setPeopleData, type ReqCtx } from './people'

beforeEach(() => setPeopleData(PEOPLE))

function context(day: number): ReqCtx {
  return { day, npc: 'shepherd', life: NO_LIFE, lover: false, suitor: false, threads: PEOPLE.threads }
}

describe('헤이즐 자녀의 성장에 맞는 대화', () => {
  it.each([[7, null], [8, 'Baby'], [21, 'Baby'], [22, 'Child'], [49, 'Child'], [50, 'Teen'], [91, 'Teen'], [92, 'Adult'], [252, 'Adult']] as const)('%i일 오웬 대사는 %s 단계만 후보가 된다', (day, suffix) => {
    expect(CONTENT.neighbors.find(n => n.role === '오웬')?.id).toBe('shepherd')
    const lines = PEOPLE.people.shepherd.lines.filter(l => l.id.startsWith('shepherd:baker'))
    expect(lines.filter(l => reqMet(l.req, context(day))).map(l => l.id)).toEqual(suffix ? [`shepherd:baker${suffix}`] : [])
    const p = { ...PEOPLE.people.shepherd, lines }
    const c = { ...context(day), m: { day, minute: 600, weather: 'sunny' as const, season: 'spring' as const }, depth: 0, cool: false, here: { x: 5, y: 29 } }
    expect(pickLine(p, c, 0)?.id ?? null).toBe(suffix ? `shepherd:baker${suffix}` : null)
  })

  it('세대 상태가 없는 옛 저장도 실제 게임 대사 선택에서 성장한 막내를 아기라 부르지 않는다', () => {
    const base = newGame(CONTENT)
    for (const day of [22, 50, 92, 252]) {
      const s = { ...base, gen: undefined, clock: { day, minute: 600 } }
      for (const rnd of [0, 0.3, 0.6, 0.99]) expect(personLine(s, 'shepherd', rnd)?.text ?? '').not.toContain('아기')
    }
  })

  it('파피의 울음 대사와 달래기 장면은 출생 전·어린이 이후에 나오지 않는다', () => {
    const p = PEOPLE.people.wendell
    const reqs = [p.lines.find(l => l.id === 'wendell8')!.req, p.lines.find(l => l.id === 'wendell15')!.req, p.events!.find(e => e.id === 'wendell:baby')!.req]
    for (const day of [7, 22, 50, 92]) for (const req of reqs) expect(reqMet(req, { ...context(day), npc: 'wendell' })).toBe(false)
    expect(reqMet(reqs[0], context(21))).toBe(true)
    expect(reqMet(reqs[2], context(8))).toBe(true)
  })
})
