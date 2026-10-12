import {HOUSE_RECT,HOME_EXTERIOR_ADDITIONS, type House} from '../engine/world'

/** Draw the deep left wing and rear room first, with the unchanged main roof in front. */
export function homeRoofParts(h:House){
  const main={x0:HOUSE_RECT.x0,y0:HOUSE_RECT.y0,x1:HOUSE_RECT.x1,y1:HOUSE_RECT.y1-2,chimney:true}
  const parts:typeof main[]=[]
  // Once the living room is added, its ridge joins the rear room into one L-shaped roof.
  // The original main roof masks the overlap, preserving its exact pixels and entrance.
  if(h.x0<HOUSE_RECT.x0)parts.push({x0:HOME_EXTERIOR_ADDITIONS[2].x0,y0:HOME_EXTERIOR_ADDITIONS[2].y0,x1:HOME_EXTERIOR_ADDITIONS[0].x1,y1:HOUSE_RECT.y1-2,chimney:false})
  else if(h.y0<HOUSE_RECT.y0)parts.push({...HOME_EXTERIOR_ADDITIONS[0],chimney:false})
  if(h.x1>HOUSE_RECT.x1)parts.push({x0:HOUSE_RECT.x1+1,y0:HOUSE_RECT.y0+0.5,x1:h.x1,y1:HOUSE_RECT.y1-2,chimney:false})
  return [...parts,main]
}

export const HOME_ADDITION_PALETTE:Record<string,string>={r:'#c07058',R:'#a86048',h:'#cc8468',t:'#ba6c54',d:'#8f523d',w:'#f4e0c0',W:'#f0d8b0',s:'#dac0a5',k:'#ac7444',f:'#c68b54',l:'#c59a61',c:'#ffeaba',y:'#ffca70',g:'#a2cb78',p:'#ffc2a0',n:'#f6f8fa',N:'#dbe4eb',H:'#e0a974',K:'#9a6e45',U:'#c99566',D:'#654b38'}
type RoofPart=ReturnType<typeof homeRoofParts>[number]
/** Low attached roofs use the surrounding houses' plain tile bands and restrained eaves. */
export function homeAdditionArt(part:RoofPart){
  if(part.chimney)throw Error('The original main roof must keep its existing renderer')
  const width=(part.x1-part.x0+1)*16,height=(part.y1-part.y0+1)*16
  const a=Array.from({length:height},()=>Array<string>(width).fill('.'))
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{
    if(x<0||y<0||x+w>width||y+h>height)throw Error('Home addition outside footprint')
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)a[yy][xx]=c
  }
  const roofHeight=height,cap=part.x0>HOUSE_RECT.x1?2:4
  for(let y=0;y<roofHeight;y++){
    const inset=Math.max(0,cap-2*Math.floor(y/2))
    rect(inset,y,width-inset*2,1,y<2?'h':y<4?'R':'r')
    if(y>=4&&y<roofHeight-4){rect(inset,y,2,1,'R');rect(width-inset-2,y,2,1,'R')}
    if(y>=8&&y<roofHeight-4&&y%8<2)rect(inset+2,y,width-inset*2-4,1,'t')
  }
  rect(0,roofHeight-4,width,2,'R');rect(0,roofHeight-2,width,2,'d')
  return {rows:a.map(row=>row.join('')),palette:HOME_ADDITION_PALETTE}
}
export function homeAdditionSnowRows(part:RoofPart){
  return homeAdditionArt(part).rows.map((row,y)=>[...row].map((c,x)=>{
    if(!'rRhtd'.includes(c))return '.'
    if(y<6)return y>=4?'N':'n'
    return y%8<2&&(Math.floor(x/8)+Math.floor(y/8))%3===0?'n':'.'
  }).join(''))
}
/** Wide living-room window; the main house's original wall is never touched. */
export function livingRoomFacadeRows(){
  const a=Array.from({length:32},(_,y)=>Array<string>(32).fill(y<3?'s':y>=28?'W':'w'))
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)a[yy][xx]=c}
  rect(0,0,2,32,'W')
  // A restrained double window uses the original frame height, sill and flower-box colour.
  rect(6,17,20,9,'l');rect(7,18,18,7,'y')
  for(const x of [8,18])rect(x,18,3,3,'c')
  rect(15,18,2,7,'l');rect(7,21,18,1,'l')
  rect(5,26,22,2,'f')
  for(let x=7;x<25;x+=4)rect(x,25,2,1,x%3?'g':'p')
  return a.map(row=>row.join(''))
}

/** Replace only roof borders buried inside another roof, so the additions read as one house. */
export function homeRoofJoinRows(h:House){
  const ox=h.x0*16,oy=h.y0*16,width=(h.x1-h.x0+1)*16,height=(h.y1-h.y0+1)*16
  const a=Array.from({length:height},()=>Array<string>(width).fill('.'))
  const plane=(x:number,y:number,w:number,hh:number)=>{
    for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+w;xx++){
      const band=(yy-HOUSE_RECT.y0*16)%8
      a[yy-oy][xx-ox]=band===0||band===1?'t':'r'
    }
  }
  if(h.y0<HOUSE_RECT.y0){
    const start=h.x0<HOUSE_RECT.x0?HOUSE_RECT.x0:HOME_EXTERIOR_ADDITIONS[0].x0
    plane(start*16,HOUSE_RECT.y0*16,(HOME_EXTERIOR_ADDITIONS[0].x1-start+1)*16,4)
  }
  if(h.x0<HOUSE_RECT.x0)plane(HOUSE_RECT.x0*16,HOUSE_RECT.y0*16,2,28)
  if(h.x1>HOUSE_RECT.x1)plane((HOUSE_RECT.x1+1)*16-2,(HOUSE_RECT.y0+.5)*16,4,20)
  return a.map(row=>row.join(''))
}

/** Compact chimney sits on the near roof plane, with flashing at its foot. */
export function homeChimneyPosition(){return {x:HOUSE_RECT.x0*16+52,y:HOUSE_RECT.y0*16-2}}
export function homeChimneyRows(){
  return [
    '............',
    '............',
    '..KKDDDDKK..',
    '..KUUUUUUK..',
    '...HHHHUU...',
    '...HHHHUU...',
    '...HHHHUU...',
    '...UUUUUU...',
    '...HHHHUU...',
    '...HHHHUU...',
    '...HHHHUU...',
    '...HHHHUU...',
    '..RRRRRRRR..',
    '..rrrrrrrr..',
    '............',
    '............',
  ]
}

/** Review alternatives only; the live chimney stays unchanged until an option is chosen. */
export function homeChimneyOptions(){
  return [
    {id:1,label:'낮고 작은 굴뚝',description:'현재 위치 · 짧은 몸통 · 작은 입구',position:homeChimneyPosition(),rows:homeChimneyRows()},
    {id:2,label:'뒤쪽의 가는 굴뚝',description:'뒤쪽 지붕으로 이동 · 가늘고 긴 몸통',position:{x:84,y:42},rows:[
      '..........','..........','..KDDDDK..','..KUUUUK..',
      '...HHUU...','...HHUU...','...HHUU...','...HHUU...',
      '...UUUU...','...HHUU...','...HHUU...','...HHUU...',
      '...HHUU...','...UUUU...','...HHUU...','...HHUU...',
      '..RRRRRR..','..rrrrrr..','..........','..........',
    ]},
    {id:3,label:'왼쪽의 넓은 벽돌 굴뚝',description:'생활방 지붕으로 이동 · 넓은 몸통 · 벽돌 줄',position:{x:34,y:52},rows:[
      '............','............','.KKDDDDDDKK.','.KUUUUUUUUK.',
      '..HHHHHHUU..','..HHHHHHUU..','..HHHHHHUU..','..UUUUUUUU..',
      '..HHHHHHUU..','..HHHHHHUU..','..HHHHHHUU..','..UUUUUUUU..',
      '..HHHHHHUU..','..HHHHHHUU..','.RRRRRRRRRR.','.rrrrrrrrrr.',
      '............','............',
    ]},
  ]
}
