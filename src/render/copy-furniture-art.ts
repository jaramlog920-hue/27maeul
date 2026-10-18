import { COPY_FURNITURE, type CopyFurnitureId } from '../engine/copy-furniture'
import { COPY_FURNITURE_DEFS } from '../engine/copy-furniture-defs'
import type { Facing } from '../engine/types'
import type { FurnitureArt } from './furniture-art'
import type { DirectionalFurnitureArt } from './home-space-directions'
import { copyFurnitureFacing, copyFurnitureFacings } from '../engine/copy-furniture-views'

export const COPY_FURNITURE_ACTION: Record<CopyFurnitureId, string> = {
  copyBabyWash:'물을 떠서 씻기고 수건으로 닦기', copyBabyMeal:'이유식을 떠서 먹이기', copyBabyNap:'눕히고 천 이불 덮기', copyBabyRail:'난간을 잡고 일어섰다가 앉기', copyBabyBall:'앉아서 천 공 밀기',
  copyChildPicture:'그림 조각 맞추기', copyChildShell:'조개를 홈마다 분류하기', copyChildWater:'물을 부어 수문 열기', copyChildPuppet:'천 인형을 번갈아 올려 공연하기', copyChildBalance:'디딤판을 하나씩 건너기',
  copyStoneBath:'물 떠서 욕조에 붓기',copyFootBasin:'발을 담그고 물결 일으키기',copyPouringJar:'항아리를 기울여 물 따르기',copyBathStool:'걸상에 앉아 수건 펼치기',copyStoneSink:'손을 씻고 물 털기',copyWarmJar:'뚜껑을 열고 따뜻한 물 뜨기',copyClothesNiche:'접은 천을 꺼내 정리하기',copyChangingScreen:'칸막이 천을 걷었다 내리기',
  copyBreadOven:'화덕에 빵을 넣고 꺼내기',copyStoneCounter:'채소를 올리고 썰어 모으기',copyClaySteamer:'찜솥 뚜껑을 들어 김 빼기',copyVegetableBasin:'채소를 흔들어 씻기',copyFoodDryer:'건조틀에 식재료 널기',copyDishDrainer:'그릇을 씻어 엎어 놓기',copyFermentShelf:'항아리 덮개를 열어 살피기',copyDrinkingStand:'잔에 물을 따라 내려놓기',
  copyPetArch:'잠자리에 들어가 몸을 둥글게 말기',copyPetJar:'숨숨집에 들어갔다 고개 내밀기',copyPetSteps:'낮은 계단 오르내리기',copyPetSand:'앞발로 모래 파기',copyPetBall:'앞발로 홈 속 공 굴리기',copyPetWater:'고개를 숙여 물 마시기',copyPetBath:'얕은 대야에서 발 씻기',copyPetBrush:'등을 빗고 빗 털기',
  copySpringFlowers:'표본틀을 열어 꽃잎 살펴보기',copySummerShells:'조개를 옮겨 진열하기',copyAutumnLeaves:'낙엽 눌러 액자에 고정하기',copyWinterCones:'솔방울 장식 돌려 살피기',copySeasonMosaic:'계절 타일 맞추기',copySeasonSand:'모래판에 계절 풍경 그리기',
}

/** Native 16px/tile originals. Upright objects remain upright in side views;
 * only their depth/footprint changes. Motion changes working parts, never the camera. */
export function copyFurnitureObjectFrame(id: CopyFurnitureId, facing: Facing, frame = 0): FurnitureArt {
  facing = copyFurnitureFacing(id, facing)
  if (facing === 'left') { const a = copyFurnitureObjectFrame(id, 'right', frame); return { ...a, rows: a.rows.map(r => [...r].reverse().join('')) } }
  const def = COPY_FURNITURE_DEFS[id], side = facing === 'right', rear = facing === 'up'
  const w = side ? 1 : def.w, h = side ? def.w : 1, W = w * 16, H = h * 16
  const a = Array.from({ length: H }, () => Array<string>(W).fill('.'))
  const p = ((Math.trunc(frame) % 4) + 4) % 4, shift = [0,1,2,0][p], y = H - 16
  const r = (c:string,x:number,yy:number,ww:number,hh:number) => {
    // A two-tile footprint is clearance, not a requirement to stretch a small baby/pet prop to 32px.
    const inset = W === 32 ? 3 : 0, scale = W === 32 ? 26/32 : 1
    const left = Math.round(x*scale)+inset, right = Math.round((x+ww)*scale)+inset
    for (let dy=0;dy<hh;dy++) for(let xx=left;xx<right;xx++) if(a[yy+dy]?.[xx]!==undefined)a[yy+dy][xx]=c
  }
  const bed = (c='b') => {r('k',1,y+9,W-2,6);r('w',2,y+8,W-4,6);r(c,3,y+10,W-6,3);r('C',3,y+9,3,3);r('W',2,y+14,W-4,1)}
  const tray = (c='l',top=11) => {r('W',1,y+top,W-2,4);r(c,2,y+top,W-4,2);r('k',1,y+top,1,3);r('k',W-2,y+top,1,3)}
  const table = (c='l',top=8) => {r('W',2,y+top+3,2,12-top);r('W',W-4,y+top+3,2,12-top);r('k',1,y+top,W-2,3);r(c,2,y+top,W-4,1)}
  const basin = (c='s',top=9) => {r('S',1,y+top+1,W-2,5);r(c,2,y+top,W-4,5);r('C',3,y+top,W-6,1);r('B',3,y+top+1,W-6,2);r('b',4+(shift%2),y+top+1,Math.max(2,W-10),1);r('S',3,y+top+5,W-6,1)}
  const jar = (x:number,top:number,c='r',ww=8) => {r('W',x+2,y+top,ww-4,2);r(c,x+1,y+top+2,ww-2,7-top);r('R',x+2,y+8,ww-4,2);r('l',x+2,y+top+2,1,Math.max(1,6-top));r('C',x+2,y+top-(p===1?1:0),ww-4,1)}
  const water = (x:number,top:number) => {if(p===1||p===2){r('b',x,y+top,1,3+p);r('c',x-2,y+top+3+p,1,1);r('b',x+2,y+top+2+p,1,1)}}
  const cloth = (x:number,top:number,c='C') => {r(c,x,y+top,5,2);r('c',x+1,y+top,3,1);r('W',x,y+top+2,5,1)}
  const motif = (x:number,top:number,c='g') => {r(c,x+1,y+top,1,4);r(c,x,y+top+1,3,1);r('y',x+1,y+top+1,1,1)}
  r('z',1,H-1,W-2,1)
  // A long side has separately drawn receding supports, not a rotated front sprite.
  if(side&&h===2&&['copyBabyRail','copyChildBalance','copyPetSteps','copyStoneBath'].includes(id)){r('W',2,12,1,H-14);r('W',13,12,1,H-14);r('l',3,12,10,1)}
  switch(id){
    case 'copyBabyWash': table('C',9);basin('w',6);cloth(W-8,4,'C');water(5,3);break
    case 'copyBabyMeal': r('b',1,y+13,5,2);r('W',9,y+12,1,3);r('W',14,y+12,1,3);r('k',8,y+10,8,2);r('l',8,y+10,8,1);r('C',11,y+8,3,2);r('r',12,y+8,1,1);break
    case 'copyBabyNap': bed('b');r('C',7,y+9,W-10,3+(p>=2?1:0));r('B',8,y+11,W-12,1);break
    case 'copyBabyRail': tray('C',13);r('W',2,y+9,2,6);r('W',W-4,y+9,2,6);r('l',2,y+11,W-4,2);for(let x=6;x<W-4;x+=4)r('w',x,y+12,1,2);r('r',W-7,y+10-shift%2,2,2);break
    case 'copyBabyBall': tray('b',12);r('p',4+shift*2,y+9,3,3);r('C',5+shift*2,y+9,1,1);break
    case 'copyChildPicture': tray('C');r('b',3,y+10,4,2);r('g',7,y+10,4,2);r('y',4+shift,y+9,3,2);r('r',11,y+11,2,2);break
    case 'copyChildShell': tray('l');for(let x=3;x<13;x+=4){r('W',x,y+11,3,1);r('C',x,y+10,2,1)}r('p',3+shift*3,y+9,2,2);break
    case 'copyChildWater': table('s',10);r('B',2,y+9,W-4,2);r('b',3+shift*2,y+9,4,1);r('W',W-7,y+6-(p===2?1:0),2,5);water(W-9,6);break
    case 'copyChildPuppet': r('W',2,y+2,2,13);r('W',W-4,y+2,2,13);r('l',2,y+2,W-4,2);r('R',4,y+4,3,7);r('r',W-7,y+4,3,7);r('k',4,y+11,W-8,3);r('b',8,y+8-shift,3,4);r('C',9,y+7-shift,2,2);r('p',W-12,y+7+(shift%2),3,4);r('C',W-11,y+6+(shift%2),2,2);break
    case 'copyChildBalance': tray('g',13);for(let x=2;x<W-2;x+=7){r('W',x,y+11,5,3);r('l',x,y+10,5,2)}r('C',2+shift*7,y+9,3,1);break
    case 'copyStoneBath': basin('s',7);r('S',3,y+13,W-6,2);water(W-6,4);break
    case 'copyFootBasin': basin('r',9);water(6,6);break
    case 'copyPouringJar': table('l',11);jar(3,2);r('R',5,y+10,4,1);r('b',10,y+8+shift%2,2,1);water(11,7);break
    case 'copyBathStool': table('w',9);cloth(5+shift%2,7);break
    case 'copyStoneSink': table('s',10);basin('s',6);r('S',11,y+2,2,4);r('s',8,y+2,4,1);water(8,3);break
    case 'copyWarmJar': table('s',12);jar(4,3,'r');r('R',6,y+10,4,2);r('C',7,y+1-shift%2,3,1);water(3,7);break
    case 'copyClothesNiche': r('S',2,y+1,12,14);r('s',3,y+2,10,12);r('W',4,y+4,8,8);cloth(5,y<0?0:6);r('b',5+shift%2,y+9,5,2);r('C',4,y+3,8,1);break
    case 'copyChangingScreen': for(let x=2;x<W-2;x+=Math.max(5,Math.floor(W/3))){r('W',x,y+1,1,14);r('C',x+1,y+2,Math.max(3,Math.floor(W/3)-2),11);r('l',x+2,y+2,1,10)}r('p',3+shift,y+3,2,9);break
    case 'copyBreadOven': r('S',1,y+6,14,9);r('s',2,y+4,12,10);r('s',4,y+2,8,3);r('C',5,y+3,6,1);r('W',4,y+9,8,5);r('R',5,y+12,6,2);r('y',5+shift,y+11,2,2);r('l',5,y+10,5,1);break
    case 'copyStoneCounter': table('s',7);r('C',4,y+7,8,1);for(let x=5;x<W-6;x+=4)r('g',x+shift%2,y+5,2,2);r('S',W-7,y+4,1,3);break
    case 'copyClaySteamer': table('w',12);r('R',3,y+7,10,5);r('r',4,y+5,8,6);r('C',3,y+4-shift%2,10,2);r('W',7,y+3-shift%2,2,1);if(p)r('c',5+shift,y+1,1,2);break
    case 'copyVegetableBasin': basin('s',9);motif(5+shift%2,6);water(10,7);break
    case 'copyFoodDryer': table('l',5);r('W',2,y+1,2,14);r('W',W-4,y+1,2,14);r('l',3,y+2,W-6,1);for(let x=5;x<W-4;x+=5){r('C',x,y+3,1,5);r('r',x-1,y+6+shift%2,3,2)}break
    case 'copyDishDrainer': table('l',11);for(let x=3;x<W-3;x+=5){r('W',x,y+5,1,7);r('C',x+1,y+6,2,5)}r('b',4+shift*2,y+12,2,1);break
    case 'copyFermentShelf': table('w',10);for(let x=3;x<W-5;x+=9)jar(x,4,x%2?'r':'b');r('C',4+shift,y+2,4,1);break
    case 'copyDrinkingStand': table('l',12);jar(1,3,'b');r('B',3,y+10,4,2);r('C',11,y+10-shift%2,3,3);water(10,7);break
    case 'copyPetArch': bed('p');r('W',2,y+3,2,9);r('W',12,y+3,2,9);r('w',4,y+1,8,3);r('l',5,y+1,6,1);r('p',5+shift%2,y+11,4,2);break
    case 'copyPetJar':
      // A real doorway, tall and wide enough for the native front-facing pet.
      // The old 6x6 opening could only receive the nose of an adult dog.
      r('R',1,y+3,14,12);r('r',2,y+1,12,13);r('C',5,y,6,2)
      r('W',3,y+3,10,12);r('p',4,y+14,8,1);r('l',2,y+4,1,8);break
    case 'copyPetSteps': for(let x=2;x<W-2;x+=7){const top=12-Math.floor(x/7)*2;r('W',x,y+top,7,15-top);r('l',x,y+top,6,1)}r('p',4+shift*3,y+9,2,1);break
    case 'copyPetSand': tray('s',10);r('l',3,y+10,W-6,2);r('W',4+shift*2,y+11,2,1);r('y',6+shift,y+9,1,1);break
    case 'copyPetBall': tray('l',11);r('W',3,y+11,10,1);r('b',3+shift*3,y+10,2,2);r('C',4+shift*3,y+10,1,1);break
    case 'copyPetWater': basin('s',10);break
    case 'copyPetBath': basin('b',9);water(5,6);break
    case 'copyPetBrush': table('C',11);r('W',4+shift,y+8,5,2);r('l',5+shift,y+9,3,2);break
    case 'copySpringFlowers':r('k',1,y+1,14,13);r('l',2,y+2,12,11);r('C',3,y+3,10,9);motif(5,5,'g');motif(9,6,'G');r('p',5+shift%2,y+5,3,2);break
    case 'copySummerShells':r('k',1,y+3,14,11);r('w',2,y+4,12,9);for(let x=3;x<12;x+=4){r('C',x,y+6,3,2);r('p',x,y+10,2,2)}r('c',3+shift*3,y+5,2,1);break
    case 'copyAutumnLeaves':r('W',1,y+2,14,12);r('l',2,y+3,12,10);r('C',3,y+4,10,8);motif(5,5,'R');motif(9,7,'y');r('r',6+shift%2,y+5,2,1);break
    case 'copyWinterCones':table('s',12);r('W',3,y+9,10,3);for(let x=4;x<12;x+=4){r('k',x,y+5,3,6);r('w',x+1,y+4,1,5);r('l',x,y+6+shift%2,3,1)}break
    case 'copySeasonMosaic':table('s',10);for(let x=3;x<W-3;x+=4){r(['g','b','r','C'][Math.floor(x/4)%4],x,y+8,3,3)}r('y',4+shift*3,y+7,3,2);break
    case 'copySeasonSand':table('w',10);r('l',2,y+8,W-4,3);r('g',3,y+9,5,1);r('B',W-9,y+9,5,1);r('W',9+shift*2,y+8,1,2);break
  }
  // A cabinet's rear is a closed backing. Wall displays remain attached faces.
  if(rear&&['copyFermentShelf','copyFoodDryer','copyChildPuppet'].includes(id)){r('W',2,y+3,W-4,11);r('w',3,y+4,W-6,9);r('l',4,y+4,1,9);r('k',3,y+12,W-6,1)}
  if(side){r('W',2,y+13,1,2);r('l',3,y+13,1,1)}
  return { w,h,rows:a.map(row=>row.join('')) }
}

export const COPY_FURNITURE_DIRECTIONS = Object.fromEntries(COPY_FURNITURE.map(({id}) => {
  const originals = Object.fromEntries(copyFurnitureFacings(id).map(f => [f,copyFurnitureObjectFrame(id,f)]))
  // Compatibility aliases for old saves are references, not invented rear/side drawings.
  return [id,Object.fromEntries((['down','up','left','right'] as const).map(f=>[f,originals[copyFurnitureFacing(id,f)]]))]
})) as Record<CopyFurnitureId,DirectionalFurnitureArt>
export const COPY_FURNITURE_ART = Object.fromEntries(COPY_FURNITURE.map(({id}) => [id,COPY_FURNITURE_DIRECTIONS[id].down])) as Record<CopyFurnitureId,FurnitureArt>
