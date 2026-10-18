// 집에 둔 동물의 놀이 소품. 수면용 깔개는 설치하지 않으면 나타나지 않는다.
import { adopt, petCornerProp, petHabit, petHomeGoal, petSpotSafe, type Companion } from './companion'
import { dayOf } from './calendar'
import { isHome, PET_HOME } from './world'

const base = (kind: 'cat' | 'dog', ways: Companion['ways']): Companion => ({ ...adopt(kind, '나비', 1, { x: PET_HOME.x, y: PET_HOME.y }), ways, stay: true })
const placed = (c: Companion, spot: 'blanket' | 'toy' | 'door'): Companion => {
  const t = petHomeGoal(c, new Set(), spot)
  return { ...c, x: t.x, y: t.y, path: [], motion: undefined }
}
const day = dayOf('spring', 4)

describe('집에 둔 동물 곁 소품', () => {
  it('낮잠일 때는 깔개를 자동 생성하지 않고, 활발한 낮 놀이에는 장난감만 둔다', () => {
    for (const kind of ['dog','cat'] as const) {
      const calm = placed(base(kind, { curious: 0, distance: 1, energy: 0 }), 'blanket')
      expect(petHabit(calm, day, 10 * 60, 'rain').spot).toBe('blanket')
      expect(petCornerProp(calm, day, 10 * 60, 'rain')).toBeNull()
    }
    const lively = placed(base('cat', { curious: 2, distance: 1, energy: 2 }), 'toy')
    expect(petHabit(lively, day, 10 * 60, 'sunny').spot).toBe('toy')
    expect(petCornerProp(lively, day, 10 * 60, 'sunny')?.art).toBe('petToy')
  })

  it('동물이 서 있는 안전한 집 안 칸에만 놓이고, 그 칸이 길·문을 막지 않는다', () => {
    for (const [ways, minute, weather] of [[{ curious: 2, distance: 0, energy: 2 }, 10 * 60, 'rain'], [{ curious: 2, distance: 2, energy: 2 }, 10 * 60, 'sunny']] as const) {
      const c = placed(base('dog', ways), ways.energy === 2 ? 'toy' : 'blanket')
      const p = petCornerProp(c, day, minute, weather)
      expect(p).not.toBeNull()
      expect(isHome(p!.at)).toBe(true)
      expect(petSpotSafe(p!.at)).toBe(true)
      expect(p!.at).toEqual({ x: Math.round(c.x), y: Math.round(c.y) })
    }
  })

  it('따라다니는 중·걷는 중·명령 중·창가/화덕 자리에서는 없다', () => {
    const c = placed(base('cat', { curious: 0, distance: 1, energy: 0 }), 'blanket')
    expect(petCornerProp({ ...c, stay: false }, day, 10 * 60, 'rain')).toBeNull()
    expect(petCornerProp({ ...c, path: [{ x: c.x + 1, y: c.y }] }, day, 10 * 60, 'rain')).toBeNull()
    expect(petCornerProp({ ...c, motion: { action: 'play', left: 1 } }, day, 10 * 60, 'rain')).toBeNull()
    expect(petCornerProp(c, dayOf('winter', 3), 16 * 60, 'sunny')).toBeNull()
  })

  it('집 밖에 있으면 없다', () => {
    const c = placed(base('cat', { curious: 0, distance: 1, energy: 0 }), 'blanket')
    expect(petCornerProp({ ...c, x: 3, y: 3 }, day, 10 * 60, 'rain')).toBeNull()
  })
})
