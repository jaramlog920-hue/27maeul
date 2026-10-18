import {drawEventPrecipitation} from './event-precipitation'
import {drawPostmanBackground} from './postman-background'

it('rain falls down and left, reaches the ground, and fills tall screens',()=>{
 for(const [w,h] of [[480,270],[320,480],[300,170]]){
  const at=(t:number)=>{const cells:{x:number;y:number}[]=[];drawEventPrecipitation((x,y)=>{cells.push({x,y})},w,h,t);return cells}
  const first=at(0),later=at(.1)
  expect(first.some(p=>p.y>h*.8)).toBe(true)
  expect(first.some(p=>p.y<h*.2)).toBe(true)
  for(let i=0;i<first.length;i+=2){
   const dy=later[i].y-first[i].y,dx=later[i].x-first[i].x
   expect(Math.abs(dy-6.6)<.001||Math.abs(dy-6.6+h+8)<.001).toBe(true)
   expect(Math.abs(dx+1.3)<.001||Math.abs(dx+1.3-w-4)<.001).toBe(true)
  }
 }
})
it('dry and indoor scenes do not acquire rainfall',()=>{
 for(const context of [{minute:900,indoors:false,wet:false},{minute:900,indoors:true,wet:true}]){
  const colors:string[]=[]
  drawPostmanBackground((_x,_y,c)=>{colors.push(c)},320,220,120,context,1)
  expect(colors).not.toContain('#a7bdb7')
 }
})
