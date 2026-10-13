import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import { goToSleep, type GameState } from './game'
import { establishedGame } from './growth-test-support'
import { deserialize, serialize } from './save'
import { nextTip, TIP_LETTERS, TIP_WHEN, tipDay, tipMorning } from './tip-letters'

const base = (): GameState => ({ ...establishedGame(CONTENT, 20), scenes: [], clock: { day: 9, minute: 22 * 60 } })

describe('이웃 꿀팁 편지 (2026-10-14)', () => {
  it('200통 — 보내는 이웃·조건이 다 있고, 금지어·"당신" 없이', () => {
    expect(TIP_LETTERS).toHaveLength(200)
    expect(new Set(TIP_LETTERS.map((t) => t.id)).size).toBe(200)
    const ids = new Set(CONTENT.neighbors.map((n) => n.id))
    for (const t of TIP_LETTERS) {
      expect(ids.has(t.from), t.id).toBe(true)
      if (t.when) expect(TIP_WHEN[t.when], t.id).toBeDefined()
      expect(forbiddenIn(t.text), t.id).toBeNull()
      expect(t.text, t.id).not.toMatch(/당신/)
    }
  })
  it('이레에 두세 통', () => {
    for (let w = 0; w < 10; w++) {
      const n = Array.from({ length: 7 }, (_, i) => w * 7 + i + 1).filter(tipDay).length
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(3)
    }
  })
  it('이미 해 본 일(신을 산 뒤)은 그 편지를 건너뛰고, 받은 편지는 다시 오지 않으며 저장에 남는다', () => {
    const shoes = TIP_LETTERS.find((t) => t.when === 'noShoes')!
    const s = { ...base(), tips: TIP_LETTERS.slice(0, TIP_LETTERS.indexOf(shoes)).map((t) => t.id) }
    expect(nextTip(s)?.id).toBe(shoes.id)
    expect(nextTip({ ...s, inv: { ...s.inv, sturdyShoes: 1 } })?.id).not.toBe(shoes.id)
    const got = tipMorning({ ...s, clock: { day: 9, minute: 360 } })
    expect(got.tips?.at(-1)).toBe(shoes.id)
    expect(got.flags.tipNew).toBe(1)
    expect(nextTip(got)?.id).not.toBe(shoes.id)
    expect(deserialize(serialize(got), CONTENT)!.tips).toEqual(got.tips)
  })
  it('편지 오는 날 아침에 한 통이 온다', () => {
    let s = base()
    while (!tipDay(s.clock.day + 1)) s = { ...s, clock: { ...s.clock, day: s.clock.day + 1 } }
    const next = goToSleep(s, CONTENT)
    expect(next.tips?.length ?? 0).toBe((s.tips?.length ?? 0) + 1)
  })
})
