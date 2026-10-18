import { NEIGHBOR_LINES } from '../content/text'
import { CONTENT } from '../content/catalog'
import { todayDiary } from './daybook'
import { finishHelp, goToSleep, newGame, storyPropsNow } from './game'
import { deserialize, serialize } from './save'

describe('돕기 보상의 수첩과 하루 기록', () => {
  it('찻집 웬델을 도우면 빵 대신 차를 받고 기록에도 차가 남는다', () => {
    const def = CONTENT.neighbors.find(n => n.role === '웬델')!
    expect(def.id).toBe('poppy')
    expect(def.help.minigame).toBe('order')
    expect(NEIGHBOR_LINES[def.id].help.thanks).toContain('약초차')
    expect(NEIGHBOR_LINES[def.id].help.thanks).not.toContain('빵')
    const initial = { ...newGame(CONTENT), scenes: [] }
    const done = finishHelp(initial, def)
    expect(done.inv.bread).toBe(initial.inv.bread)
    expect(done.inv.herbTea).toBe(1)
    expect(done.notebook.got?.[def.id]).toEqual(['herbTea'])
    expect(todayDiary(done)?.gifts).toEqual([{ from: def.id, items: { herbTea: 1 } }])
  })
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
  it('파피의 빵을 지급하고 기록하며 중복 지급 없이 저장과 다음 날에 보존한다', () => {
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
