import { OLD_VILLAGE_PALETTE } from './old-village-art'
export const BOUNDARY_PALETTE={...OLD_VILLAGE_PALETTE,J:'#765746',P:'#ead7b2'}
export const BOUNDARY_MATERIALS=['wood','stone'] as const
export type BoundaryMaterial=typeof BOUNDARY_MATERIALS[number]
export const BOUNDARY_BITS={north:1,east:2,south:4,west:8} as const
function grid(){const p=Array.from({length:16},()=>Array<string>(16).fill('.'));const dot=(x:number,y:number,c:string)=>{if(p[y]?.[x]!==undefined)p[y][x]=c};const rect=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)dot(xx,yy,c)};return {dot,rect,rows:()=>p.map(r=>r.join(''))}}
/** NESW 비트로 이웃한 경계를 연결한다. 독립·끝·일자·모서리·T·교차 총 16조각. */
export function boundaryRows(material:BoundaryMaterial,mask:number){
 const b=grid(),r=b.rect,m=Math.trunc(mask)&15,wood=material==='wood'
 if(wood){
  for(const [bit,x,w]of [[8,0,8],[2,8,8]])if(m&bit){r(x,6,w,2,'W');r(x,6,w,1,'l');r(x,10,w,2,'w')}
  for(const [bit,y,h]of [[1,0,8],[4,8,8]])if(m&bit){r(7,y,2,h,'W');r(7,y,1,h,'l');r(10,y,1,h,'w')}
  r(6,3,4,11,'W');r(7,4,2,9,'w');r(6,3,4,2,'l');r(8,6,1,6,'l');r(6,14,5,1,'z')
 }else{
  for(const [bit,x,w]of [[8,0,8],[2,8,8]])if(m&bit){r(x,7,w,7,'S');r(x,7,w,1,'u');r(x,8,w,5,'s');r(x,11,w,1,'S');for(let xx=x+3;xx<x+w-1;xx+=4)r(xx,8,1,3,'S')}
  for(const [bit,y,h]of [[1,0,8],[4,8,8]])if(m&bit){r(5,y,6,h,'S');r(5,y,1,h,'u');r(6,y,4,h,'s');for(let yy=y+3;yy<y+h-1;yy+=4)r(6,yy,4,1,'S')}
  r(5,6,6,8,'S');r(6,7,4,6,'s');r(4,5,8,2,'u');r(5,5,6,1,'P');r(5,14,7,1,'z')
 }
 return b.rows()
}
export function boundaryGateFrame(material:BoundaryMaterial,axis:'horizontal'|'vertical',action:'open'|'close',frame:number){
 const f=Math.max(0,Math.min(3,Math.trunc(frame))),phase=action==='close'?3-f:f,b=grid(),r=b.rect,wood=material==='wood',width=[5,4,2,1][phase]
 for(const x of [1,13]){r(x,4,2,10,wood?'W':'S');r(x,4,2,2,wood?'l':'u');r(x,6,1,7,wood?'w':'s')}
 for(const x of [0,15]){
  if(wood){r(x,6,1,2,'W');b.dot(x,6,'l');r(x,10,1,2,'w')}
  else{r(x,7,1,7,'S');b.dot(x,7,'u');r(x,8,1,5,'s');b.dot(x,11,'S')}
 }
 for(const [x,w]of [[3,width],[13-width,width]]){r(x,6,w,6,'W');r(x,6,w,1,'l');r(x,10,w,1,'w');for(let xx=x+1;xx<x+w;xx+=2)r(xx,7,1,3,'l')}
 if(phase===0){r(7,9,2,1,'S');r(8,8,1,3,'S')}
 let rows=b.rows()
 if(axis==='vertical'){
  rows=Array.from({length:16},(_,y)=>Array.from({length:16},(_,x)=>rows[x][y]).join(''))
  for(const y of [0,15]){
   const edge=Array<string>(16).fill('.')
   if(wood){edge[7]='l';edge[8]='W';edge[10]='w'}else{edge[5]='u';for(let x=6;x<10;x++)edge[x]='s';edge[10]='S'}
   rows[y]=edge.join('')
  }
 }
 return {rows,back:rows.map((r,y)=>y<10?r:'.'.repeat(16)),front:rows.map((r,y)=>y>=10?r:'.'.repeat(16)),width:16,height:16,anchor:{x:8,y:16},duration:200,loop:false,opening:phase===0?0:phase===1?2:phase===2?6:8,axis,material}
}
