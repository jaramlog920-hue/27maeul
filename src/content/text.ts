// 게임이 지어낸 문장의 단일 입구 (exclusion-list §0). 성경 문장은 여기 두지 않는다.
import lifeText from './life-text.json'
import type { ItemId } from '../engine/types'

export interface Line {
  speaker: string
  text: string
}

export interface NeighborLines {
  offer: Line[]
  idle: Line[]
  warm: Line[]
  /** 마음 7 이상 */
  close: Line[]
  wet: Line[]
  /** 아침에 들렀을 때 */
  visit: Line[]
  help: { label: string; thanks: string }
  helpSeason?: { label: string; thanks: string }
  lesson?: string
  giftLiked: string
  giftPlain: string
}

export interface Scene {
  title: string
  lines: Line[]
  album?: string
}

export const T = lifeText
export const NEIGHBOR_LINES = lifeText.neighbors as Record<string, NeighborLines>
export const SCENES = lifeText.scenes as Record<string, Scene>
export const ITEM_TEXT = lifeText.items as Record<ItemId, { name: string; desc: string }>
export const JOURNAL_NOTES = lifeText.journal.notes as Record<string, string>

/** 앨범에 남는 장면 id */
export const ALBUM_IDS: readonly string[] = Object.entries(SCENES)
  .filter(([, s]) => s.album)
  .map(([id]) => id)

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

export function itemName(id: ItemId): string {
  return ITEM_TEXT[id]?.name ?? id
}

/** { water: 1, bread: 2 } → "물 1 · 빵 2" */
export function itemList(items: Partial<Record<ItemId, number>>): string {
  return (Object.entries(items) as [ItemId, number][]).map(([id, n]) => `${itemName(id)} ${n}`).join(' · ')
}
