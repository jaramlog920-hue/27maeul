import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawDexterWedding} from './dexter-wedding-art'

/** 여러 마을의 생활 천을 이어 걸고 돌아올 집을 이야기하는 오스카의 결혼 잔치. */
export function drawMerchantWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:FinalePerson[],beat:number){
 drawDexterWedding(g,w,h,t,avatar,spouse,guests,Math.min(3,beat),'patchwork')
}
