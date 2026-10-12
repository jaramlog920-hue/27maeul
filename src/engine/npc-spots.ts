import { isHome, isWalkable, key, roomAt, WARPS } from './world'
import type { Tile } from './types'

/** 같은 칸에 멈추는 주민은 바로 옆의 같은 공간으로 나눈다. 다른 주민의 원래 자리는 보존한다. */
export function separateNpcGoals(goals:Record<string,Tile|null>,blocked:ReadonlySet<string>=new Set(),priority:readonly string[]=[]):Record<string,Tile|null> {
 const result={...goals},claimed=new Set<string>()
 const originals=new Set(Object.values(goals).filter((t):t is Tile=>!!t).map(key))
 const ids=[...new Set([...priority,...Object.keys(goals)])].filter(id=>id in goals)
 for(const id of ids){
  const at=goals[id];if(!at)continue
  if(!claimed.has(key(at))&&isWalkable(at,blocked)){claimed.add(key(at));continue}
  const room=roomAt(at),home=isHome(at)
  const queue=[{at,depth:0}],seen=new Set([key(at)])
  let next:Tile|undefined
  for(let i=0;i<queue.length&&!next;i++){
   const cur=queue[i]
   if(cur.depth>=2)continue
   for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){
    const t={x:cur.at.x+dx,y:cur.at.y+dy},k=key(t)
    if(seen.has(k)||WARPS.has(k)||!isWalkable(t,blocked)||roomAt(t)!==room||isHome(t)!==home)continue
    seen.add(k)
    if(!claimed.has(k)&&!originals.has(k)){next=t;break}
    queue.push({at:t,depth:cur.depth+1})
   }
  }
  if(next)result[id]=next
  claimed.add(key(result[id]!))
 }
 return result
}
