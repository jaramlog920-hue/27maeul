import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){
 if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
 const r=n(url,c);return /\/(nt-loader|ot-catalog)\.ts$/.test(url)?{...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')}:r
}})
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const {SCENES}=await import('../../src/content/text.ts')
const {eventPreviewEntries}=await import('../../src/features/scene/event-registry.ts')
const {REQUESTS}=await import('../../src/engine/bonds.ts')
const {MILESTONE_GIFTS}=await import('../../src/engine/stories.ts')
const {PEOPLE_DATA}=await import('../../src/content/people-all.ts')
const neighbors=read('src/content/neighbors.json'),inventory=eventPreviewEntries(),pending=inventory.filter(e=>!e.kind&&!e.authored)
assert.equal(pending.length,138,'계획 기준이 달라졌으므로 재대조 필요')
const sights=new Map()
for(const th of PEOPLE_DATA.threads??[])for(const phase of th.phases??[])for(const e of phase.sightings??[])sights.set('saw:'+e.id,{...e,thread:th.id,phaseDay:phase.day})
const group=(id,name,assets,context)=>({id,name,assets:assets.map(a=>'src/render/'+a+'.ts'),context,entries:[]})
const groups=[
 group('shore','나루 전체',['river-rest-background'],'호숫가·고정 목격 자리 또는 어부 이사 소개의 서술 장소'),
 group('square','광장·마을 큰길 전체',['market-square-background'],'광장 좌판과 큰길의 꽃·인사. 아침에 큐에 들어온 마을 소개는 장소를 옮기지 않는 풍경 삽입 컷'),
 group('travel','항구 여행 전체',['travel-town-background'],'여행 원문 속 항구 도착→골목 빵집. 첫 마을 주민을 항구 주인으로 대체하지 않음'),
 group('forge','대장간·틸리 창문 전체',['forge-yard-background','forge-room-background'],'목격 트리거 22,125는 lodging 내부. 원문은 틸리 방 창문 아래→대장간. 실제 방 위치와 원문을 함께 유지하며 창문/문턱 삽입 컷; 엔진 워프 금지'),
 group('hill','언덕 길·정자 전체',['sunset-background','river-rest-background'],'산책의 실제 길과 정자 곁 목격 위치는 개별 변형으로 구분'),
 group('yard','내 집 마당 전체',['home-yard-background'],'문 왼쪽 편지함, 저장된 갈대틀 위치, 고양이/강아지의 실제 STRAY_SPOTS 사용'),
 group('home','내 집 병상 전체',['family-room-background'],'원래 잠자리와 가족 외형·집 확장 배치 반영'),
 group('dinner-child','아이네 집 저녁 전체',['family-room-background'],'ROOMS.child 배치(배움 탁자·침대·화덕)를 재사용 모듈로 구성; 플레이어 집 배치를 그대로 복제하지 않음'),
 group('dinner-baker','빵집 저녁 전체',['bakery-room-background'],'ROOMS.baker 식탁과 화덕, 식탁 밑 아기는 기존 유저 아기 공용 몸체'),
 group('arrival-herb','약방 이사 소개 전체',['apothecary-front-background'],'원문에 명시한 장터 아래 약방 소개 컷. 실제 아침 큐 위치는 유지'),
 group('arrival-wood','목공방 이사 소개 전체',['carpenter-room-background'],'큰길가 공방 소개 컷. 방 내부 재료/문 앞 레이아웃은 실제 공방과 대조'),
 group('arrival-loom','베틀 이사 소개 전체',['weaver-front-background','weaver-room-background'],'새 이웃의 베틀 집 소개. 아직 해금되지 않은 가리개를 미리 만들지 않음'),
 group('east-road','동쪽 새 터 표지 전체',['travel-town-background','library-room-background'],'동쪽 큰길 끝 표지와 너머 새 터·작은 서고를 보여 주는 원문 컷. 새 터 이동/보상은 엔진만 처리'),
 group('current','현재 장소 유지 전체',['home-yard-background','family-room-background','market-square-background','oil-room-background','forge-room-background','weaver-room-background','carpenter-room-background','bee-field-background','sheep-pasture-background','river-rest-background','tea-room-background','grandpa-room-background','postman-background','library-room-background'],'실제 map/player/실내 owner/clock/weather에서 배경을 결정. NPC 직업으로 배경을 강제하지 않음. 동일 장소 배경을 공유하되 사건별 소품·자세·단계를 구현'),
 group('date-return','나들이 귀갓길 전체',['tea-front-background','sunset-background','river-rest-background'],'실제 마지막 datePlace/나온 문과 시간대의 귀갓길. 13명 원래 외형. 찻집 나들이를 무조건 밤 언덕으로 바꾸지 않음'),
 group('writing','첫 장 완성의 실제 작업 자리 전체',['writing-room-background','library-room-background'],'필사/읽기 완료 경로와 실제 작업 장소 유지. 제본 완권·헌납 보상 장면으로 확대하지 않음'),
]
const byGroup=new Map(groups.map(g=>[g.id,g]))
const fixed={
 'saw:boat:argue':['shore','코스모 오른쪽, 루디 왼쪽, 대패와 설계지는 두 사람 사이 낮은 작업 자리. 0~2행의 주장→3행 대패 내려놓기→둥글되 뾰족한 선이 남은 뱃머리 그림. 배 진수/합류 동작 없음.'],
 'movedIn:fisher':['shore','실제 어부의 이사 인사. 나루 옆 작은 짐과 물고기 항아리·그물, 손을 한 번 흔듦. 코스모로 대체하지 않음.'],
 'saw:bread:swap':['square','웬델이 파피 좌판의 빵을 삼→파피가 웬델 좌판의 과자를 삼→광장 양끝에서 한 입. 모자는 기존 머리·얼굴을 가리지 않게 조정. 실제 12~13시와 장 파할 무렵 원문 차이를 보존.'],
 'trip:harbor':['travel','돛대·갈매기·물건 좌판의 도착 컷→골목 빵집 주인이 봇짐을 봄→파피 과거 이야기→빵을 싸 건넴. 주인은 원문에 이름 없는 성인, 임의 기존 NPC 친족으로 만들지 않음.'],
 'saw:forge:handle':['forge','해 뜨기 전 smith가 잎사귀 무늬 망치 자루를 틸리 창 아래 세움→무늬가 보이는 낮은 소품 컷→헛기침하고 문으로 퇴장. 틸리는 방 안에 억지로 등장시키지 않음.'],
 'date:walk:1':['hill','실제 연인과 길을 걷다 상대가 들꽃을 꺾고 얼굴 바깥 허리 높이에서 내밈. 후보 13명·실제 성별/옷차림, 06:00~19:30 건조 날씨·40분 소모 유지.'],
 'saw:tilly:flower':['hill','정자 옆 틸리의 짧은 손에 작은 쇠꽃→꽃잎의 줄 자국→주머니 깊이 넣기→호숫가 방향으로 걸어감. 금속 꽃을 생화/선물 획득으로 바꾸지 않음.'],
 'strays':['yard','새끼 고양이와 강아지가 함께 마당에 있는 첫 소개. 아직 입양자/이름/밥 준 결과를 미리 확정하지 않음. 기존 동물 도트와 실제 먹이 선택 경로 유지.'],
 'companionJoined':['yard','저장된 companion.kind/name에 맞춘 내 동물과 반대 종류 childPet. 플레이어와 아이에게 각각 다가가는 결과. 고양이·강아지 두 분기 모두 확인.'],
 'homeMailbox':['yard','우편배달부가 내 집 문 왼쪽에 기존 나무 편지함을 세움→함을 가리키며 약속. 실제 가족 집·외형, 편지함 해금/우편 상태는 기존 엔진 처리.'],
 'reedRack':['yard','저장된 yard.reedRack 위치에 갈대와 크림색 종이 한 장. 어부가 인사하고 호숫가 방향으로 걸음. 틀을 새로 다른 칸에 건설하지 않음.'],
 'sick':['home','플레이어가 기존 침대에서 얼굴을 위로 향해 누움. baker는 옆 빈 공간에 수프를 놓음. 담요가 얼굴을 덮지 않으며 실제10시 기상/needs 처리를 보존.'],
 'dinner:child':['dinner-child','아이네 실제 방에서 오늘 배운 글자를 탁자 위 종이로 자랑→플레이어 쪽으로 약속 인사. 아이의 부모는 현재 세대/가족 데이터에서 확인된 경우만 등장.'],
 'dinner:baker':['dinner-baker','빵집 실제 식탁에 수프, baker와 플레이어의 몸통이 보이는 좌석. 기존 유저 아기 도트를 식탁 밑 바닥 옆 열린 공간에 놓고 얼굴·접지 확인.'],
 'movedIn:apothecary':['arrival-herb','실제 약방 주인의 첫 인사와 약초 화분·짐. 장터 아래 약방 표지. 약초 매입/가격을 그림 코드에서 변경하지 않음.'],
 'movedIn:carpenter':['arrival-wood','실제 목수와 큰길가 공방. 판자·작업대 옆 인사. 아직 책장 선물/새 의뢰를 지급하지 않음.'],
 'movedIn:weaver':['arrival-loom','실제 베 짜는 이웃이 베틀 옆에서 인사. 실패·이사 짐 소품. 플레이어에게 베틀 장비를 지급하지 않음.'],
 'newlandGift':['east-road','큰길 끝 새 표지→표지 너머 쓰지 않은 땅과 작은 서고→오늘 가지 않아도 남아 있는 표지. 강제 이동·새 토지 보상 재지급 없음.'],
}
const romanceCues={
 presser:['항아리 하나와 걸음을 세던 과거는 말하는 표정·작은 손짓으로 표현; 현재 장소에 기름틀을 갑자기 설치하지 않음','말하는 동안 세던 손짓을 멈추고 상대를 봄. 친구 분기는 연애 몸짓 없이 휴식 인사'],
 dexter:['잃어버린 양을 찾았던 기억을 이야기. 현재 장면에 어린 양/새벽을 강제로 생성하지 않음','별 있는 방향을 작은 손짓으로 가리키되 미래 약속을 현재 밤 나들이로 바꾸지 않음'],
 merchant:['보자기 장사의 옛 습관을 짧은 손짓으로 이야기. 현재 새 좌판이나 비를 생성하지 않음','물건 대신 상대 얼굴을 보며 대화; 판매·금전 교환 없음'],
 rudy:['할머니가 아껴 썼던 짧은 다리 의자의 과거 이야기. 실제 할머니를 현재 NPC로 생성하지 않음','상대의 책 이야기를 듣고 작업 손짓. 미래 책장을 지금 주거나 설치하지 않음'],
 marigold:['통 속에 숨었던 어린 시절을 웃으며 회상. 어린이로 변신하거나 할아버지를 즉시 소환하지 않음','미래 포도나무 계획을 손짓. 새 나무 심기/첫 포도 수확을 현재 보상으로 처리하지 않음'],
 basil:['잎을 두 번 살펴보는 작은 손짓. 독풀 오인과 어머니 이야기는 과거로 유지','피곤할 때 차를 주겠다는 약속. 현재 차를 이미 마시거나 치료 보상을 주지 않음'],
 poppy:['찻잔 세 개와 화분 받침의 기억을 이야기. 현재 창가가 있는 경우 기존 화분을 활용하며 컵을 새로 깨지 않음','미래 차 이름을 상의하는 표정. 실제 이름 입력·차 제조·선물은 새로 만들지 않음'],
 juniper:['벌에 쏘였던 기억을 작은 손짓으로 이야기. 현재 쏘임/부상/치료 효과 없음','함께 일하고 싶다는 이야기. 벌통/꿀 보상 생성 없이 상대를 향함'],
 cosmo:['안개 속 첫 항해의 기억. 현재 배경 날씨를 안개/새벽으로 강제 변경하지 않음','미래 호수 나들이를 제안. 배에 태우거나 현재 위치를 호수로 이동하지 않음'],
 tilly:['처음 망치를 들고 물집 잡힌 기억. 손바닥을 짧게 펴 보임; 현재 상처/장갑 장비 변경 없음','앞으로 만들 등불 고리를 손짓으로 설명. 이미 모든 집에 고리를 설치하지 않음'],
 postman:['길을 익히던 수첩 기억. 실제 수첩은 얼굴 바깥 몸 옆의 짧은 손 범위에 배치','수첩 맨 위 줄에 약속을 적는 작은 동작. 친구 분기는 맡긴 편지 기록으로 구분'],
}
const gate='src/engine/game.ts (heartUpRaw/askRequest/fulfillRequest/goOnDate/goToSleep), src/engine/bonds.ts, src/engine/romance.ts, src/engine/stories.ts'
const entries=pending.map((e,index)=>{
 const original=SCENES[e.id];assert.ok(original,e.id)
 let batch='current',design='',trigger={},items=null
 if(fixed[e.id]) [batch,design]=fixed[e.id]
 else if(e.id.startsWith('village:')){batch='square';design=({'village:1':'실제 마을 큰길의 꽃 증가를 풍경으로 보여 줌. 새 꽃 아이템 획득 없음.','village:2':'실제 세대의 이웃들이 집 문과 길에서 먼저 손을 흔듦. 새로운 초대 플래그 생성 없음.','village:4':'실제 마을 주민들이 플레이어 쪽으로 이름을 부르는 반응. 모르는 주민을 임의 가족으로 추가하지 않음.'})[e.id]}
 else if(e.id.startsWith('gift:')){const [,npc,m]=e.id.split(':');items=MILESTONE_GIFTS[npc]?.[m];assert.ok(items,e.id);trigger={path:'heartUpRaw',hearts:Number(m),location:'호감도 상승 당시 현재 위치',onceFlag:`gift:${npc}:${m}`};design=`실제 ${npc}가 ${JSON.stringify(items)}를 소개→얼굴 바깥 짧은 손 범위 또는 옆 낮은 자리에 놓아 전달. 가구는 바닥에 놓고 손으로 번쩍 들지 않음. 원문 물건의 사용 흔적·꽃/쇠 장식 등 개별 특징을 반영. 이미 엔진이 지급한 선물을 렌더러가 중복 지급/설치하지 않음.`}
 else if(/^(ask|done):/.test(e.id)){const [phase,...key]=e.id.split(':');const r=REQUESTS.find(r=>r.id===key.join(':'));assert.ok(r,e.id);items=r;trigger={path:phase==='ask'?'askRequest':'fulfillRequest',request:r,location:'상호작용 당시 실제 위치; 직업별 고정 장소 없음'};design=phase==='ask'?`실제 ${r.npc}가 원문에서 고치거나 만들 대상을 손짓으로 설명. 필요한 ${JSON.stringify(r.needs)}는 부탁 내용이며 아직 물건을 받거나 시설을 완성하지 않음.`:`실제 ${r.npc}가 원문의 완료 결과를 설명하고 ${JSON.stringify(r.reward)} 답례를 전달. unlock:${r.unlock}가 이미 적용된 실제 장소일 때만 시설 변화를 보여 주며 다른 장소에서는 그 시설로 워프하지 않음. 원문 결과와 답례 개별 소품을 단계별로 표현.`}
 else if(e.id.startsWith('romance')){const parts=e.id.split(':'),npc=parts[1];design=romanceCues[npc]?.[e.id.startsWith('romance1')?0:1];assert.ok(design,e.id);trigger={path:'heartUpRaw',hearts:e.id.startsWith('romance1')?4:6,friend:parts[2]==='friend',location:'실제 호감도 상승 위치',story:'현재 대화이며 과거·미래를 현재 사실로 바꾸지 않음'}}
 else if(e.id.startsWith('loverTrust:')){batch='date-return';design='나들이 뒤 함께 걷다가 상대가 걸음을 늦춤→서로를 보며 두 차례 대화→서두르지 않고 나란히 걸음. 컵·수첩 등 직업 소품을 억지로 쥐여 주지 않음.';trigger={path:'goOnDate',datesAtLeast:3,stage:'dating',storyQueued:false,background:'실제 직전 나들이 장소와 시간의 귀갓길',storyRead:'장면을 끝까지 읽은 뒤 기존 엔진 처리'}}
 else if(e.id.startsWith('invite:')){design='아침 현재 위치에서 저녁 방문을 약속하는 인사. 식사를 이미 차리거나 이웃 집으로 이동하지 않음. 안내 원문의18:00~20:30 및 초대한 집 문 좌표를 그대로 유지.';trigger={path:'goToSleep/pickInviter',hearts:7,intervalDays:6,visitWindow:'18:00–20:30',location:'아침 큐 위치'}}
 else if(e.id.startsWith('notice:')){design='아침 현재 위치에서 '+original.lines[0].text+'라는 앞으로 있을 모임을 알리는 작은 인사. 안내 시점에 밤하늘·소풍·아기 잔치를 이미 진행하지 않음.';trigger={path:'goToSleep/planGathering',location:'아침 큐 위치',meeting:'원래 행사 날짜·시간·날씨·중복 방지 조건 보존'}}
 else if(e.id==='blanket'){design='담요 사용 엔진은 플레이어 추위를 낮춤. 플레이어가 기존 담요를 목 아래에 둘러 몸을 감쌈. 아기/동물에게 덮는 장면으로 오인하지 않음.';trigger={path:'coverWithBlanket',needsItem:'blanket',effect:'warmUp(s.needs)',onceFlag:'blanketOnce',location:'현재 위치'}}
 else if(e.id==='firstChapter'){batch='writing';design='첫 장의 낱장을 순서대로 모아 낮은 선반 위에 올림. 실제 작업대·선반 위치와 플레이어 외형 유지. 완권 제본/헌납으로 확대하지 않음.';trigger={path:'첫 장 완료의 여러 경로',completedBefore:0,location:'현재 필사/읽기 장소'}}
 assert.ok(design,'기획 누락: '+e.id)
 const g=byGroup.get(batch),speakers=[...new Set(original.lines.map(l=>l.speaker).filter(s=>!['narration','player'].includes(s)))]
 const cast=speakers.map(id=>({id,definition:neighbors.find(n=>n.id===id)??null,people:PEOPLE_DATA.people[id]??null}))
 const entry={id:e.id,title:e.title,order:index+1,batch,background:g.context,reuse:g.assets,design,original,trigger:{...trigger,...(sights.has(e.id)?{sighting:sights.get(e.id)}:{})},cast,items,source:gate,status:'기획 완료 · 미제작',verification:'원문 전 행/선택 답변·동작 시작/중간/끝, 기본+실제 플레이어/세대·가족, 가로/휴대폰/썸네일. 관련 검사·전체 빌드 후에만 완료.'}
 g.entries.push(entry.id);return entry
})
for(const g of groups){assert.ok(g.entries.length,g.id);for(const a of g.assets)assert.ok(fs.existsSync(a),a)}
assert.equal(new Set(entries.map(e=>e.id)).size,138)
const document={updated:'2026-10-15',baseline:{total:inventory.length,connected:inventory.length-pending.length,pending:pending.length},instruction:'기존 자동화의 순서를 폐기하고 이 계획의 배경 묶음을 순서대로 진행. 한 묶음 전체가 대상이며 2개 제한 없음. 10분은 재개 간격, 완료 보장 시간이 아님.',rules:['실제 렌더러 등록과 다른 대화 기록을 매회 대조; 이미 완료된 ID를 제외','배경 자산은 재사용, 사건별 NPC/소품/배치/선택 동작 구현','원래 대사/장소/시간/장비/보상/호감도/해금 조건 변경 금지','src/render/AGENTS.md 준수, 사람 아기는 기존 유저 아기 공용 도트','게임/미리보기/썸네일 동일 렌더러, 미리보기 저장/앨범 불변','일반 사용량 불가 시 제작하지 않음; 진행 중에는 조용히, 새 완성/오류/결정 필요 시만 알림'],groups,entries}
write('docs/event-art-remaining-138-plan.json',document)
let md='# 남은 138개 이벤트 배경·제작 기획\n\n2026-10-15 사용자 요청에 따라 기존 자동화 순서를 폐기하고 다시 대조했다. **676개 중 538개 연결, 138개 미제작**. 138개는 새 배경 이미지 수가 아니라 사건 ID 수다. 기획 완료는 그림 완료가 아니다.\n\n'
md+='같은 배경의 잔여 전체를 한 묶음으로 제작한다. 한 번에 2개로 제한하지 않는다. 한 실행에 못 끝내면 다음 실행에서 같은 묶음의 미완성을 이어간다. 모든 행·선택과 가로/휴대폰/썸네일 시각 확인, 관련 검사·전체 빌드를 통과하기 전에는 완료 수를 올리지 않는다.\n\n'
md+='배경을 NPC 직업만 보고 고정하지 않는다. 선물·부탁·호감도 이야기·초대/모임 안내는 현재 장소, 연인 신뢰는 실제 나들이 귀갓길이다. 과거 회상과 미래 약속을 현재 사건으로 바꾸지 않는다. 큐가 아침에 열려도 서술 속 장소를 소개하는 이사·마을·새 터 풍경은 엔진 위치를 바꾸지 않는 삽입 컷으로 구분한다.\n\n'
md+='원문·출현 조건·NPC 원본 정의·재료/보상은 [기계 판독 기획](event-art-remaining-138-plan.json)에 각 ID별로 보관했다. 기존 완료 기록은 보존한다. 대장간 자루의 22,125 트리거와 틸리 창문 원문 차이, 빵 교환의 정오 트리거와 장 마감 표현 차이는 엔진/문구를 고치지 않고 장면 구성에서 보존한다.\n\n'
md+='| 순서 | 같은 배경 묶음 | 남은 사건 | 재사용 원본 |\n|---:|---|---:|---|\n'+groups.map((g,i)=>`| ${i+1} | ${g.name} | ${g.entries.length} | ${g.assets.map(a=>'`'+a+'`').join(', ')} |`).join('\n')+'\n\n'
for(const [i,g] of groups.entries()){
 md+=`## ${i+1}. ${g.name} (${g.entries.length}개)\n\n${g.context}\n\n`
 for(const id of g.entries){const e=entries.find(e=>e.id===id);md+=`### ${e.title} — \`${id}\`\n\n- 배치·동작: ${e.design}\n- 원문 단계: ${e.original.lines.map((l,i)=>`${i+1}. ${l.speaker}: ${l.text}`).join(' / ')}\n- 조건·보존: ${JSON.stringify(e.trigger)}\n- 상태: 미제작. ${e.verification}\n\n`}
}
fs.writeFileSync('docs/event-art-remaining-138-plan.md',md)
// Annotate existing ledgers without erasing historical group assignments or completion records.
const ledger=read('docs/event-art-background-groups.json');ledger.activePlan='docs/event-art-remaining-138-plan.json';ledger.productionBatches=groups.map(({id,name,entries})=>({id,name,pending:entries.length,entries}));ledger.note='538개 연결/138개 미제작 유지. 138개 전체 배경·원문·조건 재기획 완료. 제작 순서는 activePlan의 production batch를 따른다. 기존 배경군 완료 이력은 보존.'
for(const g of ledger.groups)for(const e of g.entries){const plan=entries.find(p=>p.id===e.id);if(plan){e.productionBatch=plan.batch;e.backgroundPlan=plan.background;e.needsLocationCheck=false;e.planningStatus='원문·발생 경로 대조 완료';e.planFile='docs/event-art-remaining-138-plan.json'}}
write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');selection.activePlan='docs/event-art-remaining-138-plan.json';for(const e of selection.entries){const plan=entries.find(p=>p.id===e.id);if(plan){e.productionBatch=plan.batch;e.backgroundPlan=plan.background}}
write('docs/event-art-selection.json',selection)
const canonical='docs/event-art-production-plan.md';let old=fs.readFileSync(canonical,'utf8');if(!old.includes('<!-- remaining-138-active-plan -->'))old=old.replace('# 전체 이벤트 도트 제작 계획','# 전체 이벤트 도트 제작 계획\n\n<!-- remaining-138-active-plan -->\n**2026-10-15 최신 순서:** [남은 138개 전체 재기획](event-art-remaining-138-plan.md)을 따른다. 아래의 과거 작업 순서와 기존 자동화 지시는 이 최신 계획으로 대체한다. 같은 배경의 남은 사건 전체를 묶어 순차 제작하며 임의 2개 제한은 없다. 현재 538/676개 연결, 138개 미제작. 자동화 실제 변경 여부는 앱 도구 결과로 별도 확인한다.\n<!-- /remaining-138-active-plan -->')
fs.writeFileSync(canonical,old)
console.log(JSON.stringify({baseline:document.baseline,groups:groups.map(g=>({id:g.id,count:g.entries.length})),unique:138,assets:'모든 경로 존재',scenes:'모든138개 원문 연결'},null,2))
