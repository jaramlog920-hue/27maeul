import { describe, expect, it } from 'vitest'
import { furnitureUseFrame, USE_ACTIONS, USE_PROP_PALETTE } from './furniture-use-motion'
import { writerPalette } from './sprites'

describe('furniture use pixel motion', () => {
  it('keeps every layer in a 24px canvas with supported colors', () => {
    const actorPalette = writerPalette('spring')
    for (const action of USE_ACTIONS) for (const facing of ['down', 'up', 'left', 'right'] as const) {
      const images = new Set<string>()
      for (let frame = 0; frame < 4; frame++) {
        const p = furnitureUseFrame('writer', facing, action, frame, { frame: 0, blink: false })
        images.add(JSON.stringify([p.actor, p.propBack, p.propFront]))
        for (const [rows, palette] of [[p.actor, actorPalette], [p.propBack, USE_PROP_PALETTE], [p.propFront, USE_PROP_PALETTE]] as const) {
          expect(rows).toHaveLength(24)
          for (const row of rows) { expect(row).toHaveLength(24); for (const c of row) if (c !== '.') expect(palette[c]).toBeDefined() }
        }
        expect(p.duration).toBeGreaterThan(0)
      }
      expect(images.size).toBeGreaterThan(1)
    }
  })
  it('mirrors all left layers and interaction targets once', () => {
    for (const action of USE_ACTIONS) for (let frame = 0; frame < 4; frame++) {
      const left = furnitureUseFrame('writer', 'left', action, frame, { frame: 0, blink: false })
      const right = furnitureUseFrame('writer', 'right', action, frame, { frame: 0, blink: false })
      for (const key of ['actor', 'propBack', 'propFront'] as const) expect(left[key]).toEqual(right[key].map(r => [...r].reverse().join('')))
      expect(left.interaction.x).toBe(23 - right.interaction.x)
    }
  })
})
