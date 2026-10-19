import {useEffect,useRef,type ReactNode} from 'react'
import {drawSharedBackgroundScene,type SharedBackgroundSceneSnapshot} from '../../render/shared-background-scene'
import './stars-scene.css'

/** Shared live/preview canvas input. Mounting this view never writes saves or albums.
 * Explicit snapshots permit integration review before the whole batch is registered. */
export function SharedBackgroundStoryScene({scene,title,beat=0,children}:{scene:SharedBackgroundSceneSnapshot;title:string;beat?:number;children:ReactNode}){
 const ref=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{
  const canvas=ref.current,g=canvas?.getContext('2d')
  if(!canvas||!g)return
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,start=performance.now()
  let frame=0,last=-Infinity,failed=false
  const paint=(now:number)=>{
   if(now-last>=100){
    const bounds=canvas.getBoundingClientRect(),w=320,h=Math.max(180,Math.round(w*(bounds.height||180)/(bounds.width||320)))
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    // 그리다 실패해도 장면 창은 남고 다음 틀에서 다시 그린다 (2026-10-19 감사 L-33)
    try{drawSharedBackgroundScene(g,scene,w,h,reduced?8:Math.max(0,(now-start)/1000),beat)}catch(e){if(!failed){failed=true;console.error(e)}}
    last=now
   }
   if(!reduced)frame=requestAnimationFrame(paint)
  }
  const onResize=()=>{if(reduced){last=-Infinity;paint(performance.now())}}
  window.addEventListener('resize',onResize)
  frame=requestAnimationFrame(paint)
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',onResize)}
 },[scene,beat])
 return <div className="stars-scene authored-story-scene" role="dialog" aria-label={title}><canvas ref={ref} aria-hidden="true"/>{children}</div>
}
