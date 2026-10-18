type Px=(x:number,y:number,c:string,a?:number,b?:number)=>void
export function drawWeaverFacade(p:Px,cx:number,f:number,night=false){
   const x=cx-136;p(x,f-72,'#f4e0c0',99,75);p(x-5,f-86,'#a45a44',109,15);p(x-2,f-84,'#bc6c54',103,10)
   for(let y=f-81;y<f-72;y+=4)p(x-1,y,'#cc8068',101,1)
   p(x+59,f-42,'#906040',25,45);p(x+76,f-18,'#ddbd82',2,3)
   p(x+15,f-58,'#ac7444',27,24);p(x+19,f-62,'#ac7444',19,7);p(x+18,f-55,night?'#536476':'#d7dbaf',21,18)
}
