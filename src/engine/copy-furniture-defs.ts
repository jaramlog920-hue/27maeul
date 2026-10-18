import { COPY_FURNITURE, type CopyFurnitureId } from './copy-furniture'
import type { AdditionDef } from './furniture-additions'
import { copyFurnitureFacings } from './copy-furniture-views'

const wide = new Set<string>(['copyBabyWash','copyBabyNap','copyBabyRail','copyChildWater','copyChildPuppet','copyChildBalance','copyStoneBath','copyStoneCounter','copyFoodDryer','copyDishDrainer','copyFermentShelf','copyChangingScreen','copyPetSteps','copySeasonMosaic','copySeasonSand'])
const wall = new Set<string>(['copyClothesNiche','copySpringFlowers','copySummerShells','copyAutumnLeaves'])
const floor = new Set<string>(['copyBabyNap','copyBabyBall','copyChildPicture','copyChildShell','copyChildBalance','copyPetArch','copyPetJar','copyPetSand','copyPetBall','copyPetWater','copyPetBath'])
export const COPY_FURNITURE_DEFS = Object.fromEntries(COPY_FURNITURE.map(item => [item.id, {
  name: item.name, w: wide.has(item.id) ? 2 : 1,
  layer: wall.has(item.id) ? 'wall' : floor.has(item.id) ? 'floor' : 'solid',
  use: 'copyFurniture', coins: 0,
  desc: `필사로만 얻는 ${item.category === 'infant' ? '유아용' : item.category === 'child' ? '어린이용' : '생활·전시용'} 수집 가구. ${copyFurnitureFacings(item.id).length > 1 ? '가로·세로로 놓을 수 있다.' : '정면 형태를 유지해 놓는다.'}`,
}])) as Record<CopyFurnitureId, AdditionDef>
