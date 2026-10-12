import { describe, expect, it } from 'vitest'
import { spriteRows } from './sprites'
import { withLookDefaults } from '../engine/avatar'
import { furnitureUseFrame } from './furniture-use-motion'
import { EXTRA_ACTIONS, extraUseFrame } from './expansion-life-motion'
import { COOK_ACTIONS, cookingFrame } from './cooking-art'
import { EVENT_ACTIONS, eventMotionFrame } from './event-life-motion'
import { CRAFT_ACTIONS, craftFollowupFrame } from './craft-followup-art'

describe('motion bodies keep their neckline and chest', () => {
  for (const look of ['f', 'm'] as const) {
    const avatar = withLookDefaults({ look, name: '', skin: 2, top: 13, bottom: 4 })
    const options = { frame: 0 as const, blink: false, avatar }
    const standing = spriteRows('writer', 'down', options)
    const chest = (actor: string[], ox: number, oy: number, label: string) => {
      for (let y = 7; y <= 9; y++) for (let x = 2; x <= 7; x++) {
        if (standing[y][x] !== '.') expect(actor[y + oy][x + ox], `${label}: ${x},${y}`).not.toBe('.')
      }
    }
    it(`${look}: standing and seated actions never erase the central torso`, () => {
      for (let frame = 0; frame < 4; frame++) {
        for (const action of ['drink', 'read', 'craft', 'knead', 'reach', 'pet'] as const) chest(furnitureUseFrame('writer', 'down', action, frame, options).actor, 7, 4 + ((action === 'knead' || action === 'pet') && frame % 2 ? 1 : 0), action)
        for (const action of EXTRA_ACTIONS.filter(a => !['sitDown', 'standUp', 'lieDown', 'rise'].includes(a))) chest(extraUseFrame('writer', 'down', action, frame, options).actor, 7, 4, action)
        for (const action of COOK_ACTIONS) {
          const bob = ['knead', 'shapeLong', 'shapeRound', 'score'].includes(action) ? frame % 2 : 0
          chest(cookingFrame('writer', 'down', action, frame, options).actor, 7, 4 + bob, action)
        }
        for (const action of EVENT_ACTIONS.filter(a => !['nod', 'blowCandle'].includes(a))) chest(eventMotionFrame('writer', 'down', action, frame, options).actor, 7, 4 + (action === 'dance' ? frame % 2 : 0), action)
        for (const action of CRAFT_ACTIONS) chest(craftFollowupFrame(action, 'down', frame, avatar).actor, 11, 6, action)
      }
    })
  }
})
