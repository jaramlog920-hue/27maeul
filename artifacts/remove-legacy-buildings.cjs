const fs=require('fs');
const p='src/render/old-village-art.ts';let s=fs.readFileSync(p,'utf8');
const start=s.indexOf('/** 앞·뒤·옆');const end=s.indexOf('export const OLD_INTERIORS');
s=s.slice(0,start)+s.slice(end);
s=s.replace("import { settlementBuildingDetails } from './settlement-building-details'\n",'').replace("import type { Facing } from '../engine/types'\n",'');
fs.writeFileSync('src/render/village-shared-art.ts',s);
fs.writeFileSync(p,`// 구약 마을 자산의 호환 내보내기. 옛 공통 집 외관은 삭제하고 현재 그림만 생성한다.\nimport type { FurnitureArt } from './furniture-art'\nimport type { Facing } from '../engine/types'\nimport { BUILDING_LABELS } from './village-shared-art'\nimport { BUILDING_ART_PALETTE, BUILDING_FACINGS, completeBuildingArt, constructionBuildingArt } from './newland-building-art'\nexport { OLD_PROPS, OLD_PROP_LABELS, OLD_JOB_SIGNS, OLD_TERRAIN, OLD_INTERIORS, OLD_INTERIOR_SHELL, BUILDING_LABELS } from './village-shared-art'\nexport const OLD_VILLAGE_PALETTE = BUILDING_ART_PALETTE\nexport const OLD_BUILDINGS: Record<string, Record<Facing, FurnitureArt>> = {}\nexport const OLD_CONSTRUCTION: typeof OLD_BUILDINGS = {}\nfor (const id of Object.keys(BUILDING_LABELS)) {\n OLD_BUILDINGS[id] = Object.fromEntries(BUILDING_FACINGS.map(d => [d, completeBuildingArt(id,d)])) as Record<Facing,FurnitureArt>\n OLD_CONSTRUCTION[id] = Object.fromEntries(BUILDING_FACINGS.map(d => [d, {...constructionBuildingArt(id,d,'frame'),w:4,h:4}])) as Record<Facing,FurnitureArt>\n}\n`);
let n=fs.readFileSync('src/render/newland-building-art.ts','utf8');
n=n.replace('// 구약맵 도트 자산. 기존 건물·공사 판정·일과·저장 상태는 연결하지 않는다.','// 구약맵 현재 건물 그림. 지도·아이콘·이벤트·공사 미리보기가 같은 원본을 사용한다.');
n=n.replace("import { OLD_BUILDINGS,OLD_VILLAGE_PALETTE,BUILDING_LABELS } from './old-village-art'", "import { OLD_PROPS,OLD_VILLAGE_PALETTE,BUILDING_LABELS } from './village-shared-art'\nimport { drawNewlandHouse } from './newland-house-art'\nimport { drawLibraryExterior } from './house-exterior-art'\nimport { OT_LIBRARY_ROOF } from './library-roof-palette'\nimport type { FurnitureArt } from './furniture-art'\nimport { settlementBuildingDetails } from './settlement-building-details'");
n=n.replace('export const BUILDING_ART_PALETTE=', 'export const BUILDING_ART_PALETTE:Record<string,string>=');
n=n.replace('if(!OLD_BUILDINGS[id])','if(!BUILDING_LABELS[id])').replace("OLD_BUILDINGS[id][d].rows[y][x]", "completeBuildingArt(id,d).rows[y][x]");
const pos=n.indexOf('/** 완공 전 3단계.');
n=n.slice(0,pos)+`/** 승인된 주택·서고의 색을 정수 좌표 도트로 변환한다. DOM/canvas가 없어도 같은 원본이다. */
function nativeBuildingRows(id:string,d:Facing){
 const b=grid(), colors=new Map(Object.entries(BUILDING_ART_PALETTE).map(([key,color])=>[color,key]))
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){
  let key=colors.get(this.fillStyle)
  if(!key){key=String.fromCharCode(0x100+colors.size);colors.set(this.fillStyle,key);BUILDING_ART_PALETTE[key]=this.fillStyle}
  b.rect(x,y,w,h,key)
 }} as CanvasRenderingContext2D
 if(id==='archive')drawLibraryExterior(g,{x0:0,y0:0,x1:3,y1:3,doorX:2},OT_LIBRARY_ROOF)
 else drawNewlandHouse(g,id==='guest'?'guest':id==='gallery'?'gallery':'home',d)
 return b.rows()
}
/** 이전 공통 벽돌집/삼각지붕 생성기는 제거했다. 옛 저장도 현재 외관을 사용한다. */
export function completeBuildingArt(id:string,d:Facing):FurnitureArt {
 if(id in PROFESSION_STYLES){const a=professionBuildingArt(id as ProfessionBuilding,d);return {w:4,h:4,rows:a.rows}}
 if(id==='courtyard'||id==='garden'){
  const b=grid();b.rect(3,35,58,26,'U');b.rect(5,37,54,22,'u');b.rect(3,51,58,3,'w')
  for(const x of [4,58])b.rect(x,37,2,24,'W')
  for(const x of [7,46])b.rect(x,30,12,10,'g')
  for(const x of [9,50])b.rect(x,32,3,2,'p')
  b.paste((id==='garden'?OLD_PROPS.memoryMarker:OLD_PROPS.courtyardBench).rows,id==='garden'?25:16,40)
  return settlementBuildingDetails({w:4,h:4,rows:b.rows()},id,d)
 }
 if(!BUILDING_LABELS[id])throw new Error(\`없는 건물: \$\{id\}\`)
 return {w:4,h:4,rows:nativeBuildingRows(id,d)}
}

`+n.slice(pos);
fs.writeFileSync('src/render/newland-building-art.ts',n);
