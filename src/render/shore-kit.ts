import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {writerPalette,PALETTE} from './sprites'
import {drawRiverRestBackground} from './river-rest-background'
export type ShorePx=(x:number,y:number,c:string,a?:number,b?:number)=>void
export function shoreFrame(g:CanvasRenderingContext2D,w:number,h:number,t:number,mode:'day'|'dawn'|'evening'|'fog'='day',afloat=false){
 const p:ShorePx=(x,y,c,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=foot+8
 g.imageSmoothingEnabled=false;drawRiverRestBackground(p,w,h,t,foot-70,afloat?foot+31:foot-24,mode!=='day',false)
 if(mode==='fog'){p(0,0,'#bdc7c3',w,foot-68);for(let i=0;i<4;i++)p(0,foot-70+i*8,'#c0cac5',w,3)}
 if(mode==='dawn'){p(0,0,'#8f99ae',w,Math.max(1,foot-100));p(0,Math.max(1,foot-100),'#bcc0c2',w,7)}
 return {p,cx,foot,ground}
}
export function shoreActor(p:ShorePx,x:number,ground:number,a:FinalePerson|null,avatar:Avatar|null,face:'left'|'right'|'up'='left',sit=false,walk=false,t=0){person(p,x,ground,a?a.avatar:avatar,face,a?a.who:'writer',sit,walk,t)}
export function bench(p:ShorePx,x:number,f:number){p(x-2,f+6,'#a8835e',24,3);p(x,f+9,'#76583e',3,8);p(x+17,f+9,'#76583e',3,8)}
export function workBoard(p:ShorePx,cx:number,f:number){p(cx-34,f+4,'#b69871',70,4);p(cx-30,f+8,'#866548',3,15);p(cx+29,f+8,'#866548',3,15)}
export function net(p:ShorePx,x:number,y:number,w=27,h=18){for(let xx=x;xx<x+w;xx+=4)p(xx,y,'#879987',1,h);for(let yy=y;yy<y+h;yy+=4)p(x,yy,'#a0ae94',w,1)}
export function rack(p:ShorePx,x:number,f:number,complete=true,shells=false){const y=f-39;p(x,y,'#80664c',3,49);p(x+37,y,'#80664c',3,49);if(complete)p(x-2,y,'#ac8961',44,4);if(complete){net(p,x+16,y+6,18,25);p(x+7,y+4,'#b48a57',2,27);p(x+4,y+31,'#b48a57',8,9)}if(shells)for(let i=0;i<3;i++){const sx=x+5+i*13;p(sx,y+3,'#d1bd97',1,8);p(sx-2,y+10,'#d9cbae',5,3)}}
export function letter(p:ShorePx,x:number,y:number,open=true,extra=false){p(x,y,'#eee0bd',open?20:11,open?13:7);if(open){for(let i=0;i<3+(extra?1:0);i++)p(x+3,y+3+i*2,'#a08964',i===3?13:11,1)}else{p(x+1,y+1,'#b8a382',9,1);p(x+3,y+2,'#b8a382',5,1)}}
export function boat(p:ShorePx,x:number,y:number,w=68,broken=false,sail=false){p(x+6,y,'#8d5829',w-12,3);p(x,y+3,'#b17640',w,5);p(x+5,y+8,'#8d5829',w-10,5);p(x+12,y+13,'#b17640',w-24,3);for(let i=0;i<3;i++)p(x+9,y+4+i*3,'#cc9e62',w-18,1);if(broken){p(x+w-15,y,'#849b99',15,9);p(x+w-16,y+3,'#8d5829',5,3);p(x+w-22,y+1,'#d5b887',7,2)}if(sail){p(x+w*.52,y-54,'#80664c',2,58);p(x+w*.52+2,y-52,'#e9dec0',26,31);for(let i=0;i<6;i++)p(x+w*.52+2+i*4,y-52+i*3,'#c7bf9f',2,31-i*3)}}
export function raisedFinger(p:ShorePx,a:FinalePerson|null,avatar:Avatar|null,x:number,ground:number){const av=a?a.avatar:avatar,pal=(!a||a.who==='writer')?writerPalette('spring',av?withLookDefaults(av):undefined):PALETTE;p(x-2,ground-14,pal.r??pal.V,2,5);p(x-2,ground-18,pal.s,2,4)}
