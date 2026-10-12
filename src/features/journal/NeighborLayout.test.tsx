import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { CONTENT, neighborById } from '../../content/catalog'
import { DREAMS, dreamKey, visitDream } from '../../engine/newland-life'
import type { Build } from '../../engine/newland-build'
import { askRequest, fulfillRequest, goToSleep, newGame } from '../../engine/game'
import { REQUESTS } from '../../engine/bonds'
import { todayDiary } from '../../engine/daybook'
import { deserialize, serialize } from '../../engine/save'
import { itemName } from '../../content/text'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { Journal } from './Journal'

beforeEach(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterEach(() => vi.restoreAllMocks())

it.each(DREAMS)('%j 꿈터 선물은 다음 날 수첩에도 남고 재지급해도 종류가 중복되지 않는다', ({ npc, build: kind }) => {
  const base = newGame(CONTENT)
  const build: Build = { id: 'b1', kind, x: 10, y: 12, facing: 'down', state: 'done',
    orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
  const gifts = neighborById(npc)!.help.gives
  const state = { ...base, scenes: [], clock: { day: 33, minute: 600 },
    flags: { ...base.flags, villageLevel: 27, [`movedIn:${neighborById(npc)!.family ?? npc}`]: 1,
      [dreamKey('dreamOpen', npc)]: 30, [dreamKey('dreamPick', npc)]: 1 },
    notebook: { ...base.notebook, met: [npc], got: { [npc]: ['bread' as ItemId] } },
    newland: { builds: [build], tiles: {}, nextId: 2, settledDay: 30 } }
  const out = visitDream(state, gifts, npc)!
  const expected = ['bread', ...Object.keys(gifts)]
  expect(out.state.notebook.got?.[npc]).toEqual(expected)
  const saved = deserialize(serialize(out.state), CONTENT)!
  expect(visitDream(saved, gifts, npc)!.state.notebook.got?.[npc]).toEqual(expected)
  const morning = deserialize(serialize(goToSleep(saved, CONTENT)), CONTENT)!
  expect(morning.dayLog.gifts).toEqual([])
  expect(morning.notebook.got?.[npc]).toEqual(expected)
  const later = visitDream({ ...morning, clock: { ...morning.clock, day: 40 } }, gifts, npc)!
  expect(later.gift).toEqual(gifts)
  expect(later.state.notebook.got?.[npc]).toEqual(expected)
  useGame.getState().load(morning)
  const { container } = render(<Journal />)
  fireEvent.click(screen.getByRole('tab', { name: '이웃 수첩' }))
  fireEvent.click(container.querySelector('.nb-head')!)
  const label = [...container.querySelectorAll('.nb-page dt')].find(dt => dt.textContent === '받은 선물')!
  for (const item of expected) expect(label.nextElementSibling).toHaveTextContent(itemName(item as ItemId))
})

it.each(['baker:1', 'smith:1'])('%s 부탁 보답이 일기와 수첩 화면에 남고 다음 날에도 수첩에서 보인다', id => {
  const r = REQUESTS.find(r => r.id === id)!
  const base = newGame(CONTENT)
  base.flags['growth:smallRequest'] = 1
  base.progress.mt.completed = [1, 2, 3, 4, 5]
  const asked = askRequest({ ...base, scenes: [], hearts: { [r.npc]: 40 }, inv: { ...r.needs },
    notebook: { ...base.notebook, met: [r.npc] } }, r.npc)
  const out = fulfillRequest(asked, r.npc)!
  expect(todayDiary(out)?.gifts).toEqual([{ from: r.npc, items: r.reward }])
  const saved = deserialize(serialize(out), CONTENT)!
  expect(saved.notebook.got?.[r.npc]).toEqual(Object.keys(r.reward))
  expect(fulfillRequest(saved, r.npc)).toBeNull()
  const morning = deserialize(serialize(goToSleep(saved, CONTENT)), CONTENT)!
  expect(morning.dayLog.gifts).toEqual([])
  useGame.getState().load(morning)
  const { container } = render(<Journal />)
  fireEvent.click(screen.getByRole('tab', { name: '이웃 수첩' }))
  fireEvent.click(container.querySelector('.nb-head')!)
  const page = container.querySelector('.nb-page')!
  const gifts = [...page.querySelectorAll('dt')].find(dt => dt.textContent === '받은 선물')!
  for (const item of Object.keys(r.reward)) expect(gifts.nextElementSibling).toHaveTextContent(itemName(item as ItemId))
})

it('keeps gifts paired with their label and removes shared memories from the notebook', () => {
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, notebook: { ...base.notebook, met: ['baker'], got: { baker: ['bread'] } } })
  const { container } = render(<Journal tab="neighbors" neighbor="baker" />)
  const page = container.querySelector('.nb-page')!
  expect(page).toHaveTextContent('호감도')
  expect(page).not.toHaveTextContent('함께한 기억')
  const gifts = [...page.querySelectorAll('dt')].find(dt => dt.textContent === '받은 선물')!
  expect(gifts.nextElementSibling?.tagName).toBe('DD')
  expect(gifts.nextElementSibling).toHaveTextContent('빵')
  const children = [...page.children]
  expect(children.every((child, i) => child.tagName === (i % 2 === 0 ? 'DT' : 'DD'))).toBe(true)
  expect(screen.queryByText('함께한 기억')).toBeNull()
})
