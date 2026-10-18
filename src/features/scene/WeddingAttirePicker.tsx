import type {ReactNode} from 'react'
import {WEDDING_ATTIRE,weddingOutfitsFor} from '../../engine/wedding-attire'
import {useGame} from '../../store/game-store'
import {ItemIcon} from '../../shared/ItemIcon'

/** Live ceremony only. Replay/preview mount no picker and perform no writes. */
export function WeddingAttirePicker({id,children}:{id:string;children:ReactNode}){
 const game=useGame(s=>s.game),choose=useGame(s=>s.chooseWeddingAttire),partner=id.slice('wedding:'.length)
 const items=WEDDING_ATTIRE.filter(a=>(game.inv[a.item]??0)>0)
 if(game.romance.partner!==partner||game.romance.stage!=='married'||!game.scenes.includes(id)||!items.length||weddingOutfitsFor(game,partner).chosen)return <>{children}</>
 return <div className="dialog" role="dialog" aria-label="결혼식에 입을 옷"><h2>결혼식에 입을 옷</h2><p>가방에 있는 예복을 골라 입어요.</p><div className="item-grid">{items.map(a=><button className="item-cell" key={a.item} aria-label={`${a.name} 입기`} onClick={()=>choose(a.item)}><ItemIcon id={a.item}/><span>{a.name} 입기</span></button>)}</div><div className="actions"><button onClick={()=>choose(null)}>평소 옷으로 참석</button></div></div>
}
