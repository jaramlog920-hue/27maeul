import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){
 if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
 const result=n(url,c)
 if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...result,source:String(result.source).replaceAll('import.meta.glob','(() => ({}))')}
 return result
}})
const {SCENES}=await import('../../src/content/text.ts')
const groups=JSON.parse(fs.readFileSync('docs/event-art-background-groups.json','utf8'))
const {PEOPLE_DATA}=await import('../../src/content/people-all.ts')
const entries=groups.groups.find(g=>g.id==='postman').entries.filter(e=>e.status!=='완료')
const conditions=new Map(Object.values(PEOPLE_DATA.people).flatMap(p=>(p.events??[]).map(e=>['ev:'+e.id,e])))
const guidance={
 'ev:postman:story:2':'실제 방 at16,83. 기존 postman-proposal-art의 실내 편지꽂이·탁자·궤짝을 추출해 재사용. 뒤집힌 가방 덮개/끈/안주머니 분리. 덮개 빗자국과 윤기, 실제 개조는 아직 미래.',
 'ev:postman:small:ownAppt':'돌계단 at27,14. 배달 시각 수첩에 본인의 쉼 한 줄/다음 잔칫날 추가. 미래 약속을 실제 휴식으로 앞당기지 않기.',
 'ev:postman:small:newStrap':'베틀 집 앞 at36,24. postman와 weaver 실제 두 인물. 같은 길이 끈과 어깨 쪽 넓이, 밤색 실 고르기/같이 감기. 완성 끈을 미리 설치하지 않기.',
 'ev:postman:love:2':'돌계단 at27,14. 네 번째 끊어진 끈과 세 번 기운 자리. 같이 잡는 실과 새 네 번째 매듭. 새 끈 약속 선택은 낡은 네 번 기운 끈을 보존하고 제작을 미리 실행하지 않기.',
 'ev:postman:story:1':'길가 at22,8. 가방 내려놓기, 가늘어진 끈 한쪽과 매듭. 같이 두 번 감거나 잠깐 쉬며 묶기. 새 가방으로 바꾸지 않기.',
 'ev:postman:story:4':'실제 광장 돌계단 at27,14. 기존 덮개+새 둥근 나무 잠금. 곁에 앉기/쉼 한 줄/잠금 열기 세 갈래. 통째 새 가방으로 바꾸지 않기.',
 'ev:postman:short:spouseHabit':'발생 at22,8이며 집 문 옆에 설치했다고 이야기하는 회상. 원래 현재 위치와 집의 기설치 메모 꽂이 설명을 구분. 콩죽/잘 다녀와/내일 돌계단 한 줄 메모.',
 'ev:postman:love:1':'돌계단 at27,14에서 아무 집 없는 길로 걷는 이야기. 집 없는 풀숲 길과 답변 뒤 작게 보이는 호수. 다른 선택은 수첩에 둘이 걷는 길 이름 기록.',
 'ev:postman:small:rainCover':'비 오는 실제 집 앞 at15,24. 기름 먹인 천과 가방. 한쪽만 끈에 묶기/세 번 접은 덮개 크기를 구분. 손/천은 머리·몸통 옆에서만.',
 'ev:romance:postman:blankLine':'돌계단 그늘. 배달 시각과 기존 돌계단 쉼 한 줄, 새 빈 줄. 선택은 앞으로 함께할 산책/휴식 기록. 새 모임을 미리 실행하지 않기.',
 'ev:postman:home:2':'발생 at22,8. 쉬는 날 급한 편지 연락과 쉼 수첩을 상의함. 함께 배달하거나 다른 이웃에게 부탁하는 답변을 배달 완료나 즉석 새 인물 등장으로 바꾸지 않기.',
 'ev:postman:home:1':'발생 at22,8. 집 안 편지함을 어디 달지 상의함. 부엌 문/침대 머리맡은 미래 설치 계획. 완성 편지함을 배경에 미리 달지 않기.'
}
fs.writeFileSync('artifacts/scenery/postman-production-brief.json',JSON.stringify({status:'원문·장소 대조 완료, 구현 미착수',updated:'2026-10-15',inventory:{drawn:476,pending:200},batch:'편지 집·배달길 미제작 전체12개',rules:'src/render/AGENTS.md; 그룹 전체 구현·대사/선택·가로/휴대폰/썸네일 시각 확인 및 관련 검사/빌드 후에만 완료 기록 갱신',entries:entries.map(e=>({...e,original:SCENES[e.id],trigger:conditions.get(e.id)??null,guidance:guidance[e.id]}))},null,2)+'\n')
console.log('Prepared 12 original scenes, triggers, reuse references and choice-specific prop notes. No renderer or completion counts changed.')
