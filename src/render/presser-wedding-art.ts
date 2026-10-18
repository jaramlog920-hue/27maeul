import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawDexterWedding} from './dexter-wedding-art'

/** 올리브 잎과 고른 잔 두 개 곁에서 오래 앉아 있는 올리버의 결혼 잔치. */
export function drawPresserWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:FinalePerson[],beat:number){
 drawDexterWedding(g,w,h,t,avatar,spouse,guests,Math.min(3,beat),'oliveCups')
}
