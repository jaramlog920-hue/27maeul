import {drawTeaFrontBackground} from './tea-front-background'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 오후 7~8시 찻집 곁. 박하·꿀·사과 꽃을 넣은 둘만의 차. */
export function drawOurBlend(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,host:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.64:Math.min(h*.51,h-98)),sip=choice===1&&beat>=2
 drawTeaFrontBackground(p,w,h,f)
 // 인물의 손 바로 앞 낮은 작은 탁자. 실제 찻집 가족의 외형을 사용한다.
 p(cx-5,f-1,'#8d6b4d',3,16);p(cx+26,f-1,'#8d6b4d',3,16)
 p(cx-10,f-6,'#b69770',43,6);p(cx-9,f-6,'#d9c6a4',41,2)
 person(p,cx+34,f+8,host.avatar,'left',host.who)
 person(p,cx-27,f+8,avatar,'right')
 // 주전자, 박하 잎, 꿀병. 사과 꽃은 답변에서 정체를 밝힌 뒤 보여 준다.
 p(cx+8,f-15,'#7c9187',11,8);p(cx+10,f-17,'#9caf9b',7,3);p(cx+18,f-14,'#657e74',4,5)
 p(cx+5,f-13,'#7c9187',4,3);p(cx+12,f-19,'#677e74',2,3)
 p(cx+82,f-8,'#b69770',32,4);p(cx+85,f-4,'#8f7051',3,17);p(cx+108,f-4,'#8f7051',3,17)
 p(cx+86,f-17,'#bca071',8,9);p(cx+87,f-20,'#765c43',6,3);p(cx+88,f-14,'#e1b86e',4,4)
 p(cx+99,f-12,'#537653',9,2);p(cx+100,f-15,'#7c9b65',5,3)
 if(choice!=null&&beat>=2){p(cx+103,f-19,'#e6c3b9',5,5);p(cx+104,f-20,'#f1ddd0',3,7);p(cx+102,f-18,'#f1ddd0',7,3);p(cx+105,f-17,'#d8b574',1,1)}
 const cup=(x:number,y:number)=>{p(x,y,'#8fa89b',6,5);p(x,y-1,'#eadbb8',7,2);p(x+1,y,'#8e6649',4,1);p(x+6,y+1,'#8fa89b',2,3)}
 p(cx-6,f-4,'#d5cbb0',10,2);p(cx+22,f-4,'#d5cbb0',10,2)
 cup(cx+23,f-10)
 // 짧은 손 길이로 잔만 입 옆까지 든다. 접시는 탁자에 남고 얼굴은 드러난다.
 const lift=sip?Math.min(5,Math.floor(Math.max(0,t)*5)):0
 cup(cx-5-lift,f-10+(sip?2:0))
 if(sip){const pal=writerPalette('spring',avatar?withLookDefaults(avatar):undefined);p(cx-8-lift,f-5,pal.s,2,2)}
 if(choice===0&&beat>=2){const pal=host.who==='writer'?writerPalette('spring',host.avatar?withLookDefaults(host.avatar):undefined):PALETTE;p(cx+35,f-8,pal.s,2,2)}
 if(!sip)p(cx-2,f-15-Math.floor(t*2)%3,'#e5ddc5',1,2)
}
