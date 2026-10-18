import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawDexterWedding} from './dexter-wedding-art'

/** 페넬로피가 짠 잔치 깃발이 바람에 날리는 결혼 잔치. */
export function drawPenelopeWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:FinalePerson[],beat:number){
 drawDexterWedding(g,w,h,t,avatar,spouse,guests,Math.min(2,beat),'wovenFlags')
}
