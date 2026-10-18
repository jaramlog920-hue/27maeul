import type {Facing} from '../engine/types'
import type {CopyOutfit} from '../engine/copy-outfits'

/** Modern jacket/hoodie/two-piece/dress silhouettes on the original short body. */
export function copyOutfitDetails(rows:string[],facing:Facing,o:CopyOutfit){
 const original=rows.map(r=>r.split('')),side=facing==='left'||facing==='right',back=facing==='up'
 const put=(x:number,y:number,c:string,extend=false)=>{
  const before=original[y]?.[x]
  if((x===1||x===8)&&(y===8||y===9))return
  if(y<7||y>12||before===undefined||'sh01o+25'.includes(before))return
  if(!extend&&!['r','R','l','d','D','b','k'].includes(before))return
  rows[y]=rows[y].slice(0,x)+c+rows[y].slice(x+1)
 }
 for(let y=7;y<=12;y++)for(let x=0;x<10;x++){
  const c=original[y]?.[x]
  if('rRldDb'.includes(c??'.'))put(x,y,y>=11?'β':c==='R'?'β':'α')
 }
 if(o.look==='f'&&o.cut<=2){
  // A contemporary fitted skirt. Mini dresses show the native legs below the hem.
  const mini=o.cut===0,wide=o.cut===2
  for(let x=2;x<=7;x++)put(x,11,x===2||x===7?'β':'α',true)
  if(wide){for(let x=1;x<=8;x++)put(x,12,x%3===0?'ζ':'α',true)}
  else if(mini){
   for(let x=0;x<10;x++)put(x,12,'.',true)
   for(const x of [2,3,6,7])put(x,12,'s',true)
  }else for(let x=2;x<=7;x++)put(x,12,x===2||x===7?'β':'α',true)
  if(!back){put(4,7,'γ');put(5,7,'γ');put(4,8,'α');put(5,8,'α')}
  if(mini)for(const [x,y] of [[3,8],[6,9],[4,10],[5,11]])put(x,y,'ζ')
  if(wide)for(const x of [2,4,6])put(x,11,'ζ')
 }else{
  // Separate trousers or a short skirt beneath waist-length outerwear.
  for(let x=2;x<=7;x++)put(x,10,'β')
  if(o.look==='f'&&o.cut===3&&o.motif!==14&&o.motif!==18){
   for(let x=2;x<=7;x++)put(x,11,x%2?'α':'β',true)
   for(let x=0;x<10;x++)put(x,12,'.',true)
   for(const x of [2,3,6,7])put(x,12,'s',true)
  }
  if(!back){
   if(o.cut===0||o.cut===1){
    // T-shirt and notched blazer lapels, with a dark waistband instead of a sash.
    for(const [x,y] of [[4,7],[5,7],[4,8],[5,8],[4,9],[5,9]])put(x,y,'γ')
    put(3,7,'β');put(6,7,'β');put(3,8,'β');put(6,8,'β');put(6,9,'ζ')
   }else if(o.cut===2){
    for(let y=7;y<=10;y++)put(5,y,'γ')
    put(3,8,'ζ');put(3,9,'ζ');put(6,10,'γ')
    if(o.motif===8||o.motif===14)for(let y=7;y<=9;y++){put(2,y,'γ');put(7,y,'γ')}
   }else if(o.cut===3||o.motif===13||o.motif===16){
    // Hood opening, short drawstrings and a graphic/kangaroo pocket.
    put(3,7,'γ');put(6,7,'γ');put(3,8,'γ');put(6,8,'γ')
    put(4,8,'ζ');put(5,8,'ζ');put(3,9,'β');put(4,9,'β');put(5,9,'β');put(6,9,'β')
   }else{
    for(let y=7;y<=9;y++)put(5,y,'γ')
    put(3,8,'β');put(6,8,'β');put(3,9,'γ');put(6,9,'γ')
   }
  }else{put(4,8,'β');put(5,9,'β');put(4,10,'γ')}
  // Modern open trench/overcoat tails: visibly separate from the trousers.
  if(o.look==='m'&&o.cut===1){
   for(let y=11;y<=12;y++)for(const x of [2,3,6,7])put(x,y,'α')
   for(const x of [4,5])put(x,11,'β')
  }
 }
 // Surface treatments are printed graphics, quilting, knit or sequins, not embroidery bands.
 if(o.motif===7)for(const y of [8,9,10])for(let x=3;x<=6;x++)put(x,y,(x+y)%2?'γ':'β')
 if(o.motif===15)for(let y=7;y<=11;y++)for(let x=3;x<=6;x++)if((x+y)%3===0)put(x,y,'γ')
 if(o.motif===17)for(const x of [3,6])for(let y=7;y<=11;y++)put(x,y,'ζ')
 if(o.motif===0||o.motif===19)for(const [x,y] of [[3,8],[6,9],[4,10],[5,11]])put(side?4:x,y,'ζ')
}
