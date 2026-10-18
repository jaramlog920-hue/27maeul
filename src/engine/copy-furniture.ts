/** 필사 전용 40종. 유아 → 어린이 → 나머지 순서로 영구 수집한다. */
export type CopyFurnitureCategory = 'infant' | 'child' | 'bath' | 'kitchen' | 'pet' | 'season'
export interface CopyFurnitureDesign {
  id: string
  name: string
  category: CopyFurnitureCategory
}

const group = <const T extends readonly (readonly [string, string])[]>(category: CopyFurnitureCategory, entries: T) =>
  entries.map(([id, name]) => ({ id: id as T[number][0], name, category }))

export const COPY_FURNITURE = [
  ...group('infant', [
    ['copyBabyWash', '유아 씻기대'],
    ['copyBabyMeal', '낮은 이유식상'],
    ['copyBabyNap', '천 덮개 낮잠자리'],
    ['copyBabyRail', '잡고 서는 난간'],
    ['copyBabyBall', '천 공 놀이자리'],
  ]),
  ...group('child', [
    ['copyChildPicture', '그림 맞추기 판'],
    ['copyChildShell', '조개 분류판'],
    ['copyChildWater', '작은 물길 놀이대'],
    ['copyChildPuppet', '천 인형극 무대'],
    ['copyChildBalance', '낮은 균형 디딤대'],
  ]),
  ...group('bath', [
    ['copyStoneBath', '낮은 돌 욕조'],
    ['copyFootBasin', '발 씻는 대야'],
    ['copyPouringJar', '물 붓는 항아리대'],
    ['copyBathStool', '목욕 걸상'],
    ['copyStoneSink', '돌 세면대'],
    ['copyWarmJar', '온수 저장 항아리'],
    ['copyClothesNiche', '옷 보관 벽감'],
    ['copyChangingScreen', '탈의 칸막이'],
  ]),
  ...group('kitchen', [
    ['copyBreadOven', '둥근 빵 화덕'],
    ['copyStoneCounter', '돌 조리대'],
    ['copyClaySteamer', '토기 찜솥'],
    ['copyVegetableBasin', '채소 씻는 수반'],
    ['copyFoodDryer', '음식 건조틀'],
    ['copyDishDrainer', '식기 물빼기대'],
    ['copyFermentShelf', '발효 항아리장'],
    ['copyDrinkingStand', '식수 보관대'],
  ]),
  ...group('pet', [
    ['copyPetArch', '아치형 잠자리'],
    ['copyPetJar', '항아리 숨숨집'],
    ['copyPetSteps', '낮은 오르내림대'],
    ['copyPetSand', '모래 파기 상자'],
    ['copyPetBall', '공 굴리는 놀이판'],
    ['copyPetWater', '돌 물그릇'],
    ['copyPetBath', '작은 목욕 대야'],
    ['copyPetBrush', '빗질 받침'],
  ]),
  ...group('season', [
    ['copySpringFlowers', '봄 들꽃 표본틀'],
    ['copySummerShells', '여름 조개 진열판'],
    ['copyAutumnLeaves', '가을 낙엽 액자'],
    ['copyWinterCones', '겨울 솔방울 장식대'],
    ['copySeasonMosaic', '사계절 모자이크판'],
    ['copySeasonSand', '계절 풍경 모래판'],
  ]),
]

export type CopyFurnitureId = typeof COPY_FURNITURE[number]['id']
export const isCopyFurniture = (id: string): id is CopyFurnitureId => COPY_FURNITURE.some(item => item.id === id)

/** 장 완료 기념 가구와 같은 25% 확률. 최초 완성만, 저장된 세계/책/장 기준으로 고정한다. */
export const COPY_FURNITURE_CHANCE = .25
export function copyFurnitureReward(flags: Readonly<Record<string, number>>, book: string, chapter: number, seed: number): CopyFurnitureId | null {
  let h = (2166136261 ^ (seed >>> 0)) >>> 0
  for (const c of `copy-furniture-v1:${book}:${chapter}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 }
  const random = () => { h = (h + 0x6d2b79f5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  return random() < COPY_FURNITURE_CHANCE ? selectCopyFurnitureReward(flags, random)?.id as CopyFurnitureId ?? null : null
}

const tier = (category: CopyFurnitureCategory): number => category === 'infant' ? 0 : category === 'child' ? 1 : 2
export const copyFurnitureFlag = (id: string): string => `copyFurniture:${id}`

/** 소지품 개수 대신 영구 획득 기록을 사용한다. 배치·선물·판매해도 수집 순서가 되돌아가지 않는다. */
export function copyFurnitureRewardPool(flags: Readonly<Record<string, number>>): readonly CopyFurnitureDesign[] {
  const missing = COPY_FURNITURE.filter(item => !(flags[copyFurnitureFlag(item.id)] > 0))
  const nextTier = missing.reduce((lowest, item) => Math.min(lowest, tier(item.category)), Infinity)
  return missing.filter(item => tier(item.category) === nextTier)
}

/** 보상 당첨 판정 이후 호출한다. 이 함수는 당첨 확률이나 다른 필사 보상을 변경하지 않는다. */
export function selectCopyFurnitureReward(flags: Readonly<Record<string, number>>, random: () => number): CopyFurnitureDesign | null {
  const pool = copyFurnitureRewardPool(flags)
  if (!pool.length) return null
  const roll = random()
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError('Furniture reward random must be in [0, 1)')
  return pool[Math.floor(roll * pool.length)]
}
