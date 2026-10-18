import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawDexterWedding} from './dexter-wedding-art'

/** 할아버지가 아껴 둔 포도 바구니를 내놓는 메리골드의 결혼 잔치. */
export function drawMarigoldWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:(FinalePerson&{id?:string})[],beat:number){
 drawDexterWedding(g,w,h,t,avatar,spouse,guests,Math.min(2,beat),'grapes')
}
