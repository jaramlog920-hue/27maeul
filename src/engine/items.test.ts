import { add, craft, has, MAX_STACK, RECIPES, take, count } from './items'
import { cursorOf, isDone, startMini, stepMini, tapMini, TIMING_PERIOD, MASH_GAIN, PICK_NEED, progressOf } from './minigame'

describe('items', () => {
  it('넣고 빼기', () => {
    let inv = add({}, { water: 2 })
    expect(count(inv, 'water')).toBe(2)
    expect(has(inv, { water: 2 })).toBe(true)
    expect(has(inv, { water: 3 })).toBe(false)
    inv = take(inv, { water: 2 })!
    expect(inv).toEqual({})
    expect(take(inv, { water: 1 })).toBeNull()
  })
  it('최대 9개, 도구는 1개', () => {
    expect(count(add({ reed: 8 }, { reed: 5 }), 'reed')).toBe(MAX_STACK)
    expect(count(add({ goodPen: 1 }, { goodPen: 1 }), 'goodPen')).toBe(1)
  })
  it('빵: 보리 하나와 물 하나로 두 개', () => {
    expect(craft({ barley: 1, water: 1 }, RECIPES.bread)).toEqual({ bread: 2 })
    expect(craft({ barley: 1 }, RECIPES.bread)).toBeNull()
  })
  it('좋은 펜이 있으면 잉크가 두 병', () => {
    expect(craft({ soot: 1, water: 1 }, RECIPES.ink)).toEqual({ ink: 1 })
    expect(craft({ soot: 1, water: 1, goodPen: 1 }, RECIPES.ink)).toEqual({ ink: 2, goodPen: 1 })
  })
})

describe('minigame', () => {
  const r = () => 0.5
  it('연타는 줄어들지만 계속 누르면 끝난다', () => {
    let s = startMini('mash', r)
    s = tapMini(s)
    expect(progressOf(s)).toBeCloseTo(MASH_GAIN)
    s = stepMini(s, 1, r)
    expect(progressOf(s)).toBeLessThan(MASH_GAIN)
    for (let i = 0; i < 20; i++) s = tapMini(s)
    expect(isDone(s)).toBe(true)
  })
  it('타이밍: 구간 안에서 세 번', () => {
    let s = startMini('timing', r)
    if (s.kind !== 'timing') throw new Error()
    const [a, b] = s.zone
    const mid = (a + b) / 2
    // 커서가 mid에 오는 시각
    const tHit = (mid / 2) * TIMING_PERIOD
    s = stepMini(s, tHit, r)
    expect(cursorOf((s as { t: number }).t)).toBeCloseTo(mid)
    s = tapMini(s)
    expect(s.kind === 'timing' && s.flash).toBe('hit')
    s = stepMini(s, 0.35 * TIMING_PERIOD, r) // 구간 밖
    s = tapMini(s)
    expect(s.kind === 'timing' && s.flash).toBe('miss')
    expect(s.kind === 'timing' && s.hits).toBe(1)
    s = stepMini(s, TIMING_PERIOD - 0.35 * TIMING_PERIOD, r)
    s = tapMini(s)
    s = stepMini(s, TIMING_PERIOD, r)
    s = tapMini(s)
    expect(isDone(s)).toBe(true)
  })
  it('줍기: 나타난 것을 눌러 다섯 개', () => {
    let s = startMini('pick', r)
    let guard = 0
    while (!isDone(s) && guard++ < 200) {
      s = stepMini(s, 0.2, r)
      if (s.kind === 'pick' && s.items[0]) s = tapMini(s, s.items[0].id)
    }
    expect(isDone(s)).toBe(true)
    expect(s.kind === 'pick' && s.got).toBe(PICK_NEED)
  })
  it('없는 것을 누르면 그대로', () => {
    const s = startMini('pick', r)
    expect(tapMini(s, 999)).toBe(s)
  })
})

describe('만들기 한도 (리뷰 3차)', () => {
  it('기름틀 손잡이 보너스가 만들기 결과에 들어간다', () => {
    const inv = { olive: 2, water: 1 }
    const out = craft(inv, RECIPES.oil, { 'unlock:pressHandle': 1 })
    expect(out && count(out, 'oil')).toBe(2)
  })
  it('선물로 한도를 넘은 수는 더해도 줄지 않는다', () => {
    expect(count(add({ bread: MAX_STACK + 3 }, { bread: 1 }), 'bread')).toBe(MAX_STACK + 3)
  })
})
