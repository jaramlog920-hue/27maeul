import { describe, it, expect, vi } from 'vitest'
import { CONTENT } from '../../../src/content/catalog'
import { SCENES } from '../../../src/content/text'
import { newGame, syncHome, placeFurniture, buildWall, canBuildWall } from '../../../src/engine/game'
import { HOME_CTX, placement } from '../../../src/engine/room'
import { ARCHIVE_CTX, slotCtx } from '../../../src/engine/newland-rooms'
import { INTERIOR_ENTRY, ROOM_SLOTS } from '../../../src/engine/newland-config'
import { NEWLAND_MAP } from '../../../src/engine/newland'
import { setActiveMap } from '../../../src/engine/maps'
import { setHomeWalls } from '../../../src/engine/home-walls'
import { drawVillageMap } from '../../../src/render/renderer'
import { WIDTH, HEIGHT, TILE } from '../../../src/engine/world'
import { AUTHORED_STORY_IDS, authoredStoryPeople, drawAuthoredStory } from '../../../src/render/authored-story-art'
import { withLookDefaults } from '../../../src/engine/avatar'
import { previewActor } from '../../../src/features/scene/event-preview-art'
import { facingArt, hasFacingArt } from '../../../src/render/furniture-facing'

function mockContext() {
  let draws = 0
  const gradient = { addColorStop() {} }
  const fn = (name: string, args: unknown[]) => {
    if (['fillRect', 'clearRect', 'strokeRect', 'moveTo', 'lineTo', 'translate', 'scale', 'setTransform', 'arc'].includes(name)) {
      for (const n of args) if (typeof n === 'number' && !Number.isFinite(n)) throw new Error(`${name}: ${n}`)
    }
    if (name === 'fillRect') draws++
    if (name.startsWith('create') && name.endsWith('Gradient')) return gradient
    if (name === 'measureText') return { width: 12 }
    return undefined
  }
  const g = new Proxy({ fillStyle: '', canvas: { width: 320, height: 180 } }, {
    get(target, key) { return key in target ? target[key as keyof typeof target] : (...args: unknown[]) => fn(String(key), args) },
    set(target, key, value) { Reflect.set(target, key, value); return true },
  }) as unknown as CanvasRenderingContext2D
  return { g, draws: () => draws }
}

describe('Read-only audit probes', () => {
  it('reproduces missing wall placement support in archive and newland homes', () => {
    const s = newGame(CONTENT)
    syncHome(s)
    setActiveMap('village')
    const home = placement([], 'copySpringFlowers', { x: 19, y: 110 }, 'down', HOME_CTX)
    expect(home).not.toBeNull()
    setActiveMap('newland')
    const roomCandidates = (ctx: typeof ARCHIVE_CTX) => NEWLAND_MAP.flatMap((row, y) => [...row].flatMap((ch, x) => ch === '#' && ctx.isFloor({ x, y: y + 1 }) ? [{ x, y }] : []))
    for (const ctx of [ARCHIVE_CTX, ...ROOM_SLOTS.map(slotCtx)]) {
      const walls = roomCandidates(ctx)
      expect(walls.length).toBeGreaterThan(0)
      expect(walls.map(t => placement([], 'copySpringFlowers', t, 'down', ctx)).filter(Boolean)).toHaveLength(0)
    }
    const archive = { ...s, map: 'newland' as const, flags: { ...s.flags, growthLegacy: 1, newlandGift: 1, newlandRevealed: 1 }, inv: { ...s.inv, stool: 1, copySpringFlowers: 1 }, player: { ...s.player, ...INTERIOR_ENTRY }, homeLevel: 3 as const }
    const floors = NEWLAND_MAP.flatMap((row, y) => [...row].flatMap((_,x) => ARCHIVE_CTX.isFloor({x,y}) ? [{x,y}] : []))
    expect(floors.some(t => placeFurniture(archive, 'stool', t) !== null)).toBe(true)
    for (const item of ['copyClothesNiche','copySpringFlowers','copySummerShells','copyAutumnLeaves'] as const) {
      const state = { ...archive, inv: { ...archive.inv, [item]: 1 } }
      expect(roomCandidates(ARCHIVE_CTX).every(t => placeFurniture(state, item, t) === null)).toBe(true)
    }
    console.log('WALL_PROBE', JSON.stringify({ home, archiveWalls: roomCandidates(ARCHIVE_CTX), normalFurniturePlaceable: true, allFourWallItemsRejected: true }))
    setActiveMap('village')
  })

  it('reproduces retained full-world canvases per wall layout', () => {
    const base = newGame(CONTENT)
    let s = { ...base, homeLevel: 3 as const, coins: 5000, flags: { ...base.flags, growthLegacy: 1 } }
    syncHome(s)
    const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()
    const full: HTMLCanvasElement[] = []
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function(this: HTMLCanvasElement) {
      if (!contexts.has(this)) {
        contexts.set(this, mockContext().g)
        if (this.width === WIDTH * TILE && this.height === HEIGHT * TILE) full.push(this)
      }
      return contexts.get(this)!
    } as never)
    const g = mockContext().g
    const states = [s]
    const walls: {x:number;y:number}[] = []
    for (let i = 0; i < 11; i++) {
      const next = Array.from({length:14},(_,y)=>Array.from({length:26},(_,x)=>({x:x+6,y:y+104}))).flat().find(t=>canBuildWall(s,t)===null)
      expect(next).toBeDefined()
      walls.push(next!)
      s = buildWall(s,next!)! as typeof s
      states.push(s)
    }
    for (const state of states) { syncHome(state); drawVillageMap(g, state) }
    const created = full.length
    for (const state of states) { syncHome(state); drawVillageMap(g, state) }
    expect(created).toBe(12)
    expect(full.length).toBe(created)
    console.log('CACHE_PROBE', JSON.stringify({ layouts: created, legalWallBuilds: walls, width: WIDTH * TILE, height: HEIGHT * TILE, rgbaBytes: created * WIDTH * HEIGHT * TILE * TILE * 4 }))
    setHomeWalls(undefined)
    vi.restoreAllMocks()
  })

  it('draws every authored story at initial and final dialogue phases, three viewport sizes and null/custom avatars', () => {
    const custom = withLookDefaults({ name: '감사', look: 'f', hairColor: [170, 60, 25], top: 4, bottom: 4 })
    let cases = 0
    for (const id of new Set(AUTHORED_STORY_IDS)) {
      expect(SCENES[id], id).toBeDefined()
      const people = authoredStoryPeople(id).map(p => previewActor(`person:${p}`))
      const npc = people[0] ?? previewActor(id)
      for (const avatar of [null, custom]) for (const [w,h] of [[300,170], [320,180], [320,693]]) {
        for (const [t,beat] of [[0,0], [8,Math.max(0,SCENES[id].lines.length-1)]]) {
          const ctx = mockContext()
          drawAuthoredStory(ctx.g,id,w,h,t,avatar,npc,people.slice(1),beat)
          expect(ctx.draws(), `${id}/${w}/${h}/${beat}`).toBeGreaterThan(0)
          cases++
        }
      }
    }
    console.log('AUTHORED_SMOKE', JSON.stringify({ uniqueStories: new Set(AUTHORED_STORY_IDS).size, cases }))
  })

  it('checks copy furniture facing preview resolves through registered additions', () => {
    for (const id of ['copyBabyNap','copyChangingScreen']) {
      expect(hasFacingArt(id)).toBe(true)
      expect(facingArt(id, 'right')).toBeDefined()
    }
  })
})
