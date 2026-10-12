import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {png,draw} from './pixel-png.mjs'
const {REMAINING_FIXTURE_DIRECTIONS}=await import('../src/render/remaining-furniture-art.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const {spriteRows,writerPalette}=await import('../src/render/sprites.ts')
const root='assets/furniture/adult-bed';fs.mkdirSync(root,{recursive:true})
const palette={...FURNI_PALETTE,z:'#d1c4ae'},data=new Uint8Array(256*256*4)
for(let i=0;i<data.length;i+=4)data.set([245,240,222,255],i)
for(const [index,facing]of ['down','up','left','right'].entries()){
  const a=REMAINING_FIXTURE_DIRECTIONS.bed[facing],single=new Uint8Array(a.w*16*a.h*16*4)
  draw(single,a.w*16,a.rows,palette);png(`${root}/${facing}.png`,a.w*16,a.h*16,single)
  const x=(index%2)*128,y=Math.floor(index/2)*128
  draw(data,256,a.rows,palette,x+12,y+16,3)
  draw(data,256,spriteRows('writer','down',{frame:0,blink:false}),writerPalette('spring'),x+82,y+30,3)
}
png(`${root}/review.png`,256,256,data)
console.log(`${root}/review.png`)
