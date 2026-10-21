import { expect, it } from 'vitest'
import { SCENES } from '../../../src/content/text'
import { AUTHORED_STORY_IDS, authoredStoryPeople, drawAuthoredStory } from '../../../src/render/authored-story-art'
import { withLookDefaults } from '../../../src/engine/avatar'
import { previewActor } from '../../../src/features/scene/event-preview-art'

it('smokes every current authored story through base dialogue and every choice reply page',()=>{
 const custom=withLookDefaults({name:'감사',look:'f',hairColor:[170,60,25],top:4,bottom:4,hairFront:21,hairBack:20})
 const ids=[...new Set(AUTHORED_STORY_IDS)]
 let cases=0,stages=0,pixels=0
 for(const id of ids){
  const scene=SCENES[id];expect(scene,id).toBeDefined()
  const people=authoredStoryPeople(id).map(p=>previewActor(`person:${p}`)),npc=people[0]??previewActor(id)
  const phases=scene.lines.map((_,beat)=>({beat,choice:undefined as number|undefined}))
  for(let choice=0;choice<(scene.choices?.length??0);choice++){
   const length=scene.choices![choice].reply.length
   for(let reply=0;reply<Math.max(1,length);reply++)phases.push({beat:scene.lines.length+reply,choice})
  }
  stages+=phases.length
  for(const phase of phases)for(const avatar of [null,custom])for(const [w,h] of [[300,170],[320,180],[320,693]]){
   let draws=0
   const g={fillStyle:'',imageSmoothingEnabled:false,fillRect(x:number,y:number,width:number,height:number){
    for(const n of [x,y,width,height])if(!Number.isFinite(n))throw new Error(`nonfinite ${id}/${phase.beat}/${phase.choice}`)
    draws++;pixels++
   }} as CanvasRenderingContext2D
   drawAuthoredStory(g,id,w,h,phase.beat%2?0:8,avatar,npc,people.slice(1),phase.beat,phase.choice)
   expect(draws,`${id}/${phase.beat}/${phase.choice}`).toBeGreaterThan(0)
   cases++
  }
 }
 console.log('CURRENT_STORY_SMOKE',JSON.stringify({stories:ids.length,stages,cases,drawCommands:pixels}))
},120000)

