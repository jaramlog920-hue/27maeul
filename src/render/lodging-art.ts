export const LODGING_PALETTE={k:'#906040',w:'#c59a61',l:'#f0d8b0',c:'#f4e0c0',h:'#ffeaba',r:'#c07058',R:'#a86048',p:'#cc8468',m:'#ba6c54',H:'#c49261',C:'#e0a974',K:'#9a6e45',b:'#ffca70',B:'#ac7444',g:'#c68b54',v:'#81975b',a:'#e8ca92',d:'#bfa16f',e:'#fff0cf',q:'#fff4df',t:'#c8ac83',s:'#c5d7ab',S:'#aec392',y:'#f2dfb1',Y:'#dcc697',n:'#d7bea0',i:'#f6e8bf',j:'#e2ebc5',o:'#b6855e',O:'#c79a72',D:'#99734f',u:'#a69b76',f:'#d8c99e',z:'#d2bca5'}
/** 주변 집과 같은 네모 지붕·평면 창·굵은 선으로 그린 2층 공동 주택. */
export function lodgingBuildingRows():string[]{
 const a=Array.from({length:128},()=>Array<string>(96).fill('.'))
 const r=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(a[yy]?.[xx]!==undefined)a[yy][xx]=c}
 // 층수·건물 폭·현관 위치는 그대로 두고 주변 집의 벽 재료를 쓴다.
 r(0,67,96,61,'c');r(0,124,96,4,'l')
 r(0,67,2,61,'l');r(94,67,2,61,'l');r(0,67,96,3,'z')
 const window=(x:number,y:number)=>{
  // 일반 마을 집과 같은 10×9 창, 십자 창틀, 작은 꽃 상자.
  r(x,y,10,9,'w');r(x+1,y+1,8,7,'b');r(x+1,y+1,3,3,'h')
  r(x+4,y+1,2,7,'w');r(x+1,y+4,8,1,'w')
  r(x,y+9,10,2,'g');r(x+1,y+8,2,1,'h');r(x+5,y+8,2,1,'h')
 }
 const door=(x:number,y:number,height:number)=>{
  r(x,y,12,height,'w');r(x+1,y+1,10,height-1,'k')
  r(x+4,y+2,1,height-2,'B');r(x+7,y+2,1,height-2,'B')
  r(x+9,y+8,2,2,'b')
 }
 window(19,77);window(67,77)
 // 위층 중앙은 세 칸으로 나뉜 가로로 긴 창.
 r(36,77,24,9,'w');r(37,78,22,7,'b')
 for(const x of [37,45,53])r(x,78,3,3,'h')
 r(43,78,2,7,'w');r(51,78,2,7,'w');r(37,81,22,1,'w')
 r(35,86,26,2,'g')
 // 발코니: 창 아래의 뒤쪽 바닥 → 앞으로 돌출된 바닥 → 앞 난간 순서.
 r(12,104,72,3,'z')
 r(14,89,68,5,'l');r(12,93,72,4,'l')
 r(15,89,66,1,'n')
 for(const x of [24,36,48,60,72])r(x,90,1,3,'t')
 // 옆 난간을 벽까지 되돌려 연결해, 두 개의 가로 막대가 벽에 떠 보이지 않게 한다.
 r(13,89,2,3,'w');r(11,91,2,3,'w')
 r(81,89,2,3,'w');r(83,91,2,3,'w')
 r(10,93,76,1,'w');r(10,94,76,1,'B')
 for(const x of [10,25,40,54,69,84])r(x,95,2,7,x===10||x===84?'B':'w')
 // 난간 기둥은 바닥 앞턱에 닿고, 받침은 아래층 창을 침범하지 않는다.
 r(10,102,76,2,'B');r(10,104,76,1,'k')
 for(const x of [19,74]){r(x,105,3,2,'w');r(x+1,107,2,1,'B')}
 window(19,111);window(67,111);door(42,108,20)
 // drawRoof와 같은 평면 직사각형 지붕, 8픽셀 간격 기와 띠.
 r(0,39,96,28,'r')
 for(let y=47;y<63;y+=8)r(0,y,96,2,'m')
 r(0,39,96,4,'R');r(0,39,96,2,'p')
 r(0,39,2,28,'R');r(94,39,2,28,'R');r(0,63,96,4,'R')
 r(0,65,96,2,'k')
 // 주변 집과 같은 굴뚝 재료와 간단한 명암.
 r(75,33,8,12,'C');r(74,31,12,2,'K');r(81,33,2,12,'H')
 return a.map(row=>row.join(''))
}
export const LODGING_STAIRS_ROWS=(()=>{
 const rows=Array.from({length:16},()=>Array<string>(16).fill('.'))
 const bar=(x:number,y:number,w:number,c:string)=>{for(let dx=0;dx<w;dx++)rows[y][x+dx]=c}
 // 폭이 일정한 다섯 발판: 밝은 윗면과 어두운 수직면으로 오르는 방향을 보여 준다.
 // 넓은 맨 아래 받침과 피라미드형 옆선을 없앤다.
 for(let step=0;step<5;step++){
  const y=1+step*3
  bar(2,y,12,'l');bar(2,y+1,12,'B');bar(2,y+2,12,'D')
 }
 for(let y=1;y<16;y++){rows[y][1]='O';rows[y][14]='O'}
 return rows.map(row=>row.join(''))
})()
