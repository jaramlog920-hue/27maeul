import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {png,draw} from './pixel-png.mjs'
const {lodgingBuildingRows,LODGING_PALETTE,LODGING_STAIRS_ROWS}=await import('../src/render/lodging-art.ts')
const {OIL_PRESS_ART}=await import('../src/render/oil-press-art.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const root='assets/lodging';fs.mkdirSync(root,{recursive:true})
for(const [name,rows] of [['shared-house',lodgingBuildingRows()],['stairs',LODGING_STAIRS_ROWS]]){const w=rows[0].length,h=rows.length,p=new Uint8Array(w*h*4);draw(p,w,rows,LODGING_PALETTE);png(`${root}/${name}.png`,w,h,p)}
const p=new Uint8Array(384*512*4);for(let i=0;i<p.length;i+=4)p.set([241,225,198,255],i);draw(p,384,lodgingBuildingRows(),LODGING_PALETTE,0,0,4);png(`${root}/house-review.png`,384,512,p)
const grass=new Uint8Array(384*512*4)
const grassRows=Array.from({length:128},(_,y)=>Array.from({length:96},(_,x)=>((x*37+y*53)%97<4?'b':(x*13+y*31)%89<3?'c':'a')).join(''))
draw(grass,384,grassRows,{a:'#b0cc94',b:'#a6c48a',c:'#b8d29e'},0,0,4)
draw(grass,384,lodgingBuildingRows(),LODGING_PALETTE,0,0,4);png(`${root}/house-on-grass-review.png`,384,512,grass)
const stairReview=new Uint8Array(128*128*4);for(let i=0;i<stairReview.length;i+=4)stairReview.set([241,225,198,255],i);draw(stairReview,128,LODGING_STAIRS_ROWS,LODGING_PALETTE,0,0,8);png(`${root}/stairs-review.png`,128,128,stairReview)
const oilPalette={...FURNI_PALETTE,z:'#d0c0a5'}
for(const scale of [1,8]){
 const w=16*scale,pixels=new Uint8Array(w*w*4)
 if(scale>1)for(let i=0;i<pixels.length;i+=4)pixels.set([241,225,198,255],i)
 draw(pixels,w,OIL_PRESS_ART.rows,oilPalette,0,0,scale)
 if(scale===1)OIL_PRESS_ART.rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='z')pixels.set([90,70,50,56],(y*w+x)*4)}))
 png(`${root}/${scale===1?'oil-press':'oil-press-review'}.png`,w,w,pixels)
}
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({description:'마을 집과 같은 평면 지붕과 작은 꽃 상자 창의 2층 공동 여관 · 1층 작업장과 2층 가족 숙소',assets:[{id:'shared-house',label:'소박한 공동 여관 · 2층',group:'buildings',file:'shared-house.png',width:96,height:128},{id:'stairs',label:'두 층을 잇는 계단',group:'interiors',file:'stairs.png',width:16,height:16},{id:'oil-press',label:'기름 짜는 통 · 나무 압착기',group:'interiors',file:'oil-press.png',width:16,height:16}]},null,2))
const balconyRows=lodgingBuildingRows().slice(73,108).map(row=>row.slice(6,90))
const balconyPreview=new Uint8Array(504*210*4)
draw(balconyPreview,504,balconyRows,LODGING_PALETTE,0,0,6)
png(`${root}/balcony-review.png`,504,210,balconyPreview)
console.log('2층 공동 주택 PNG 내보내기 완료')
