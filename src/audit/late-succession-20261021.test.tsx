import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { gameAtChapters } from '../engine/growth-test-support'
import { newGenState, type GenState } from '../engine/gen'
import { settleGen } from '../engine/gen-settle'
import { kidWorkers, ownerJob } from '../engine/kid-work'
import { emptyNewland, doorOf, type Build } from '../engine/newland-build'
import { serialize, deserialize } from '../engine/save'
import { useGame } from '../store/game-store'
import { FacilityView } from '../features/newland/FacilityView'

// LATE-001 (2026-10-21 다른 창 검사): 두 번째 세대교체 날 손주 일터의 일이 사라졌다.
// 같은 날 사용자 결정으로 은퇴·이어받기를 없애 — 아래는 고친 뒤의 동작을 확인한다 (은퇴가 생기지 않고 손주는 제 일을 지킨다)
function fixture(built = true) {
  const base = gameAtChapters(CONTENT, 260)
  const seed = newGenState(CONTENT, 17, 283)
  const gen: GenState = { ...seed, nextPerson: 4,
    persons: { ...seed.persons,
      'g-0001': { id:'g-0001', origin:'born', born:10, stage:'elder', name:'부모하나', parents:['rudy','poppy'], spouse:'g-0002', household:'h-2', look:'m' },
      'g-0002': { id:'g-0002', origin:'born', born:10, stage:'elder', name:'부모둘', parents:['wendell','tilly'], spouse:'g-0001', household:'h-2', look:'f' },
      'g-0003': { id:'g-0003', origin:'born', born:160, stage:'adult', name:'손주검사', parents:['g-0001','g-0002'], spouse:null, household:'h-2', look:'m' },
    },
    households: { 'h-2': { id:'h-2', members:['g-0001','g-0002'], children:['g-0003'], home:'rudy', lastBirth:160, since:130 } },
    retired: { rudy:{heir:'g-0001',day:134} },
    heirs: { rudy:{heir:'g-0003',since:244} },
  }
  const build: Build = { id:'b1',kind:'kidWork',owner:'g-0003',x:8,y:10,facing:'down',state:'done',orderedDay:250,paid:{coins:100,items:{}},refunded:false }
  return { ...base, clock:{day:283,minute:600}, gen, scenes:[],
    hearts:{...base.hearts,rudy:60},flags:{...base.flags,newlandGift:1,newlandRevealed:1},
    newland:{...emptyNewland(),nextId:2,builds:built?[build]:[]} }
}
const advance = (s: ReturnType<typeof fixture>) => settleGen({...s,clock:{day:284,minute:600}},CONTENT)
afterEach(cleanup)
void advance

it('LATE-001 고침: 하루 정산이 이어 가도 견습·은퇴가 새로 생기지 않고 손주 일터의 일은 그대로', () => {
  const start = fixture()
  let s = { ...start, gen: { ...start.gen, retired: {}, heirs: {} } }
  const job = ownerJob(s, 'g-0003')
  expect(job).not.toBeNull()
  for (let day = 284; day <= 330; day++) s = settleGen({ ...s, clock: { day, minute: 600 } }, CONTENT) as typeof s
  expect(Object.keys(s.gen.retired ?? {})).toHaveLength(0)
  expect(Object.keys(s.gen.heirs ?? {})).toHaveLength(0)
  expect(ownerJob(s, 'g-0003')).toBe(job)
  expect(kidWorkers(s as never).some((w) => w.resident?.id === 'g-0003')).toBe(true)
  expect(s.gen.log.some((l) => l.kind === 'retired' || l.kind === 'apprentice')).toBe(false)
})

it('LATE-001 고침: 예전 저장의 은퇴·견습 기록은 불러올 때 지워져 부모가 제 자리로 돌아온다', () => {
  const loaded = deserialize(serialize(fixture() as never), CONTENT)!
  expect(Object.keys(loaded.gen?.retired ?? {})).toHaveLength(0)
  expect(Object.keys(loaded.gen?.heirs ?? {})).toHaveLength(0)
  render(<FacilityView id="kidWork" />)
  void screen; void doorOf; void useGame
})
