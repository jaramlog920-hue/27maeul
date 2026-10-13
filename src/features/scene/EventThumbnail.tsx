import {useEffect,useRef} from 'react'
import type {EventPreviewEntry} from './event-registry'
import {previewActor,previewFamilyChild} from './event-preview-art'
import {drawMoment,type MomentKind} from '../../render/scenic-moments-art'
import {drawStargazing} from '../../render/stargazing-art'
import {drawSunset} from '../../render/sunset-scene-art'
import {drawLivingMoment} from '../../render/living-moments-art'
import {LIVING_KINDS,type LivingKind} from '../../engine/scenic-kinds'
import {FACILITY_IDS,type FacilityId} from '../../engine/village-sites'
import {drawAuthoredStory,hasAuthoredStory,authoredStoryPeople} from '../../render/authored-story-art'
import {person} from '../../render/milestone-moments-art'

export function EventThumbnail({entry}:{entry:EventPreviewEntry}){
 const ref=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{
  const canvas=ref.current
  if(!canvas)return
  const paint=()=>{
   const g=canvas.getContext('2d');if(!g)return
   const actor=previewActor(entry.id),w=300,h=170
   if(hasAuthoredStory(entry.id)){
    const people=authoredStoryPeople(entry.id)
    drawAuthoredStory(g,entry.id,w,h,8,null,(entry.id==='fam:trip'||entry.id==='fam:read')?previewFamilyChild():people.length?previewActor(`person:${people[0]}`):actor,people.slice(1).map(id=>previewActor(`person:${id}`)),entry.id==='fam:read'?0:2)
   }
   else if((LIVING_KINDS as readonly string[]).includes(entry.kind??'')){
    const facility=entry.id.split(':')[1]
    drawLivingMoment(g,entry.kind as LivingKind,w,h,8,null,{guests:['grandpa','baker','wendell'].map(id=>{const a=previewActor(`firstDinner:${id}`);return {avatar:a.avatar,who:a.who}}),host:{avatar:actor.avatar,who:actor.who},book:'phm',facility:FACILITY_IDS.includes(facility as FacilityId)?facility as FacilityId:'longBench',decor:false})
   }
   else if(entry.kind==='stars')drawStargazing(g,w,h,8,null)
   else if(entry.kind==='sunset')drawSunset(g,w,h,8,null)
   else if(entry.kind)drawMoment(g,entry.kind as MomentKind,w,h,8,null,actor.avatar,'아이',actor.who,17,false,undefined,/^ev:.*:confess$/.test(entry.id)?actor.id:undefined)
   else{
    g.fillStyle='#c2cfb3';g.fillRect(0,0,w,h);g.fillStyle='#859e77';g.fillRect(0,80,w,90)
    g.fillStyle='#c0ae87';g.fillRect(0,118,w,52)
    const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
    person(p,120,135,null,'right');person(p,163,135,actor.avatar,'left',actor.who)
    p(175,70,'#ecdfbf',29,15);p(178,85,'#ecdfbf',4,4)
    for(let i=0;i<3;i++)p(180+i*7,76,'#897c62',3,3)
   }
  }
  if(typeof IntersectionObserver==='undefined'){paint();return}
  const observer=new IntersectionObserver(items=>{if(items.some(i=>i.isIntersecting)){paint();observer.disconnect()}},{rootMargin:'300px'})
  observer.observe(canvas);return()=>observer.disconnect()
 },[entry])
 return <canvas ref={ref} width={300} height={170} className="event-thumbnail" aria-label={`${entry.title} 미리보기 그림`} role="img"/>
}
