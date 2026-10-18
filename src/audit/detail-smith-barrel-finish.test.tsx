import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { functionalAt, isStorage, moveFurniture, placeFurniture, removeFurniture, rotateFurniture, syncHome, tapTile } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { chooseSkillStyle } from '../engine/skills'
import { SkillCraftOptions } from '../features/skills/SkillLesson'
import { facingArt } from '../render/furniture-facing'
import { FURNI_PALETTE, STYLE_PALETTES } from '../render/furniture-art'
import { useGame } from '../store/game-store'

const at = { x: 20, y: 112 }, to = { x: 22, y: 113 }
function seed() {
  const base = legacyGame(CONTENT)
  const game = { ...base, clock: { day: 20, minute: 600 }, scenes: [], inv: { barrel: 1 },
    skills: { hookFinish: { day: 2, from: 'smith', picked: 'copper' } }, flags: { ...base.flags, 'skillFinish:barrel': 1 },
    player: { ...base.player, x: 20, y: 114, path: [] } }
  syncHome(game)
  useGame.getState().load(game)
  return game
}
const copper = () => chooseSkillStyle(seed(), 'hookFinish', 'copper')
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('009 대장간 나무통 마감의 설치와 실제 반응', () => {
  it('작업대의 구리색 선택은 시간·수량·능력치 없이 설치할 모습만 바꾼다', () => {
    const before = seed()
    render(<SkillCraftOptions />)
    const label = T.skill.lessons.hookFinish.styles.copper
    fireEvent.click(screen.getByRole('button', { name: label }))
    const selected = useGame.getState().game
    expect(selected.flags['skillFinish:barrel']).toBe(2)
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')
    expect(selected.inv).toEqual(before.inv)
    expect(selected.clock).toEqual(before.clock)
    expect(selected.stats).toEqual(before.stats)
    const placed = placeFurniture(selected, 'barrel', at)!
    expect(placed.room.find(f => f.item === 'barrel')?.finish).toBe('copper')
  })

  it('회전·가방 없는 이동·저장 복원은 놓인 구리 마감을 유지한다', () => {
    const placed = placeFurniture(copper(), 'barrel', at)!
    const turned = rotateFurniture(placed, placed.room.find(f => f.item === 'barrel')!)!
    const moved = moveFurniture(turned, turned.room.find(f => f.item === 'barrel')!, to)!
    expect(moved.room.find(f => f.item === 'barrel')).toMatchObject({ ...to, finish: 'copper', facing: 'right' })
    const restored = deserialize(serialize(moved), CONTENT)!
    expect(restored.room.find(f => f.item === 'barrel')).toEqual(moved.room.find(f => f.item === 'barrel'))
    expect(restored.skills).toEqual(moved.skills)
    expect(restored.flags['skillFinish:barrel']).toBe(2)
  })

  it('원래 색 선택은 이미 놓인 통을 바꾸지 않고 회수 뒤 다시 놓는 통에 적용된다', () => {
    const placed = placeFurniture(copper(), 'barrel', at)!
    const changed = chooseSkillStyle(placed, 'hookFinish', 'iron')
    expect(changed.room.find(f => f.item === 'barrel')?.finish).toBe('copper')
    const back = removeFurniture(changed, at)
    expect(back.inv.barrel).toBe(1)
    const again = placeFurniture(deserialize(serialize(back), CONTENT)!, 'barrel', to)!
    expect(again.room.find(f => f.item === 'barrel')?.finish).toBeUndefined()
    expect(again.inv.barrel ?? 0).toBe(0)
  })

  it.each(['down', 'right', 'up', 'left'] as const)('%s 실제 방향 그림에는 구리색 치환 픽셀이 존재한다', facing => {
    const sprite = facingArt('barrel', facing)!
    expect(sprite).toBeDefined()
    const style = STYLE_PALETTES.barrel.copper
    const changed = sprite.rows.join('').split('').filter(c => style[c] && style[c] !== FURNI_PALETTE[c])
    expect(changed.length).toBeGreaterThan(0)
  })

  it('설치한 나무통의 실제 탭은 수납·생산을 시작하지 않는 장식 가구 동작이다', () => {
    const placed = placeFurniture(copper(), 'barrel', at)!
    expect(isStorage('barrel')).toBe(false)
    expect(functionalAt(placed, at)).toBeNull()
    const tapped = tapTile(placed, at)
    expect(tapped.inv).toEqual(placed.inv)
    expect(tapped.act).toEqual(placed.act)
    expect(tapped.target).toEqual(placed.target)
  })
})
