import { CONTENT } from '../../content/catalog'
import { ITEM_TEXT } from '../../content/text'
import { recordProgress, newGame } from '../../engine/game'
import { BOOK_DESIGNS } from '../../engine/binding'
import { RECIPES } from '../../engine/items'
import { FURNITURE_DEFS } from '../../engine/furniture-defs'
import { NEW_DISHES, NO_COOKING } from '../../engine/cooking'
import { SKILL_IDS } from '../../engine/skill-defs'
import { collectionEntries } from './collection'
import '../../render/dish-icons'
import { ICONS } from '../../render/sprites'
import { FURNITURE_ART } from '../../render/furniture-art'

describe('획득 도감 목록', () => {
  it('실제 물건·모든 제본 요소·제작법·요리법·생활 기술을 겹치지 않게 싣는다', () => {
    const entries = collectionEntries(newGame(CONTENT))
    expect(new Set(entries.map(e => e.id)).size).toBe(entries.length)
    expect(entries.filter(e => e.category === 'furniture')).toHaveLength(Object.keys(FURNITURE_DEFS).length)
    expect(entries.filter(e => e.category === 'books')).toHaveLength(BOOK_DESIGNS.length)
    expect(entries.filter(e => e.category === 'recipes')).toHaveLength(Object.keys(RECIPES).length + NEW_DISHES.length + SKILL_IDS.length)
    expect(entries.filter(e => e.id.startsWith('item:'))).toHaveLength(Object.keys(ITEM_TEXT).length)
    for (const entry of entries) expect(entry.name && entry.desc && entry.hint).toBeTruthy()
    for (const entry of entries) if ('item' in entry.art) {
      const rows = FURNITURE_ART[entry.art.item]?.rows ?? ICONS[entry.art.item]
      expect(rows?.some(row => /[^.]/.test(row)), entry.id).toBe(true)
    }
  })

  it('설치한 가구·다른 지도 방·찬장·이미 먹은 음식도 획득했고 보유하지 않은 물건은 숨긴다', () => {
    const game = { ...newGame(CONTENT), inv: {}, chest: {}, pantry: { honey: 1 }, found: ['shell' as const],
      room: [{ item: 'rug' as const, x: 20, y: 112 }], rooms: { 'newland:b1': [{ item: 'chair' as const, x: 1, y: 1 }] },
      cooking: { ...NO_COOKING, made: { herbTea: 1 } } }
    const entries = collectionEntries(game)
    for (const id of ['rug', 'chair', 'honey', 'herbTea', 'shell']) expect(entries.find(e => e.id === `item:${id}`)?.known).toBe(true)
    expect(entries.find(e => e.id === 'item:goldLeaf')?.known).toBe(false)
    const recorded = recordProgress(game).state
    expect(recorded.found).toEqual(expect.arrayContaining(['rug', 'chair', 'honey', 'herbTea', 'shell']))
  })

  it('구입한 완성품만으로는 제작법을 얻지 않고, 만들거나 배우면 레시피가 열린다', () => {
    const game = { ...newGame(CONTENT), inv: { papyrus: 1 }, recipesKnown: ['ink' as const],
      cooking: { ...NO_COOKING, learned: { herbTea: { day: 1, from: 'poppy' } } },
      skills: { carpenterFinish: { day: 1, from: 'carpenter', picked: 'warm' } } }
    const entries = collectionEntries(game)
    expect(entries.find(e => e.id === 'recipe:papyrus')?.known).toBe(false)
    for (const id of ['recipe:ink', 'dish:herbTea', 'skill:carpenterFinish', 'dish:beanDish']) expect(entries.find(e => e.id === id)?.known).toBe(true)
    expect(entries.find(e => e.id === 'dish:honeyBread')?.known).toBe(false)
  })
})
