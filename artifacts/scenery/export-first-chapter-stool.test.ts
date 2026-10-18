import { writeFileSync } from 'node:fs'
import { HOME_SPACE_DIRECTIONS } from '../../src/render/home-space-directions'
import { FURNI_PALETTE } from '../../src/render/furniture-art'
it('export canonical stool art for offline inspection', () => {
 writeFileSync('artifacts/scenery/first-chapter-stool-directions.json',JSON.stringify({views:HOME_SPACE_DIRECTIONS.stool,palette:FURNI_PALETTE}))
})
