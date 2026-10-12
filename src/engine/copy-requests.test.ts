// 계획 21 R3·R4: 주민 부탁 필사 — 날 씨앗 부탁, 기한, 별, 닢 없는 보답, 주민 가족 축복 부탁
import { CONTENT } from '../content/catalog'
import { canWriteRequest, copyRequestsToday, goToSleep, newGame as createGame, writePresetRequest, type GameState } from './game'
import { REQUEST_PRESETS } from './request-presets'
import { familyRequests, giftFor, requestsOn, requestsToday, starsFor, type CopyRequest } from './copy-requests'
import { deserialize, serialize } from './save'
import { todayDiary } from './daybook'
import { RARE_ITEMS } from './fixtures'

const ids = CONTENT.neighbors.filter((d) => !d.marketOnly).map((d) => d.id)

// 부탁의 보답·기한 검사는 게시판이 정식으로 열린 상태에서 한다.
function newGame(content: typeof CONTENT) {
  const game = createGame(content)
  // 게시판 정식 해금 12장 (2026-10-13 장 수 기준)
  game.progress.mt.completed = Array.from({ length: 12 }, (_, i) => i + 1)
  return game
}

describe('부탁이 붙는 법', () => {
  it('날마다 둘, 같은 날은 같다, 3–7일 동안 남는다, 아이는 배움 부탁', () => {
    const a = requestsOn(10, ids)
    expect(a).toHaveLength(2)
    expect(requestsOn(10, ids)).toEqual(a)
    for (let d = 1; d < 60; d++)
      for (const r of requestsOn(d, ids)) {
        expect(r.until - r.day + 1).toBeGreaterThanOrEqual(3)
        expect(r.until - r.day + 1).toBeLessThanOrEqual(7)
        if (r.npc === 'child') expect(r.kind).toBe('learn')
      }
  })
  it('오늘 게시판은 기한이 남은 것만, 결혼·출생 뒤에는 그 집의 축복 부탁', () => {
    for (const r of requestsToday(20, ids)) expect(r.until).toBeGreaterThanOrEqual(20)
    const fam = familyRequests([{ day: 18, kind: 'married', who: ['poppy', 'rudy'] }, { day: 18, kind: 'friend', who: ['a', 'b'] }], (id) => ids.includes(id))
    expect(fam).toEqual([{ id: 'gen:18:poppy', npc: 'poppy', kind: 'bless', day: 18, until: 22 }])
    expect(requestsToday(20, ids, fam).some((r) => r.id === 'gen:18:poppy')).toBe(true)
    expect(requestsToday(23, ids, fam).some((r) => r.id === 'gen:18:poppy')).toBe(false)
  })
})

describe('별과 보답', () => {
  const r: CopyRequest = { id: '5:0', npc: 'baker', kind: 'comfort', day: 5, until: 9 }
  it('직접 필사 보답은 받은 선물 일기와 이웃 수첩에 실제 지급량으로 남는다', () => {
    const base = newGame(CONTENT)
    const s = { ...base, clock: { day: 6, minute: 600 }, scenes: [], notebook: { ...base.notebook, met: ['baker'] } }
    const preset = REQUEST_PRESETS[r.kind][0]
    const out = writePresetRequest(s, r, preset.id, preset.text, CONTENT)!
    const gift = giftFor(r, out.stars, CONTENT.neighbors.find(n => n.id === r.npc)!.likes, RARE_ITEMS)
    expect(todayDiary(out.state)?.gifts).toEqual([{ from: r.npc, items: gift }])
    expect(out.state.notebook.got?.[r.npc]).toEqual(Object.keys(gift))
    const restored = deserialize(serialize(out.state), CONTENT)!
    expect(todayDiary(restored)?.gifts).toEqual([{ from: r.npc, items: gift }])
    expect(writePresetRequest(restored, r, preset.id, preset.text, CONTENT)).toBeNull()
    const morning = deserialize(serialize(goToSleep(restored, CONTENT)), CONTENT)!
    expect(morning.dayLog.gifts).toEqual([])
    expect(morning.notebook.got?.[r.npc]).toEqual(Object.keys(gift))
  })
  it('게시일부터 마지막 날까지만 전달할 수 있고 저장 복원 후에도 재지급하지 않는다', () => {
    const base = newGame(CONTENT)
    const preset = REQUEST_PRESETS[r.kind][0]
    const at = (day: number) => ({ ...base, clock: { day, minute: 600 } })
    expect(canWriteRequest(at(4), r)).not.toBeNull()
    expect(writePresetRequest(at(4), r, preset.id, preset.text, CONTENT)).toBeNull()
    for (const day of [5, 9]) {
      const out = writePresetRequest(at(day), r, preset.id, preset.text, CONTENT)!
      expect(out).not.toBeNull()
      expect(writePresetRequest(out.state, r, preset.id, preset.text, CONTENT)).toBeNull()
      const restored = deserialize(serialize(out.state), CONTENT)!
      expect(restored.flags[`req:${r.id}`]).toBe(out.stars)
      expect(writePresetRequest(restored, r, preset.id, preset.text, CONTENT)).toBeNull()
    }
    expect(writePresetRequest(at(10), r, preset.id, preset.text, CONTENT)).toBeNull()
  })
  it('분위기가 맞을수록 별이 늘고 (최대 3), 조건을 지키면 하나 더', () => {
    expect(starsFor(r, { moods: [], chars: 200, care: false })).toBe(1)
    expect(starsFor(r, { moods: ['comfort'], chars: 200, care: false })).toBe(2)
    expect(starsFor(r, { moods: ['comfort', 'hope'], chars: 200, care: false })).toBe(3)
    expect(starsFor({ ...r, cond: 'short' }, { moods: ['comfort'], chars: 40, care: false })).toBe(3)
    expect(starsFor({ ...r, cond: 'care' }, { moods: [], chars: 200, care: true })).toBe(2)
  })
  it('보답은 좋아하는 물건 — 닢은 없다, 마음이 오르고 끝낸 부탁은 다시 못 쓴다', () => {
    expect(giftFor(r, 1, ['grapes'], ['goldLeaf'])).toEqual({ grapes: 1 })
    const base = newGame(CONTENT)
    const s: GameState = { ...base, clock: { day: 6, minute: 600 }, collected: [] }
    const preset = REQUEST_PRESETS[r.kind][0]
    const out = writePresetRequest(s, r, preset.id, preset.text, CONTENT)!
    expect(out.state.coins).toBe(s.coins)
    expect(out.state.hearts.baker).toBeGreaterThan(0)
    expect(out.state.flags['req:5:0']).toBe(out.stars)
    expect(canWriteRequest(out.state, r)).toBe('done')
    expect(canWriteRequest({ ...s, clock: { day: 10, minute: 600 } }, r)).toBe('expired')
  })
  it('게시판에는 이사 온 이웃의 부탁만', () => {
    const s = newGame(CONTENT)
    for (const r2 of copyRequestsToday({ ...s, clock: { day: 4, minute: 600 } }, CONTENT)) {
      const d = CONTENT.neighbors.find((n) => n.id === r2.npc)!
      expect(d.marketOnly).toBeFalsy()
    }
  })
})
