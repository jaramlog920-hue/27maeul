import { CONTENT } from '../content/catalog'
import { goToSleep } from '../engine/game'
import { allShelved } from '../engine/library'
import { canAttendAppt } from '../engine/plans'
import { deserialize, serialize } from '../engine/save'
import { controlsPlaytest } from './controls-playtest'

it('가방·잔치 시험 칸은 저장을 복원한 뒤에도 27권을 유지하고, 자면 잔치가 열린다', async () => {
  for (const test of ['yard', 'feast']) {
    const { game } = await controlsPlaytest(CONTENT, test)
    const restored = deserialize(serialize(game), CONTENT)!
    expect(allShelved(restored)).toBe(true)
    const morning = goToSleep({ ...restored, clock: { ...restored.clock, minute: 1320 } }, CONTENT)
    expect(morning.scenes).toContain('allFeast')
  }
})

it('차 시험 칸은 두 장소에서 실제 함께할 수 있고, 세 입맛의 이웃이 모두 존재한다', async () => {
  for (const test of ['tea-hall', 'tea-cafe']) {
    const { game } = await controlsPlaytest(CONTENT, test)
    const restored = deserialize(serialize(game), CONTENT)!
    expect(canAttendAppt(restored, 'appt:1')).toBe(true)
    for (const id of restored.plans.appts[0].members) expect(CONTENT.neighbors.some(n => n.id === id)).toBe(true)
    expect(restored.plans.appts[0].members).toHaveLength(3)
  }
})
