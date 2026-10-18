from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
briefp=Path('artifacts/scenery/library-production-brief.json');brief=json.loads(briefp.read_text(encoding='utf-8'));ids={e['id'] for e in brief['entries']}
inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'));drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')};assert len(drawn)==512 and ids<=drawn
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'));groups={g['id']:g for g in d['groups']}
for g in d['groups']:
 for e in list(g['entries']):
  if e['id'] not in ids:continue
  i=e['id'];target='library' if i.startswith(('ev:rudy:','roomOpen:')) or i in ['gospelFeast','allFeast','fam:show'] else 'home'
  e.update(group=target,status='완료',needsLocationCheck=False,renderer='drawLibraryEvent',basis=('원래 서고 문 앞/서고 방/배움터의 대사·실제 발생 조건 대조' if target=='library' else '집의 기록 책상·가구·편지 안내 컷; 편지 바구니는 집 밖 기존 마당, 미래 손님/모임/요리는 계획으로 표시')+'; 전체 55개 대사·선택 단계, 실제 외형/아이 작품과 앨범 보존 확인')
  if target!=g['id']:g['entries'].remove(e);groups[target]['entries'].append(e)
for g in d['groups']:
 g['count']=len(g['entries']);g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=g['count']-g['completed']
d.update(drawn=512,pending=164,note='512개 연결/164개 미제작. 서고·필사 책상·시설 배정 24개 전체 완료. 실제 서고·배움터 8개와 집 책상·가구·마당 안내 16개로 장소 대조 후 이동. 다음 이웃 마을·여행 배정 미제작 2개 전체, 그 뒤 현재 위치/장소 확인 대기 160개를 실제 배경별로 묶는다.')
assert sum(g['pending'] for g in d['groups'])==164
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');s=json.loads(p.read_text(encoding='utf-8'))
for e in s['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
s.update(existing=512,pending=164,counts={tier:sum(e['tier']==tier and e['id'] not in drawn for e in s['entries']) for tier in ['dialogue','illustration','event']})
p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');t=p.read_text(encoding='utf-8').replace('현재 실제 연결 488개, 미제작 188개.','현재 실제 연결 512개, 미제작 164개.',1);p.write_text(t,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');t=p.read_text(encoding='utf-8').replace('실제 그림 연결 488개, 남은 188개.','실제 그림 연결 512개, 남은 164개.',1).replace('| 서고·필사 책상·시설 | 24 |','| 서고·필사 책상·시설 | 0 |',1)
t+='\n\n2026-10-15 서고·필사 책상·시설 배정 미제작 24개 전체 완료. 기존 서고 완성 장면의 방·창·문·바닥과 가족방/집 마당, 실제 찬장·궤짝·화덕 도트를 재사용했다. 루디의 밖에서 머무름/동의 후 책장 모서리 재기, 세 서고 방의 카드 판/편지꽂이/책장과 탁자 차이, 네 권/27권 소식, 독서 편지 세 종류, 아이의 실제 작품을 구분했다. 해금 안내는 미래 모임·손님·잔치·요리를 미리 실행하지 않는다. 55개 대사·선택 단계를 기본/실제 외형으로, 24개씩 휴대폰 컷과 썸네일을 확인했다. 관련 검사 2,888개 및 전체 사전 검사·TypeScript·Vite 빌드 통과. 현재 512개 연결/164개 미제작. 다음 이웃 마을·여행 2개 전체, 이후 현재 위치/장소 확인 160개를 실제 배경별로 묶는다. 모음: http://localhost:5173/assets/events/index.html?background=library-new\n';p.write_text(t,encoding='utf-8')
notes={
'built:sootCatcher':'집 화덕의 기존 도트 위에 실제 얇은 쇠판과 받침. 그을음 수확은 엔진 그대로.',
'growth:visitor':'기록 뒤 다음 날 아침 방문 약속 메모. 빵 굽는 이웃을 미리 방문시키지 않음.',
'ev:rudy:story:3':'저녁 서고 문 곁 담과 비스듬한 나무 표지. 집에 둔 받침은 가져오지 않으며 표지 뒷면 이름 표시 선택.',
'gospelFeast':'네 권만 꽂힌 서고 선반과 헤이즐·할아버지·아서의 소식. 저녁 잔치/불을 미리 실행하지 않음.',
'ev:rudy:library':'문 앞에서 망설임, 함께 책장 보자는 답변의 실제 문턱 진입 대사에서만 실내로 전환. 짧은 손으로 가까운 책장 모서리 재기. 다른 선택은 밖에 남음.',
'roomOpen:rev':'두 창문 사이 카드 판·책장·한 권용 선반·가운데 읽는 탁자. 앞으로 올 책은 미리 꽂지 않음.',
'roomOpen:hebJud':'두 창문 사이 편지꽂이·책장·얇은 책 선반과 읽는 탁자.',
'roomOpen:romPhm':'두 창문 사이 편지꽂이·얇은 책 선반·작은 탁자. 없는 큰 책장은 그리지 않음.',
'allFeast':'27권이 모두 꽂힌 서고와 할아버지·아서·마일로. 저녁 여섯 시 잔치 초대는 초대장으로 유지.',
'growth:shelf':'책상 위에 모인 일곱 장의 기록. 책별 진행을 확인하는 단계.',
'bibleReadingLetter:0':'할아버지의 독서 편지와 한 장 읽은 기록. 편지 보낸 이를 집에 순간이동시키지 않음.',
'bibleReadingLetter:1':'어린 이웃의 편지와 둘이 펼친 책을 나타내는 쪽지.',
'bibleReadingLetter:2':'헤이즐의 독서 편지와 읽던 자리의 책갈피.',
'built:homeCoolCupboard':'기존 COOL_CUPBOARD 원본 도트와 아서. 음식 효과·집 안 배치는 그대로.',
'growth:clubs:full':'다양한 활동의 소모임 계획과 실·재료. 모임은 미리 개최하지 않음.',
'growth:cooking:full':'보리와 조리법 메모. 요리 배우기/식탁 차리기는 이후 행동으로 유지.',
'welcome':'집 기록 책상·원고·필사 도구. 원래 안내 세 대사 유지.',
'growth:smallRequest':'원래 지급된 보리 세 개와 부탁 메모. 건네기나 보상을 그림에서 실행하지 않음.',
'growth:clubs':'두 찻잔을 그린 작은 모임 계획 쪽지.',
'built:supplyChest':'실제 재료 궤짝의 원본 도트와 목수. 가방/궤짝 저장 기능 유지.',
'growth:cooking':'허브와 차 조리법 쪽지. 화덕에서 조리하는 미래 행동과 구분.',
'growth:mailbox':'기존 집 바깥 마당의 편지 바구니와 첫 소식 한 장.',
'growth:mailbox:full':'같은 집 마당의 바구니와 새 편지들. 주기와 실제 지급 변경 없음.',
'fam:show':'배움터 전시 탁자와 실제 사용자 아이의 외형·옷·피부·키, 저장된 실제 woodToy/clothDoll 작품. 발표/그림 경험·보상은 그대로.'}
p=Path('docs/event-art-progress.md');t=p.read_text(encoding='utf-8').replace('## 완료 377','## 완료 401',1);t+='\n\n## 2026-10-15 서고·필사 책상·시설 배정 24개 전체 완료\n\n'+'\n'.join('- `'+e['id']+'` — '+notes[e['id']] for e in brief['entries'])+'\n\n55개 원래 대사·선택 단계(기본/실제 외형 각각 55컷), 24개씩 휴대폰 컷 및 실제 모음 썸네일 시각 확인. 얼굴·머리·몸통·짧은 손과 팔·발 가림, 실제 아이와 전시 작품, 기존 대사·선택·게임 저장/앨범 보존 및 게임 프레임 사진 보호 관련 검사 2,888개 통과. 전체 콘텐츠 사전 검사·TypeScript·Vite 빌드 통과. 브라우저에서 동의 뒤 문턱을 넘은 대사에만 실내 전환, 휴대폰 두 창문/카드 판 안내, 모음 24개와 새로고침 콘솔 오류 없음 확인. 다른 작업의 변경과 완료 기록 보존. 현재 전체 512개 연결/164개 미제작. 다음 이웃 마을·여행 2개 전체. 모음 http://localhost:5173/assets/events/index.html?background=library-new\n';p.write_text(t,encoding='utf-8')
brief.update(status='24개 전체 구현·시각 확인·검사·빌드 완료',verification='55개 원래 대사/선택 단계 기본·실제 외형; 24개씩 휴대폰 컷; 관련 검사 2888개, prebuild, TypeScript, Vite build 통과',inventory={'drawn':512,'pending':164},next='이웃 마을·여행 미제작 2개 전체')
briefp.write_text(json.dumps(brief,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'drawn':512,'pending':164,'batch':len(ids),'remaining':[(g['id'],g['pending']) for g in d['groups'] if g['pending']]},ensure_ascii=False))
