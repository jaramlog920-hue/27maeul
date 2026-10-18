import { COPY_FURNITURE, type CopyFurnitureId } from '../engine/copy-furniture'
import { withLookDefaults, type Avatar } from '../engine/avatar'
import type { ChildStage } from '../engine/child'
import type { Facing, Season } from '../engine/types'
import { copyFurnitureObjectFrame } from './copy-furniture-art'
import { spriteRows, writerPalette, PALETTE, ANIMAL_PALETTE, type SpriteOpts, type Who } from './sprites'
import { newbornArt } from './newborn-art'
import { petMotionRows, petStillRows } from './pet-art'
import { FURNI_PALETTE } from './furniture-art'
import { COPY_FURNITURE_DEFS } from '../engine/copy-furniture-defs'
import { copyFurnitureFacing, copyFurnitureChildStage } from '../engine/copy-furniture-views'

export const COPY_MOTION_SIZE = 96
export interface CopyFurnitureCast {
  child?: { avatar: Avatar; stage: ChildStage; dressed?: boolean }
  pet?: { kind: 'cat' | 'dog'; baby: boolean }
  childFeet?: { x:number; y:number }
  petFeet?: { x:number; y:number }
}
export interface CopyFurnitureMotionOptions extends CopyFurnitureCast {
  showActor?: boolean
  who?: Who
  actor?: SpriteOpts
  season?: Season
  /** Actor's actual feet relative to the furniture ground centre, native pixels. */
  feet?: { x: number; y: number }
}

/** One renderer for installed furniture and the read-only gallery. No game writes. */
export function copyFurnitureUseFrame(id: CopyFurnitureId, facing: Facing, frame: number, opts: CopyFurnitureMotionOptions = {}) {
  facing=copyFurnitureFacing(id,facing)
  const p = ((Math.trunc(frame)%4)+4)%4, object = copyFurnitureObjectFrame(id,facing,p)
  const layer = () => Array.from({length:COPY_MOTION_SIZE},()=>Array<string>(COPY_MOTION_SIZE).fill('.'))
  type Grid = ReturnType<typeof layer>
  const furniture=layer(),actor=layer(),child=layer(),baby=layer(),pet=layer(),props=layer()
  const stamp=(a:Grid,rr:readonly string[],x:number,y:number)=>rr.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&a[y+yy]?.[x+xx]!==undefined)a[y+yy][x+xx]=c}))
  const rect=(a:Grid,c:string,x:number,y:number,w:number,h:number)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(a[yy]?.[xx]!==undefined)a[yy][xx]=c}
  const rows=(a:Grid)=>a.map(r=>r.join(''))
  // Short sprites have only one leg row: the general sitting pose's three-row
  // cut was eating the toddler's torso. Bend only actual leg pixels horizontally.
  const seatedRows=(rr:string[],face:Facing)=>{
    const legs=rr.length<14?1:2,dx=face==='left'?-2:2
    return rr.map((r,y)=>y<rr.length-legs?r:[...r].map((_,x)=>r[x-dx]??'.').join(''))
  }
  const wall=COPY_FURNITURE_DEFS[id].layer==='wall'
  const ox=48-object.w*8,oy=64-object.h*16-(wall?8:0),inset=object.w===2?3:0
  stamp(furniture,object.rows,ox,oy)
  const category=COPY_FURNITURE.find(item=>item.id===id)!.category
  const actorFeet=opts.feet??{x:-object.w*8+inset-5,y:0}
  const needsAdult=['copyBabyWash','copyBabyMeal','copyBabyNap','copyPetBrush','copyPetBath'].includes(id)
  const showActor=opts.showActor??(!!opts.feet||needsAdult||!['infant','child','pet'].includes(category))
  const who=opts.who??'writer',side:Facing=actorFeet.x<0?'right':actorFeet.x>0?'left':facing==='up'?'down':'up'
  const body=spriteRows(who,side,{...opts.actor,frame:0,blink:p===3,pose:wall&&(p===1||p===2)?'handUp':'stand',season:opts.season??'spring'})
  const ax=Math.round(48+actorFeet.x-body[0].length/2),ay=Math.round(64+actorFeet.y-body.length)
  if(showActor)stamp(actor,body,ax,ay)
  const seatedAdult=id==='copyBathStool'||id==='copyFootBasin'
  if(seatedAdult&&showActor){
    for(const row of actor)row.fill('.')
    stamp(actor,seatedRows(body,side),ax,ay)
  }
  // A bent hand only moves one pixel at the wrist. Never extend the original arm.
  const hx=side==='right'?ax+body[0].length-3:ax+1,hy=ay+Math.max(8,body.length-5)
  if(showActor&&!wall&&!seatedAdult&&(p===1||p===2)){rect(actor,'r',hx,hy-1,2,1);rect(actor,'s',hx,hy,2,1)}
  // Working utensils remain at the palms, away from eyes and torso.
  if(showActor){
  if(['copyBabyWash','copyStoneBath','copyStoneSink','copyVegetableBasin','copyPetBath','copyChildWater'].includes(id)){
    rect(props,'C',hx+(side==='right'?2:-3),hy,3,2)
    if(p===1||p===2)for(let n=0;n<3;n++)rect(props,'b',hx+(side==='right'?4:-4)+n%2,hy+2+n,1,1)
  }else if(id==='copyBabyMeal'&&opts.child?.stage==='toddler'){
    const spoonY=hy-(p===1||p===2?1:0)
    rect(props,'W',hx+(side==='right'?1:-2),spoonY,2,1);rect(props,'C',hx+(side==='right'?3:-3),spoonY,1,1)
  }else if(id==='copyPetBrush'){rect(props,'W',hx+(side==='right'?2:-3),hy-2,1,3);rect(props,'l',hx+(side==='right'?2:-6),hy-3+(p%2),5,1)}
  else if(['copyStoneCounter','copySeasonSand'].includes(id))rect(props,'W',hx+(side==='right'?2:-2),hy-1,1,3)
  else if(['copyBathStool','copyClothesNiche','copyBabyNap'].includes(id)){rect(props,'C',hx+(side==='right'?2:-4),hy,4,2);rect(props,'c',hx+(side==='right'?2:-4),hy,3,1)}
  }

  let babyPalette:Record<string,string>={},childPalette:Record<string,string>={},petPalette:Record<string,string>={}
  const babyUse=category==='infant'&&copyFurnitureChildStage(id)==='baby'&&opts.child?.stage==='baby'
  const toddlerUse=category==='infant'&&copyFurnitureChildStage(id)==='toddler'&&opts.child?.stage==='toddler'
  const childUse=category==='child'&&opts.child&&['toddler','helper'].includes(opts.child.stage)
  if(babyUse){
    const b=newbornArt(opts.child!.avatar,p,id==='copyBabyNap'&&p>=2)
    babyPalette=b.palette
    // Exact shared newborn source. Head stays outside basin/blanket; no furniture overdraw.
    const bx=ox+6,by=64-9
    stamp(baby,b.rows,bx,by)
    if(id==='copyBabyNap'&&p>=2)rect(props,'C',bx+6,by+3,3,2)
  }
  if(toddlerUse||childUse){
    const c=opts.child!,short=c.stage==='toddler'?0:1
    const avatar=withLookDefaults(c.avatar)
    const cw:Who=c.stage==='helper'&&!c.dressed?'child':'writer'
    const facingKid:Facing=id==='copyBabyMeal'?'left':'right'
    let cr=spriteRows(cw,facingKid,{avatar,look:avatar.look,short,growth:2,frame:(id==='copyChildBalance'&&p===1?1:0),blink:p===3,season:opts.season??'spring'})
    childPalette=cw==='writer'?writerPalette(opts.season??'spring',avatar):PALETTE
    const colored=(rr:string[])=>cw==='child'?rr.map(row=>[...row].map(ch=>c.avatar.look==='m'?({z:'E',Z:'M'}[ch]??ch):({z:'V',Z:'X'}[ch]??ch)).join('')):rr
    cr=colored(cr)
    const seated=id==='copyBabyMeal'||id==='copyBabyBall'||id==='copyChildPicture'||id==='copyChildShell'||(id==='copyBabyRail'&&(p===0||p===3))
    const childFeet=opts.childFeet??{x:id==='copyBabyMeal'?-2:id==='copyChildBalance'?-object.w*8+inset+7:-object.w*8+inset-5,y:id==='copyChildBalance'?-6:0}
    const footX=48+childFeet.x+(id==='copyChildBalance'?[0,3,6,3][p]:0),footY=64+childFeet.y
    const kx=footX-cr[0].length/2,ky=footY-cr.length
    if(seated){
      stamp(child,seatedRows(cr,facingKid),Math.round(kx),Math.round(ky))
    }else stamp(child,cr,Math.round(kx),Math.round(ky))
    if(id==='copyBabyBall'||id==='copyChildShell'||id==='copyChildPicture'){
      rect(props,id==='copyBabyBall'?'p':'C',Math.round(kx)+cr[0].length+1+(p===2?1:0),Math.round(ky+cr.length)-2,2,2)
    }
  }
  if(category==='pet'&&opts.pet){
    const kind=opts.pet.kind,babyPet=opts.pet.baby,nap=id==='copyPetArch'&&p>=2
    const action=id==='copyPetSand'||id==='copyPetBall'?'play':id==='copyPetSteps'||id==='copyPetJar'?'walk':'sniff'
    const jarStartX=opts.petFeet?40+opts.petFeet.x:ox-14,jarStartY=opts.petFeet?48+opts.petFeet.y:48
    const jarApproach:Facing=jarStartX>ox?'left':'right'
    const petFace:Facing=id==='copyPetJar'?([jarApproach,'up','down',jarApproach==='right'?'left':'right'] as const)[p]:id==='copyPetBath'?'left':'right'
    const curled=nap?petStillRows(kind,'curl',babyPet):undefined
    const pr=curled?(petFace==='right'?curled.map(row=>[...row].reverse().join('')):curled):petMotionRows(kind,petFace,action,p,babyPet)
    petPalette=ANIMAL_PALETTE[kind]
    const dx=id==='copyPetSteps'?[0,7,14,7][p]:0
    const dy=id==='copyPetSteps'?[-4,-6,-8,-6][p]:0
    // Enter, turn around inside the doorway, then walk back out. Preserve every
    // face/body pixel instead of masking the animal behind a too-small jar.
    const petX=id==='copyPetJar'?ox+([ -14,0,0,-14 ] as const)[p]:id==='copyPetSteps'?ox+inset-3+(babyPet?2:0):id==='copyPetArch'?ox:id==='copyPetBrush'?ox:id==='copyPetBath'?ox+7:ox-11+inset
    const petY=id==='copyPetBrush'?44:48
    const px=id==='copyPetJar'?(p===1||p===2?ox:jarStartX):opts.petFeet?40+opts.petFeet.x+dx:petX+dx
    const py=id==='copyPetJar'?(p===1||p===2?48:jarStartY):opts.petFeet?48+opts.petFeet.y+dy:petY+dy
    stamp(pet,pr,Math.round(px),Math.round(py))
  }
  // Contact props cannot cover a face, torso, hand or foot. Occupied actor pixels win.
  for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(actor[y][x]!=='.'||child[y][x]!=='.'||baby[y][x]!=='.'||pet[y][x]!=='.')props[y][x]='.'
  return {
    layers:[
      {rows:rows(furniture),palette:FURNI_PALETTE},
      {rows:rows(actor),palette:who==='writer'?writerPalette(opts.season??'spring',opts.actor?.avatar):PALETTE},
      {rows:rows(child),palette:childPalette}, {rows:rows(baby),palette:babyPalette},
      {rows:rows(pet),palette:petPalette}, {rows:rows(props),palette:FURNI_PALETTE},
    ],anchor:{x:48,y:64},object,participants:{baby:!!babyUse,child:!!(toddlerUse||childUse),pet:category==='pet'&&!!opts.pet},duration:650,
  }
}
