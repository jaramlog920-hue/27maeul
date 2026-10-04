// 그날의 날씨 그림 (계획 15 작업 2): 물웅덩이·살얼음·굴뚝 연기가 나오는 때
import { chimneySmoke, dayOf, icyMorning, puddlesOut, weatherOf } from './calendar'

const H = 60

describe('그날의 날씨 그림', () => {
  it('물웅덩이는 비 온 날 저녁부터 다음 날 낮까지', () => {
    const rainy = Array.from({ length: 160 }, (_, i) => i + 3).find((d) => weatherOf(d) === 'rain' && weatherOf(d - 1) !== 'rain' && weatherOf(d + 1) !== 'rain' && weatherOf(d + 2) !== 'rain')!
    expect(rainy).toBeDefined()
    expect(puddlesOut(rainy, 10 * H)).toBe(false) // 비가 오는 낮에는 아직
    expect(puddlesOut(rainy, 17 * H)).toBe(true)
    expect(puddlesOut(rainy + 1, 7 * H)).toBe(true)
    expect(puddlesOut(rainy + 1, 17 * H + 59)).toBe(true)
    expect(puddlesOut(rainy + 1, 18 * H)).toBe(false)
    expect(puddlesOut(rainy + 2, 10 * H)).toBe(false)
  })
  it('살얼음은 겨울 맑은 날 아침 6–9시에만', () => {
    const clear = Array.from({ length: 40 }, (_, i) => dayOf('winter', i + 1)).find((d) => weatherOf(d) === 'sunny')!
    const snowy = dayOf('winter', 2)
    expect(weatherOf(snowy)).toBe('snow')
    expect(icyMorning(clear, 6 * H)).toBe(true)
    expect(icyMorning(clear, 8 * H + 59)).toBe(true)
    expect(icyMorning(clear, 9 * H)).toBe(false)
    expect(icyMorning(clear, 5 * H)).toBe(false)
    expect(icyMorning(snowy, 7 * H)).toBe(false)
    const springClear = Array.from({ length: 40 }, (_, i) => dayOf('spring', i + 3)).find((d) => weatherOf(d) === 'sunny')!
    expect(icyMorning(springClear, 7 * H)).toBe(false)
  })
  it('굴뚝 연기는 겨울엔 깨어 있는 내내, 다른 계절엔 밥 짓는 때만', () => {
    const w = dayOf('winter', 5)
    const s = dayOf('summer', 5)
    expect(chimneySmoke(w, 12 * H)).toBe('winter')
    expect(chimneySmoke(w, 23 * H)).toBe('none')
    expect(chimneySmoke(s, 12 * H)).toBe('none')
    expect(chimneySmoke(s, 7 * H)).toBe('meal')
    expect(chimneySmoke(s, 18 * H)).toBe('meal')
  })
})
