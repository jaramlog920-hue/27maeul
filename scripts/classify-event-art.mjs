import fs from 'node:fs'

// 실제 콘텐츠 목록의 모든 ID를 포함하고, 신규 전용 장면은 명시적으로 선정한다.
const entries=JSON.parse(fs.readFileSync('artifacts/scenery/event-art-inventory.json','utf8'))
const selected=new Map()
function scene(group,reason,...ids){for(const id of ids)selected.set(id,{group,reason})}
for(const prefix of ['wedding','propose'])for(const e of entries.filter(e=>e.id.startsWith(prefix+':')))scene(prefix==='wedding'?'결혼식':'청혼',prefix==='wedding'?'실제 결혼과 마을의 축하가 일어나는 삶의 전환점. 인물별 13개를 한 장면 구조의 외형 변형으로 제작.':'청혼을 받고 약속의 끈을 건네는 중요한 관계 변화. 인물별 외형과 대사는 보존.',e.id)
scene('아기를 기다리는 날','식탁에서 손을 잡고 요람 곁에 이불을 준비하는 가족의 변화.','pregnancy')
scene('첫 아이의 탄생','긴 밤을 견디고 아침에 요람을 맞는 큰 생활 변화.','childBorn')
scene('동생의 탄생','큰아이 손가락을 아기가 쥐는 구체적인 가족 행동.','siblingBorn')
scene('작은 손님','새끼 고양이와 강아지가 마당에 찾아오는 실제 사건.','strays')
for(const [id,group,reason] of [
 ['fam:make','둘이 만든 장난감','나무와 헝겊이 장난감으로 바뀌는 공동 작업.'],
 ['fam:supperAll','식구가 둘러앉은 저녁','배우자가 차린 식탁에 아이가 수저를 놓는 가족 장면.'],
 ['fam:bdaySpouse','배우자의 생일','꿀빵을 준비한 식탁과 배우자의 반응을 함께 보여 줄 수 있음.'],
 ['fam:bdayChild','아이의 생일','식구들이 꿀빵을 나누는 생일의 한 순간.'],
 ['fam:bdayChildFar','멀리 보낸 편지','떠난 아이의 생일에 편지를 쓰는 독립 이후의 가족 이야기.'],
 ['fam:show','작품을 보여 준 날','아이 작품을 전시하고 아이가 직접 소개하는 변화.'],
 ['fam:story','잠자리 이야기','이불을 덮어 주고 이야기를 들려주는 구체적인 행동.'],
 ['fam:deskNap','책상 옆에서','책장을 넘기던 아이가 졸기 시작하는 작은 변화.'],
 ['fam:walk','손잡고 걷는 길','부모와 아이가 손잡고 걷는 동작이 핵심.'],
 ['fam:errand','첫 심부름','아이가 처음 심부름을 받아 스스로 나서는 변화.'],
 ['fam:picnic','가족 봄 소풍','꽃길에 앉아 빵을 나누는 가족의 실제 활동.'],
 ['fam:cook','함께 만든 음식','어른이 불과 냄비를 맡고 아이가 접시를 고르는 공동 활동.'],
 ['actsShip','나루에 배가 들어왔다','큰 배가 들어와 닻을 내리는 풍경 변화.'],
 ['trip:harbor','바닷가 항구 마을','배가 항구에 닿고 새로운 장소를 처음 보는 여행 도착.'],
 ['trip:hillTown','언덕 너머 마을','낯선 마을에 도착해 탐험하는 여행의 전환점.'],
 ['village:4','정든 마을','마을 성장의 큰 완성 시점. 실제 완성 상태를 보여 주는 장면.'],
 ['hallNight','사랑방의 저녁','이웃들이 긴 탁자에 둘러앉는 실제 모임.'],
 ['ev:cosmo:boat','부서진 배','폭풍에 부서진 배와 나뭇조각을 줍는 선택을 보여 줄 수 있음.'],
 ['saw:boat:launch','다시 뜬 배','수리된 배가 뜨고 코스모와 루디가 함께 올라타는 결과.'],
 ['ev:cosmo:rowTogether','노 젓기','수리 이후 실제로 함께 배에 타는 행동.'],
 ['ev:wendell:trip','사흘','보따리를 메고 떠나는 파피와 배웅의 중요한 순간.'],
 ['ev:wendell:story:1','고르는 날','편지와 두 줄의 새 종이 앞에서 자기 진로를 정하는 변화.'],
 ['ev:wendell:story:2b','배우러 가는 아침','결정한 뒤 실제로 배움을 위해 나서는 후속 장면.'],
 ['ev:wendell:myBread','내 모양 빵','자기 빵을 만들고 보여 주는 꿈의 구체적인 표현.'],
 ['ev:rudy:carvingTalk','밤마다 새긴 글자','판자 여러 장의 변화와 선택에 따른 끌 작업.'],
 ['saw:rudy:carving','밤의 끌 소리','등불 아래 글자를 새기는 행동을 조용히 목격함.'],
 ['ev:rudy:readTogether','천천히 읽기','글자를 함께 읽는 행동과 인물 성장.'],
 ['ev:dexter:winterNight','겨울 우리','기침하는 양과 양들 사이에 함께 앉는 돌봄 장면.'],
 ['ev:dexter:clouds','구름 보기','양들 가운데 바로 누워 구름을 보는 자세가 핵심.'],
 ['saw:dexter:poem','언덕의 돌','돌 밑에 시를 숨기는 행동을 처음 목격함.'],
 ['ev:dexter:story:3','작은 보기 모임','그림과 글을 실제로 함께 보여 주는 개인 이야기의 결과.'],
 ['ev:marigold:grandpaIll','넝쿨 앞의 할아버지','할아버지를 부축하고 계단에서 우는 선택의 변화.'],
 ['ev:marigold:ledgerTalk','모자란 동전','감춘 동전 자루와 혼자 감당하던 걱정의 공개.'],
 ['ev:marigold:ledgerNew','포도원의 값','포도원 매입 편지를 들고 자기 삶을 고민하는 중요한 이야기.'],
 ['saw:marigold:ledger','밤의 동전','늦은 밤 계단에서 동전을 세는 행동을 목격함.'],
 ['ev:marigold:small:freeAfternoon','계획 없는 오후','늘 목록을 들던 인물이 빈손으로 쉬는 성장의 결과.'],
 ['ev:marigold:tooMuch','마흔아홉 번째','일과 가족과 관계를 전부 떠맡는 성격의 갈등이 드러남.'],
 ['ev:marigold:rainTea','할아버지 방','담요와 차 세 잔으로 가족을 돌보는 행동.'],
 ['ev:juniper:love:1','공책 맨 뒤','벌 기록보다 긴 주인공 기록을 공개하는 관계의 전환점.'],
 ['ev:juniper:book','벌 공책의 책','닳은 공책 더미를 건네고 자기 책을 꿈꾸는 중요한 순간.'],
 ['ev:juniper:danceNew','풀밭의 공책','바람에 펼쳐진 공책 속 주인공 그림을 발견하는 사건.'],
 ['saw:juniper:dance','풀밭의 춤','혼자 춤을 추는 인물의 숨은 모습을 목격함.'],
 ['ev:juniper:avoid','피해 다니는 날들','언덕에서 마주쳐 공책 없이 마음을 말하는 관계 변화.'],
 ['ev:penelope:silentDay','고르지 못한 날','선택에 따라 실제 노을 장면까지 이어지는 변화.'],
 ['saw:penelope:unpick','풀어 버린 천','완성한 천을 바라보다 풀어 버리는 행동을 목격함.'],
 ['ev:penelope:story:3','펴 보이는 저녁','비뚠 줄을 남긴 깔개를 끝까지 펼치는 성장의 결과.'],
 ['ev:basil:tree','높은 가지','나무를 올라 이끼를 모으거나 함께 새벽 마을을 보는 실제 행동.'],
 ['saw:basil:treeFall','새벽의 고목','높은 나무에서 벌어지는 행동을 목격하는 장면.'],
 ['ev:poppy:closing','문 닫은 찻집','떠나야 할지 모른다는 두려움과 자기 찻집에 대한 결심.'],
 ['ev:poppy:window','김 서린 창','김 서린 창에 그림을 그리는 행동으로 인물의 마음을 표현.'],
 ['ev:postman:love:1','배달 없는 길','함께 걸어 비밀 호숫가를 보여 주는 실제 이동.'],
 ['ev:postman:story:3','잠금 부탁','늘 부탁을 받던 인물이 직접 공방에 도움을 청하는 변화.'],
 ['ev:romance:presser:imperfectHouse','조금 덜 반듯한 집','집 그림 위 돌을 함께 놓으며 두 사람의 생활을 조정하는 행동.'],
 ['ev:romance:presser:untimedTea','시간을 재지 않은 차','작업 시간표를 비운 뒤 실제로 함께 쉬는 성장의 결과.'],
 ['ev:tilly:cough','밤의 기침','아버지의 기침을 듣고 두려움을 말하거나 불씨를 살리는 선택.'],
 ['ev:tilly:quarrel','호숫가의 저녁','대장간 갈등 뒤 호숫가에서 돌을 던지는 감정의 행동.'],
 ['saw:forge:handle','새벽의 망치 자루','아버지가 딸을 위해 손잡이를 조용히 남기는 관계의 결과.'],
 ['date:walk:2','벤치까지 내기','둘이 벤치까지 달리는 실제 동작.'],
 ['date:tea:1','두 잔의 차','나란한 두 잔과 서로의 반응으로 관계를 보여 주는 데이트.'],
 ['date:walk:1','들꽃 한 송이','함께 걷다 꽃을 건네는 실제 데이트 행동.'],
])scene(group,reason,id)
scene('날아간 새','다친 새를 돌보던 모습과 손을 펼쳐 날려 보내는 변화. 본 적 있는지에 따른 대사 분기만 별도 유지.','ev:tilly:birdSeen','ev:tilly:birdNew')
scene('다친 새를 돌보는 밤','불빛 옆에서 쇠 부목을 대는 돌봄 행동을 목격함.','saw:tilly:bird')
scene('돌 밑의 종이','숨겨 둔 종이를 꺼내 처음 시를 읽어 주는 관계의 변화. 발견 여부에 따른 대사와 소품 수를 유지.','ev:dexter:poemFound','ev:dexter:poemNew')
scene('함께 추는 벌 춤','실제로 배우고 함께 추는 동작. 서로 다른 대사는 같은 장소·몸 동작 자산을 활용.','ev:juniper:dancePlay','ev:juniper:love:2')

const talkIds=new Set(['notice:babyParty','notice:picnic','notice:starNight','babyBorn','gospelFeast','allFeast','ev:shepherd:short:seasonNews','ev:cosmo:gossip','ev:poppy:order','ev:basil:checkup','ev:tilly:busy','ev:cosmo:weather','ev:basil:love:2','ev:merchant:home:1','ev:romance:merchant:lateReturn','ev:romance:postman:lastDelivery','ev:basil:home:2','ev:tilly:home:2','ev:postman:home:2','ev:presser:home:2','ev:marigold:love:2','ev:cosmo:jealous','ev:poppy:love:2','ev:poppy:sister','ev:romance:postman:otherDay'])
const pending=e=>!e.kind&&!e.authored
const sourceTexts=e=>[...(e.lines??[]),...(e.choices??[]).flatMap(c=>c.reply??[])].map(l=>l.text).join(' ')
const hasVisibleProp=/공책|나무판|판자|책|편지|종이|지도|목록|표|수첩|찻잔|차 |빵|꽃|실|천|깔개|항아리|병|바구니|의자|도구|망치|가방|끈|양털|노 |그물|상자|화분|고리|조약돌|돌 |이불|방석|장난감|반죽|가마|집게|손잡이|올리브|넝쿨|양 |양들|양을|풀|얼음|그릇|화덕|별|구름|발판|포도나무|시간표|동선/
function recommendation(e){
 if(selected.has(e.id))return {tier:'event',...selected.get(e.id)}
 if(!pending(e))return {tier:'event',group:e.kind??e.id,reason:'이미 전용 그림이 연결되어 있으므로 유지. 새로 작은 삽화나 대화창으로 되돌리지 않음.'}
 if(talkIds.has(e.id))return {tier:'dialogue',group:e.id,reason:/^notice:/.test(e.id)?'시간·장소를 알리는 초대 안내. 실제 모임 장면을 따로 보여 주므로 안내는 대화만 유지.':e.id==='babyBorn'?'이웃이 아기 출생 소식과 나중 방문을 전함. 실제 아기를 만나는 잔치는 별도 장면.':/^(gospelFeast|allFeast)$/.test(e.id)?'책 완성과 저녁 잔치 소식을 알림. 이미 실제 완성·잔치 장면이 있으므로 안내 중복을 피함.':'이야기의 내용은 유지하되 현재 화면에서 벌어지는 큰 행동이 없어 대화로 전달하는 편이 자연스러움.'}
 if(/^(ask:|invite:|romance[12]:|loverTrust:)/.test(e.id))return {tier:'dialogue',group:e.id.replace(/:friend$/,''),reason:e.id.startsWith('ask:')?'필요한 물건과 부탁을 말로 설명하는 단계. 완성 결과는 별도 삽화로 보여 줌.':e.id.startsWith('invite:')?'다음 저녁 약속을 알리는 대화. 실제 식사는 별도 그림으로 보여 줌.':e.id.startsWith('loverTrust:')?'같은 관계 확인 대사의 인물별 변형. 기존 대사와 외형을 유지하고 전용 장면을 각각 추가하지 않음.':'과거 경험이나 생각을 말하는 이야기. 회상을 실제 현재 행동처럼 그리지 않고 대화로 유지. 친구 대사 변형은 같은 항목의 분기.'}
 if(/^(gift:|done:|built:|growth:|roomOpen:|movedIn:|bibleReadingLetter:|fam:with:)/.test(e.id))return {tier:'illustration',group:e.id,reason:e.id.startsWith('gift:')?'실제로 건네는 물건이 중심. 해당 물건과 손의 작은 삽화로 정확히 표현.':e.id.startsWith('done:')?'부탁으로 바뀐 가구·시설·물건의 결과를 작은 컷으로 보여 주면 충분. 보상은 원래대로.':e.id.startsWith('growth:')?'해금된 게시판·가구·활동을 알리는 안내. 한 컷 삽화와 원래 조건 설명을 함께 제시.':e.id.startsWith('fam:with:')?'아이와 이웃의 한 가지 활동. 안전한 손·도구·활동 위치를 보여 주는 작은 가족 삽화.':e.id.startsWith('bibleReadingLetter:')?'편지 내용을 읽는 이벤트. 편지·책갈피 삽화로 충분.':'새로 열린 장소 또는 설치된 물건의 외형을 한 컷으로 보여 주는 안내.'}
 if(/^ev:.*:short:spouseHabit$/.test(e.id))return {tier:'illustration',group:e.id,reason:'새로 정할 가족 습관과 소품을 상의하는 대화. 실제 소품만 삽화로 보여 주고 미래 행동을 미리 실행하지 않음.'}
 if(/^ev:/.test(e.id)&&!hasVisibleProp.test(e.title+' '+sourceTexts(e))&&!(e.lines??[]).some(l=>l.speaker==='narration'))return {tier:'dialogue',group:e.id,reason:'표정과 말의 내용이 중심이고 눈에 보이는 소품·행동 변화가 적어 기존 대화창으로 전달.'}
 return {tier:'illustration',group:e.id,reason:'이벤트 내용은 유지하고 핵심 소품·현재 활동을 한 컷으로 보여 줌. 연속 동작이나 화면 전환보다 작은 삽화가 적합.'}
}
const labels={event:'전용 이벤트 장면',illustration:'작은 삽화',dialogue:'기존 대화창'}
const rows=entries.map(e=>({...e,...recommendation(e),status:pending(e)?'미제작':'기존 그림 유지',owner:[17,18].includes(Math.floor((e.title.charCodeAt(0)-0xac00)/588))?'다른 창(ㅍ·ㅎ)':'이 창'}))
const left=rows.filter(pending),counts=Object.fromEntries(Object.keys(labels).map(k=>[k,left.filter(e=>e.tier===k).length]))
const groups=new Set(left.filter(e=>e.tier==='event').map(e=>e.group))
if(new Set(rows.map(e=>e.id)).size!==rows.length)throw new Error('Duplicate event ID')
if(Object.values(counts).reduce((a,b)=>a+b,0)!==left.length)throw new Error('Incomplete classification')
const missing=[...selected.keys()].filter(id=>!entries.some(e=>e.id===id))
if(missing.length)throw new Error(`Selected IDs absent from actual content: ${missing.join(', ')}`)
const md=['# 이벤트 그림 제작 선별안','',`기준: 현재 실제 미리보기 목록 ${rows.length}개를 전부 확인 대상으로 포함한다. 기존 그림 연결 ${rows.length-left.length}개는 유지하고, 남은 ${left.length}개에 다음 표현 방식을 추천한다. 코드상의 이벤트 ID 수이며 선택별 컷 수나 새 그림 종류 수와 다르다.`,``,`| 앞으로의 표현 방식 | 미제작 이벤트 ID 수 |`,`|---|---:|`,...Object.entries(counts).map(([k,n])=>`| ${labels[k]} | ${n} |`),'',`전용 장면은 인물·발견 여부의 변형을 묶으면 **${groups.size}종의 이야기 구조**다. 결혼식/청혼 각각 13명은 두 구조로 세며 인물별 대사·외형은 보존한다. 다른 장소/동작이 필요한 사건은 같은 이름이라도 억지로 합치지 않는다.`,'','## 적용 기준','','- 전용 장면: 가족·관계의 중요한 전환, 물건·장소가 바뀌는 사건, 행동으로 드러나는 개인 성장, 실제 이동·돌봄·공동 활동.','- 작은 삽화: 선물·가구·작업 결과, 해금 안내, 소품이 중심인 짧은 생활 활동.','- 기존 대화창: 초대·일정 안내, 재료 부탁, 생각·과거 이야기, 말만 달라지는 관계 확인.','- 원래 이벤트·대사·선택지·보상·시간·해금 조건을 삭제하거나 변경하지 않는다. 이 문서는 표현 방식과 제작 순서를 정하는 선별안이다.','- 이미 만든 전용 그림은 그대로 유지한다. 아직 제작하지 않은 항목만 새 우선순위를 적용한다.','- 첫 초성이 ㅍ·ㅎ인 제목은 다른 창 담당이며 이 창에서 중복 제작하지 않는다.','- 이번 선별은 자동 제작 대상으로 확정하지 않는다. 사용자가 검토할 수 있는 계획이며 기존 자동화의 행동 범위 변경은 별도로 반영한다.','','## 먼저 만들 전용 장면 목록','','| 제목 | ID | 묶음 | 추천 이유 | 담당 |','|---|---|---|---|---|',...left.filter(e=>e.tier==='event').map(e=>`| ${e.title} | \`${e.id}\` | ${e.group} | ${e.reason} | ${e.owner} |`),'','## 작은 삽화 목록','','| 제목 | ID | 추천 이유 | 담당 |','|---|---|---|---|',...left.filter(e=>e.tier==='illustration').map(e=>`| ${e.title} | \`${e.id}\` | ${e.reason} | ${e.owner} |`),'','## 기존 대화창으로 둘 목록','','| 제목 | ID | 추천 이유 |','|---|---|---|',...left.filter(e=>e.tier==='dialogue').map(e=>`| ${e.title} | \`${e.id}\` | ${e.reason} |`),'','## 기존 그림이 연결된 항목 — 유지','','| 제목 | ID |','|---|---|',...rows.filter(e=>!pending(e)).map(e=>`| ${e.title} | \`${e.id}\` |`),'']
const examples=['','## 대표 예시와 우선순위','','| 표현 방식 | 예시 |','|---|---|','| 전용 이벤트 장면 | 겨울 우리, 날아간 새, 부서진 배, 다시 뜬 배, 사흘, 밤의 기침, 공책 맨 뒤, 새 식구, 둘이 만든 장난감 |','| 작은 삽화 | 게시판의 첫 부탁, 선물, 부탁을 들어준 날, 새 이웃, 서고 문 개방, 겨울 도구 닦기, 항아리 표지, 책 받침 |','| 기존 대화창 | 모임 초대 안내, 재료를 요청하는 이웃의 부탁, 고향 길, 늦게 닫은 약방, 바쁜 날, 호감도 과거 이야기, 같은 내용의 관계 확인 |','','추천 제작 순서: 가족의 큰 전환(청혼·결혼·출산) → 인물의 핵심 이야기(새·배·진로·돌봄·글자·공책) → 가족 활동 → 기억에 남는 조용한 생활 장면. 작은 삽화는 기존 물건 도트를 정확한 대상에 연결하는 것부터 시작한다. 전체화면 장면처럼 확대·연속 동작을 붙일 필요는 없다.','','검토 주의: 작은 삽화도 해당 대사에 맞는 실제 물건·상황을 보여 줘야 한다. 모든 항목에 공통 두 인물을 넣고 배경색만 바꾸는 방식은 쓰지 않는다. 기존 대화창 항목은 이벤트 자체를 지우는 뜻이 아니며 원래 선택·보상·관계 기록을 그대로 유지한다.','']
md.splice(md.indexOf('## 적용 기준'),0,...examples)
fs.writeFileSync('docs/event-art-selection.md',md.join('\n'))
fs.writeFileSync('docs/event-art-selection.json',JSON.stringify({total:rows.length,existing:rows.length-left.length,pending:left.length,counts,newSceneGroups:groups.size,entries:rows.map(({id,title,tier,group,reason,status,owner})=>({id,title,tier,group,reason,status,owner}))},null,2))
fs.writeFileSync('src/content/event-art-dialogue-only.json',JSON.stringify(rows.filter(e=>e.tier==='dialogue').map(e=>e.id),null,2)+'\n')
console.log(JSON.stringify({total:rows.length,existing:rows.length-left.length,pending:left.length,counts,newSceneGroups:groups.size}))
