import {HOUSES,TILE} from '../engine/world'
import {HOUSE_STYLES,houseWallTile,drawRoof} from './house-exterior-art'

/** Reuse the village house itself, rather than the new-land profession workshop. */
export function drawFisherHouse(p:(x:number,y:number,c:string,w?:number,h?:number)=>void,left:number,bottom:number){
 const house=HOUSES.find(h=>h.id==='fisher')
 if(!house)return
 // Event actors use 2× native pixels; keep the house at the same scale.
 const scale=2,ox=left-house.x0*TILE*scale,oy=bottom-(house.y1+1)*TILE*scale
 const g={fillStyle:'',fillRect(x:number,y:number,w:number,h:number){p(x*scale+ox,y*scale+oy,this.fillStyle,w*scale,h*scale)}}
 for(let y=house.y1-1;y<=house.y1;y++)for(let x=house.x0;x<=house.x1;x++)houseWallTile(g,x,y,x===house.doorX&&y===house.y1?'D':'S','fisher',house)
 drawRoof(g,house.x0,house.y0,house.x1,house.y1-2,HOUSE_STYLES.fisher.roof)
}
