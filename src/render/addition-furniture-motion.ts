import type { Facing } from '../engine/types'
import type { FurnitureArt } from './furniture-art'
import { ADDITION_FURNITURE_DIRECTIONS } from './addition-furniture-directions'
import { motionBodyRows } from './motion-body'
import type { SpriteOpts, Who } from './sprites'

export const ADDITION_USE_ACTIONS = ['rock','sew','knead','washFace','harp','paint','washDishes','mill','waterPlant','tuckDoll','pushCart'] as const
export type AdditionUseAction = typeof ADDITION_USE_ACTIONS[number]
export const ADDITION_USE_INFO: Record<AdditionUseAction,{label:string;furniture:string;duration:readonly number[]}> = {
  rock:{label:'흔들의자에서 쉬기',furniture:'rockingChair',duration:[380,380,380,380]},
  sew:{label:'바늘 움직이고 실 당기기',furniture:'sewingTable',duration:[240,200,420,240]},
  knead:{label:'반죽 누르고 접기',furniture:'kneadingTable',duration:[260,220,280,220]},
  washFace:{label:'물 뜨고 얼굴 씻고 닦기',furniture:'washstand',duration:[320,240,420,340]},
  harp:{label:'하프 현 번갈아 뜯기',furniture:'smallHarp',duration:[240,240,240,240]},
  paint:{label:'붓 찍고 꽃 그리기',furniture:'drawingDesk',duration:[320,220,300,240]},
  washDishes:{label:'그릇 문지르고 헹구기',furniture:'dishwashingTable',duration:[300,220,280,320]},
  mill:{label:'맷돌 손잡이 돌리기',furniture:'millstoneStand',duration:[220,220,220,220]},
  waterPlant:{label:'화분에 물 주고 잎 살피기',furniture:'plantSteps',duration:[300,300,340,400]},
  tuckDoll:{label:'인형 눕히고 이불 덮기',furniture:'dollBed',duration:[300,320,380,420]},
  pushCart:{label:'장난감 수레 밀기',furniture:'toyCart',duration:[240,240,240,240]},
}
export const OPENING_FURNITURE = ['longDresser','wardrobe','jewelryBox','seedCabinet','breadCupboard','linenCupboard','vanity','sewingBox'] as const
export const ANIMATED_ADDITION_FURNITURE = [...OPENING_FURNITURE,'rockingChair','smallHarp'] as const
export type AnimatedAdditionFurniture = typeof ANIMATED_ADDITION_FURNITURE[number]
export const ADDITION_MOTION_SIZE = 48
type Grid = string[][]
const phaseOf = (f:number) => ((Math.trunc(f)%4)+4)%4
const grid = (w:number,h:number):Grid => Array.from({length:h},()=>Array<string>(w).fill('.'))
function put(a:Grid,x:number,y:number,c:string) {
  if(x<0||y<0||y>=a.length||x>=a[0].length) throw new Error(`Furniture motion pixel outside canvas: ${x},${y}`)
  a[y][x]=c
}
function rect(a:Grid,x:number,y:number,w:number,h:number,c:string) {
  for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++) put(a,x+dx,y+dy,c)
}
function line(a:Grid,x:number,y:number,tx:number,ty:number,c:string) {
  const n=Math.max(Math.abs(tx-x),Math.abs(ty-y))
  for(let i=0;i<=n;i++) put(a,Math.round(x+(tx-x)*i/(n||1)),Math.round(y+(ty-y)*i/(n||1)),c)
}
const rows = (a:Grid) => a.map(r=>r.join(''))

/** Native-size object frames. A larger side footprint is canvas/depth, not enlarged pixels. */
export function additionObjectFrame(id:AnimatedAdditionFurniture,facing:Facing,frame:number):FurnitureArt {
  if(facing==='left') {
    const right=additionObjectFrame(id,'right',frame)
    return {...right,rows:right.rows.map(r=>[...r].reverse().join(''))}
  }
  const base=ADDITION_FURNITURE_DIRECTIONS[id][facing],p=phaseOf(frame)
  const image=base.rows.map(r=>[...r]),w=base.w*16,h=base.h*16
  if(id==='rockingChair') {
    const dx=[0,1,0,-1][p]
    // Rock the back/seat, leaving the curved rocker contact at its original baseline.
    for(let y=0;y<h-2;y++) {
      image[y].fill('.')
      base.rows[y].split('').forEach((c,x)=>{if(c!=='.'&&x+dx>=0&&x+dx<w)image[y][x+dx]=c})
    }
  } else if(id==='smallHarp') {
    const strings=facing==='right'?[8,10]:facing==='up'?[5,7,9]:[6,8,10]
    if(p===1||p===3) for(const x of strings) for(let y=4;y<11;y++) {
      if('cC'.includes(base.rows[y][x])) {image[y][x]='.';const nx=x+(p===1?1:-1);if(image[y][nx]==='.')image[y][nx]='c'}
    }
  } else {
    const amount=[0,1,2,1][p],box=id==='jewelryBox'||id==='sewingBox'
    const door=id==='wardrobe'||id==='linenCupboard'
    if(box){
      // A lid pivots on its hinge. It never floats above a disconnected box.
      rect(image,3,4,10,11,'.');rect(image,3,10,10,5,'k')
      rect(image,4,11,8,3,'w');rect(image,7,13,2,1,'y')
      if(facing==='right'){
        const tx=[11,10,7,10][p],ty=[10,7,5,7][p]
        line(image,4,10,tx,ty,'k');line(image,4,9,tx,ty-1,'l')
        if(amount>0)rect(image,6,10,5,1,'W')
      }else{
        const ly=10-amount*2
        rect(image,4,ly,8,11-ly,'k');rect(image,5,ly+1,6,Math.max(1,9-ly),facing==='up'?'w':'l')
        rect(image,4,10,8,1,amount>0&&facing==='down'?'W':'l')
        if(amount>0&&facing==='down'){put(image,6,11,id==='jewelryBox'?'y':'p');put(image,9,11,'c')}
      }
    }else if(facing==='down'&&door){
      const x=5,y=4,bw=10,dh=10,visible=[10,7,2,7][p]
      rect(image,x,y,bw,dh,'W');rect(image,x+2,y+2,6,6,'C')
      rect(image,x,y,visible,dh,'w');rect(image,x,y,visible,1,'l')
      rect(image,x,y,1,dh,'k');put(image,x+visible-2,y+5,'y')
    }else if(facing==='down'){
      const part:Record<string,readonly[number,number,number,number]>={
        longDresser:[4,6,7,3],seedCabinet:[12,5,8,4],breadCupboard:[3,8,10,3],vanity:[11,9,10,2],
      }
      const [x,y,bw,dh]=part[id]
      rect(image,x,y,bw,dh+amount,'W')
      if(amount>0){rect(image,x+1,y+1,bw-2,amount,'k');rect(image,x,y,1,amount+1,'l');rect(image,x+bw-1,y,1,amount+1,'l')}
      rect(image,x,y+amount,bw,dh,'w');rect(image,x,y+amount,bw,1,'l')
      put(image,x+Math.floor(bw/2),y+amount+dh-1,'y')
    }else if(amount>0){
      // Only the projecting front edge is visible from behind. Rear boards stay intact.
      const y=h-(door?12:9),x=facing==='right'?12:w-3,dh=door?9:3
      rect(image,x,y,amount+1,dh,'k');rect(image,x,y,amount+1,1,'l')
      rect(image,x+amount,y,1,dh,'w');put(image,x+amount,y+Math.floor(dh/2),'y')
    }
  }
  return {...base,rows:rows(image)}
}

export interface AdditionUseFrame {
  actor:string[]; furnitureBack:string[]; furnitureFront:string[]; propBack:string[];propFront:string[]
  duration:number; actorAnchor:{x:number;y:number};furnitureAnchor:{x:number;y:number};interaction:{x:number;y:number}
  posture:'standing'|'seated'|'crouching'
  hands:{shoulder:{x:number;y:number};palm:{x:number;y:number}}[]
}
/** Appearance comes from the live renderer; exported writer PNGs are examples only. */
export function additionUseFrame(who:Who,facing:Facing,action:AdditionUseAction,frame:number,opts:SpriteOpts):AdditionUseFrame {
  if(facing==='left') {
    const right=additionUseFrame(who,'right',action,frame,opts)
    const flip=(r:string[])=>r.map(row=>[...row].reverse().join(''))
    const anchor=(a:{x:number;y:number})=>({x:47-a.x,y:a.y})
    return {...right,actor:flip(right.actor),furnitureBack:flip(right.furnitureBack),furnitureFront:flip(right.furnitureFront),propBack:flip(right.propBack),propFront:flip(right.propFront),actorAnchor:anchor(right.actorAnchor),furnitureAnchor:anchor(right.furnitureAnchor),interaction:anchor(right.interaction),hands:right.hands.map(h=>({shoulder:anchor(h.shoulder),palm:anchor(h.palm)}))}
  }
  const p=phaseOf(frame),info=ADDITION_USE_INFO[action],size=ADDITION_MOTION_SIZE
  const actor=grid(size,size),back=grid(size,size),front=grid(size,size),prop=grid(size,size)
  const side=facing==='right',rear=facing==='up'
  const posture=action==='rock'?'seated':action==='tuckDoll'?'crouching':'standing'
  const body=motionBodyRows(who,facing,{...opts,frame:action==='pushCart'?(p%3) as 0|1|2:0,pose:posture==='crouching'?'crouch':'stand'})
  const animated=action==='rock'?'rockingChair':action==='harp'?'smallHarp':null
  const reference=animated?additionObjectFrame(animated,facing,p):ADDITION_FURNITURE_DIRECTIONS[info.furniture][facing]
  const furniture={...reference,rows:[...reference.rows]}
  if(action==='mill'){
    const handleX=rear?5:10
    // Remove the static upright crank before drawing the moving crank.
    furniture.rows=furniture.rows.map((row,y)=>[...row].map((c,x)=>x===handleX&&y>=2&&y<=5?(y<4?'.':row[x-1]):c).join(''))
  }
  if(action==='tuckDoll'){
    // An empty mattress: the moving doll and blanket are drawn only once.
    furniture.rows=furniture.rows.map((row,y)=>[...row].map((c,x)=>y>=8&&y<=12&&x>=4&&x<=11?(y<=11?'C':'k'):c).join(''))
    if(facing==='down')furniture.rows=furniture.rows.map(row=>[...row].reverse().join(''))
  }
  if(action==='paint'){
    // Clear the printed flower, fixed brush and ink pot: the working sheet is a single layer.
    furniture.rows=furniture.rows.map((row,y)=>[...row].map((c,x)=>{
      if(side)return y>=21&&y<=25&&x>=4&&x<=12?'l':c
      if(y>=2&&y<=9&&x>=4&&x<=29)return y<4?'.':rear?'w':'l'
      return c
    }).join(''))
  }
  const fw=furniture.w*16,fh=furniture.h*16
  const table=!['rock','harp','waterPlant','tuckDoll','pushCart'].includes(action)
  // Facing down works from the far edge of a table; facing up from its near edge.
  // Their floor points differ in depth, rather than forcing two objects onto one screen row.
  let floor=side?38:rear?36:42,actorFloor=side?38:rear?40:36
  let fx=side?25:Math.floor((size-fw)/2),ax=19
  if(!table){floor=38;actorFloor=38}
  if(action==='harp'){
    fx=side?26:16;ax=side?23:19
    floor=side?38:rear?36:42;actorFloor=side?38:rear?40:36
  }
  if(action==='washFace'&&rear)floor=40
  if(action==='mill'&&rear)floor=40
  if(action==='mill'&&side)ax=23
  if(action==='paint')floor=side?43:rear?38:45
  if(action==='waterPlant'){fx=side?25:14;ax=side?17:7}
  if(action==='tuckDoll'){fx=facing==='down'?9:26;ax=facing==='down'?23:side?19:17}
  const move=action==='pushCart'?[0,1,2,1][p]:0
  if(action==='pushCart'){
    floor=side?38:rear?36:42;actorFloor=side?38:rear?42:36
    fx=side?26+move:16;ax=side?17+move:19
    if(!side){floor+=rear?-move:move;actorFloor+=rear?-move:move}
  }
  const fy=floor-fh,rockShift=action==='rock'?[0,1,0,-1][p]:0
  if(action==='rock')ax=fx+3+rockShift
  // Pelvis sits on the cushion, with bent knees and hanging feet; no standing pose on a chair.
  const ay=posture==='seated'?fy+9-(body.length-4):actorFloor-body.length
  let ix=side?fx+5:24,iy=side?floor-7:fy+(rear?10:6)
  if(action==='washFace'){ix=side?fx+6:fx+7;iy=fy+(side?7:rear?8:5)}
  if(action==='rock'){ix=ax+5;iy=fy+9}
  if(action==='harp'){ix=fx+8;iy=fy+8}
  if(action==='waterPlant'){ix=fx+6;iy=fy+(side?24:8)}
  if(action==='tuckDoll'){ix=fx+4;iy=fy+10}
  if(action==='paint'){ix=side?30:rear?34:24;iy=side?34:rear?29:36}
  if(action==='pushCart'){ix=side?fx+1:fx+7;iy=fy+(side?6:rear?12:5)}
  const bob=action==='knead'&&p===1?1:0
  body.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='.')return
    const seatedLeg=posture==='seated'&&y>=body.length-3
    const px=ax+x+(seatedLeg&&side?2:0),py=ay+y-(seatedLeg?1:0)+(y<body.length-3?bob:0)
    // The far-side worker's torso is behind the tabletop, not painted through it.
    const cFurniture=furniture.rows[py-fy]?.[px-fx]
    if((table||action==='pushCart')&&!side&&!rear&&py>=fy+(table?5:8)&&cFurniture&&cFurniture!=='.')return
    put(actor,px,py,c)
  }))
  const silhouette=actor.map(row=>[...row])
  const armPixel=(x:number,y:number,c:string)=>{
    if(rear&&silhouette[y]?.[x]!=='.')return
    put(actor,x,y,c)
  }
  const armLine=(x:number,y:number,tx:number,ty:number,c:string)=>{
    const n=Math.max(Math.abs(tx-x),Math.abs(ty-y))
    for(let i=0;i<=n;i++)armPixel(Math.round(x+(tx-x)*i/(n||1)),Math.round(y+(ty-y)*i/(n||1)),c)
  }
  const sleeve=body[Math.min(8,body.length-1)][side?4:2]||'r'
  const hands:AdditionUseFrame['hands']=[]
  const hand=(x:number,y:number,second=false)=>{
    // The old craft/work sprites put small palms just beside the sleeve.
    // Lateral tasks use the near shoulder, rather than dragging an arm across the chest.
    const lateral=action==='tuckDoll'
    const sx=ax+(side?6:action==='paint'?(rear?(second?1:8):(second?8:1)):lateral?(facing==='down'?(second?2:1):(second?7:8)):action==='mill'?(second?1:8):second?8:1),sy=ay+Math.min(8,body.length-4)+bob
    hands.push({shoulder:{x:sx,y:sy},palm:{x,y}})
    // A sleeve and bent elbow connect each palm to the shoulder. Skin remains just 2px.
    const elbowX=side?x-2:sx,elbowY=Math.min(sy+1,y+1)
    armLine(sx,sy,elbowX,elbowY,sleeve==='.'?'r':sleeve)
    armLine(elbowX,elbowY,x,y,sleeve==='.'?'r':sleeve)
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)armPixel(x+dx,y+dy,dy===0?'s':'5')
  }
  let hx=side?ix-2:rear?ix-6:ix-3,hy=iy,otherX=rear?ix+5:ix+2,otherY=iy
  let twoHands=!side
  if(action==='rock'){hx=ax+(side?8:1);hy=ay+9;otherX=ax+8;otherY=hy}
  if(action==='sew'){
    hy=iy-[0,1,2,0][p];hx+=p===2?1:0
    rect(prop,ix-3,iy,7,2,'C');rect(prop,ix-2,iy,5,1,'b')
    line(prop,hx+1,hy,ix,iy,'c');put(prop,hx+1,hy-1,'S')
  }
  if(action==='knead'){
    const width=[5,7,4,6][p]
    rect(prop,ix-3,iy+1,width,1,'C');rect(prop,ix-2,iy,Math.min(width-1,5),1,'c')
    hy=iy-1+(p%2);otherY=hy
  }
  if(action==='washFace'){
    if(rear){
      // Raised elbows and towel edges are visible; palms and the front of the face are hidden.
      hx=ax-1;otherX=ax+9;hy=ay+[6,5,4,6][p];otherY=hy
      if(p===3){rect(prop,ax-1,ay+4,12,3,'C');rect(prop,ax,ay+4,10,1,'c')}
      if(p===0){put(prop,ix-1,iy,'b');put(prop,ix+1,iy,'b')}
    }else if(p===1||p===2||p===3){
      hx=ax+(side?7:2);otherX=ax+6;hy=ay+5;otherY=hy
      if(p===3){rect(prop,ax+(side?7:2),ay+4,side?2:6,3,'C');rect(prop,ax+(side?7:3),ay+4,side?1:4,1,'c')}
      else if(!rear){put(prop,ax+(side?8:3),ay+6,'b');if(p===2)put(prop,ax+(side?8:6),ay+7,'b')}
    }else{rect(prop,ix-2,iy,4,1,'b')}
  }
  if(action==='harp'){
    if(side){hx=fx+6+p%2;hy=fy+7+p%2;twoHands=false}
    else if(rear){hx=ax+1;hy=ay+7+p%2;otherX=ax+8;otherY=ay+8-p%2}
    else{hx=fx+6+(p===1?1:0);hy=fy+6-(p===1?1:0);otherX=fx+10-(p===2?1:0);otherY=fy+8-(p>=2?1:0)}
    // Plucked string bends beside its fixed endpoints, not a floating decorative dot.
    const stringX=fx+(rear?9:side?8:8)
    line(prop,stringX,fy+4,stringX+(p===1?1:p===3?-1:0),fy+6,'c')
    line(prop,stringX+(p===1?1:p===3?-1:0),fy+6,stringX,fy+10,'c')
  }
  if(action==='paint'){
    hx=side?26+[0,1,1,0][p]:rear?29+[0,1,1,0][p]:20+[0,1,2,1][p]
    hy=side?32:rear?32:31+[0,0,1,1][p]
    rect(prop,ix-4,iy-4,9,7,'C');rect(prop,ix-3,iy-3,7,5,'c')
    // Four pink petals, a gold centre, green stem and leaves at native pixel size.
    if(p>=1){put(prop,ix,iy-3,'p');put(prop,ix-1,iy-2,'p')}
    if(p>=2){put(prop,ix+1,iy-2,'p');put(prop,ix,iy-1,'p');put(prop,ix,iy-2,'y')}
    if(p===3){line(prop,ix,iy,ix,iy+2,'g');put(prop,ix-1,iy+1,'G');put(prop,ix+1,iy,'G')}
    const tx=p===0?ix-5:ix+(p===2?1:0),ty=p===0?iy-2:iy+(p===1?-3:p===2?-2:1)
    // A dark, narrow brush remains distinct from both the page and the skin.
    line(prop,hx+1,hy,tx,ty,'W');put(prop,tx,ty,p===0?'p':p===3?'g':'p')
    rect(prop,ix-6,iy-3,2,3,'b');put(prop,ix-6,iy-3,'p')
    otherX=rear?ax+1:ax+8;otherY=ay+9
  }
  if(action==='washDishes'){
    hy=iy-(p===2?1:0);otherY=hy
    rect(prop,ix-2,hy-1,5,3,'C');rect(prop,ix-1,hy-1,3,1,'c')
    put(prop,hx+1,hy,'b')
    if(p===2||p===3){put(prop,ix+2,hy+3,'b');put(prop,ix+3,hy+2,'b')}
  }
  if(action==='mill'){
    // A handle travels around the centre of the stone, never detaches from it.
    ix=fx+8;iy=fy+(side?7:6)
    hx=ix+(side?[-2,-1,0,-1]:[1,2,1,0])[p];hy=iy+(side?[0,-1,0,1]:[0,1,2,1])[p];otherX=ix-4;otherY=iy+1
    line(prop,ix,iy,hx+1,hy,'W');put(prop,hx+1,hy,'l')
  }
  if(action==='waterPlant'){
    hx=ix-7;hy=iy-3-(p===1||p===2?1:0);otherX=hx+2;otherY=hy+1;twoHands=!side
    rect(prop,hx+1,hy,4,3,'b');rect(prop,hx+2,hy-1,2,1,'B')
    line(prop,hx+4,hy+1,ix,iy-1,'B')
    if(p===1||p===2){put(prop,ix,iy,'b');put(prop,ix+1,iy+1+(p===2?1:0),'b')}
    if(p===3){otherX=ix;otherY=iy-2}
  }
  if(action==='tuckDoll'){
    const headX=fx+4,headY=iy-1
    // Lift upright, lay head on the pillow, then draw the cover from feet to chest.
    if(p===0){
      rect(prop,fx+1,iy-4,2,1,'k');rect(prop,fx+1,iy-3,2,2,'c')
      put(prop,fx+2,iy-3,'k');rect(prop,fx+1,iy-1,2,3,'r');rect(prop,fx+1,iy+2,2,1,'W')
    }else{
      rect(prop,headX-1,headY-1,3,3,'c')
      rect(prop,headX,headY,2,2,'C');put(prop,headX,headY,'k');put(prop,headX+1,headY+1,'W')
      rect(prop,headX+2,headY,4,2,'r');rect(prop,headX+6,headY,1,2,'W')
    }
    const coverX=fx+(p<2?10:p===2?8:6)
    rect(prop,coverX,iy,fx+12-coverX,2,'p');line(prop,coverX,iy,fx+11,iy,'c')
    hx=fx+(p===0?0:p===1?2:p===2?3:2);hy=iy+(p===0?0:1)
    otherX=fx;otherY=iy+1
    if(facing==='down'){
      // Front right hand is on screen left; bring the cot to that side of the body.
      for(const row of prop){const local=row.slice(fx,fx+16).reverse();row.splice(fx,16,...local)}
      hx=fx+15-(hx-fx);otherX=fx+15-(otherX-fx)
      ix=fx+11
    }
  }
  if(action==='pushCart'){
    hx=side?ix:fx+2;hy=iy;otherX=fx+12;otherY=iy
  }
  hand(hx,hy);if(twoHands)hand(otherX,otherY,true)
  // Paper, blankets and tool shafts go behind the gripping fingers.
  if(!rear&&['paint','mill','tuckDoll'].includes(action))for(const h of hands){
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if('s5'.includes(actor[h.palm.y+dy][h.palm.x+dx]))prop[h.palm.y+dy][h.palm.x+dx]='.'
  }
  furniture.rows.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='.')return
    const foreground=action==='rock'?(rear?y<12:y>=7&&(x<=3||x>=12)):action==='harp'&&!rear&&!side?(y>=7||('cC'.includes(c)&&y>=4)):(table||action==='pushCart')&&!rear&&!side&&y>=9
    put(foreground?front:back,fx+x,fy+y,c)
  }))
  const empty=rows(grid(size,size))
  return {actor:rows(actor),furnitureBack:rows(back),furnitureFront:rows(front),propBack:rear?rows(prop):empty,propFront:rear?empty:rows(prop),posture,hands,duration:info.duration[p],actorAnchor:{x:ax+5,y:posture==='seated'?fy+9:actorFloor},furnitureAnchor:{x:fx+fw/2,y:floor},interaction:{x:ix,y:iy}}
}
