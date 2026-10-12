import './pixel-ts-loader.mjs'
import {png,draw} from './pixel-png.mjs'
const {petMotionRows}=await import('../src/render/pet-art.ts')
const {spriteRows,writerPalette,ANIMAL_PALETTE}=await import('../src/render/sprites.ts')
const w=400,h=176,p=new Uint8Array(w*h*4)
for(let i=0;i<p.length;i+=4)p.set([238,225,204,255],i)
for(const [j,facing]of ['down','up','left','right'].entries()) {
  const y=j*44
  draw(p,w,spriteRows('writer',facing,{frame:0,blink:false}),writerPalette('spring'),16,y+8,2)
  for(const [i,kind]of ['cat','dog'].entries())for(const [b,baby]of [false,true].entries())
    draw(p,w,petMotionRows(kind,facing,'wait',0,baby),ANIMAL_PALETTE[kind],72+(i*2+b)*76,y+4,2)
}
png('assets/furniture/expansion/pet-size-review.png',w,h,p)
