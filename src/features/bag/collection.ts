import { neighborById } from '../../content/catalog'
import { ITEM_TEXT, itemList, T } from '../../content/text'
import { foundItems } from '../../engine/achievements'
import { BOOK_DESIGNS, withBookDesigns, type BookDesign } from '../../engine/binding'
import { cookOf, DISHES, NEW_DISHES, knownDish } from '../../engine/cooking'
import type { GameState } from '../../engine/game'
import { RECIPES } from '../../engine/items'
import { FURNITURE_DEFS } from '../../engine/furniture-defs'
import { SKILL_DEFS, SKILL_IDS } from '../../engine/skill-defs'
import type { ItemId } from '../../engine/types'
import { t } from '../../shared/i18n'

export const COLLECTION_CATEGORIES = ['furniture', 'books', 'recipes', 'items'] as const
export const BOOK_DESIGN_GROUPS: readonly BookDesign['kind'][] = ['deco', 'book', 'color', 'pattern', 'detail']
export type CollectionCategory = typeof COLLECTION_CATEGORIES[number]
export interface CollectionEntry {
  id: string
  category: CollectionCategory
  name: string
  desc: string
  hint: string
  known: boolean
  art: { item: ItemId } | { design: BookDesign }
}

function designName(d: BookDesign): string {
  if (d.kind === 'book') return t('dex.bookCover', { book: (T.quiz.books as Record<string, string>)[d.book] })
  if (d.kind === 'detail') return t(`bindDetail.${d.value}`)
  const labels = { color: T.binding.colors, pattern: T.binding.patterns, deco: T.binding.decos }
  return (labels[d.kind] as Record<string, string>)[d.value]
}
const teachers = (ids: readonly string[]) => ids.map(id => neighborById(id)?.role ?? id).join(' · ')
const ingredients = (needs: Partial<Record<ItemId, number>>) => t('dex.ingredients', { items: itemList(needs) })

/** 게임의 실제 물건·제본 선택지·제작법을 그대로 읽어 목록과 획득 여부를 만든다. */
export function collectionEntries(game: GameState): CollectionEntry[] {
  const found = new Set(foundItems(game))
  const designs = new Set(withBookDesigns(game.bookDesigns ?? [], game.bound, game.shelved))
  const cooking = cookOf(game)
  return [
    ...(Object.entries(ITEM_TEXT) as [ItemId, { name: string; desc: string }][]).map(([item, text]) => ({
      id: `item:${item}`, category: FURNITURE_DEFS[item] ? 'furniture' as const : 'items' as const,
      ...text, hint: t('dex.itemHint'), known: found.has(item), art: { item },
    })),
    ...BOOK_DESIGNS.map(design => ({
      id: `design:${design.id}`, category: 'books' as const, name: designName(design),
      desc: t(`dex.designKinds.${design.kind}`), hint: t(design.kind === 'book' ? 'dex.plainHint' : 'dex.designHint'),
      known: designs.has(design.id), art: { design },
    })),
    ...Object.values(RECIPES).map(recipe => ({
      id: `recipe:${recipe.id}`, category: 'recipes' as const, name: (T.recipes as Record<string, string>)[recipe.id],
      desc: ingredients(recipe.needs), hint: t('dex.craftHint', { place: t(`dex.places.${recipe.at}`) }),
      known: game.recipesKnown.includes(recipe.id), art: { item: Object.keys(recipe.gives)[0] as ItemId },
    })),
    ...NEW_DISHES.map(id => ({
      id: `dish:${id}`, category: 'recipes' as const, name: t('dex.dishRecipe', { name: ITEM_TEXT[DISHES[id].item].name }),
      desc: ingredients(DISHES[id].needs),
      hint: DISHES[id].teachers.length ? t('dex.learnHint', { who: teachers(DISHES[id].teachers) }) : t('dex.craftHint', { place: T.skill.places.hearth }),
      known: knownDish(game, id) || (cooking.made[id] ?? 0) > 0, art: { item: DISHES[id].item },
    })),
    ...SKILL_IDS.map(id => ({
      id: `skill:${id}`, category: 'recipes' as const, name: (T.skill.lessons as Record<string, { name: string }>)[id].name,
      desc: SKILL_DEFS[id].needs ? ingredients(SKILL_DEFS[id].needs!) : t('dex.skillDescription'),
      hint: t('dex.learnHint', { who: teachers(SKILL_DEFS[id].teachers) }),
      known: !!game.skills?.[id], art: { item: SKILL_DEFS[id].item },
    })),
  ]
}
