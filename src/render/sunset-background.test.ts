import {drawSunsetBackground} from './sunset-background'

function render(w:number,h:number,t:number,horizon:number,shore:number,frame:number){
 const pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){
  for(let yy=Math.max(0,y);yy<Math.min(h,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(w,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)
 }} as CanvasRenderingContext2D
 drawSunsetBackground(g,w,h,t,horizon,shore,frame)
 return pixels
}
it.each([[320,180,103,149,180],[320,180,44,96,118],[320,693,310,362,384],[320,120,19,71,93]])('keeps the sunset lawn continuous through the middle at %i × %i',(w,h,horizon,shore,frame)=>{
 const first=render(w,h,0,horizon,shore,frame)
 for(const t of [.6,8]){
  const pixels=render(w,h,t,horizon,shore,frame)
  // The former light rectangle reached the bottom and covered the entire middle.
  const middle=Array.from({length:Math.floor(w*.3)},(_,i)=>pixels.get(`${Math.round(w*.35)+i},${h-2}`))
  expect(middle.filter(c=>c==='#3f5149').length/middle.length).toBeGreaterThan(.9)
  expect(new Set(pixels.values()).has('#64705b')).toBe(false)
  // Moving water and sun must not move the bank under the actors' feet.
  for(let y=shore+6;y<h;y++)for(let x=Math.round(w*.2);x<w*.75;x++)expect(pixels.get(`${x},${y}`)).toBe(first.get(`${x},${y}`))
 }
 expect(first.get(`${Math.round(w*.5)},${shore-6}`)).not.toBe('#3f5149')
})
