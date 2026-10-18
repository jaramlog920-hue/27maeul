import { PET_FURNITURE } from '../engine/family-furniture'
import { petFurnitureArtRows } from './family-furniture-art'
import { describe, expect, it } from 'vitest'
import { ADDITION_ART, ADDITION_FACINGS, ADDITION_FURNITURE_DIRECTIONS } from './addition-furniture-directions'
import { ADDITION_USE_ACTIONS, ANIMATED_ADDITION_FURNITURE, additionObjectFrame, additionUseFrame } from './addition-furniture-motion'
import { FURNI_PALETTE } from './furniture-art'
import { writerPalette } from './sprites'
import { withLookDefaults } from '../engine/avatar'
import { motionBodyRows } from './motion-body'
import { isCopyFurniture } from '../engine/copy-furniture'
import { sizeOf } from '../engine/room'

describe('additional furniture views and use motion', () => {
  it('keeps furniture dimensions, palettes and separately drawn directions valid', () => {
    expect(Object.keys(ADDITION_FURNITURE_DIRECTIONS)).toHaveLength(108)
    for (const [id, views] of Object.entries(ADDITION_FURNITURE_DIRECTIONS)) {
      if (!['rockingChair', 'toyCart'].includes(id)) expect(views.down).toEqual(ADDITION_ART[id])
      if(isCopyFurniture(id))expect({w:views.right.w,h:views.right.h}).toEqual(sizeOf(id,'right'))
      else {expect(views.right.w).toBe(views.down.h);expect(views.right.h).toBe(views.down.w)}
      if ((PET_FURNITURE as readonly string[]).includes(id)) expect(views.left.rows).toEqual(petFurnitureArtRows(id, 'left'))
      else if(!isCopyFurniture(id)) expect(views.left.rows).toEqual(views.right.rows.map(row => [...row].reverse().join('')))
      for (const facing of ADDITION_FACINGS) {
        const art = views[facing]
        expect(art.rows).toHaveLength(art.h * 16)
        for (const row of art.rows) {
          expect(row).toHaveLength(art.w * 16)
          for (const c of row) if (c !== '.') expect(FURNI_PALETTE[c]).toBeDefined()
        }
      }
    }
  })

  it('produces visible changes in every object direction without changing its footprint or source', () => {
    const original = JSON.stringify(ADDITION_FURNITURE_DIRECTIONS)
    for (const id of ANIMATED_ADDITION_FURNITURE) for (const facing of ADDITION_FACINGS) {
      const poses = Array.from({ length: 4 }, (_, i) => additionObjectFrame(id, facing, i))
      expect(new Set(poses.map(a => a.rows.join('\n'))).size, `${id}-${facing}`).toBeGreaterThanOrEqual(3)
      expect(additionObjectFrame(id, facing, 4)).toEqual(poses[0])
      expect(additionObjectFrame(id, facing, -1)).toEqual(poses[3])
      for (const pose of poses) {
        expect([pose.w, pose.h]).toEqual([poses[0].w, poses[0].h])
        expect(pose.rows).toHaveLength(pose.h * 16)
        for (const row of pose.rows) {
          expect(row).toHaveLength(pose.w * 16)
          for (const c of row) if (c !== '.') expect(FURNI_PALETTE[c]).toBeDefined()
        }
      }
    }
    expect(JSON.stringify(ADDITION_FURNITURE_DIRECTIONS)).toBe(original)
  })

  it('keeps motion layers, interaction anchors and selected appearance valid for every direction', () => {
    for (const look of ['m', 'f'] as const) {
      const avatar = withLookDefaults({ look, name: '', skin: 2, top: 13, bottom: 4 })
      const opts = { frame: 0 as const, blink: false, avatar, season: 'spring' as const }
      const before = JSON.stringify(opts), palette = writerPalette('spring', avatar)
      for (const action of ADDITION_USE_ACTIONS) for (const facing of ADDITION_FACINGS) {
        const unique = new Set<string>()
        for (let frame = 0; frame < 4; frame++) {
          const pose = additionUseFrame('writer', facing, action, frame, opts)
          unique.add(JSON.stringify([pose.actor, pose.furnitureBack, pose.furnitureFront, pose.propBack, pose.propFront]))
          for (const key of ['actor', 'furnitureBack', 'furnitureFront', 'propBack', 'propFront'] as const) {
            expect(pose[key]).toHaveLength(48)
            for (const row of pose[key]) {
              expect(row).toHaveLength(48)
              for (const c of row) if (c !== '.') expect((key === 'actor' ? palette : FURNI_PALETTE)[c]).toBeDefined()
            }
          }
          for (const anchor of [pose.actorAnchor, pose.furnitureAnchor, pose.interaction]) {
            expect(anchor.x).toBeGreaterThanOrEqual(0); expect(anchor.x).toBeLessThan(48)
            expect(anchor.y).toBeGreaterThanOrEqual(0); expect(anchor.y).toBeLessThan(48)
          }
          expect(pose.duration).toBeGreaterThan(0)
          expect(additionUseFrame('writer', facing, action, frame + 4, opts)).toEqual(pose)
        }
        expect(unique.size, `${action}-${facing}`).toBeGreaterThanOrEqual(3)
      }
      expect(JSON.stringify(opts)).toBe(before)
    }
  })

  it('mirrors left-handed scene layers and their anchors exactly once', () => {
    for (const action of ADDITION_USE_ACTIONS) for (let frame = 0; frame < 4; frame++) {
      const opts = { frame: 0 as const, blink: false }
      const left = additionUseFrame('writer', 'left', action, frame, opts)
      const right = additionUseFrame('writer', 'right', action, frame, opts)
      for (const key of ['actor', 'furnitureBack', 'furnitureFront', 'propBack', 'propFront'] as const) expect(left[key]).toEqual(right[key].map(r => [...r].reverse().join('')))
      for (const key of ['actorAnchor', 'furnitureAnchor', 'interaction'] as const) expect(left[key]).toEqual({ x: 47 - right[key].x, y: right[key].y })
    }
  })

  it('uses compact reference-style hands instead of long skin-colored arms', () => {
    const count = (rows: string[], char: string) => rows.join('').split(char).length - 1
    for (const action of ADDITION_USE_ACTIONS) for (const facing of ADDITION_FACINGS) for (let frame = 0; frame < 4; frame++) {
      const opts = { frame: 0 as const, blink: false }
      const source = motionBodyRows('writer', facing, opts)
      const pose = additionUseFrame('writer', facing, action, frame, opts)
      // Two 2px hands, or one visible hand in profile. Neck/face skin comes from the original body.
      const added = facing === 'left' || facing === 'right' ? 2 : 4
      expect(count(pose.actor, 's'), `${action}-${facing}-${frame}`).toBeLessThanOrEqual(count(source, 's') + added)
      expect(count(pose.actor, '5'), `${action}-${facing}-${frame}`).toBeLessThanOrEqual(count(source, '5') + added)
    }
  })

  it('occludes working hands behind the head and back in rear views', () => {
    for (const look of ['m', 'f'] as const) {
      const avatar = withLookDefaults({ look, name: '', skin: 2, top: 13, bottom: 4 })
      const opts = { frame: 0 as const, blink: false, avatar }
      for (const action of ADDITION_USE_ACTIONS) for (let frame = 0; frame < 4; frame++) {
        const pose = additionUseFrame('writer', 'up', action, frame, opts)
        const body = motionBodyRows('writer', 'up', { ...opts, pose: pose.posture === 'crouching' ? 'crouch' : 'stand' })
        const ax = pose.actorAnchor.x - 5
        const ay = pose.actorAnchor.y - (pose.posture === 'seated' ? body.length - 4 : body.length)
        const bob = action === 'knead' && frame === 1 ? 1 : 0
        // The planted legs cover the lowered torso's last row during kneading.
        const shortenedLap = pose.posture === 'seated' ? 1 : 0
        for (let y = 0; y < body.length - 3 - bob - shortenedLap; y++) for (let x = 0; x < body[y].length; x++) {
          if (body[y][x] !== '.') expect(pose.actor[ay + y + bob][ax + x], `${look}-${action}-${frame}: ${x},${y}`).toBe(body[y][x])
        }
      }
    }
  })

  it('plants standing and crouching feet while seated hips rest on the cushion', () => {
    for (const action of ADDITION_USE_ACTIONS) for (const facing of ADDITION_FACINGS) for (let frame = 0; frame < 4; frame++) {
      const pose = additionUseFrame('writer', facing, action, frame, { frame: 0, blink: false })
      const floor = pose.actorAnchor.y
      if (action === 'rock') {
        expect(pose.posture).toBe('seated')
        expect(floor).toBe(pose.furnitureAnchor.y - 7)
        // Knees and hanging feet continue below the pelvis, above the rockers.
        expect(pose.actor.slice(floor, pose.furnitureAnchor.y).some(row => /[^.]/.test(row))).toBe(true)
        continue
      }
      expect(pose.posture).toBe(action === 'tuckDoll' ? 'crouching' : 'standing')
      // A far-side worker's feet can be occluded by the table/cart.
      if (facing !== 'down' || ['harp', 'waterPlant', 'tuckDoll'].includes(action)) {
        expect(pose.actor[floor - 1].replaceAll('.', '').length, `${action}-${facing}-${frame}: feet`).toBeGreaterThan(0)
      }
      expect(pose.actor.slice(floor).every(row => /^\.+$/.test(row)), `${action}-${facing}-${frame}: below floor`).toBe(true)
    }
  })

  it('moves the cart and its pusher together, keeping hands at the handle', () => {
    const poses = Array.from({ length: 4 }, (_, frame) => additionUseFrame('writer', 'right', 'pushCart', frame, { frame: 0, blink: false }))
    for (const pose of poses) {
      expect(pose.interaction.x - pose.actorAnchor.x).toBe(5)
      expect(pose.interaction.y).toBe(pose.furnitureAnchor.y - 10)
      expect(pose.actor[pose.interaction.y][pose.interaction.x]).toBe('s')
    }
    expect(poses.map(p => p.actorAnchor.x)).toEqual([22, 23, 24, 23])
  })

  it('connects visible palms to the dressed body instead of leaving floating hands', () => {
    for (const action of ADDITION_USE_ACTIONS) for (const facing of ADDITION_FACINGS) for (let frame = 0; frame < 4; frame++) {
      const pose = additionUseFrame('writer', facing, action, frame, { frame: 0, blink: false })
      const seen = new Set<string>(), queue: number[][] = []
      // Seed the connected character from the topmost occupied actor row (the head).
      const top = pose.actor.findIndex(row => /[^.]/.test(row))
      for (let x = 0; x < 48; x++) if (pose.actor[top][x] !== '.') queue.push([x, top])
      for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i], key = `${x},${y}`
        if (seen.has(key)) continue
        seen.add(key)
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && nx < 48 && ny >= 0 && ny < 48 && pose.actor[ny][nx] !== '.' && !seen.has(`${nx},${ny}`)) queue.push([nx, ny])
        }
      }
      for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
        if (pose.actor[y][x] === 's') expect(seen.has(`${x},${y}`), `${action}-${facing}-${frame}: detached palm ${x},${y}`).toBe(true)
      }
    }
  })

  it('keeps the revised working arms within a four-pixel reach instead of stretching them', () => {
    for (const action of ['washFace', 'harp', 'paint', 'mill', 'tuckDoll'] as const) {
      for (const facing of ADDITION_FACINGS) for (let frame = 0; frame < 4; frame++) {
        const pose = additionUseFrame('writer', facing, action, frame, { frame: 0, blink: false })
        for (const hand of pose.hands) {
          expect(Math.abs(hand.palm.x - hand.shoulder.x), `${action}-${facing}-${frame}: horizontal reach`).toBeLessThanOrEqual(4)
          expect(Math.abs(hand.palm.y - hand.shoulder.y), `${action}-${facing}-${frame}: vertical reach`).toBeLessThanOrEqual(4)
        }
      }
    }
  })

  it('shows a complete flower and visible gripping fingers in the final drawing frame', () => {
    const pose = additionUseFrame('writer', 'down', 'paint', 3, { frame: 0, blink: false })
    const count = (char: string) => pose.propFront.join('').split(char).length - 1
    expect(count('p')).toBeGreaterThanOrEqual(4)
    expect(count('y')).toBe(1)
    expect(count('g') + count('G')).toBeGreaterThanOrEqual(4)
    for (const hand of pose.hands) {
      expect(pose.actor[hand.palm.y][hand.palm.x]).toBe('s')
      expect(pose.propFront[hand.palm.y][hand.palm.x]).toBe('.')
    }
  })

  it('uses the anatomical right shoulder for painting and tending the doll in front and rear views', () => {
    for (const action of ['paint', 'tuckDoll'] as const) for (const facing of ['down', 'up'] as const) for (let frame = 0; frame < 4; frame++) {
      const pose = additionUseFrame('writer', facing, action, frame, { frame: 0, blink: false })
      const workingHand = pose.hands[0]
      expect(workingHand.shoulder.x - pose.actorAnchor.x).toBe(facing === 'down' ? -4 : 3)
    }
  })

  it('lays the doll down before progressively covering its body while leaving the head visible', () => {
    const frames = [1, 2, 3].map(frame => additionUseFrame('writer', 'right', 'tuckDoll', frame, { frame: 0, blink: false }))
    const covers = frames.map(pose => pose.propFront.join('').split('p').length - 1)
    expect(covers[1]).toBeGreaterThan(covers[0])
    expect(covers[2]).toBeGreaterThan(covers[1])
    for (const pose of frames) {
      const { x, y } = pose.interaction
      expect(pose.propFront[y - 1][x]).toBe('k')
      expect(pose.propFront[y][x + 1]).toBe('W')
    }
  })
})
