import { coolDown, eat, exhausted, fallsSick, FRESH, sleepNeeds, tickNeeds, warmUp, work } from './needs'
import { barleyRipe, dayOf, festivalOf, grapesRipe, isMarketDay, seasonDay, weatherOf, yearOf } from './calendar'
import { SEASON_DAYS } from './clock'

const ctx = { indoor: true, season: 'spring' as const, phase: 'day' as const, warm: false, hasBlanket: false }

describe('needs', () => {
  it('14분마다 배고픔 1, 12분마다 피로 1', () => {
    const n = tickNeeds(FRESH, 120, ctx)
    expect(n.hunger).toBeCloseTo(10 + 120 / 14)
    expect(n.fatigue).toBeCloseTo(10)
  })
  it('겨울밤 바깥은 춥고, 화덕 옆은 곧 따뜻해진다', () => {
    const cold = tickNeeds(FRESH, 60, { ...ctx, indoor: false, season: 'winter', phase: 'night' })
    expect(cold.cold).toBeGreaterThan(40)
    expect(tickNeeds(cold, 30, { ...ctx, warm: true }).cold).toBe(0)
    expect(warmUp(cold).cold).toBe(0)
  })
  it('담요가 있으면 겨울밤 집 안의 추위가 절반', () => {
    const w = { ...ctx, season: 'winter' as const, phase: 'night' as const }
    const a = tickNeeds(FRESH, 100, w).cold
    const b = tickNeeds(FRESH, 100, { ...w, hasBlanket: true }).cold
    expect(b).toBeCloseTo(a / 2)
  })
  it('수치는 0~100 안에 머문다', () => {
    const n = tickNeeds(FRESH, 10000, ctx)
    expect(n.hunger).toBe(100)
    expect(eat({ ...FRESH, hunger: 20 }).hunger).toBe(0)
  })
  it('지치거나 굶은 채 잠들면 앓아눕는다', () => {
    expect(fallsSick({ hunger: 100, fatigue: 0, cold: 0, heat: 0 })).toBe(true)
    expect(fallsSick({ hunger: 99, fatigue: 99, cold: 0, heat: 0 })).toBe(false)
    expect(exhausted(work({ ...FRESH, fatigue: 98 }))).toBe(true)
  })
  it('새벽 1시 넘어 자면 피로가 덜 풀린다', () => {
    expect(sleepNeeds({ hunger: 50, fatigue: 90, cold: 10, heat: 0 }, 22 * 60).fatigue).toBe(0)
    expect(sleepNeeds({ hunger: 50, fatigue: 90, cold: 10, heat: 0 }, 25 * 60).fatigue).toBe(30)
  })
  it('평안인 날은 피로가 천천히 쌓인다', () => {
    const plain = tickNeeds({ ...FRESH }, 60, ctx).fatigue
    const calm = tickNeeds({ ...FRESH }, 60, { ...ctx, peace: true }).fatigue
    expect(plain).toBeCloseTo(5)
    expect(calm).toBeCloseTo(4)
  })
})

describe('더위', () => {
  const summerNoon = { indoor: false, season: 'summer' as const, phase: 'day' as const, warm: false, hasBlanket: false }
  it('여름 한낮 바깥에서 오르고, 뜨거운 날은 두 배', () => {
    expect(tickNeeds({ ...FRESH }, 60, summerNoon).heat).toBeCloseTo(18)
    expect(tickNeeds({ ...FRESH }, 60, { ...summerNoon, hot: true }).heat).toBeCloseTo(36)
  })
  it('집 안이나 다른 계절에는 식는다', () => {
    expect(tickNeeds({ ...FRESH, heat: 50 }, 30, { ...summerNoon, indoor: true }).heat).toBeCloseTo(20)
    expect(tickNeeds({ ...FRESH, heat: 50 }, 60, { ...summerNoon, season: 'spring' }).heat).toBeCloseTo(20)
  })
  it('물을 마시면 식고, 자고 나면 0', () => {
    expect(coolDown({ ...FRESH, heat: 80 }).heat).toBe(0)
    expect(sleepNeeds({ ...FRESH, heat: 80 }, 22 * 60).heat).toBe(0)
  })
})

describe('calendar', () => {
  it('날씨는 날짜로 정해지고, 처음 이틀은 맑다', () => {
    expect(weatherOf(1)).toBe('sunny')
    expect(weatherOf(2)).toBe('sunny')
    expect(weatherOf(40)).toBe(weatherOf(40))
  })
  it('계절에 맞지 않는 날씨는 없다', () => {
    for (let d = 1; d <= 320; d++) {
      const w = weatherOf(d)
      const s = Math.floor((d - 1) / SEASON_DAYS) % 4
      if (s !== 3) expect(w).not.toBe('snow')
      if (s !== 1) expect(w).not.toBe('hot')
    }
  })
  it('잔치 날은 언제나 맑다', () => {
    for (let d = 1; d <= 320; d++) if (festivalOf(d)) expect(weatherOf(d), String(d)).toBe('sunny')
  })
  it('가을에 비 오는 날이 있어 무지개를 볼 수 있다', () => {
    const autumn = Array.from({ length: SEASON_DAYS }, (_, i) => dayOf('autumn', i + 1))
    expect(autumn.some((d) => weatherOf(d) === 'rain')).toBe(true)
  })
  it('겨울 둘째 날은 첫눈', () => {
    expect(weatherOf(dayOf('winter', 2))).toBe('snow')
  })
  it('비 오는 날이 있다 (봄·가을)', () => {
    const days = Array.from({ length: 56 }, (_, i) => i + 1)
    expect(days.some((d) => weatherOf(d) === 'rain')).toBe(true)
  })
  it('장날·행사·거둘 때', () => {
    expect(isMarketDay(7)).toBe(true)
    expect(isMarketDay(8)).toBe(false)
    expect(festivalOf(dayOf('spring', 20))).toBe('blossom')
    expect(festivalOf(dayOf('summer', 25))).toBe('barley')
    expect(festivalOf(dayOf('autumn', 30))).toBe('grapes')
    expect(festivalOf(dayOf('winter', 20))).toBe('hearth')
    expect(festivalOf(1)).toBeNull()
    expect(barleyRipe(dayOf('summer', 15))).toBe(true)
    expect(barleyRipe(dayOf('summer', 14))).toBe(false)
    expect(grapesRipe(dayOf('summer', 32))).toBe(true)
    expect(grapesRipe(3)).toBe(false)
    expect(seasonDay(SEASON_DAYS + 1)).toBe(1)
    expect(yearOf(SEASON_DAYS * 4)).toBe(1)
    expect(yearOf(SEASON_DAYS * 4 + 1)).toBe(2)
  })
})
