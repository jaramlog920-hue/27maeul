import type { Facing } from '../engine/types'
import { spriteRows, type SpriteOpts, type Who } from './sprites'

/** Remove resting hands by anatomy, never by scanning all skin-colored pixels.
 * Neck/chest skin, the chin outline and clothing decorations remain untouched.
 */
export function motionBodyRows(who: Who, facing: Facing, opts: SpriteOpts): string[] {
  const rows = spriteRows(who, facing, opts)
  const side = facing === 'left' || facing === 'right'
  const canonical = facing === 'left' ? rows.map(r => [...r].reverse().join('')) : rows
  const clean = canonical.map((row, y) => [...row].map((c, x) => {
    const hand = side ? y >= (opts.pose === 'crouch' ? 7 : 9) && x >= 5 && x <= 8 : y >= 7 && (x <= 1 || x >= 8)
    return hand && 's5!K'.includes(c) ? '.' : c
  }).join(''))
  return facing === 'left' ? clean.map(r => [...r].reverse().join('')) : clean
}
