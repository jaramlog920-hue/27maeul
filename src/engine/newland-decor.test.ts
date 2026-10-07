// 사용자 결정 ⑧: 새 터 꾸미기 소재 — 값이 있고, 나무·덤불은 막히고, 서고 길을 막는 배치는 거절, 걷어 내면 반만
import { CONTENT } from '../content/catalog'
import { newGame, syncHome, type GameState } from './game'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'
import { canPlace, clearTile, orderBuild, tilesOf } from './newland-build'
import { NEWLAND_PORTAL_FRONT } from './newland-config'
import { DECOR_KINDS, SITES } from './newland-sites'
import { isWalkable } from './world'
import { BG_ART } from '../render/bg-materials-art'
import { t } from '../shared/i18n'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

function land(coins = 1000): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 10, minute: 600 },
    coins,
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    map: 'newland',
    player: { ...base.player, x: NEWLAND_PORTAL_FRONT.x, y: NEWLAND_PORTAL_FRONT.y, path: [] },
  }
  syncHome(g)
  return g
}

describe('새 터 꾸미기', () => {
  it('소재마다 그림·이름·값이 있다 (공짜 없음)', () => {
    for (const k of DECOR_KINDS) {
      expect(BG_ART[k]?.length).toBeGreaterThan(0)
      expect(t(`decor.${k}`)).not.toContain('decor.')
      expect(SITES[k].cost.coins).toBeGreaterThan(0)
    }
  })
  it('나무는 막히고 모래 길은 걷는다, 걷어 내면 반만 돌아온다', () => {
    let s = orderBuild(land(), 'treeBig', 20, 20)!
    expect(s.coins).toBe(1000 - SITES.treeBig.cost.coins)
    s = orderBuild(s, 'sand', 21, 20)!
    syncHome(s)
    expect(isWalkable({ x: 20, y: 20 })).toBe(false)
    expect(isWalkable({ x: 21, y: 20 })).toBe(true)
    const c = clearTile(s, 20, 20)!
    expect(c.coins).toBe(s.coins + Math.floor(SITES.treeBig.cost.coins / 2))
    expect(tilesOf(c)['20,20']).toBeUndefined()
  })
  it('닢이 모자라면 못 놓는다', () => {
    expect(orderBuild(land(0), 'flower', 20, 20)).toBeNull()
  })
  it('깐 길을 나무로 둘러싸 갇히게 하는 배치는 거절, 다른 것 위에는 못 놓는다', () => {
    let s = orderBuild(land(), 'path', 20, 20)!
    for (const [x, y] of [[19, 20], [21, 20], [20, 19]]) s = orderBuild(s, 'treeSmall', x, y)!
    expect(canPlace(s, 'treeSmall', 20, 21)).toBe('sealed')
    expect(canPlace(s, 'flower', 20, 21)).toBeNull()
    expect(canPlace(s, 'treeBig', 20, 20)).toBe('overlap')
  })
})
