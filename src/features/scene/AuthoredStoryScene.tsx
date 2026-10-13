import {createContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {neighborById} from '../../content/catalog'
import {withLookDefaults} from '../../engine/avatar'
import {slotPerson} from '../../engine/gen-growth'
import type {Who} from '../../render/sprites'
import {drawAuthoredStory,authoredStoryPeople} from '../../render/authored-story-art'
import {playerChildAvatar,playerChildSprite} from '../../render/player-child-look'
import {childStage} from '../../engine/child'
import {albumImage,storeAlbumImage,useGame} from '../../store/game-store'
import {previewActor,previewPerson,previewFamilyChild} from './event-preview-art'
import './stars-scene.css'

export const StoryArtBeat=createContext<(page:number)=>void>(()=>{})
export const StoryArtChoice=createContext<(choice:number|null)=>void>(()=>{})
export function AuthoredStoryScene({id,title,preview=false,children,beat=0,chosen}:{id:string;title:string;preview?:boolean;children:ReactNode;beat?:number;chosen?:number}){
 const [previewBeat,setPreviewBeat]=useState(0),page=preview?previewBeat:beat
 const phase=id==='village:3'?Math.min(1,page):id==='built:reedRack'?Math.min(1,page):id==='ev:baker:small:festBasket'?Math.min(1,page):id==='fam:trip'?Math.min(1,page):id==='ev:baker:story:3'||id==='lightShoes'||id==='ev:carpenter:story:3'||id==='ev:poppy:story:2'||id==='ev:rudy:small:signPost'?Math.min(2,page):0
 const [previewChoice,setPreviewChoice]=useState<number|null>(null),choice=preview?previewChoice:chosen
 const artChoice=id==='ev:baker:small:festBasket'||id==='ev:poppy:story:2'||id==='ev:rudy:small:signPost'?choice:undefined
 const ref=useRef<HTMLCanvasElement>(null)
 const child=useGame(s=>s.game.child),day=useGame(s=>s.game.clock.day),remembered=useGame(s=>s.game.album.some(a=>a.id===id))
 const avatar=useGame(s=>s.game.avatar),gen=useGame(s=>s.game.gen),looks=useGame(s=>s.game.looks)
 useEffect(()=>{
  const canvas=ref.current,g=canvas?.getContext('2d');if(!canvas||!g)return
  const resolve=(npcId:string)=>{
   const def=neighborById(npcId),current=gen?.persons[slotPerson(gen,npcId)],custom=looks?.[npcId]
   return preview?previewActor(`person:${npcId}`):{
    avatar:withLookDefaults({name:current?.name??def?.role??'이웃',look:current?.look??def?.look??'m',...def?.avatar,...current?.avatar,...custom,...(current?.hair?{hairColor:current.hair}:{})}),
    who:(!def?.avatar&&!current?.avatar&&!custom&&!gen?.retired?.[npcId]?def?.sprite??'writer':'writer') as Who}
  }
  const stage=child?childStage(child,day):'helper'
  const familyChild=preview?previewFamilyChild():{avatar:playerChildAvatar({child,avatar,looks}),...playerChildSprite(stage,!!looks?.child),baby:stage==='baby'}
  const people=authoredStoryPeople(id),npc=id==='fam:trip'?familyChild:resolve(people[0]??previewPerson(id)??'wendell'),others=people.slice(1).map(resolve)
  const resize=()=>{canvas.width=320;canvas.height=Math.max(180,Math.round(320*window.innerHeight/window.innerWidth))}
  resize();window.addEventListener('resize',resize)
  if((id==='fam:trip'||id==='village:3')&&!preview&&(!remembered||!albumImage(id))){
   const photo=document.createElement('canvas');photo.width=canvas.width;photo.height=canvas.height
   const pg=photo.getContext('2d');if(pg){drawAuthoredStory(pg,id,photo.width,photo.height,8,avatar,npc,others,1);storeAlbumImage(id,photo.toDataURL('image/png'))}
  }
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,start=performance.now()
  let frame=0,last=-1000
  const paint=(now:number)=>{
   if(now-last>=100){drawAuthoredStory(g,id,canvas.width,canvas.height,reduced?8:(now-start)/1000,preview?null:avatar,npc,others,phase,artChoice);last=now}
   if(!reduced)frame=requestAnimationFrame(paint)
  }
  frame=requestAnimationFrame(paint)
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize)}
 },[id,preview,avatar,gen,looks,phase,child,day,remembered,artChoice])
 return <StoryArtBeat.Provider value={setPreviewBeat}><StoryArtChoice.Provider value={setPreviewChoice}><div className="stars-scene authored-story-scene" role="dialog" aria-label={title}><canvas ref={ref} aria-hidden="true"/>{children}</div></StoryArtChoice.Provider></StoryArtBeat.Provider>
}




