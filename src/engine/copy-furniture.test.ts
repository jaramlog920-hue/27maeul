import { COPY_FURNITURE, copyFurnitureFlag, copyFurnitureRewardPool, selectCopyFurnitureReward } from './copy-furniture'

it('keeps the approved 40 designs with five infant and five child rewards first', () => {
  expect(COPY_FURNITURE).toHaveLength(40)
  expect(new Set(COPY_FURNITURE.map(item => item.id)).size).toBe(40)
  expect(new Set(COPY_FURNITURE.map(item => item.name)).size).toBe(40)
  expect(COPY_FURNITURE.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.category]: (counts[item.category] ?? 0) + 1 }), {}))
    .toEqual({ infant: 5, child: 5, bath: 8, kitchen: 8, pet: 8, season: 6 })
})

it('collects infant five, then child five, then the other thirty without duplicates', () => {
  const flags: Record<string, number> = {}
  const received = new Set<string>()
  for (let count = 0; count < 40; count++) {
    // Exercise both ends of each eligible pool rather than relying on catalogue order.
    const item = selectCopyFurnitureReward(flags, () => count % 2 ? .999999 : 0)!
    expect(item.category === 'infant').toBe(count < 5)
    expect(item.category === 'child').toBe(count >= 5 && count < 10)
    expect(received.has(item.id)).toBe(false)
    received.add(item.id)
    flags[copyFurnitureFlag(item.id)] = 1
  }
  expect(received.size).toBe(40)
  expect(selectCopyFurnitureReward(flags, () => { throw new Error('No draw after completion') })).toBeNull()
})

it('preserves progress across saved records, including previously acquired later rewards', () => {
  const flags: Record<string, number> = { unrelated: 1 }
  for (const item of COPY_FURNITURE.filter(item => item.category !== 'child')) flags[copyFurnitureFlag(item.id)] = 1
  const restored = JSON.parse(JSON.stringify(flags)) as Record<string, number>
  expect(copyFurnitureRewardPool(restored).map(item => item.category)).toEqual(Array(5).fill('child'))
  const before = JSON.stringify(restored)
  selectCopyFurnitureReward(restored, () => .5)
  expect(JSON.stringify(restored)).toBe(before)
  // The last missing infant still blocks the child tier even when later prizes were acquired.
  delete restored[copyFurnitureFlag(COPY_FURNITURE[2].id)]
  expect(copyFurnitureRewardPool(restored).map(item => item.id)).toEqual([COPY_FURNITURE[2].id])
})

it('does not treat an unearned zero flag as collected, and rejects invalid random values', () => {
  expect(copyFurnitureRewardPool({ [copyFurnitureFlag(COPY_FURNITURE[0].id)]: 0 })).toHaveLength(5)
  for (const roll of [-1, 1, Infinity, NaN]) expect(() => selectCopyFurnitureReward({}, () => roll)).toThrow(RangeError)
})
