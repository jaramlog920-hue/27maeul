import {drawEventPrecipitation} from './event-precipitation'
type Pixel=(x:number,y:number,c:string,a?:number,b?:number)=>void
/** Existing merchant awning, Rudy's square well and the village dirt palette. */
export function drawMarketSquareBackground(p:Pixel,w:number,h:number,f:number,market=false,evening=false,wet=false,t=0,precipitation=true){
 const cx=Math.round(w/2)
 p(0,0,wet?'#b1bfba':evening?'#cdb8aa':'#d7d9b8',w,h);p(0,f-29,'#9eaf7c',w,h-f+29);p(0,f+3,'#c6b28a',w,h-f-3)
 for(let i=0;i<28;i++)p((i*47+7)%w,f+24+(i*19)%Math.max(5,h-f-27),'#b6a27c',2,1)
 if(market){
  p(cx-128,f-67,'#816344',4,80);p(cx+116,f-67,'#816344',4,80);p(cx-135,f-72,'#aa8865',262,7)
  for(let i=0;i<13;i++)p(cx-135+i*20,f-65,i%2?'#d0b187':'#b88d6c',20,12)
  p(cx-135,f-53,'#9b7654',262,3)
 }else{
  p(cx-135,f-45,'#997e5e',66,45);p(cx-138,f-49,'#bba17c',72,5);p(cx-129,f-26,'#c6b18b',54,3);p(cx-126,f-17,'#8f795d',48,17)
 }
 p(cx+83,f-8,'#929587',35,12);p(cx+81,f-12,'#c1c2ac',39,5);p(cx+87,f-12,'#77877e',27,3)
 if(wet&&precipitation)drawEventPrecipitation(p,w,h,t)
}
