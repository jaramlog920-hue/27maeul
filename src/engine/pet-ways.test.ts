import { adopt, interactPet, petWays, sanitizeCompanion } from './companion'

describe('반려동물의 성향과 확인한 경험', () => {
  const pet = adopt('cat', '나비', 2, { x: 1, y: 8 })
  it('옛 저장의 성향을 이름과 입양일로 복원하고 저장 후 유지한다', () => {
    const old = { ...pet, ways: undefined }
    expect(sanitizeCompanion(old)?.ways).toEqual(petWays(old))
    expect(sanitizeCompanion(JSON.parse(JSON.stringify(sanitizeCompanion(old))))?.ways).toEqual(pet.ways)
  })
  it('범위를 벗어난 성향과 잘못된 관찰 기록은 보존하지 않는다', () => {
    const malformed = { ...pet, ways: { curious: 99, distance: -1, energy: NaN }, moments: { play: 0, rest: 3 } }
    expect(sanitizeCompanion(malformed)?.ways).toEqual(pet.ways)
    expect(sanitizeCompanion(malformed)?.moments).toEqual({ rest: 3 })
  })
  it('함께하기에 반응 간격이 있고 첫 경험 날짜는 덮어쓰지 않는다', () => {
    const first = interactPet(pet, 'play', 3, 600)!
    expect(interactPet(first, 'play', 3, 610)).toBeNull()
    const again = interactPet(first, 'play', 4, 600)!
    expect(again.moments?.play).toBe(3)
    expect(again.found).toEqual(['play'])
    expect(again.stay).toBe(pet.stay)
  })
})
