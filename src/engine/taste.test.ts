import { CONTENT, PEOPLE } from '../content/catalog'
import { describe, expect, it } from 'vitest'
import { deserialize, serialize } from './save'
import { newGame } from './game'
import { knownLifestyleTastes, NO_NOTEBOOK, noteTaste, noteObservedTaste, noteExperienceTastes, sanitizeNotebook, sharedMemories, canProposeTea, noteTasteProposal } from './notebook'
import { scheduleAppt } from './plans'
import { NO_LIFE, type Experience } from './people'

describe('생활 취향과 함께한 기억', () => {
  it('친구·발견·함께한 경험 뒤에 제안하고 거절 뒤 간격을 둔다', () => {
    const n = noteTaste(NO_NOTEBOOK, 'carpenter', 'activity.tea')
    expect(canProposeTea(n, 'carpenter', 3, 100, false)).toBe(false)
    expect(canProposeTea(n, 'carpenter', 3, 0, true)).toBe(false)
    expect(canProposeTea(n, 'carpenter', 3, 100, true)).toBe(true)
    const game = newGame(CONTENT)
    const deferred = { ...game, notebook: noteTasteProposal(n, 'carpenter', 3) }
    expect(deferred.hearts).toEqual(game.hearts)
    expect(deferred.inv).toEqual(game.inv)
    expect(canProposeTea(deferred.notebook, 'carpenter', 9, 100, true)).toBe(false)
    expect(canProposeTea(deferred.notebook, 'carpenter', 10, 100, true)).toBe(true)
    const ready = { ...game, flags: { ...game.flags, villageLevel: 10, ...Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1])) }, life: { ...game.life, seen: Object.values(PEOPLE.people).flatMap((p) => (p.events ?? []).map((e) => e.id)) } }
    const result = scheduleAppt(ready, { kind: 'event', activity: 'tea', day: 2, from: 840, to: 900, place: 'teaTable', members: ['carpenter'] }, CONTENT)
    expect(result.appt).toBeDefined()
    expect(result.state.plans?.appts).toContain(result.appt)
  })
  it('발견 전에는 모르며 직접 들은 취향만 열린다', () => {
    expect(knownLifestyleTastes(NO_NOTEBOOK, 'poppy')).toEqual([])
    const n = noteTaste(NO_NOTEBOOK, 'poppy', 'activity.tea')
    expect(knownLifestyleTastes(n, 'poppy')).toEqual(['차를 함께 마시는 것을 좋아함'])
    expect(noteTaste(n, 'poppy', 'activity.tea')).toBe(n)
    expect(noteTaste(n, 'poppy', 'unknown-internal-id')).toBe(n)
  })
  it('관찰한 직업 행동을 좋아한다고 단정하지 않는다', () => {
    expect(noteObservedTaste(NO_NOTEBOOK, 'carpenter', 'wood')).toBe(NO_NOTEBOOK)
    expect(knownLifestyleTastes(noteObservedTaste(NO_NOTEBOOK, 'basil', 'tea'), 'basil')).toEqual(['차를 마시며 쉬는 모습을 봄'])
    expect(noteObservedTaste(NO_NOTEBOOK, 'poppy', 'tea', { tea: 1 }).tastes?.poppy).toEqual(['activity.tea'])
  })
  it('실제 함께한 사람의 명시된 발견만 기록한다', () => {
    const n = noteExperienceTastes(NO_NOTEBOOK, { with: ['poppy'] }, { poppy: 'activity.tea', basil: 'activity.tea' })
    expect(n.tastes?.poppy).toEqual(['activity.tea'])
    expect(n.tastes?.basil).toBeUndefined()
    expect(noteExperienceTastes(NO_NOTEBOOK, { with: ['poppy'] })).toBe(NO_NOTEBOOK)
  })
  it('저장·재접속에도 발견을 보존하고 잘못된 키는 버린다', () => {
    const game = { ...newGame(CONTENT), notebook: noteTaste(NO_NOTEBOOK, 'poppy', 'activity.tea') }
    expect(deserialize(serialize(game), CONTENT)?.notebook?.tastes?.poppy).toEqual(['activity.tea'])
    expect(sanitizeNotebook({ tastes: { poppy: ['activity.tea', 'bad', 'activity.tea'] } }).tastes?.poppy).toEqual(['activity.tea'])
  })
  it('가족·동물 기록을 나누고 날짜를 지어내지 않는다', () => {
    const e: Experience = { id: 'legacy', kind: 'story', with: ['poppy'], first: null, last: null, count: 1 }
    const list = sharedMemories({ ...NO_LIFE, experiences: { legacy: e, pet: { ...e, id: 'pet', kind: 'pet' }, other: { ...e, id: 'other', with: ['basil'] } } }, 'poppy')
    expect(list).toEqual([e])
    expect(list[0].first).toBeNull()
  })
})
