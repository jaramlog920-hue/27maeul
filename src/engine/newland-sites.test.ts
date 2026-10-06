// 계획 20 작업 6: 건물 종류 표가 자산 manifest.json과 어긋나지 않는다
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { OLD_BUILDINGS, OLD_CONSTRUCTION, OLD_PROPS, OLD_TERRAIN, BUILDING_LABELS } from '../render/old-village-art'
import { ART_TILES, SITES, SITE_KINDS } from './newland-sites'
import type { Facing } from './types'

interface ManifestItem {
  id: string
  group: string
  facing?: Facing
  entry?: { x: number; y: number } | null
  footprint?: { w: number; h: number }
  visualTiles?: { w: number; h: number }
  width: number
  height: number
}
const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../assets/old-testament-generations/manifest.json'), 'utf8')) as { items: ManifestItem[] }
const find = (group: string, id: string, facing: Facing) => manifest.items.find((i) => i.group === group && i.id === id && i.facing === facing)

describe('건물 종류 표', () => {
  it('첫 제작은 길·정원 칸·공동 마당·입주 주택 네 가지', () => {
    expect([...SITE_KINDS]).toEqual(['path', 'garden', 'courtyard', 'home'])
  })

  it('집·마당의 그림 칸 수와 막히는 영역이 manifest와 같다 (그림 4×4, footprint 4×3)', () => {
    for (const id of ['home', 'courtyard'] as const) {
      for (const f of ['down', 'up', 'left', 'right'] as const) {
        const it = find('buildings', id, f)!
        expect(it.visualTiles).toEqual({ w: ART_TILES, h: ART_TILES })
        expect(it.width).toBe(ART_TILES * 16)
        expect(it.footprint).toEqual({ w: 4, h: 3 })
      }
    }
    expect(SITES.home.area).toEqual({ w: 4, h: 3, dy: 1 })
  })

  it('집의 방향별 entry 화소와 문 칸이 manifest와 같다 (뒤를 보는 방향은 문이 없어 놓지 않는다)', () => {
    for (const f of ['down', 'up', 'left', 'right'] as const) {
      const entry = find('buildings', 'home', f)!.entry ?? null
      const door = SITES.home.doors?.[f]
      if (entry === null) {
        expect(door).toBeUndefined()
        expect(SITES.home.facings).not.toContain(f)
        continue
      }
      expect(door!.entryPx).toEqual(entry)
      // 문 칸은 그림에서 footprint 맨 아랫줄이고, entry 화소가 그 칸(좌우 한 화소 안쪽)에 들어 있다
      expect(door!.door.dy).toBe(Math.floor(entry.y / 16))
      const left = door!.door.dx * 16
      expect(entry.x).toBeGreaterThanOrEqual(left - 1)
      expect(entry.x).toBeLessThanOrEqual(left + 16)
      // 문 앞은 문 바로 바깥 한 칸이다
      expect(Math.abs(door!.front.dx - door!.door.dx) + Math.abs(door!.front.dy - door!.door.dy)).toBe(1)
    }
  })

  it('공사 그림도 집·마당 네 방향이 있다 (공사 그림의 입구는 쓰지 않는다)', () => {
    for (const id of ['home', 'courtyard'] as const) {
      for (const f of ['down', 'up', 'left', 'right'] as const) {
        expect(find('construction', id, f)).toBeDefined()
        expect(OLD_BUILDINGS[id][f].rows).toHaveLength(ART_TILES * 16)
        expect(OLD_CONSTRUCTION[id][f].rows).toHaveLength(ART_TILES * 16)
      }
    }
  })

  it('이름·그림이 자산에 있다', () => {
    expect(BUILDING_LABELS.home).toBe('입주 주택')
    expect(BUILDING_LABELS.courtyard).toBe('공동 마당')
    for (const k of SITE_KINDS) {
      const d = SITES[k]
      if (d.assetId) expect(BUILDING_LABELS[d.assetId]).toBeTruthy()
      if (d.terrainId) expect(OLD_TERRAIN[d.terrainId]).toBeDefined()
    }
    expect(OLD_PROPS.plotPeg).toBeDefined()
  })

  it('비용은 결정 D3 그대로', () => {
    expect(SITES.path.cost).toEqual({ coins: 1, items: {} })
    expect(SITES.garden.cost).toEqual({ coins: 3, items: {} })
    expect(SITES.courtyard.cost).toEqual({ coins: 40, items: { reed: 4 } })
    expect(SITES.home.cost).toEqual({ coins: 150, items: { olive: 4, papyrus: 3 } })
  })
})
