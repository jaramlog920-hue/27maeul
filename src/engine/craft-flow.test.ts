import { CONTENT } from '../content/catalog'
import { canCraft, finishCraft, newGame, stockOf } from './game'
import { MAX_STACK, RECIPES, recipeGives, type RecipeId } from './items'
import { CHEST_STACK } from './easier'
import type { ItemId } from './types'
import { finishNow } from './minigame'
import { deserialize, serialize } from './save'
import { useGame } from '../store/game-store'

it.each(Object.keys(RECIPES) as RecipeId[])('%s 제작을 중단·완료·저장 복원해도 재료와 결과가 중복 처리되지 않는다', recipe => {
  const base = newGame(CONTENT), def = RECIPES[recipe]
  const state = { ...base, scenes: [], inv: { ...def.needs }, recipesKnown: [recipe],
    lettersDone: 30, shelved: { mk: 1 as const, lk: 1 as const } }
  useGame.getState().load(state)
  expect(canCraft(useGame.getState().game, recipe)).toBeNull()
  const before = useGame.getState().game
  useGame.getState().startCraft(recipe)
  useGame.getState().quitMini()
  expect(useGame.getState().game).toBe(before)
  useGame.getState().startCraft(recipe)
  const modal = useGame.getState().modal
  expect(modal?.kind).toBe('mini')
  if (modal?.kind !== 'mini') throw new Error('제작 손일이 열리지 않음')
  useGame.setState({ modal: { ...modal, state: finishNow(modal.state) } })
  useGame.getState().miniTap()
  const made = useGame.getState().game
  for (const [item] of Object.entries(def.needs)) expect(stockOf(made, item as keyof typeof state.inv)).toBe(0)
  for (const [item, n] of Object.entries(recipeGives(def, before.inv, before.flags)))
    expect(stockOf(made, item as keyof typeof state.inv)).toBeGreaterThanOrEqual(n!)
  useGame.getState().miniTap()
  expect(useGame.getState().game).toBe(made)
  const loaded = deserialize(serialize(made), CONTENT)!
  expect(loaded.inv).toEqual(made.inv)
  expect(loaded.chest).toEqual(made.chest)
})

it.each(Object.keys(RECIPES) as RecipeId[])('%s 궤짝 재료로 만들고 결과물을 궤짝에 보관하며, 양쪽이 차면 아무것도 차감하지 않는다', recipe => {
  const base = newGame(CONTENT), def = RECIPES[recipe]
  const output = Object.keys(def.gives)[0] as ItemId
  const state = { ...base, scenes: [], inv: { [output]: MAX_STACK }, chest: { ...def.needs },
    flags: { ...base.flags, 'unlock:supplyChest': 1 }, recipesKnown: [recipe],
    lettersDone: 30, shelved: { mk: 1 as const, lk: 1 as const } }
  expect(canCraft(state, recipe)).toBeNull()
  const made = finishCraft(state, recipe)
  expect(made.inv[output]).toBe(MAX_STACK)
  expect(made.chest[output]).toBeGreaterThanOrEqual(def.gives[output]!)
  for (const item of Object.keys(def.needs) as ItemId[]) expect(stockOf(made, item)).toBe(0)
  const full = { ...state, chest: { ...state.chest, [output]: CHEST_STACK } }
  expect(canCraft(full, recipe)).toBe('full')
  expect(finishCraft(full, recipe)).toBe(full)
})
