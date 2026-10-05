import { pixels } from './home-space-art'
import type { FurnitureArt } from './furniture-art'
import type { Facing } from '../engine/types'

type Rect = readonly [string, number, number, number, number]
export interface SpouseRoomDesign {
  id: string; name: string; title: string; accent: string; second: string
  character: string; concept: string; desk: string; keepsake: string; wall: string
  routine: string; together: string; boundary: string; motif: readonly Rect[]
  layout: 'window' | 'reading' | 'craft' | 'tea'
}
// New furnishing choices are design proposals based on existing character documents.
export const SPOUSE_ROOM_DESIGNS: readonly SpouseRoomDesign[] = [
  {id:'wendell',name:'웬델',title:'새 맛을 적는 오후',accent:'y',second:'r',character:'손일은 능숙하지만 가족 책임과 자기 진로 사이에서 자기 선택을 미룬다.',concept:'작은 빵 모양 연구 자리와 문 닫은 뒤 쉬는 자리. 가게의 생산 화덕은 들이지 않는다.',desk:'빵 모양 스케치 탁자',keepsake:'세 가지 빵 모양 견본',wall:'자기가 고른 새 맛 메모',routine:'일을 마친 뒤 모양을 그리다가 메모를 덮고 쉬기.',together:'찬 반죽 모양 고르기, 만든 간식 함께 맛보기.',boundary:'취향 연구를 자동 빵 생산이나 가족 노동으로 바꾸지 않는다.',layout:'craft',motif:[['l',3,9,8,4],['y',4,8,6,3],['C',6,9,1,2],['l',16,8,5,5],['y',17,7,3,3],['w',24,9,5,4],['y',25,9,3,2]]},
  {id:'cosmo',name:'코스모',title:'잔잔한 물빛 쉼터',accent:'b',second:'B',character:'농담이 많지만 조용한 시간도 필요하며 물에 관한 어려운 기억을 자기 속도로 다룬다.',concept:'물빛 천과 작은 배를 놓은 마른 휴식방. 호수 전망과 실제 물가 접근은 강요하지 않는다.',desk:'작은 배 모형 진열 탁자',keepsake:'접은 돛과 나무 배',wall:'물결 무늬 생활 그림',routine:'그물을 집에 펼치는 대신 작은 배를 손질하고 편히 앉기.',together:'배의 돛 모양 고르기, 말없이 나란히 쉬기.',boundary:'수조·실내 연못·강제 물가 체험은 넣지 않는다.',layout:'window',motif:[['W',3,11,12,2],['w',5,13,8,1],['W',9,3,1,8],['c',10,4,5,5],['b',3,10,12,1],['C',21,6,6,5],['w',20,11,8,1]]},
  {id:'rudy',name:'루디',title:'내 속도로 읽는 방',accent:'l',second:'g',character:'읽는 속도보다 자기 속도와 손으로 표현하는 능력이 중요하다.',concept:'낮은 읽기 받침과 직접 깎은 책받침, 쉬운 동선. 미완성 손일도 편히 놓는 공간.',desk:'책받침을 깎는 낮은 탁자',keepsake:'나무 책갈피와 책받침',wall:'나무 결 표본 액자',routine:'몇 줄 읽고 책갈피를 놓은 뒤 나무 조각 손질.',together:'같은 책을 각자 속도로 읽기, 생활 물건의 모양 이야기.',boundary:'읽기 실력을 평가하는 장식이나 필사 강제 과제를 두지 않는다.',layout:'reading',motif:[['W',3,10,12,3],['C',4,6,10,5],['c',5,6,4,4],['w',9,6,1,5],['w',21,5,5,8],['l',22,5,2,7],['g',23,7,1,3]]},
  {id:'dexter',name:'덱스터',title:'구름과 별의 작은 서재',accent:'b',second:'y',character:'관찰이 세심하고 별과 종이에 관심이 많다. 느린 반응은 무관심이 아니다.',concept:'하늘 보이는 창가, 접은 종이와 별 그림. 밤의 작은 등불로 차분한 분위기.',desk:'관찰 종이를 펼치는 탁자',keepsake:'접은 종이 별',wall:'별자리와 구름 생활 그림',routine:'창밖 구름 보기, 짧은 창작 메모 접기, 밤에는 조용히 등불 켜기.',together:'오늘 구름 모양 말하기, 접은 종이 모양 함께 고르기.',boundary:'현대 망원경·우주 장비나 별 관찰 숙제를 넣지 않는다.',layout:'window',motif:[['C',3,6,11,7],['c',4,7,9,5],['b',5,8,6,1],['W',7,9,1,2],['y',23,5,2,8],['y',20,8,8,2],['Y',22,7,4,4]]},
  {id:'basil',name:'바질',title:'돌보는 사람의 휴식방',accent:'g',second:'b',character:'남을 챙기지만 자기 휴식과 도움 요청은 서툴고 바깥 풍경을 좋아한다.',concept:'소수의 허브 화분과 자기 찻잔, 그늘빛 천. 약방 업무를 들여오는 대신 쉰다.',desk:'화분 관찰과 차 탁자',keepsake:'잎을 비교하는 작은 받침',wall:'물을 준 날의 생활 메모',routine:'자기 화분을 잠깐 보고 차를 마신 뒤 창밖 풍경 보기.',together:'함께 화분 돌보기, 원하는 휴식부터 물어보기.',boundary:'치료 효과·실내 진료·매일 약 생산 기능은 없다.',layout:'tea',motif:[['r',4,10,7,4],['p',5,11,2,2],['g',7,5,1,6],['G',4,6,4,2],['g',8,7,4,2],['B',21,8,6,5],['c',22,7,4,2],['g',22,8,4,1]]},
  {id:'marigold',name:'메리골드',title:'포도빛과 빈 일정',accent:'v',second:'g',character:'책임감이 크고 계획을 세우며 불확실한 일에 긴장한다.',concept:'포도빛 천, 생활 일정판과 일부러 빈 휴식칸. 포도원 업무와 별개로 자기 하루를 고르는 방.',desk:'생활 일정과 풍경 스케치 탁자',keepsake:'포도 잎 생활 표본',wall:'휴식칸이 남은 일정판',routine:'내일 일정을 짧게 정하고 휴식칸은 비워 두기.',together:'둘의 쉬는 오후를 고르기, 포도원 밖 취향 이야기.',boundary:'할아버지 돌봄 의무나 포도 생산을 배우자 방 과제로 옮기지 않는다.',layout:'craft',motif:[['C',3,4,12,9],['c',4,5,10,7],['g',6,6,1,4],['G',5,6,4,2],['v',9,8,3,3],['C',21,5,7,8],['W',22,6,4,1],['g',22,8,3,1]]},
  {id:'penelope',name:'페넬로피',title:'두 색이 남는 손일방',accent:'p',second:'b',character:'선택을 오래 살피고 섬세한 색 취향이 있으며 완벽해야 한다는 고민을 덜고 싶다.',concept:'두 색 실을 나란히 놓고 완성작과 작업 중인 천을 함께 둔다. 미완성을 숨기지 않는 방.',desk:'두 색 천을 비교하는 손일 탁자',keepsake:'선택한 두 색 실패',wall:'완성·미완성 무늬 비교판',routine:'두 색 비교 후 한 조각만 마무리하고 쉬기.',together:'정답 없이 서로 좋아하는 무늬를 말하기.',boundary:'완벽한 결과만 전시하거나 플레이어가 색을 대신 결정하지 않는다.',layout:'craft',motif:[['W',4,4,3,10],['p',2,7,7,4],['c',3,8,5,1],['W',13,4,3,10],['b',11,7,7,4],['c',12,8,5,1],['p',23,5,6,4],['b',23,9,6,4],['c',25,5,1,8]]},
  {id:'tilly',name:'틸리',title:'튼튼하고 예쁜 등불방',accent:'t',second:'b',character:'쓸모와 아름다움을 함께 살리는 장식 고리를 자기 이름으로 만들고 싶다.',concept:'차가운 금속 장식 진열과 도안판, 작은 등불. 뜨거운 대장간은 작업장에 남긴다.',desk:'장식 고리 도안 탁자',keepsake:'자기 이름의 장식 고리',wall:'곡선과 네모 고리 도안',routine:'도안을 고르고 차가운 완성 고리를 등불에 대 보기.',together:'등불 그림자의 모양 보기, 안전한 장식 선택.',boundary:'용광로·불꽃·망치 소음은 집의 휴식방에 들이지 않는다.',layout:'craft',motif:[['S',4,4,9,2],['S',3,6,2,6],['S',12,6,2,6],['S',4,12,9,2],['s',5,4,6,1],['t',21,6,7,7],['Y',23,8,3,4],['W',23,3,2,3]]},
  {id:'juniper',name:'주니퍼',title:'공책을 펴는 햇빛방',accent:'g',second:'y',character:'말이 막힐 때도 있지만 벌과 관찰을 이야기할 때는 구체적이고 활발하다.',concept:'관찰 공책과 생활 그림을 펼치는 햇빛 자리. 사람들 앞에서 발표할 의무가 없는 개인방.',desk:'관찰 공책과 그림 탁자',keepsake:'벌과 꽃 관찰 카드',wall:'계절별 꽃 그림',routine:'창가 관찰 뒤 짧게 그리고 공책 덮기.',together:'원할 때만 관찰 이야기를 듣고 그림의 작은 차이 찾기.',boundary:'실내 벌통·곤충 채집·강제 발표는 넣지 않는다.',layout:'window',motif:[['C',3,5,12,8],['c',4,6,10,6],['g',7,9,1,3],['r',6,7,3,2],['y',10,7,3,2],['W',11,7,1,2],['c',9,6,2,1],['C',21,5,7,8],['g',22,9,5,1],['y',23,7,2,2]]},
  {id:'poppy',name:'파피',title:'손님이 아닌 나의 차자리',accent:'p',second:'g',character:'손님 취향은 잘 기억하지만 자기 요구는 조심스럽고 머무를 자리를 원한다.',concept:'자기가 고른 찻잔·차받침과 쉬는 의자. 가게 접객용 자리와 다른 사적인 차방.',desk:'둘이 차를 마시는 낮은 탁자',keepsake:'파피가 고른 개인 찻잔',wall:'좋아하는 차자리 생활 그림',routine:'찻집 마감 후 자기 잔에 차를 따르고 쉬기.',together:'오늘은 누구 취향의 차를 마실지 번갈아 고르기.',boundary:'집을 새 찻집으로 만들거나 손님을 자동 초대하지 않는다.',layout:'tea',motif:[['B',4,8,7,5],['c',5,7,5,2],['B',11,9,2,3],['.',11,10,1,1],['p',18,6,10,7],['c',19,7,8,5],['g',22,8,3,2]]},
  {id:'merchant',name:'떠돌이 상인',title:'돌아올 자리가 있는 방',accent:'r',second:'b',character:'물건 설명은 능숙하지만 사적인 마음은 머뭇거린다. 여행도 돌아올 집도 소중하다.',concept:'여행 짐 선반·귀가 일정·편지 상자. 물건을 팔지 않는 개인 기념품 공간.',desk:'편지와 길 메모 탁자',keepsake:'개인 여행 상자와 접은 천',wall:'돌아오는 길의 생활 지도',routine:'귀가해 짐을 내려놓고 편지 정리, 다음 여행 전에 일정 확인.',together:'기념품 가격 대신 있었던 일 이야기.',boundary:'방 안 상점·희귀 상품 자동 지급·장사 포기를 강요하지 않는다.',layout:'reading',motif:[['W',3,6,13,8],['l',4,7,11,6],['w',8,6,2,8],['S',8,9,2,2],['b',21,5,7,4],['r',21,9,7,4],['c',22,6,5,1]]},
  {id:'presser',name:'기름 짜는 이웃',title:'시간을 재지 않는 쉼터',accent:'C',second:'g',character:'효율을 좋아하지만 이야기하다 보면 오래 머문다. 편한 동선과 쉬어 갈 자리를 원한다.',concept:'정돈한 생활 항아리와 두 사람 의자, 빈 휴식칸. 작업장 기계는 집 밖에 둔다.',desk:'시간을 재지 않는 차 탁자',keepsake:'자기가 고른 생활 항아리',wall:'빈 칸이 있는 휴식표',routine:'물건을 정리한 뒤 일정표를 덮고 차 마시기.',together:'계획 없이 오늘 함께할 일을 정하기.',boundary:'기름틀·자동 생산·플레이어 하루를 대신 짜는 기능은 없다.',layout:'tea',motif:[['W',5,3,7,2],['r',4,5,9,9],['p',5,6,3,6],['C',7,9,4,3],['C',21,5,7,8],['W',22,6,5,1],['g',22,8,2,1]]},
  {id:'postman',name:'편지 나르는 이웃',title:'마지막 배달 뒤의 방',accent:'b',second:'C',character:'남의 일정은 잘 기억하고 자기 약속은 수첩으로 확인한다. 조용한 길을 좋아한다.',concept:'가방 걸이와 개인 메모함, 다음 약속 수첩. 업무 우편은 작업장에 남기는 방.',desk:'개인 편지를 적는 탁자',keepsake:'내려놓은 배달 가방',wall:'자기 약속이 있는 귀가표',routine:'퇴근해 가방을 걸고 수첩을 덮은 뒤 쉬기.',together:'서로의 하루를 짧은 메모로 남기기, 조용한 산책.',boundary:'다른 주민 우편물을 전시하거나 집을 배달 창구로 만들지 않는다.',layout:'reading',motif:[['W',5,3,7,4],['.',6,4,5,2],['w',3,7,12,7],['l',4,8,10,2],['S',8,10,2,2],['C',21,5,7,8],['c',22,6,5,6],['b',22,7,4,1]]},
]
export const SPOUSE_ROOM_ART: Record<string, FurnitureArt> = {}
export const SPOUSE_ROOM_VIEWS: Record<string, Record<Facing, FurnitureArt>> = {}
function overlay(base:FurnitureArt,rects:readonly Rect[],dx=0,dy=0){const rows=base.rows.map(r=>[...r]);for(const[c,x,y,w,h]of rects)for(let sy=0;sy<h;sy++)for(let sx=0;sx<w;sx++)if(rows[y+dy+sy]?.[x+dx+sx]!==undefined)rows[y+dy+sy][x+dx+sx]=c;return {...base,rows:rows.map(r=>r.join(''))}}
for(const d of SPOUSE_ROOM_DESIGNS){
  const desk=pixels(2,1,[['W',2,7,28,6],['l',3,7,26,4],['w',3,11,26,2],['W',4,13,2,3],['W',26,13,2,3]])
  // Only the upper half of each motif is on the tabletop; source props remain separate.
  const tabletop=d.motif.map(([c,x,y,w,h])=>[c,x,Math.floor(y/2)+1,w,Math.max(1,Math.ceil(h/2))] as Rect)
  const front=overlay(desk,tabletop),back=overlay(desk,[['W',2,7,28,2],['w',3,9,26,3]])
  const side=pixels(1,2,[['W',3,10,10,13],['l',4,9,8,12],['w',4,21,8,2],['W',4,23,2,7],['W',10,23,2,7],['C',5,11,6,6],[d.accent,6,12,4,3]])
  SPOUSE_ROOM_VIEWS[`${d.id}-desk`]={down:front,up:back,right:side,left:{...side,rows:side.rows.map(r=>[...r].reverse().join(''))}}
  SPOUSE_ROOM_ART[`${d.id}-keepsake`]=pixels(2,1,d.motif)
  const frame=pixels(2,1,[['W',2,1,28,14],['l',3,2,26,12],['c',4,3,24,10]])
  const framed=d.motif.map(([c,x,y,w,h])=>[c,Math.max(4,Math.min(27,x)),Math.max(3,Math.min(12,y)),Math.min(w,28-Math.max(4,x)),Math.min(h,13-Math.max(3,y))] as Rect).filter(r=>r[3]>0&&r[4]>0)
  SPOUSE_ROOM_ART[`${d.id}-wall`]=overlay(frame,framed)
  const rugRects:Rect[]=[['W',1,1,30,30],[d.accent,2,2,28,28],['c',3,3,26,1],['c',3,28,26,1]]
  if(['cosmo','dexter'].includes(d.id))for(let y=7;y<27;y+=6)for(let x=5;x<27;x+=8)rugRects.push([d.second,x,y+(x%3),5,1])
  else if(['penelope','merchant','postman'].includes(d.id))for(let x=6;x<28;x+=7)rugRects.push([d.second,x,4,2,24])
  else if(['basil','marigold','juniper'].includes(d.id))for(const[x,y]of [[7,8],[21,20],[8,22],[22,7]])rugRects.push(['g',x,y,1,4],['G',x-1,y,3,2])
  else if(d.id==='tilly')rugRects.push(['S',10,8,12,2],['S',8,10,2,12],['S',22,10,2,12],['S',10,22,12,2])
  else for(let y=7;y<28;y+=7)rugRects.push([d.second,6,y,20,2])
  SPOUSE_ROOM_ART[`${d.id}-rug`]=pixels(2,2,rugRects)
  SPOUSE_ROOM_ART[`${d.id}-cushion`]=pixels(1,1,[['W',2,8,12,6],[d.accent,3,7,10,6],['c',4,8,8,1],[d.second,5,10,6,1]])
  SPOUSE_ROOM_ART[`${d.id}-curtain`]=pixels(2,1,[['W',1,1,30,2],[d.accent,2,3,6,12],[d.accent,24,3,6,12],['c',4,3,1,12],['c',26,3,1,12],[d.second,2,10,6,1],[d.second,24,10,6,1]])
}

// Revision 2: distinct silhouettes, not recolored versions of one desk/cabinet.
export const SPOUSE_ROOM_SIGNATURES: Record<string,{name:string;rows:readonly Rect[]}> = {
  wendell:{name:'아치형 빵 견본장과 반죽 선반',rows:[['W',3,5,26,24],['W',7,2,18,4],['l',4,6,24,22],['C',6,7,20,8],['W',4,15,24,2],['W',4,23,24,2],['w',6,17,20,5],['l',8,18,6,3],['y',9,17,4,2],['l',17,17,6,3],['y',18,16,4,3],['C',7,8,4,6],['C',20,8,4,6],['r',13,10,5,3],['W',5,29,3,3],['W',24,29,3,3]]},
  cosmo:{name:'큰 돛배 모형과 낮은 진열 받침',rows:[['W',15,1,2,19],['C',5,4,9,13],['c',8,3,6,10],['c',11,2,3,7],['.',5,4,3,3],['.',5,7,1,2],['b',18,5,3,11],['b',21,8,3,8],['b',24,11,3,5],['B',18,15,9,2],['W',2,19,28,3],['w',5,22,22,3],['l',8,25,16,2],['c',4,19,24,1],['W',13,27,6,3],['w',6,30,20,2]]},
  rudy:{name:'깊은 독서 의자와 기울어진 책받침',rows:[['W',2,3,13,25],['g',4,5,9,14],['G',5,6,7,4],['w',1,17,15,4],['g',3,19,11,5],['W',3,25,3,7],['W',12,25,3,7],['W',22,17,3,15],['w',18,10,12,9],['l',19,9,10,7],['C',20,9,8,5],['c',21,9,3,4],['W',24,9,1,5],['w',18,30,12,2]]},
  dexter:{name:'별 관찰창과 종이 접기 자리',rows:[['W',3,1,26,19],['B',5,3,22,15],['b',6,4,20,13],['Y',8,5,2,2],['y',20,7,3,1],['y',21,6,1,3],['c',13,12,2,1],['c',24,12,1,2],['W',15,3,2,15],['W',5,18,22,2],['w',4,22,24,5],['l',5,21,22,3],['C',8,22,7,2],['y',20,20,2,6],['y',18,22,6,2],['W',5,27,3,5],['W',24,27,3,5]]},
  basil:{name:'계단형 허브 화분대',rows:[['W',4,2,2,30],['W',25,2,2,30],['w',3,11,26,2],['w',3,22,26,2],['w',2,30,28,2],['r',7,7,6,4],['g',9,2,1,5],['G',7,3,5,2],['C',19,7,5,4],['g',20,4,1,4],['G',19,3,4,2],['r',6,17,7,5],['g',8,12,1,6],['G',6,13,6,2],['B',20,17,5,5],['g',21,13,1,5],['G',20,12,4,2],['C',11,26,9,4],['g',13,25,5,1]]},
  marigold:{name:'포도잎 격자와 창가 벤치',rows:[['W',3,1,2,23],['W',27,1,2,23],['w',5,4,22,1],['w',5,10,22,1],['w',5,16,22,1],['w',10,2,1,19],['w',20,2,1,19],['g',6,4,7,2],['G',10,6,5,2],['g',20,9,6,2],['v',22,11,3,4],['V',24,12,2,2],['g',7,15,7,2],['w',3,24,26,5],['C',4,22,24,3],['v',8,22,8,2],['W',5,29,3,3],['W',24,29,3,3]]},
  penelope:{name:'실이 걸린 소형 생활 베틀',rows:[['W',3,1,3,29],['W',26,1,3,29],['w',4,3,24,3],['w',4,22,24,3],['W',2,29,28,3],['p',7,6,2,18],['b',10,6,2,18],['c',13,6,2,18],['p',16,6,2,18],['b',19,6,2,18],['c',22,6,2,18],['p',7,15,17,3],['b',7,18,17,3],['W',4,12,24,2],['l',9,12,14,1],['w',23,25,6,3]]},
  tilly:{name:'커다란 곡선 고리에 매단 구리 등불',rows:[['S',3,10,3,20],['s',4,11,1,17],['S',5,6,3,5],['S',8,3,4,4],['S',12,1,9,3],['s',13,1,6,1],['S',20,3,5,3],['S',24,5,3,5],['S',20,9,6,2],['S',19,7,2,3],['S',21,10,2,3],['t',17,12,10,3],['t',15,15,14,11],['R',16,16,2,9],['C',18,16,8,9],['y',19,17,6,7],['Y',21,16,2,9],['t',22,16,1,9],['t',17,26,10,2],['W',19,28,6,2],['S',0,30,13,2],['s',1,30,10,1]]},
  juniper:{name:'대형 꽃 관찰 그림과 이젤',rows:[['W',7,0,2,32],['W',24,0,2,32],['w',4,2,25,23],['C',5,3,23,20],['c',6,4,21,18],['g',11,14,1,7],['g',20,12,1,9],['r',9,11,5,4],['y',18,8,5,4],['G',7,16,5,2],['G',20,17,5,2],['y',20,16,4,2],['W',21,16,1,2],['c',20,15,2,1],['W',3,24,27,2],['w',3,30,7,2],['w',22,30,7,2]]},
  poppy:{name:'둥근 두 사람 차탁자',rows:[['W',8,27,3,5],['W',21,27,3,5],['W',6,9,20,18],['w',3,12,26,12],['l',5,10,22,12],['C',7,11,18,10],['p',7,20,18,2],['B',8,13,5,5],['c',9,12,3,2],['B',19,13,5,5],['c',20,12,3,2],['r',14,15,4,4],['p',15,14,2,2],['w',13,23,6,5]]},
  merchant:{name:'엇갈려 쌓은 여행 궤짝',rows:[['W',2,18,28,13],['w',3,19,26,10],['l',4,19,24,2],['S',8,18,2,13],['S',22,18,2,13],['S',14,23,4,3],['W',6,7,23,11],['r',7,8,21,8],['C',10,7,2,11],['C',23,7,2,11],['S',16,11,3,3],['B',3,2,14,5],['b',4,3,12,2],['c',6,2,2,5],['c',13,2,2,5],['W',3,31,3,1],['W',26,31,3,1]]},
  presser:{name:'돌 벽감와 낮은 생활 항아리 선반',rows:[['s',2,2,28,28],['S',4,4,24,23],['C',6,5,20,20],['s',2,26,28,5],['r',7,13,7,12],['p',8,14,2,9],['W',8,11,5,2],['r',19,17,6,8],['p',20,18,2,6],['W',20,15,4,2],['g',11,4,1,8],['G',8,6,6,2],['C',3,30,26,2]]},
  postman:{name:'가방 걸이와 외출 준비 긴 의자',rows:[['W',3,1,26,4],['l',4,2,24,2],['S',8,5,2,4],['S',21,5,2,4],['W',7,8,8,4],['.',9,9,4,2],['w',5,12,12,9],['l',6,13,10,2],['S',10,16,2,3],['C',20,9,7,9],['b',21,10,5,2],['W',3,23,26,5],['l',4,22,24,3],['W',5,28,3,4],['W',24,28,3,4],['w',19,27,6,4]]},
}
for(const[id,s]of Object.entries(SPOUSE_ROOM_SIGNATURES))SPOUSE_ROOM_ART[`${id}-signature`]=pixels(2,2,s.rows)

// Every candidate gets a specific layout. Furniture stays clear of the central route.
export const SPOUSE_ROOM_LAYOUTS: Record<string,readonly (readonly [string,number,number,Facing])[]> = {
 wendell:[['signature',1,1,'down'],['desk',4,3,'down'],['stool',4,4,'down'],['basket',1,4,'down']],
 cosmo:[['signature',4,1,'down'],['longBench',1,3,'down'],['cushion',1,4,'down'],['keepsake',1,1,'down'],['mat',4,4,'down']],
 rudy:[['signature',4,2,'down'],['bookcase',1,1,'down'],['woodToy',2,4,'down'],['rug',1,3,'down']],
 dexter:[['signature',1,1,'down'],['cushion',1,3,'down'],['rug',4,3,'down'],['lantern',5,1,'down']],
 basil:[['signature',4,1,'down'],['table',1,3,'down'],['chair',1,4,'up'],['teapot',2,1,'down']],
 marigold:[['signature',1,1,'down'],['desk',4,3,'down'],['stool',4,4,'down'],['basket',5,1,'down']],
 penelope:[['signature',1,2,'down'],['stool',1,4,'down'],['desk',4,1,'down'],['rug',4,3,'down']],
 tilly:[['signature',4,1,'down'],['desk',1,3,'down'],['stool',1,4,'down'],['chest',1,1,'down'],['keepsake',4,4,'down']],
 juniper:[['signature',1,1,'down'],['cushion',1,3,'down'],['desk',4,3,'down'],['stool',4,4,'down']],
 poppy:[['signature',1,2,'down'],['cushion',1,4,'down'],['cupboard',4,1,'down'],['cushion',4,4,'down'],['teapot',5,3,'down']],
 merchant:[['signature',4,3,'down'],['desk',1,1,'down'],['chair',1,2,'up'],['keepsake',1,4,'down']],
 presser:[['signature',1,1,'down'],['longBench',4,3,'down'],['table',1,4,'down'],['chair',5,1,'down']],
 postman:[['signature',1,3,'down'],['desk',4,1,'down'],['chair',4,2,'up'],['keepsake',1,1,'down']],
}

// Tilly's drawing desk is a slanted drawing board, not the common flat table.
SPOUSE_ROOM_VIEWS['tilly-desk'].down=pixels(2,1,[
 ['W',4,11,3,5],['W',25,11,3,5],['w',1,5,29,7],['l',3,3,27,7],
 ['C',5,3,22,6],['c',6,3,20,5],['S',8,4,7,1],['S',7,5,1,2],['S',15,5,1,2],['S',8,7,7,1],
 ['S',20,4,4,1],['S',19,5,1,3],['S',24,5,1,3],['t',27,2,2,7],['W',1,10,29,2],
])
SPOUSE_ROOM_ART['tilly-keepsake']=pixels(2,1,[
 ['w',1,13,30,3],['l',2,13,28,1],
 ['S',4,3,7,2],['S',3,5,2,5],['S',10,5,2,5],['S',4,10,7,2],['s',5,3,4,1],
 ['t',20,2,6,2],['t',18,4,2,5],['t',26,4,2,5],['t',20,9,6,2],['Y',21,2,3,1],
])
SPOUSE_ROOM_ART['tilly-wall']=pixels(2,1,[
 ['w',2,1,28,14],['C',3,2,26,12],['c',4,3,24,10],
 ['S',6,4,6,1],['S',5,5,1,5],['S',12,5,1,5],['S',6,10,6,1],
 ['S',18,4,6,1],['S',18,5,1,6],['S',23,5,1,6],['S',18,11,6,1],['t',20,7,2,2],
 ['w',6,12,6,1],['w',19,12,5,1],
])

// Personal interests revision: grounded in dialogue, with clearly labelled guesses.
Object.assign(SPOUSE_ROOM_DESIGNS.find(d=>d.id==='cosmo')!,{
 title:'바람 소리와 느긋한 놀이',concept:'친구와 농담하고 조개 소리를 좋아하는 코스모의 편한 생활방. 큰 바닥 방석, 조개 모빌, 작은 돌말놀이판으로 구성한다.',
 desk:'돌말놀이를 펼치는 낮은 자리',keepsake:'조개 모빌과 구름 낙서',wall:'기분 따라 바꾸는 구름 모양 그림',
 routine:'바닥 방석에 기대 조개 소리를 듣고, 짧은 낙서를 남기거나 조용히 쉬기.',together:'돌말놀이를 하며 농담하기, 구름이 무슨 모양인지 각자 말하기.',
 boundary:'배·돛·그물·물고기 장식은 방에 두지 않는다. 돌말놀이 취향은 디자인용 추측이며 기존 설정으로 단정하지 않는다.',
 tasteBasis:{confirmed:['친구와 농담','구름 모양 이야기','조개 소리','조용히 쉬기'],inferred:['돌말놀이','푹신한 바닥 방석','구름 낙서']},
})
Object.assign(SPOUSE_ROOM_DESIGNS.find(d=>d.id==='presser')!,{
 title:'차가 식을 때까지 쉬는 오후',concept:'오후 차와 오래 이어지는 대화를 좋아하는 사람의 정돈한 휴식방. 큰 안락의자, 작은 차상, 개인 컵과 꽃 진열을 둔다.',
 desk:'안락의자 옆 작은 차상',keepsake:'형태가 다른 개인 찻잔 세 개',wall:'작은 꽃을 고르는 생활 자리',
 routine:'오후에 자기 잔을 골라 차를 마시고 의자에 깊이 기대 쉬기.',together:'차 한 잔과 긴 대화, 그날 마음에 드는 잔과 꽃 고르기.',
 boundary:'기름틀·작업용 항아리·생산 도구는 없다. 찻잔 수집과 꽃 취향은 성격을 바탕으로 한 디자인 제안이다.',
 tasteBasis:{confirmed:['오후 휴식','차 한 잔','소수의 대화','편한 자리와 정돈'],inferred:['찻잔 모양 고르기','소박한 꽃 장식','큰 안락의자']},
})

SPOUSE_ROOM_ART['cosmo-signature']=pixels(2,2,[
 // A soft floor seat with a leaning cushion and two round cushions, no bed frame.
 ['B',3,13,25,15],['b',2,15,27,12],['C',5,5,18,15],['c',6,6,16,12],['b',6,16,16,3],
 ['p',3,20,9,9],['o',4,20,7,7],['c',6,22,3,2],['b',17,20,12,9],['c',18,21,10,2],
 ['B',4,28,24,2],['c',9,25,13,1],['W',1,1,2,8],['w',2,1,7,1],
 // Shell mobile, small cream shapes dangling at different heights.
 ['w',4,2,1,4],['w',8,2,1,7],['C',3,6,3,2],['c',4,5,1,1],['C',7,9,3,2],['c',8,8,1,1],
])
SPOUSE_ROOM_ART['cosmo-personal']=pixels(2,2,[
 ['w',3,8,26,19],['l',4,7,24,17],['C',6,9,20,13],
 ['W',11,10,1,11],['W',18,10,1,11],['W',7,13,18,1],['W',7,18,18,1],
 ['s',8,10,2,2],['S',14,15,2,2],['s',21,19,2,2],['p',20,10,2,2],['r',8,19,2,2],
 ['W',5,25,3,5],['W',23,25,3,5],['C',1,2,6,3],['c',2,1,4,1],['b',24,2,6,3],
])
SPOUSE_ROOM_ART['cosmo-keepsake']=pixels(2,1,[
 ['C',4,3,24,11],['c',5,4,22,9],['b',8,7,8,3],['b',10,5,4,2],['g',19,9,6,1],['y',22,5,2,2],
])
SPOUSE_ROOM_ART['cosmo-sideboard']=pixels(2,2,[
 // Low storage groups spare cushions and a plant into one quiet right-side corner.
 ['W',2,19,28,11],['l',3,18,26,3],['w',3,22,26,7],['W',15,22,1,7],
 ['C',12,24,2,1],['C',18,24,2,1],['W',4,30,3,2],['W',25,30,3,2],
 ['b',5,13,12,5],['c',6,14,10,1],['p',7,9,10,4],['C',8,10,8,1],
 ['r',22,12,6,6],['p',23,13,2,4],['g',24,5,1,8],['G',21,6,4,2],['g',25,8,4,2],
])
SPOUSE_ROOM_LAYOUTS.cosmo=[['signature',1,1,'down'],['personal',1,3,'down'],['sideboard',4,2,'down']]

SPOUSE_ROOM_ART['presser-signature']=pixels(2,2,[
 // A deep chair, rounded back and arms; a separate tiny cup table at its side.
 ['W',4,3,15,23],['g',5,4,13,17],['G',6,5,11,4],['C',6,18,11,7],
 ['w',2,17,3,9],['w',18,17,3,9],['g',5,24,13,3],['W',4,27,3,5],['W',16,27,3,5],
 ['w',22,18,9,4],['l',23,17,7,2],['W',25,22,2,8],['W',22,30,9,2],
 ['B',24,13,5,4],['c',25,12,3,2],['B',29,14,2,2],['C',25,9,1,2],
])
SPOUSE_ROOM_ART['presser-personal']=pixels(2,2,[
 // Low personal display for tea cups and a delicate flower vase; no storage jars.
 ['W',3,18,26,11],['l',4,17,24,3],['C',5,21,22,6],['W',4,29,3,3],['W',25,29,3,3],
 ['b',5,13,5,4],['c',6,12,3,2],['b',10,14,2,2],['p',14,13,5,4],['c',15,12,3,2],
 ['C',22,10,5,7],['c',23,11,2,5],['g',24,3,1,8],['g',21,5,4,1],['p',22,2,4,2],['y',23,3,2,1],
 ['g',25,5,4,1],['c',27,3,3,2],['y',28,4,1,1],['b',8,22,5,3],['C',16,22,6,3],
])
SPOUSE_ROOM_ART['presser-keepsake']=pixels(2,1,[
 ['w',2,12,28,3],['l',3,12,26,1],['b',4,7,6,5],['c',5,6,4,2],['p',13,6,6,6],['c',14,5,4,2],
 ['C',23,8,5,4],['c',24,7,3,2],
])
SPOUSE_ROOM_LAYOUTS.presser=[['personal',1,1,'down'],['signature',4,3,'down'],['chair',1,4,'right'],['stool',2,3,'down']]

SPOUSE_ROOM_SIGNATURES.cosmo.name='조개 모빌과 푹신한 바닥 쉼자리'
SPOUSE_ROOM_SIGNATURES.presser.name='오후 차를 마시는 큰 안락의자'
Object.assign(SPOUSE_ROOM_DESIGNS.find(d=>d.id==='marigold')!,{
 title:'소풍을 기다리는 햇살방',concept:'책임감과 계획하는 성격을 자기 여가에 쓰는 방. 볕 드는 휴식 벤치와 소풍 바구니, 접어 둔 계절 천을 놓는다.',
 desk:'가고 싶은 장소를 펼치는 작은 여가 자리',keepsake:'소풍 바구니와 접은 담요',wall:'가고 싶은 풍경 그림',
 routine:'쉬는 날 가고 싶은 곳을 고르고, 바구니를 준비한 뒤 밝은 벤치에서 아무 일 없이 쉬기.',
 together:'짧은 소풍 장소 고르기, 담요 색 정하기, 각자 좋아하는 풍경 이야기.',
 boundary:'포도 덩굴·수확 바구니·작업 일정표는 두지 않는다. 소풍과 계절 천 취향은 성격에서 추측한 디자인 제안이다.',
 tasteBasis:{confirmed:['계획하는 성향','큰 책임감','스스로 쉬는 시간을 갖고 싶음'],inferred:['짧은 소풍','햇살 드는 휴식자리','계절색 담요와 풍경 그림']},
})
SPOUSE_ROOM_ART['marigold-signature']=pixels(2,2,[
 ['W',2,5,28,23],['C',4,5,24,14],['c',5,6,22,8],['W',3,18,26,2],
 ['p',3,20,26,7],['o',4,20,24,3],['C',6,14,8,8],['c',7,14,6,6],
 ['v',19,15,8,7],['V',20,15,6,4],['C',22,19,2,1],['W',4,28,3,4],['W',25,28,3,4],
 ['y',7,3,18,1],['Y',10,1,12,2],
])
SPOUSE_ROOM_ART['marigold-personal']=pixels(2,2,[
 ['W',3,21,26,8],['l',4,20,24,3],['W',5,29,3,3],['W',24,29,3,3],
 ['W',5,9,11,5],['.',7,10,7,3],['w',3,14,15,7],['l',4,15,13,2],['C',8,14,3,7],
 ['p',20,11,9,5],['c',21,12,7,1],['v',20,16,9,4],['C',23,11,2,9],
 ['C',5,3,12,4],['g',7,5,3,1],['b',11,4,4,2],['y',14,3,2,1],
])
SPOUSE_ROOM_ART['marigold-keepsake']=pixels(2,1,[
 ['C',3,3,26,11],['c',4,4,24,9],['b',6,5,20,4],['G',6,9,20,3],['g',8,8,4,2],['y',21,5,3,2],
])
SPOUSE_ROOM_LAYOUTS.marigold=[['signature',1,1,'down'],['personal',4,3,'down'],['keepsake',4,1,'down'],['cushion',1,4,'down']]
SPOUSE_ROOM_SIGNATURES.marigold.name='소풍을 기다리는 볕 드는 휴식 벤치'

Object.assign(SPOUSE_ROOM_DESIGNS.find(d=>d.id==='postman')!,{
 title:'조용한 길을 닮은 독서방',concept:'조용한 길과 쉬는 시간을 좋아하는 성격에서 독서·풍경 스케치 취향을 추측한 개인방. 책이 놓인 깊은 의자와 작은 그림 자리, 화분을 둔다.',
 desk:'풍경을 그리는 작은 스케치 탁자',keepsake:'읽던 책과 잎 모양 책갈피',wall:'조용한 길의 작은 풍경 스케치',
 routine:'편한 의자에서 조금 읽고 책갈피를 넣거나 산책에서 본 풍경을 짧게 그리기.',
 together:'같은 방에서 각자 읽기, 다음에 걷고 싶은 조용한 길 이야기.',
 boundary:'배달 가방·우편함·배달 일정표는 두지 않는다. 독서·풍경 스케치·작은 화분 취향은 디자인 제안이며 기존 확정 설정은 아니다.',
 tasteBasis:{confirmed:['조용한 길을 좋아함','남의 약속보다 자기 휴식 챙기기는 서툼'],inferred:['차분한 독서','풍경 스케치','잎 모양 책갈피와 작은 화분']},
})
SPOUSE_ROOM_ART['postman-signature']=pixels(2,2,[
 ['W',4,2,21,25],['b',6,4,17,15],['B',7,16,15,4],['C',8,6,12,6],['c',9,7,10,3],
 ['w',2,17,4,10],['w',24,17,4,10],['b',6,21,18,6],['c',7,22,16,1],
 ['C',10,18,10,5],['c',11,18,4,4],['W',15,18,1,5],['g',16,18,1,5],
 ['W',4,27,3,5],['W',23,27,3,5],
])
SPOUSE_ROOM_ART['postman-personal']=pixels(2,2,[
 ['W',3,2,26,26],['l',4,3,24,23],['W',5,5,22,8],['W',5,16,22,8],
 ['C',6,6,3,7],['b',10,7,3,6],['g',14,6,3,7],['C',18,8,7,4],
 ['C',6,17,8,2],['c',6,20,8,2],['b',16,18,9,5],['c',17,18,7,1],
 ['W',4,28,3,4],['W',24,28,3,4],['r',21,0,6,4],['g',23,0,1,2],
])
SPOUSE_ROOM_ART['postman-keepsake']=pixels(2,1,[
 ['w',2,7,28,5],['l',3,7,26,3],['W',4,12,3,4],['W',25,12,3,4],
 ['C',6,2,15,7],['c',7,3,13,5],['g',9,5,8,1],['b',11,3,7,2],['W',23,1,1,7],
])
SPOUSE_ROOM_LAYOUTS.postman=[['personal',1,1,'down'],['signature',4,2,'down'],['keepsake',1,4,'down']]
SPOUSE_ROOM_SIGNATURES.postman.name='책갈피를 꽂아 둔 깊은 독서 의자'
