import {drawOilRoomBackground} from './oil-room-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

/** 공동주택 아래층 기름 작업장. 걸음을 이미 세어 본 올리버와 다음 만남을 상의한다. */
export function drawCountingSteps(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,oliver:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),wall=Math.round(h<=170?h*.47:Math.min(h*.39,h-106)),foot=wall+39
 drawOilRoomBackground(p,w,h,wall)
 // 대화 시작에 두 걸음 가까이 온 뒤 멈춘다. 대사를 넘겨도 재접근하지 않는다.
 const a=beat===0?Math.min(1,t/1.8):1,x=cx-29+(1-a)*-10
 person(p,x,foot,oliver.avatar,'right',oliver.who,false,beat===0&&a<1,t)
 person(p,cx+20,foot,avatar,'left')
 // 두 선택 모두 미래 만남에 관한 말이므로 현재 방과 위치를 유지한다.
 p(cx+51,wall+29,'#bea17a',25,2);p(cx+65,wall+34,'#bea17a',22,2)
}
