import { CONTENT } from '../content/catalog'
import { todayDiary } from './daybook'
import { finishHelp, goToSleep, newGame, storyPropsNow } from './game'
import { deserialize, serialize } from './save'

describe('돕기 보상의 수첩과 하루 기록', () => {
  it.each(['baker', 'wendell'])('%s의 일반 돕기는 집 옆 빵 소품을 만들지 않는다', id => {
    const def = CONTENT.neighbors.find(n => n.id === id)!
    const initial = { ...newGame(CONTENT), scenes: [] }
    const props = storyPropsNow(initial)
    const done = finishHelp(initial, def)
    expect(storyPropsNow(done)).toEqual(props)
    expect(done.room).toEqual(initial.room)
    expect(done.life.experiences).toEqual(initial.life.experiences)
    expect(storyPropsNow(deserialize(serialize(done), CONTENT)!)).toEqual(props)
  })
  it('웬델의 빵을 지급하고 기록하며 중복 지급 없이 저장과 다음 날에 보존한다', () => {
    const def = CONTENT.neighbors.find(n => n.id === 'wendell')!
    const initial = { ...newGame(CONTENT), scenes: [] }
    const done = finishHelp(initial, def)
    expect(done.inv.bread).toBe(3)
    expect(done.notebook.got?.wendell).toEqual(['bread'])
    expect(todayDiary(done)?.gifts).toEqual([{ from: 'wendell', items: { bread: 1 } }])
    expect(finishHelp(done, def)).toBe(done)
    const restored = deserialize(serialize(done), CONTENT)!
    expect(restored.notebook.got?.wendell).toEqual(['bread'])
    expect(todayDiary(restored)?.gifts).toEqual([{ from: 'wendell', items: { bread: 1 } }])
    const morning = goToSleep(restored, CONTENT)
    expect(morning.notebook.got?.wendell).toEqual(['bread'])
    expect(todayDiary(morning)?.gifts ?? []).toEqual([])
  })
})
