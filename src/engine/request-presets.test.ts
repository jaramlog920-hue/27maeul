import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { REQUEST_KINDS, SHORT_CHARS, type CopyRequest } from './copy-requests'
import { newGame as createGame, writePresetRequest } from './game'
import { normalizeRequestText, REQUEST_PRESETS } from './request-presets'

function newGame(content: typeof CONTENT) {
  const game = createGame(content)
  for (const book of ['phm', '2jn', '3jn'] as const) game.progress[book].completed = [1]
  return game
}

describe('주민 의뢰 프리셋 직접 필사', () => {
  it('여섯 분류에 중복 없는 짧은 구절 다섯 개씩 있다', () => {
    const all = REQUEST_KINDS.flatMap((kind) => {
      expect(REQUEST_PRESETS[kind]).toHaveLength(5)
      return REQUEST_PRESETS[kind]
    })
    expect(new Set(all.map((p) => p.ref)).size).toBe(30)
    expect(new Set(all.map((p) => p.text)).size).toBe(30)
    for (const p of all) expect(normalizeRequestText(p.text).length).toBeLessThanOrEqual(SHORT_CHARS)
    expect(REQUEST_PRESETS.work[4].ref).toBe('잠언 22:29')
  })

  it('다른 분류·빈 입력·오타·쓰다 만 구절은 보상을 받을 수 없다', () => {
    const s = newGame(CONTENT)
    const r: CopyRequest = { id: '1:0', npc: 'baker', kind: 'learn', cond: 'care', day: 1, until: 3 }
    const p = REQUEST_PRESETS.learn[0]
    for (const text of ['', p.text.slice(0, -1), p.text + '가']) expect(writePresetRequest(s, r, p.id, text, CONTENT)).toBeNull()
    const other = REQUEST_PRESETS.work[0]
    expect(writePresetRequest(s, r, other.id, other.text, CONTENT)).toBeNull()
  })

  it('모은 조각 없이 직접 완필할 수 있고 실제 호감도·중복 지급·기한을 확인한다', () => {
    const s = { ...newGame(CONTENT), collected: [] }
    for (const cond of ['short', 'care'] as const) {
      const r: CopyRequest = { id: `1:${cond}`, npc: 'baker', kind: 'comfort', cond, day: 1, until: 3 }
      const p = REQUEST_PRESETS.comfort[0]
      const out = writePresetRequest(s, r, p.id, p.text.replaceAll(' ', '\n'), CONTENT)!
      expect(out.affinity).toBe((out.state.hearts.baker ?? 0) - (s.hearts.baker ?? 0))
      expect(out.affinity).toBeGreaterThan(0)
      expect(out.state.coins).toBe(s.coins)
      expect(out.state.collected).toEqual([])
      expect(writePresetRequest(out.state, r, p.id, p.text, CONTENT)).toBeNull()
      expect(writePresetRequest({ ...s, clock: { day: 4, minute: 600 } }, r, p.id, p.text, CONTENT)).toBeNull()
    }
  })
})
