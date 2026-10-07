import type { FurnitureArt } from './furniture-art'
import type { Facing } from '../engine/types'

/** 기존 문·지붕 외곽·64px 크기를 유지한 시설별 디테일. */
export function settlementBuildingDetails(base: FurnitureArt, id: string, facing: Facing): FurnitureArt {
  if(!['guest','home','weaver','courtyard','garden'].includes(id))return base
  const p=base.rows.map(r=>[...r])
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c}
  if(id==='courtyard') {
    rect(8,54,7,5,'W');rect(9,54,5,3,'l');rect(45,54,9,5,'W');rect(46,54,7,3,'l')
    rect(24,36,15,2,'w');rect(26,38,2,6,'W');rect(35,38,2,6,'W');rect(29,34,4,2,'C')
  } else if(id==='garden') {
    for(const [x,y] of [[12,43],[45,44],[17,55],[42,55]]){rect(x,y,5,3,'g');rect(x+1,y,2,1,'p')}
    rect(24,55,16,1,'I');rect(27,58,10,1,'I')
  } else {
    // 지붕은 기존 팔레트로 구별하고 문과 문턱은 보존한다.
    if(id==='home')for(let y=0;y<28;y++)for(let x=0;x<64;x++){if(p[y][x]==='H')p[y][x]='I';else if(p[y][x]==='h')p[y][x]='i'}
    if(id==='weaver')for(let y=0;y<28;y++)for(let x=0;x<64;x++){if(p[y][x]==='H')p[y][x]='a';else if(p[y][x]==='h')p[y][x]='A'}
    if(facing!=='up') {
      const xs=facing==='down'?[14,43]:[27]
      for(const x of xs){rect(x-1,44,10,2,'w');rect(x,43,8,1,'g');if(id==='home'){rect(x+2,42,2,1,'p');rect(x+6,42,1,1,'p')}}
      if(id==='guest'){rect(20,31,24,1,'W');for(let x=21;x<44;x+=4){rect(x,32,2,3,'C');rect(x+1,32,1,1,'p')}}
      if(id==='weaver'){rect(20,29,23,3,'W');for(let x=21;x<42;x+=3)rect(x,30,2,1,x%2?'b':'p')}
    }
  }
  return {...base,rows:p.map(r=>r.join(''))}
}
