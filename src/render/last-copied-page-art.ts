import {drawWritingRoomBackground} from './writing-room-background'
import type {Avatar} from '../engine/avatar'
import {person} from './milestone-moments-art'

/** 마지막 장을 쓴 직후. 제본과 서고 이동은 아직 하지 않는다. */
export function drawLastCopiedPage(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.68:Math.min(h*.54,h-94)),desk=cx-6
 drawWritingRoomBackground(p,w,h,f)
 // 椅子 → 人物 → 台の順。顔は台から離れ、短い脚が椅子の前に見える。
 p(cx-35,f-6,'#876649',20,4);p(cx-32,f-2,'#6d533e',3,13);p(cx-20,f-2,'#6d533e',3,13)
 person(p,cx-33,f+5,avatar,'right','writer',true)
 p(desk,f-10,'#ad8d62',62,4);p(desk+4,f-6,'#795d45',3,17);p(desk+54,f-6,'#795d45',3,17)
 // 書き終えた紙を整える。前の紙束と最後の一枚は区別する。
 p(desk+28,f-17,'#b9a381',23,7);p(desk+29,f-19,'#eee0bf',21,6)
 for(let i=0;i<3;i++)p(desk+30,f-16+i*2,'#cdbb9b',19,1)
 p(desk+7,f-19,'#c4b392',18,9);p(desk+8,f-20,'#f0e3c5',16,8)
 for(let i=0;i<3;i++)p(desk+10,f-18+i*2,'#917b61',i===2?7:12,1)
 // ペンを置いた後は呼吸や尺度で人物を揺らさず、灯火だけを動かす。
 p(desk+5,f-13,'#594d3e',13,1);p(desk+15,f-16,'#d9caa6',3,3)
 p(desk+3,f-25,'#72624f',5,5);p(desk+4,f-25,'#393d3d',3,1)
 p(desk+51,f-17,'#775946',7,3);p(desk+53,f-25,'#dec29a',3,8)
 p(desk+53,f-28,Math.floor(t*3)%2?'#f0bd7c':'#f9da98',2,4)
}
