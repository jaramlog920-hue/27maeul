import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

export function drawSnackBasket(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,baker:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h*(h<=170?.53:.44))
 const basketPalette:Record<string,string>={...ICON_PALETTE,N:'#806042',n:'#b28b5b'}
 const stamp=(rows:readonly string[],x:number,y:number,scale=1,from=0)=>rows.forEach((r,yy)=>{if(yy<from)return;[...r].forEach((c,xx)=>{const palette=rows===ICONS.basket?basketPalette:ICON_PALETTE;if(c!=='.'&&palette[c])p(x+xx*scale,y+yy*scale,palette[c],scale,scale)})})
 p(0,0,'#d7b999',w,h);p(0,floor,'#b69870',w,h-floor)
 for(let y=floor+8;y<h;y+=9)p(0,y,'#a88963',w,1)
 p(0,floor-3,'#b0946d',w,3)
 // 가을 오후의 빵집 준비대. 창밖의 낙엽은 천천히 지나간다.
 p(cx-112,floor-65,'#977453',47,43);p(cx-109,floor-62,'#d9c2a2',41,37)
 p(cx-109,floor-41,'#b2b78b',41,16);p(cx-91,floor-62,'#a38660',3,37);p(cx-109,floor-44,'#a38660',41,2)
 const leafY=floor-60+Math.floor(t*3)%31
 p(cx-102,leafY,'#ba9560',3,2);p(cx-101,leafY+2,'#b18554',1,1)
 p(cx+78,floor-59,'#8b6948',32,4);p(cx+81,floor-55,'#ead5ad',3,17);p(cx+95,floor-55,'#ead5ad',3,23)
 p(cx-112,floor+3,'#a68054',21,22);p(cx-110,floor+1,'#c09d71',17,3)
 p(cx-107,floor+8,'#816342',11,2);p(cx-107,floor+13,'#816342',11,2)
 const active=beat>=1,help=active&&choice===0,a=active?Math.min(1,t/2):0
 const clothProgress=help?Math.max(0,Math.min(1,(t-.8)/1.4)):0
 const helperX=help?(t<.8?85-24*t/.8:61-27*clothProgress):85
 person(p,cx-24+(active&&!help?25*a:0),floor+34-(active&&!help?12*a:0),baker.avatar,'right',baker.who)
 person(p,cx+helperX,floor+34,avatar,'left','writer',false,help&&t<2.2,t)
 // 작업대는 허리 높이. 바구니 손잡이는 인물의 얼굴 앞에 오지 않는다.
 p(cx-7,floor+20,'#be9a69',90,5);p(cx-3,floor+25,'#7e5c3d',3,13);p(cx+75,floor+25,'#7e5c3d',3,13)
 p(cx-7,floor+24,'#aa8054',90,1)
 const bx=cx+15,by=floor+6
 stamp(ICONS.basket,bx,by,2)
 p(bx+3,by+6,'#7c6345',10,4)
 // 선택하기 전에는 접힌 천과 식은 빵을 바구니 옆에 준비해 둔다.
 const clothX=help?cx+41-(cx+41-bx-2)*clothProgress:cx+41
 const clothY=help?floor+16-(floor+16-by-6)*clothProgress:floor+16
 p(clothX,clothY,'#e9d7ad',18-(help?4*clothProgress:0),4)
 for(let i=0;i<4;i++)p(clothX+1+i*4,clothY+1,'#bc9370',2,2)
 p(cx-8,floor+14,'#9b744a',21,6);p(cx-7,floor+14,'#c5a071',19,2)
 if(!active||help)stamp(ICONS.bread,cx-7,floor+9)
 stamp(ICONS.bread,cx+3,floor+9)
 if(help){
  // 실제 담기 놀이는 대답을 닫은 뒤 시작한다. 여기서는 천을 까는 준비까지만 그린다.
  if(clothProgress>=1){p(bx+2,by+6,'#ead8b2',12,4);p(bx+4,by+7,'#bf9875',2,2);p(bx+9,by+7,'#bf9875',2,2)}
 }else if(active){
  // 지켜보는 선택에서는 헤이즐이 부드러운 빵을 위에 놓는다.
  const breadX=cx-7+(bx+4-cx+7)*a,breadY=floor+9+(by+1-floor-9)*a
  stamp(ICONS.bread,breadX,breadY)
 }
 // 앞면의 엮은 무늬로 천과 빵의 아래쪽을 가려, 안에 담긴 깊이를 만든다.
 stamp(ICONS.basket,bx,by,2,4)
 p(cx+45,floor+43,'#9d8260',27,4)
}
