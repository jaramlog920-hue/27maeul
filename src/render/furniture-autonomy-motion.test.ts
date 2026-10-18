import { furnitureUseFrame, USE_PROP_PALETTE } from './furniture-use-motion'
import { additionUseFrame, ADDITION_USE_ACTIONS } from './addition-furniture-motion'
import { withLookDefaults } from '../engine/avatar'
import { PALETTE, writerPalette, type SpriteOpts, type Who } from './sprites'
import { FURNI_PALETTE } from './furniture-art'

const profiles: { who: Who; opts: SpriteOpts }[] = [
  { who: 'writer', opts: { frame: 0, blink: false } },
  { who: 'writer', opts: { frame: 0, blink: false, avatar: withLookDefaults({ name: '유저', look: 'f', hairFront: 8, top: 13 }) } },
  { who: 'writer', opts: { frame: 0, blink: false, short: 1, avatar: withLookDefaults({ name: '아이', look: 'm', skin: 3, top: 4 }) } },
  { who: 'baker', opts: { frame: 0, blink: false } },
  { who: 'grandpa', opts: { frame: 0, blink: false, elder: true } },
]

it('standing autonomous actions preserve actor size and keep cups, books and objects away from facial marks', () => {
  for (const { who, opts } of profiles) for (const facing of ['down', 'up', 'left', 'right'] as const) {
    for (const action of ['drink', 'read', 'craft', 'reach', 'pet'] as const) for (let phase = 0; phase < 4; phase++) {
      const f = furnitureUseFrame(who, facing, action, phase, opts, true, true)
      expect(f.anchor.y).toBe(18)
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        if ('o+'.includes(f.actor[y][x])) expect(f.propFront[y][x], `${who}/${action}/${phase}: ${x},${y}`).toBe('.')
      }
      const pal = who === 'writer' ? writerPalette('spring', opts.avatar) : PALETTE
      for (const [layer, palette] of [[f.actor, pal], [f.propBack, USE_PROP_PALETTE], [f.propFront, USE_PROP_PALETTE]] as const) {
        expect(layer).toHaveLength(24)
        for (const row of layer) {
          expect(row).toHaveLength(24)
          for (const c of row) if (c !== '.') expect(palette[c]).toBeDefined()
        }
      }
    }
  }
})

it('dedicated furniture scenes accept player, child and original NPC appearances in every direction and phase', () => {
  for (const { who, opts } of profiles) for (const facing of ['down', 'up', 'left', 'right'] as const) {
    for (const action of ADDITION_USE_ACTIONS) for (let phase = 0; phase < 4; phase++) {
      const f = additionUseFrame(who, facing, action, phase, opts)
      const palette = who === 'writer' ? writerPalette('spring', opts.avatar) : PALETTE
      for (const [layer, pal] of [[f.actor, palette], [f.furnitureBack, FURNI_PALETTE], [f.furnitureFront, FURNI_PALETTE], [f.propBack, FURNI_PALETTE], [f.propFront, FURNI_PALETTE]] as const) {
        expect(layer).toHaveLength(48)
        for (const row of layer) {
          expect(row).toHaveLength(48)
          for (const c of row) if (c !== '.') expect(pal[c], `${who}/${action}: ${c}`).toBeDefined()
        }
      }
    }
  }
})
