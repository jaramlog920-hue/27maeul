from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path('.')
briefp=Path('artifacts/scenery/postman-production-brief.json');brief=json.loads(briefp.read_text(encoding='utf-8'));ids={e['id'] for e in brief['entries']}
inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'));drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')};assert len(drawn)==488 and ids<=drawn
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'));groups={g['id']:g for g in d['groups']}
move={'ev:postman:small:newStrap':'weaver','ev:postman:love:1':'hill','ev:postman:story:4':'square','ev:postman:love:2':'square','ev:postman:small:ownAppt':'square','ev:romance:postman:blankLine':'square','ev:postman:story:1':'library','ev:postman:short:spouseHabit':'library','ev:postman:home:1':'library','ev:postman:home:2':'library'}
places={'postman':'편지 집 방(at 16,83) / 비 오는 집 앞(at 15,24), 기존 마일로 배경 공유','weaver':'실제 at 36,24 베 짜는 집 앞, 기존 아이리스 외관 공유','hill':'배달길 밖 집 없는 길, 덤불 사이 호수는 함께 걷는 답변에서만 표시','square':'실제 at 27,14 광장 돌계단 그늘, 기존 광장 배경 공유','library':'실제 at 22,8 서고 쪽 길가, 기존 마일로 장면의 서고 길 배경 공유'}
for g in d['groups']:
 for e in list(g['entries']):
  if e['id'] not in ids:continue
  target=move.get(e['id'],'postman');e.update(group=target,status='완료',needsLocationCheck=False,renderer='drawPostmanEvent',basis=places[target]+'; 원래 대사·선택 단계와 미래 계획 구분 확인')
  if target!=g['id']:g['entries'].remove(e);groups[target]['entries'].append(e)
for g in d['groups']:
 g['count']=len(g['entries']);g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=g['count']-g['completed']
d.update(drawn=488,pending=188,note='488개 연결/188개 미제작. 편지 집·배달길 배정 미제작 12개 전체 완료. 실제 장소에 따라 베틀 집 앞 1개·광장 돌계단 4개·집 없는 언덕길 1개·서고 길가 4개로 이동, 편지 집 방/비 오는 집 앞 2개 유지. 다음 서고·필사 책상·시설 전체 미제작 24개를 원문·실제 장소·등록과 대조한다.')
assert sum(g['pending'] for g in d['groups'])==188
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');s=json.loads(p.read_text(encoding='utf-8'))
for e in s['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
s.update(existing=488,pending=188,counts={tier:sum(e['tier']==tier and e['id'] not in drawn for e in s['entries']) for tier in ['dialogue','illustration','event']})
p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');t=p.read_text(encoding='utf-8').replace('현재 실제 연결 476개, 미제작 200개.','현재 실제 연결 488개, 미제작 188개.',1);p.write_text(t,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');t=p.read_text(encoding='utf-8').replace('실제 그림 연결 476개, 남은 200개.','실제 그림 연결 488개, 남은 188개.',1).replace('| 편지 집·배달길 | 12 |','| 편지 집·배달길 | 0 |',1)
t+='\n\n2026-10-15 편지 집·배달길 배정 미제작 12개 전체 완료. 원래 편지 집 실내·빗날 외관·서고 길·광장·베틀 외관·목초지 배경을 재사용하고 가방 덮개/끈/안주머니, 네 번째 매듭, 넓은 어깨끈, 수첩, 둥근 잠금과 선택별 손동작을 구분했다. 집 안 편지함 설치·쉬는 날 배달·새 끈 짜기는 미래 계획 단계로 유지. 52개 원래 대사/선택 단계와 걷기 시작/중간 10컷을 기본·실제 외형으로, 12개 휴대폰 컷과 모음 썸네일을 확인했다. 관련 검사 2,766개와 전체 사전 검사·TypeScript·Vite 빌드 통과. 현재 488개 연결/188개 미제작. 다음 서고·필사 책상·시설 전체 미제작 24개. 모음: http://localhost:5173/assets/events/index.html?background=postman-new\n'
p.write_text(t,encoding='utf-8')
p=Path('docs/event-art-progress.md');t=p.read_text(encoding='utf-8').replace('## 완료 365','## 완료 377',1)
notes=[('ev:postman:story:2','남길 부분: 방 탁자에 분리한 기존 가방 덮개·같은 길이 끈·안주머니. 닳은 모서리와 만지는 선택을 구분.'),('ev:postman:small:ownAppt','내 약속 적기: 광장 돌계단의 수첩. 쉬기/다음 축제 배달 쉬기의 약속을 새 줄에 적음.'),('ev:postman:small:newStrap','넓은 어깨끈: 베 짜는 집 앞의 마일로·아이리스. 길이는 유지하고 어깨 부분만 넓은 견본·밤색 세 가지와 실 감기 선택.'),('ev:postman:love:2','네 번째 매듭: 돌계단 옛 가방·세 매듭, 실을 잡는 선택 후 네 번째 매듭. 새 끈 제안은 옛 끈을 간직하려는 답변 그대로 유지.'),('ev:postman:story:1','닳은 끈: 서고 쪽 길가의 내려놓은 오래된 가방·가느다란 끈·세 매듭. 실을 받치는 짧은 손과 재매듭.'),('ev:postman:story:4','돌계단 그늘에 앉기: 기존 덮개와 새 둥근 나무 잠금. 함께 앉기·수첩 쓰기·한 손가락으로 열기 선택별 표시.'),('ev:postman:short:spouseHabit','문 옆 메모 꽂이: 원래 야외 대화 장소에서 첫 메모를 고름. 콩죽·인사·내일 돌계단 약속을 표시하고 집 안으로 임의 이동하지 않음.'),('ev:postman:love:1','배달 없는 길: 집 없는 길을 나란히 걷기. 함께 가는 답변 뒤에만 덤불 사이 호수 앞 멈춤, 길 이름 선택은 수첩에 기록.'),('ev:postman:small:rainCover','비 오는 날 덮개: 빗날 기존 외관·가방 위 기름 먹인 천. 한쪽 끝만 묶기와 세 번 접어 덮개 크기 맞추기를 구분.'),('ev:romance:postman:blankLine','수첩의 빈 줄: 돌계단 배달 수첩의 비워 둔 한 줄, 산책/돌계단 둘이 약속을 적는 선택.'),('ev:postman:home:2','쉬는 날의 편지: 서고 쪽 길가의 쉼 수첩·급한 편지·계획 메모. 함께 가기/다른 이에게 부탁하기를 상의하며 실제 배달 완료나 제삼자를 미리 만들지 않음.'),('ev:postman:home:1','집 안 편지함: 원래 서고 쪽 야외 대화. 설치 전 도면에서 부엌문/침대 머리맡 자리 선택, 완성 편지함을 미리 설치하지 않음.')]
t+='\n\n## 2026-10-15 편지 집·배달길 배정 12개 전체 완료\n\n'+'\n'.join('- `'+i+'` — '+n for i,n in notes)+'\n\n52개 원래 대사·선택 단계와 걷기 시작/중간 보강 10컷(기본/실제 사용자 외형 각각 62컷), 12개씩의 휴대폰 컷과 실제 모음 썸네일 시각 확인. 얼굴·머리·몸통·짧은 손과 팔·발 가림, 마일로·아이리스 실제 외형, 원래 선택·대사와 저장/앨범 보호 관련 검사 2,766개 통과. 콘텐츠 전체 사전 검사·TypeScript·Vite 전체 빌드 통과. 실제 브라우저에서 돌계단 잠금 열기·휴대폰 세 번 접기 선택과 12개 모음 확인, 새로고침 콘솔 오류 없음. 다른 작업의 변경과 완료 기록 보존. 현재 전체 488개 연결/188개 미제작. 다음 서고·필사 책상·시설 미제작 24개 전체. 모음 http://localhost:5173/assets/events/index.html?background=postman-new\n'
p.write_text(t,encoding='utf-8')
brief.update(status='12개 전체 구현·시각 확인·검사·빌드 완료',inventory={'drawn':488,'pending':188},verification='62컷씩 기본/실제 외형, 12개씩 휴대폰 컷, 브라우저 선택·썸네일 확인; 2766 tests, prebuild, tsc, vite build 통과',next='서고·필사 책상·시설 미제작 24개 전체')
briefp.write_text(json.dumps(brief,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'drawn':488,'pending':188,'batch':len(ids),'nextLibrary':groups['library']['pending'],'counts':s['counts']},ensure_ascii=False))
