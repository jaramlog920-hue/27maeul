// 2026-10-12 손님·서고·이사·자식 점검(docs/playtest-손님서고이사자식-2026-10-12.md)에서 찾은 버그의 회귀 검사
import { describe, expect, it } from 'vitest'
import { T } from '../content/text'

describe('12. 주민 결혼 상담 선택지는 한 줄(16자 안)', () => {
  it('응원·기다리기 둘 다 16자 안', () => {
    for (const s of Object.values(T.gen.answers)) expect([...s].length, s).toBeLessThanOrEqual(16)
  })
})

import { CONTENT } from '../content/catalog'
import { neighborDoor, newGame, type GameState } from './game'
import { familyShownMember, livesInNewland } from './gen-homes'
import { newGenState, type GenState } from './gen'
import { withPairs } from './gen-settle'
import type { Build } from './newland-build'
import { VILLAGE_PORTAL } from './newland-config'

describe('10. 새 터로 이사한 원래 이웃 가족', () => {
  // 상인–메리골드처럼 원래 이웃끼리 꾸린 가구 (gen.persons에 avatar가 없다)
  function moved(): GameState {
    const g = newGenState(CONTENT, 7, 1, withPairs())
    const gen = { ...g,
      persons: { ...g.persons, merchant: { ...g.persons.merchant, spouse: 'marigold', household: 'h-3' }, marigold: { ...g.persons.marigold, spouse: 'merchant', household: 'h-3' } },
      households: { ...g.households, 'h-3': { id: 'h-3', home: 'merchant', members: ['merchant', 'marigold'], children: [], lastBirth: null, since: 200 } },
    } as GenState
    const house: Build = { id: 'b3', kind: 'home', x: 22, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 } as Build
    const base = newGame(CONTENT)
    return { ...base, gen, flags: { ...base.flags, 'familyHome:3': 3 }, newland: { builds: [house], tiles: {}, nextId: 4, settledDay: 200 } } as unknown as GameState
  }
  it('문 옆에 설 사람을 원래 이웃 가구에서도 고른다', () => {
    const s = moved()
    expect(familyShownMember(s, s.gen!.households['h-3'])).toBe('merchant')
  })
  it('이사한 가족은 새 터 사람 — 밤에 첫 마을 집이 아니라 새 터 표식으로 돌아간다', () => {
    const s = moved()
    expect(livesInNewland(s, 'marigold')).toBe(true)
    expect(livesInNewland(s, 'baker')).toBe(false)
    const def = CONTENT.neighbors.find((d) => d.id === 'marigold')!
    expect(neighborDoor(s, def)).toEqual(VILLAGE_PORTAL)
    expect(neighborDoor(s, CONTENT.neighbors.find((d) => d.id === 'baker')!)).toEqual(CONTENT.neighbors.find((d) => d.id === 'baker')!.door)
  })
})
