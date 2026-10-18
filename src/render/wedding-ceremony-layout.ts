export function weddingGuestPlaces(count:number,w:number,f:number){
 const cx=w/2,result:{x:number;foot:number;index:number}[]=[]
 const top=Math.min(6,count)
 for(let i=0;i<top;i++)result.push({x:Math.round(cx-92+i*34),foot:f-84+[5,17,4,11,20,8][i],index:i})
 for(let i=top;i<count;i++){
  const side=(i-top)%2,k=Math.floor((i-top)/2),row=Math.floor(k/2),inner=k%2
  const curve=[9,0,4,14][row%4],left=5+curve+inner*34
  result.push({x:side?w-left-22:left,foot:f-46+row*34+inner*14+(side?3:0),index:i})
 }
 return result.sort((a,b)=>a.foot-b.foot)
}


