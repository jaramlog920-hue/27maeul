import {withLookDefaults,type Avatar} from '../engine/avatar'
import {NEWBORN_ROWS,NEWBORN_PALETTE,writerPalette} from './sprites'
/** 유저 아기 돌보기에서 쓰던 원본 몸체. 모든 아기 장면은 같은 원본을 사용한다. */
export function newbornArt(avatar?:Avatar|null,frame=0,sleeping=false):{rows:string[];palette:Record<string,string>}{
 const pal=avatar?writerPalette('spring',withLookDefaults(avatar)):null
 return {rows:NEWBORN_ROWS.map(r=>sleeping||Math.abs(frame)%4===2?r.replaceAll('o','e'):r),palette:{...NEWBORN_PALETTE,...(pal?{s:pal.s,n:pal['1']??pal.s,h:pal.h}:{})}}
}
