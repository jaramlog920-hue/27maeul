type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** Dispersed rain falls through the whole view, behind the event actors. */
export function drawEventPrecipitation(p:Pixel,w:number,h:number,t:number,snow=false,night=false){
 const wrap=(n:number,size:number)=>((n%size)+size)%size
 const count=Math.max(18,Math.ceil(w*h/1700))
 for(let i=0;i<count;i++){
  const y=wrap(i*73.37+t*(snow?10:66),h+8)-4
  const x=wrap(i*97.13-t*(snow?2:13),w+4)-2
  if(snow)p(x,y,'#e5e9db',2,2)
  else{
   const color=night?'#82979d':'#a7bdb7'
   p(x,y,color,1,3);p(x-1,y+3,color,1,2)
  }
 }
}

/** Clip outdoor rain to glass, preserving the window frame and crossbars. */
export function drawWindowPrecipitation(p:Pixel,x:number,y:number,w:number,h:number,t:number,pane:(x:number,y:number)=>boolean=()=>true){
 drawEventPrecipitation((px,py,c,a=1,b=1)=>{
  const sx=Math.round(px),sy=Math.round(py)
  for(let yy=Math.max(0,sy);yy<Math.min(h,sy+b);yy++)for(let xx=Math.max(0,sx);xx<Math.min(w,sx+a);xx++){
   if(pane(x+xx,y+yy))p(x+xx,y+yy,c)
  }
 },w,h,t)
}
