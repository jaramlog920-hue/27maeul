import {HOME_ADDITION_PALETTE as home} from './expanded-home-art'
type Pixel=(x:number,y:number,c:string,a?:number,b?:number)=>void
/** 기존 갈대 틀 설치 장면의 집 벽·기와·울타리·마당을 재사용한다. */
export function drawHomeYardBackground(p:Pixel,w:number,h:number,f:number,offset={x:0,y:0}){
 const cx=Math.round(w/2),wall=cx-146
 const house:Pixel=(x,y,c,a,b)=>p(x+offset.x,y+offset.y,c,a,b)
 p(0,0,'#d7dfbe',w,h);p(0,f-12,'#b6c591',w,h-f+12)
 p(0,f+6,'#c7c693',w,h-f-6)
 // 기존 집의 크림 벽과 붉은 기와가 왼쪽에서 끝나고 오른쪽은 볕 드는 풀밭이다.
 house(wall,f-71,home.W,109,76);house(wall+3,f-68,home.w,103,71)
 house(wall-5,f-93,home.R,119,23);house(wall-2,f-90,home.r,113,16)
 for(let y=f-87;y<f-73;y+=5)house(wall-2,y,home.h,113,1)
 house(wall-5,f-74,home.R,119,5)
 house(wall+74,f-43,home.f,20,24);house(wall+77,f-40,'#e9d8a7',14,18)
 house(wall+82,f-40,home.f,3,18);house(wall+77,f-32,home.f,14,2)
 house(wall+101,f-69,'#d7c098',4,71);house(wall,f+3,'#d5bd93',109,4)
 house(wall+7,f+7,'#acb784',110,5)
 // 뒤쪽에는 생울타리, 앞쪽에는 집에서 떨어진 바람 잘 통하는 자리.
 for(let i=0;i<7;i++){house(cx-19+i*20,f-24-i%2*3,'#94aa7e',20,10);house(cx-17+i*20,f-17,'#a5b78b',16,7)}
 for(let i=0;i<36;i++){const x=(i*53+13)%w,y=f+13+(i*19)%Math.max(18,h-f-18);p(x,y,i%3?'#b8bc86':'#d7d0a2',2,1)}
}
