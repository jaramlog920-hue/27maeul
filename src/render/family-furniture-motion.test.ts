import { FAMILY_FURNITURE_DIRECTIONS, petFurnitureArtRows } from './family-furniture-art'
import { FAMILY_FURNITURE_ART } from './family-furniture-art'
import { childFurnitureFrame, petFurnitureRows, petFurnitureObjectRows } from './family-furniture-motion'
import { CHILD_FURNITURE, PET_FURNITURE } from '../engine/family-furniture'
import { withLookDefaults } from '../engine/avatar'
import { writerPalette } from './sprites'
import { FURNI_PALETTE } from './furniture-art'
import { ANIMAL_PALETTE } from './sprites'

it('keeps young sleepers small and faces the same side as the waking pet',()=>{
  for(const kind of ['cat','dog'] as const)for(const id of ['wovenPetBed','coolingPetMat'] as const){
    const count=(rows:string[])=>rows.join('').replaceAll('.','').length
    expect(count(petFurnitureRows(id,kind,'down',0,true))).toBeLessThan(count(petFurnitureRows(id,kind,'down',0,false)))
    const nose=(rows:string[])=>rows.find(row=>row.includes('n'))!.indexOf('n')
    expect(nose(petFurnitureRows(id,kind,'down',0,true))).toBeLessThan(8)
    expect(nose(petFurnitureRows(id,kind,'up',0,true))).toBeGreaterThanOrEqual(8)
  }
})

it('draws twenty distinct native silhouettes and five child interactions without changing the ground/canvas size', () => {
  expect(Object.keys(FAMILY_FURNITURE_ART)).toHaveLength(20)
  expect(new Set(Object.values(FAMILY_FURNITURE_ART).map(a => a.rows.join('\n'))).size).toBe(20)
  for (const toddler of [true, false]) for (const look of ['m', 'f'] as const) {
    const avatar = withLookDefaults({ look, name: '아이', hairFront: 8, top: 13 })
    for (const id of CHILD_FURNITURE) for (const facing of ['down', 'up', 'left', 'right'] as const) {
      const unique = new Set<string>()
      for (let phase = 0; phase < 4; phase++) {
        const f = childFurnitureFrame(id, facing, phase, avatar, toddler)
        expect(f.anchor).toEqual({ x: 16, y: 32 })
        unique.add(JSON.stringify(f))
        // Eye/cheek marks stay unobstructed by paper, blocks and instruments.
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          if ('o+'.includes(f.actor[y][x])) expect(f.front[y][x], `${id}: face ${x},${y}`).toBe('.')
        }
        for (const [layer, palette] of [[f.actor, writerPalette('spring', avatar)], [f.furniture, FURNI_PALETTE], [f.front, FURNI_PALETTE]] as const) {
          expect(layer).toHaveLength(32)
          for (const row of layer) {
            expect(row).toHaveLength(32)
            for (const c of row) if (c !== '.') expect(palette[c], `${id}: ${c}`).toBeDefined()
          }
        }
      }
      expect(unique.size, id).toBeGreaterThan(1)
    }
  }
})

it('draws both pet species and ages at fixed size, with changing drinking/play poses', () => {
  for (const id of PET_FURNITURE) for (const kind of ['cat', 'dog'] as const) for (const baby of [true, false]) {
    const phases = [0, 1, 2, 3].map(p => petFurnitureRows(id, kind, 'down', p, baby))
    for (const frame of phases) {
      expect(frame).toHaveLength(16)
      for (const row of frame) {
        expect(row).toHaveLength(16)
        for (const c of row) if (c !== '.') expect(ANIMAL_PALETTE[kind][c], `${id}: ${c}`).toBeDefined()
      }
    }
    if (id !== 'wovenPetBed' && id !== 'coolingPetMat') expect(new Set(phases.map(p => p.join('\n'))).size, `${id}/${kind}/${baby}`).toBeGreaterThan(1)
  }
})

it('water, tug rope and puzzle pieces respond while their installed footprint stays fixed', () => {
  for (const id of ['petBowlStation', 'petTugMat', 'petPuzzleTray'] as const) {
    const phases = [0, 1, 2, 3].map(p => petFurnitureObjectRows(id, 'down', p))
    expect(new Set(phases.map(f => f.join(''))).size).toBeGreaterThan(1)
    for (const frame of phases) {
      expect(frame).toHaveLength(16)
      expect(frame.every(r => r.length === 16)).toBe(true)
    }
  }
})


it('아이 몸과 반려동물 가구 반응이 설치한 네 방향을 따른다', () => {
  const avatar = withLookDefaults({ look: 'm', name: '아이' })
  for (const id of CHILD_FURNITURE) {
    const poses = ['down', 'up', 'left', 'right'].map(f => childFurnitureFrame(id, f as 'down', 1, avatar, true).actor.join(''))
    expect(new Set(poses).size, id).toBe(4)
  }
  for (const id of PET_FURNITURE) for (const facing of ['down', 'up', 'left', 'right'] as const) {
    if (facing !== 'down') expect(FAMILY_FURNITURE_DIRECTIONS[id][facing].rows).toEqual(petFurnitureArtRows(id, facing))
    for (let phase = 0; phase < 4; phase++) expect(petFurnitureObjectRows(id, facing, phase)).toEqual(petFurnitureArtRows(id, facing, phase))
  }
  for (const kind of ['cat', 'dog'] as const) for (const id of ['petBowlStation', 'petTugMat', 'petPuzzleTray'] as const) {
    const poses = ['down', 'up', 'left', 'right'].map(f => petFurnitureRows(id, kind, f as 'down', 1, false).join(''))
    expect(new Set(poses).size, `${id}/${kind}`).toBe(4)
  }
})
