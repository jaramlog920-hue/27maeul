// 새 터 울타리·돌담과 문 (2026-10-22): 울타리·돌담은 길을 막고 문은 지나간다, 이름·값이 있다
import { emptyNewland, overlayFor } from './newland-build'
import { BOUNDARY_KINDS, DECOR_KINDS, SITES, blocksWay, boundaryMaterial } from './newland-sites'
import ko from '../content/lang/ko.json'

it('울타리·돌담은 막고, 문은 지나갈 수 있다', () => {
  const nl = { ...emptyNewland(), tiles: { '5,12': 'woodFence', '6,12': 'woodGate', '7,12': 'stoneWall', '8,12': 'stoneGate' } as never }
  const o = overlayFor(nl)
  expect(o.get('5,12')).toBe('S')
  expect(o.get('7,12')).toBe('S')
  expect(o.get('6,12')).toBe('.')
  expect(o.get('8,12')).toBe('.')
  expect(blocksWay('woodGate')).toBe(false)
})

it('꾸미기 목록에 있고, 이름·값·재료가 정해져 있다', () => {
  for (const k of BOUNDARY_KINDS) {
    expect(DECOR_KINDS).toContain(k)
    expect(SITES[k].cost.coins).toBeGreaterThan(0)
    expect((ko as { decor: Record<string, string> }).decor[k], k).toBeTruthy()
  }
  expect(boundaryMaterial('woodGate')).toBe('wood')
  expect(boundaryMaterial('stoneWall')).toBe('stone')
})
