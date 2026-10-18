import type {Facing} from '../engine/types'
import {pixels as nativePixels} from './home-space-art'

function elevation(rects:Parameters<typeof nativePixels>[2]){
 const w=Math.max(...rects.map(r=>r[1]+r[3])),h=Math.max(...rects.map(r=>r[2]+r[4]))
 return {rows:nativePixels(Math.ceil(w/16),Math.ceil(h/16),rects).rows.slice(0,h).map(row=>row.slice(0,w))}
}

// Event-camera elevations. These are not map sprites: tops are short horizontal
// edges, and fronts/legs carry the height seen by the people in the cut.
const desk=elevation([['k',0,2,30,3],['l',1,2,28,1],['W',2,5,26,4],['w',3,5,24,2],['W',2,9,3,11],['W',25,9,3,11],['l',3,9,1,10],['l',26,9,1,10]])
const table=elevation([['k',0,1,30,3],['l',1,1,28,1],['W',2,4,26,3],['W',3,7,3,13],['W',24,7,3,13],['l',4,7,1,12],['l',25,7,1,12]])
const shelf=elevation([['W',0,0,30,34],['w',2,2,26,29],['k',2,3,26,12],['k',2,18,26,12],['l',2,15,26,2],['l',2,30,26,2],['c',4,5,4,9],['b',9,4,4,10],['C',14,6,4,8],['r',20,4,5,10],['b',4,20,5,9],['c',11,21,4,8],['C',17,20,7,9],['W',2,32,3,2],['W',25,32,3,2]])
const bed=elevation([['W',0,0,28,4],['l',1,0,26,1],['w',1,4,26,3],['c',3,5,22,3],['b',1,8,26,8],['B',1,14,26,2],['W',0,16,28,3],['l',1,16,26,1],['W',1,19,3,3],['W',24,19,3,3]])
const bedSide=elevation([['W',0,0,3,21],['l',1,1,1,17],['c',3,7,8,4],['b',11,8,23,9],['B',11,15,23,2],['W',3,17,33,3],['l',3,17,32,1],['W',4,20,3,2],['W',31,20,3,2],['W',34,9,2,11]])
const hearth=elevation([['s',4,0,20,3],['S',2,3,24,25],['s',3,4,22,23],['S',7,10,14,16],['S',9,8,10,2],['W',9,12,10,13],['k',10,13,8,12],['r',12,19,4,5],['y',13,17,2,5],['S',0,27,28,3],['s',1,27,26,1]])
const chair=elevation([['W',1,0,14,3],['l',2,0,12,1],['W',1,3,2,10],['W',13,3,2,10],['w',3,4,10,5],['k',0,13,16,3],['l',1,13,14,1],['W',1,16,3,8],['W',12,16,3,8]])
const chairSide=elevation([['W',0,0,3,23],['l',1,0,1,14],['w',3,13,12,3],['l',3,13,12,1],['W',12,16,3,7],['W',3,16,2,7]])
const stool=elevation([['k',0,0,18,3],['l',1,0,16,1],['W',2,3,3,12],['W',13,3,3,12],['w',4,9,10,2]])
// Separate elevations follow the native views (down/front, up/back, right/side).
// The cabinet's bottom structural frame is not an exposed shelf surface;
// the closed back and side never acquire invented books or open compartments.
const shelfBack=elevation([['W',0,0,30,34],['w',2,2,26,28],['k',7,3,1,26],['k',14,3,1,26],['k',21,3,1,26],['W',2,16,26,2],['l',2,30,26,2],['W',2,32,3,2],['W',25,32,3,2]])
const shelfSide=elevation([['W',0,0,20,34],['w',2,2,16,28],['k',5,4,1,25],['k',15,4,1,25],['W',2,16,16,2],['l',2,30,16,2],['W',2,32,3,2],['W',15,32,3,2]])
const deskBack=elevation([['k',0,2,30,3],['l',1,2,28,1],['w',2,5,26,5],['W',2,9,3,11],['W',25,9,3,11],['W',4,14,22,2],['W',8,5,1,5],['W',21,5,1,5]])
const deskSide=elevation([['k',0,2,18,3],['l',1,2,16,1],['w',2,5,14,4],['W',2,9,3,11],['W',13,9,3,11],['W',4,14,10,2]])
const tableSide=elevation([['k',0,1,18,3],['l',1,1,16,1],['W',2,4,14,3],['W',2,7,3,13],['W',13,7,3,13]])
const bedBack=elevation([['W',0,0,28,4],['w',1,4,26,4],['b',2,5,24,3],['W',0,8,28,11],['w',2,10,24,7],['k',8,10,1,7],['k',19,10,1,7],['l',1,8,26,1],['W',1,19,3,3],['W',24,19,3,3]])
const hearthBack=elevation([['S',4,0,20,3],['S',2,3,24,25],['s',3,4,22,23],['S',3,13,22,2],['S',10,4,2,9],['S',17,15,2,12],['S',0,27,28,3]])
const hearthSide=elevation([['S',3,0,14,3],['S',1,3,18,25],['s',2,4,16,23],['S',2,13,16,2],['S',12,4,2,9],['W',16,17,2,9],['S',0,27,20,3]])
const chairBack=elevation([['W',1,0,14,3],['l',2,0,12,1],['w',1,3,14,13],['W',5,3,1,12],['W',10,3,1,12],['W',1,16,3,8],['W',12,16,3,8]])

/** Null means a small upright ornament whose original directional art can be enlarged. */
export function storyRoomFurnitureArt(id:string,facing:Facing='down'):{rows:readonly string[]}|null{
 let art: {rows:readonly string[]}|null=null
 const side=facing==='left'||facing==='right',back=facing==='up'
 if(['homeBed','bed'].includes(id))art=side?bedSide:back?bedBack:bed
 else if(['homeDesk','homeWorkbench','desk','workbench','writingDesk','copyDesk'].includes(id))art=side?deskSide:back?deskBack:desk
 else if(['table','diningTable','lowTable','teaTable'].includes(id))art=side?tableSide:table
 else if(['homeShelf','bookcase','shelf','bookshelf'].includes(id))art=side?shelfSide:back?shelfBack:shelf
 else if(id==='homeHearth'||id==='hearth')art=side?hearthSide:back?hearthBack:hearth
 else if(id==='chair')art=side?chairSide:back?chairBack:chair
 else if(id==='stool')art=stool
 if(!art)return null
 return {rows:facing==='left'?art.rows.map(r=>[...r].reverse().join('')):art.rows}
}

export function enlargeStoryOrnament(rows:readonly string[]){
 return rows.flatMap(row=>{const enlarged=[...row].map(ch=>ch.repeat(2)).join('');return [enlarged,enlarged]})
}
