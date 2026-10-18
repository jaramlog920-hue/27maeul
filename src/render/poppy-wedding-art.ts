import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawDexterWedding} from './dexter-wedding-art'

/** 찻집의 웬델(poppy)이 직접 우린 따뜻한 잔치 차를 권한다. */
export function drawPoppyWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:FinalePerson[],beat:number){
 drawDexterWedding(g,w,h,t,avatar,spouse,guests,Math.min(2,beat),'banquetTea')
}
