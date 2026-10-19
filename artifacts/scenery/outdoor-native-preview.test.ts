import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { CONTENT } from '../../src/content/catalog'
import { newGame, placeFurniture, syncHome, useOutdoorFurniture } from '../../src/engine/game'
import { moveYard } from '../../src/engine/yard'
import { outdoorFurniture } from '../../src/engine/outdoor'
import { createRenderer } from '../../src/render/renderer'
import { furnitureUseSpec, furnitureUseStands } from '../../src/engine/furniture-autonomy'
import { withLookDefaults } from '../../src/engine/avatar'

it('exports actual map renderer and all four seating orientations without browser or save mutation',()=>{
 const require=createRequire(import.meta.url)
 const {createCanvas}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas')
 const nativeCreate=document.createElement.bind(document)
 const spy=vi.spyOn(document,'createElement').mockImplementation(((tag:string,...args:unknown[])=>tag==='canvas'?createCanvas(1,1):nativeCreate(tag,...args as [])) as typeof document.createElement)
 try{
  const sheet=createCanvas(768*2,480*2),sg=sheet.getContext('2d')
  for(const level of [0,1,2,3]){
   const initial=newGame(CONTENT)
   let game={...initial,homeLevel:level,avatar:withLookDefaults({look:'f',name:'마당',hairBack:3}),scenes:[],npcs:{},clock:{day:12,minute:720},player:{...initial.player,x:10,y:7,path:[]},inv:{...initial.inv,stool:1,longBench:1,table:1,vase:1,bigPlant:1,mat:1},flags:{...initial.flags,'unlock:rainJar':1,'unlock:reedRack':1}}
   for(const [item,x,y] of [['stool',12,2],['longBench',14,2],['table',14,6],['vase',14,6],['bigPlant',11,7],['mat',15,4]] as const){const next=placeFurniture(game,item,{x,y},'down');expect(next,item).not.toBeNull();game=next! as typeof game}
   game=moveYard(game,'rainJar',{x:16,y:7})! as typeof game
   game=moveYard(game,'reedRack',{x:17,y:7})! as typeof game
   syncHome(game)
   const canvas=createCanvas(768,960),r=createRenderer(canvas.getContext('2d'),CONTENT)
   r.scale=3;r.zoom=1;r.look={x:9,y:4};r.draw(game,2,0)
   writeFileSync(`artifacts/scenery/outdoor-home-${level}.png`,canvas.toBuffer('image/png'))
   sg.drawImage(canvas,0,0,768,480,(level%2)*768,Math.floor(level/2)*480,768,480)
   if(level===3){r.decorating=true;r.preview={furniture:{item:'chair',x:15,y:5,facing:'left'},valid:true};r.draw(game,2,0);writeFileSync('artifacts/scenery/outdoor-edit-preview.png',canvas.toBuffer('image/png'))}
  }
  writeFileSync('artifacts/scenery/outdoor-home-levels.png',sheet.toBuffer('image/png'))
  const motionSheet=createCanvas(768*4,480*2),mg=motionSheet.getContext('2d')
  for(const [i,facing] of (['down','right','up','left'] as const).entries())for(const phase of [0,1]){
   const initial=newGame(CONTENT)
   let game={...initial,scenes:[],npcs:{},clock:{day:12,minute:720},player:{...initial.player,x:10,y:7,path:[]},inv:{...initial.inv,chair:1}}
   game=placeFurniture(game,'chair',{x:13,y:2},facing)! as typeof game
   const f=outdoorFurniture(game)[0],stand=furnitureUseStands(f,furnitureUseSpec('chair','adult')!)[0]
   game=useOutdoorFurniture({...game,player:{...game.player,...stand}},f) as typeof game
   expect(game.act?.use).toBe('outdoor')
   game={...game,act:{...game.act!,left:4.8-phase*1.2}} as typeof game
   const canvas=createCanvas(768,960),r=createRenderer(canvas.getContext('2d'),CONTENT)
   r.scale=3;r.zoom=1;r.look={x:9,y:4};r.draw(game,phase*1.2,0)
   if(phase===0){const detail=createCanvas(384,384),dg=detail.getContext('2d');dg.imageSmoothingEnabled=false;dg.drawImage(canvas,(13-r.camera.x)*48-48,(2-r.camera.y)*48-48,144,144,0,0,384,384);writeFileSync(`artifacts/scenery/outdoor-seat-${facing}.png`,detail.toBuffer('image/png'))}
   mg.drawImage(canvas,0,0,768,480,i*768,phase*480,768,480)
  }
  writeFileSync('artifacts/scenery/outdoor-seating-directions.png',motionSheet.toBuffer('image/png'))
 }finally{spy.mockRestore()}
})
