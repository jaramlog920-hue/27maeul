import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawDexterWedding} from './dexter-wedding-art'

/** 같은 광장의 결혼 잔치, 루디 대사에 맞는 새 탁자와 소개 동작. 양은 등장하지 않는다. */
export function drawRudyWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:FinalePerson[],beat:number){
 drawDexterWedding(g,w,h,t,avatar,spouse,guests,beat,'table')
}
