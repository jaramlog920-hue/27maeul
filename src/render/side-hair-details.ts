import type { Who } from './sprites'

const HAIR = 'h01'
function put(rows:string[],x:number,y:number,c:string,fill=false) {
 const old=rows[y]?.[x]
 if(old===undefined||(!HAIR.includes(old)&&!(fill&&old==='.')))return
 rows[y]=rows[y].slice(0,x)+c+rows[y].slice(x+1)
}

/** 오른쪽 모습의 후두부만 다듬는다. 왼쪽 모습은 spriteRows 마지막에서 반전한다. */
export function sideHairDetails(rows:string[],kind:number) {
 const shade=(x:number,y:number,c:string)=>put(rows,x,y,c)
 const lock=(x:number,y:number,c='h')=>put(rows,x,y,c,true)
 // 뒤통수의 둥근 결: 밝은 줄은 안쪽, 어두운 경계는 귀 뒤쪽에 둔다.
 for(const [x,y]of [[1,3],[1,4],[2,5]])shade(x,y,'1')
 for(const [x,y]of [[3,3],[2,4]])shade(x,y,'0')
 switch(kind) {
  case 0: // 짧은 머리: 목덜미에서 한 칸 안쪽으로 들어간다.
   shade(1,5,'.');shade(2,5,'1')
   break
  case 1: // 긴 머리: 끊김 없이 내려오는 두 줄과 가늘게 갈라지는 끝.
   for(const y of [3,5,7])shade(0,y,'1')
   for(const y of [4,6])shade(1,y,'0')
   shade(1,8,'1')
   break
  case 2: // 단발: 끝은 반듯하게 두고 안쪽 결과 바깥 그늘만 더한다.
   for(const y of [4,5,6])shade(0,y,'1')
   for(const y of [3,4])shade(1,y,'0')
   break
  case 3: // 올린 머리: 정수리 뒤의 둥근 쪽과 묶음.
   lock(1,1);lock(0,2);lock(1,2,'0');lock(0,3,'1');lock(1,3,'1');lock(2,3,'x')
   break
  case 4: // 낮게 묶기: 매듭 밑으로 내려가다 안쪽으로 굽는 꼬리.
   shade(0,5,'0');lock(1,6,'0');shade(0,6,'1');lock(0,7,'1');shade(1,7,'h')
   break
  case 5: // 양갈래: 매듭과 갈라진 끝이 보이는 가까운 쪽 묶음.
   shade(0,4,'0');shade(0,6,'1');lock(1,6,'0');lock(1,7,'1')
   break
  case 6: // 낮게 땋기: 두 칸 폭에서 밝은 결과 그늘이 교차한다.
   lock(0,6,'h');shade(1,6,'0');lock(0,7,'0');shade(1,7,'1');lock(0,8,'1');shade(1,8,'0')
   break
  case 7: // 물결: 안쪽 줄은 이어 두어 귀를 덮고 바깥 윤곽만 굽힌다.
   shade(0,4,'.');shade(0,6,'.');shade(0,5,'0');shade(1,3,'0');shade(1,6,'1');shade(1,7,'0')
   break
  case 8: // 높게 묶기: 매듭 뒤로 부푼 뒤 끝에서 다시 안쪽으로.
   lock(0,3,'h');shade(1,3,'0');shade(0,4,'1');shade(1,5,'0');lock(0,7,'1')
   break
  case 9: // 쌍둥이 쪽머리: 작은 둥근 묶음의 밝은 가운데와 아래 그늘.
   lock(0,1,'h');shade(0,2,'h');shade(1,2,'0');lock(0,3,'1');shade(2,2,'1')
   break
  case 10: // 양쪽 땋기: 옆에서 보이는 한 가닥도 교차하는 두 줄로.
   for(const [x,y,c]of [[0,5,'h'],[1,5,'0'],[0,6,'0'],[1,6,'1'],[0,7,'1'],[1,7,'0'],[0,8,'0'],[1,8,'1'],[0,9,'1']] as const)lock(x,y,c)
   break
 }
}

/** 옛 주민은 고유 머리·모자 색을 유지하면서 머리 영역에만 결을 더한다. */
const LEGACY:Record<Who,{hair:string;light:string;shade:string}>= {
 writer:{hair:'h01',light:'0',shade:'1'},baker:{hair:'3',light:'c',shade:'C'},
 child:{hair:'h',light:'0',shade:'1'},grandpa:{hair:'W7',light:'W',shade:'7'},
 merchant:{hair:'L',light:'u',shade:'j'},smith:{hair:'ju',light:'u',shade:'j'},
 shepherd:{hair:'Uu',light:'u',shade:'O'},presser:{hair:'h',light:'0',shade:'1'},
 weaver:{hair:'F',light:'V',shade:'X'},beekeeper:{hair:'h',light:'0',shade:'1'},
 postman:{hair:'h',light:'0',shade:'1'},apothecary:{hair:'h',light:'0',shade:'1'},
 fisher:{hair:'7',light:'W',shade:'j'},carpenter:{hair:'L',light:'u',shade:'j'},
}
export function legacySideHairDetails(rows:string[],who:Who,elder=false) {
 // 긴 머리·땋은 머리의 목 아래 가닥도 노년 머리색으로 이어 준다.
 if(elder&&who==='writer')for(let y=7;y<=10;y++)for(let x=0;x<=2;x++){
  const c=rows[y]?.[x],gray=c==='h'?'~':c==='0'?'^':c==='1'?'%':undefined
  if(gray)rows[y]=rows[y].slice(0,x)+gray+rows[y].slice(x+1)
 }
 const colors=elder?{hair:'~^%',light:'^',shade:'%'}:LEGACY[who]
 for(const [x,y,light]of [[1,3,false],[1,4,false],[2,5,false],[3,3,true],[2,4,true]] as const){
  if(!colors.hair.includes(rows[y]?.[x]??'.'))continue
  rows[y]=rows[y].slice(0,x)+(light?colors.light:colors.shade)+rows[y].slice(x+1)
 }
}
