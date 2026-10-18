/** Existing Marigold family-room walls, window, folded cloth and water bottle. */
export function drawGrandpaRoomBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,f:number,night=false){
 const cx=Math.round(w/2)
  p(0,0,night?'#877c69':'#c8b899',w,h);p(0,f-21,night?'#8b795f':'#ae926e',w,h-f+21)
  for(let y=f-14;y<h;y+=9)p(0,y,night?'#7b6a54':'#9e825d',w,1)
  p(cx-126,f-75,'#937450',43,35);p(cx-123,f-72,night?'#4c5d6b':'#c7d3bd',37,29)
  p(cx-106,f-72,'#aa8c66',2,29);p(cx-123,f-58,'#aa8c66',37,2)
  p(cx+65,f-11,'#a1825b',40,5);p(cx+68,f-6,'#866b4a',3,22);p(cx+99,f-6,'#866b4a',3,22)
  // 원래 가족 집의 접힌 천과 물병. 결혼 후 가구를 미리 넣지 않는다.
  p(cx+74,f-17,'#d2c6a8',18,6);p(cx+76,f-15,'#afa78c',14,1)
  p(cx+95,f-20,'#93a095',7,9);p(cx+97,f-23,'#c2c5ad',3,3)
}
