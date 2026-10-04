import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { festivalOf } from './calendar'
import { scheduledEvents } from './events'
import { VISIT_FROM } from './bonds'
import { dislikesOf, giveGift, greetNeighbor, listen, newGame, receiveVisit, type GameState } from './game'
import { deserialize, serialize } from './save'
import { BIRTHDAYS, isBirthday, knownTastes, nextBirthday, NO_NOTEBOOK, noteGot, sanitizeNotebook, slotOf } from './notebook'
import type { NeighborDef } from './types'

const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id) as NeighborDef
const on = (s: GameState, day: number, minute = 600): GameState => ({ ...s, clock: { ...s.clock, day, minute } })

describe('이웃 수첩', () => {
  it('이웃마다 생일이 하나씩, 겹치지 않고 잔치 날을 피한다', () => {
    const days = new Set<string>()
    for (const n of CONTENT.neighbors) {
      const b = BIRTHDAYS[n.id]
      expect(b, n.id).toBeDefined()
      const key = b.join(':')
      expect(days.has(key), key).toBe(false)
      days.add(key)
      const d = nextBirthday(n.id, 1)!
      expect(isBirthday(n.id, d)).toBe(true)
      expect(festivalOf(d)).toBeNull()
    }
  })

  it('다음 생일은 오늘이거나 한 해 안', () => {
    const d = nextBirthday('baker', 1)!
    expect(d).toBe(10)
    expect(nextBirthday('baker', 10)).toBe(10)
    expect(nextBirthday('baker', 11)).toBe(10 + 160)
  })

  it('모든 이웃은 싫어하는 것이 있고, 좋아하는 것과 겹치지 않는다', () => {
    for (const n of CONTENT.neighbors) {
      const dis = dislikesOf(n)
      expect(dis.length, n.id).toBeGreaterThan(0)
      expect(dis.filter((x) => n.likes.includes(x)), n.id).toEqual([])
    }
  })

  it('말을 걸면 만난 이웃과 마주친 때·자리가 적힌다', () => {
    const s = greetNeighbor(newGame(CONTENT), 'baker')
    expect(s.notebook.met).toContain('baker')
    expect(s.notebook.seen.baker?.[slotOf(s.clock.minute)]).toBeTruthy()
  })

  it('선물로 좋아하는 것·싫어하는 것을 알게 된다', () => {
    const s = { ...newGame(CONTENT), inv: { grapes: 1, olive: 1 } }
    const liked = giveGift(s, def('baker'), 'grapes')!
    expect(liked.state.notebook.likes.baker).toEqual(['grapes'])
    const bad = giveGift(s, def('baker'), 'olive')!
    expect(bad.state.notebook.dislikes.baker).toEqual(['olive'])
    expect(bad.state.hearts.baker ?? 0).toBe(0)
  })

  it('생일에 건넨 선물은 마음이 두 배', () => {
    const s = on({ ...newGame(CONTENT), inv: { grapes: 1 } }, 10)
    expect(giveGift(s, def('baker'), 'grapes')!.state.hearts.baker).toBe(10)
  })

  it('사이가 깊어지면 ? 칸이 열린다', () => {
    const d = def('baker')
    const dis = dislikesOf(d)
    expect(knownTastes(NO_NOTEBOOK, d, dis, 0)).toEqual({ likes: [null, null], dislikes: [null] })
    expect(knownTastes(NO_NOTEBOOK, d, dis, 15).likes).toEqual(['grapes', null])
    expect(knownTastes(NO_NOTEBOOK, d, dis, 30).dislikes).toEqual(['olive'])
    expect(knownTastes(NO_NOTEBOOK, d, dis, 55).likes).toEqual(['grapes', 'fig'])
  })

  it('이야기를 들으면 들은 이야기에 남는다', () => {
    let s = newGame(CONTENT)
    const [who, piece] = Object.entries(s.offers)[0] ?? []
    if (!who) return
    s = listen(s, who, CONTENT).state
    expect(s.notebook.heard[who]).toEqual([piece])
  })

  it('만난 이웃의 생일은 일정에 보인다', () => {
    const s = on(greetNeighbor(newGame(CONTENT), 'baker'), 5)
    expect(scheduledEvents(s, CONTENT).some((e) => e.id === '10:birthday:baker')).toBe(true)
    expect(scheduledEvents(newGame(CONTENT), CONTENT).some((e) => e.id.includes('birthday'))).toBe(false)
  })

  it('저장했다 불러와도 수첩이 이어지고, 옛 저장은 빈 수첩', () => {
    const s = greetNeighbor(newGame(CONTENT), 'baker')
    const back = deserialize(serialize(s), CONTENT)
    expect(back?.notebook.met).toContain('baker')
    expect(sanitizeNotebook(undefined)).toEqual(NO_NOTEBOOK)
    expect(sanitizeNotebook({ met: ['a', 3], likes: { a: ['fig', 1] } }).likes).toEqual({ a: ['fig'] })
  })

  it('이웃에게 받은 선물(일지 › 이웃 수첩): 같은 물건은 한 번, 저장했다 불러와도 남고 옛 저장에는 칸이 없다', () => {
    const n = noteGot(noteGot(NO_NOTEBOOK, 'baker', ['bread']), 'baker', ['bread', 'fig'])
    expect(n.got).toEqual({ baker: ['bread', 'fig'] })
    expect(noteGot(n, 'baker', [])).toBe(n)
    expect(sanitizeNotebook({ ...n, got: { baker: ['bread', 3] } }).got).toEqual({ baker: ['bread'] })
    expect(sanitizeNotebook({ met: [] })).not.toHaveProperty('got')
    // 아침에 들른 이웃이 두고 간 것도 그 이웃의 쪽에 적힌다
    const s = on(newGame(CONTENT), 1, VISIT_FROM)
    s.today = { ...s.today, visitor: 'baker' }
    const r = receiveVisit(s, 'baker')!
    expect(r.state.notebook.got?.baker).toEqual(Object.keys(r.gift))
    const back = deserialize(serialize(r.state), CONTENT)
    expect(back?.notebook.got?.baker).toEqual(Object.keys(r.gift))
  })
})
