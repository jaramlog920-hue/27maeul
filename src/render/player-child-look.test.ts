import { childStage } from '../engine/child'
import { playerChildSprite } from './player-child-look'
import { spriteRows } from './sprites'
import { withLookDefaults } from '../engine/avatar'

describe('player child render selection', () => {
  it('switches the default child to full-height writer art at age 84', () => {
    const child = { born: 12 }
    expect(playerChildSprite(childStage(child, 95), false)).toEqual({ who: 'child', short: 1 })
    for (const age of [84, 85, 120]) {
      for (const dressed of [false, true]) {
        const selected = playerChildSprite(childStage(child, child.born + age), dressed)
        expect(selected).toEqual({ who: 'writer', short: undefined })
        for (const facing of ['down', 'up', 'left', 'right'] as const) {
          const avatar = withLookDefaults({ look: 'm', name: '' })
          expect(spriteRows(selected.who, facing, { avatar, short: selected.short, frame: 0, blink: false }))
            .toEqual(spriteRows('writer', facing, { avatar, frame: 0, blink: false }))
        }
      }
    }
  })

  it('keeps toddler and dressed helper writer art at their existing heights', () => {
    expect(playerChildSprite('toddler', false)).toEqual({ who: 'writer', short: 0 })
    expect(playerChildSprite('helper', true)).toEqual({ who: 'writer', short: 1 })
    expect(playerChildSprite('helper', false)).toEqual({ who: 'child', short: 1 })
  })
})
