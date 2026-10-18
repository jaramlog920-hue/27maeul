import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { gameAtChapters, legacyGame } from './growth-test-support'
import { BAKER_BABY_ID, newGenState } from './gen'
import { settleGen, setGenOn, setResidentAging } from './gen-settle'
import { deserialize, serialize } from './save'
import { companionsOf } from './gen-looks'

const restore = (s: ReturnType<typeof newGame>) => deserialize(serialize(s), CONTENT)!
function morning(s: ReturnType<typeof newGame>, day: number) {
  return settleGen({ ...s, clock: { ...s.clock, day } }, CONTENT)
}
function family() {
  const s = newGame(CONTENT)
  return { ...s, gen: newGenState(CONTENT, 7, 1) }
}

it('75장 전에는 성인에서 멈추고 해금 이후의 160일만 세며 저장과 그림에도 유지된다', () => {
  let s = morning(family(), 400)
  expect(s.gen!.persons[BAKER_BABY_ID].stage).toBe('adult')
  expect(setResidentAging(s, true)).toBe(s)
  s = restore(s)
  expect(companionsOf(s.gen, 'baker', 400)[0].person.stage).toBe('adult')
  s = { ...s, progress: gameAtChapters(CONTENT, 75).progress }
  for (let d = 401; d <= 559; d++) s = morning(s, d)
  expect(restore(s).gen!.persons[BAKER_BABY_ID].stage).toBe('adult')
  s = morning(restore(s), 560)
  expect(s.gen!.persons[BAKER_BABY_ID].stage).toBe('elder')
  expect(restore(s).gen!.persons[BAKER_BABY_ID].stage).toBe('elder')
})

it('나이 그대로 기간은 빵집 아이와 생성 주민 모두 제외하고 이미 든 나이는 유지한다', () => {
  let s = legacyGame(CONTENT)
  const gen = newGenState(CONTENT, 7, 100)
  s = { ...s, clock: { day: 100, minute: 600 }, gen: { ...gen, persons: { ...gen.persons,
    'g-0001': { id: 'g-0001', origin: 'born', born: 8, stage: 'adult', parents: [], spouse: null, household: null } } } }
  s = setResidentAging(s, false)
  for (let d = 101; d <= 400; d++) s = morning(s, d)
  s = restore(s)
  for (const id of [BAKER_BABY_ID, 'g-0001']) expect(s.gen!.persons[id].stage).toBe('adult')
  s = setResidentAging(s, true)
  for (let d = 401; d <= 551; d++) s = morning(s, d)
  for (const id of [BAKER_BABY_ID, 'g-0001']) expect(s.gen!.persons[id].stage).toBe('adult')
  s = morning(s, 552)
  for (const id of [BAKER_BABY_ID, 'g-0001']) expect(s.gen!.persons[id].stage).toBe('elder')
})

it('자율생활을 껐다가 켜도 멈춘 기간을 노년 나이에 합산하지 않는다', () => {
  let s = legacyGame(CONTENT)
  s = { ...s, clock: { day: 100, minute: 600 }, gen: newGenState(CONTENT, 7, 100) }
  s = setGenOn(s, false)
  s = restore(morning(s, 400))
  expect(s.gen!.persons[BAKER_BABY_ID].stage).toBe('adult')
  s = setGenOn(s, true)
  expect(morning(s, 401).gen!.persons[BAKER_BABY_ID].stage).toBe('adult')
})

it('나이 그대로인 동안 견습 은퇴 시계도 멈추고 다시 켜자마자 부모가 은퇴하지 않는다', () => {
  let s = legacyGame(CONTENT)
  const gen = newGenState(CONTENT, 7, 100)
  s = { ...s, clock: { day: 100, minute: 600 }, gen: { ...gen, heirs: { baker: { heir: BAKER_BABY_ID, since: 92 } } } }
  s = setResidentAging(s, false)
  for (let d = 101; d <= 400; d++) s = morning(s, d)
  s = setResidentAging(restore(s), true)
  for (let d = 401; d <= 431; d++) s = morning(s, d)
  expect(s.gen!.retired?.baker).toBeUndefined()
  s = morning(s, 432)
  expect(s.gen!.retired?.baker?.heir).toBe(BAKER_BABY_ID)
})
