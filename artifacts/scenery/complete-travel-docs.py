from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
ids=['growth:travel:full','trip:hillTown'];inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'));drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')};assert len(drawn)==514
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'))
for g in d['groups']:
 for e in g['entries']:
  if e['id'] in ids:e.update(status='완료',needsLocationCheck=False,renderer='drawTravelEvent',basis='원래 여행 해금 안내와 언덕 마을 도착/찻잎 말리던 여자아이/꽃잎 전달 3단계를 대조. 기존 강가 쉼터·가족 여행 마을 배경 공유. 동생은 별도 기존 NPC가 없어 찻집 웬델(poppy)의 실제 피부·머리색을 물려받은 기본 여자아이 도트 사용.')
 g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=len(g['entries'])-g['completed']
d.update(drawn=514,pending=162,note='514개 연결/162개 미제작. 여행 배정 2개 전체 완료. 다음 실제 위치 확인 대기 160개와 남아 있는 빵집/찻집 각 1개를 실제 원문·장소·다른 대화 기록에 맞춰 공유 배경별로 묶어 진행한다. 임의 2~5개 제한 없음.')
assert sum(g['pending'] for g in d['groups'])==162;p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=514,pending=162,counts={tier:sum(e['tier']==tier and e['id'] not in drawn for e in d['entries']) for tier in ['dialogue','illustration','event']});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 512개, 미제작 164개.','현재 실제 연결 514개, 미제작 162개.',1);p.write_text(s,encoding='utf-8')
summary='여행 배정 2개 전체 완료. 여행 해금 안내는 기존 나루 배경에서 여행 길 그림으로 표시하며 아직 배를 타지 않는다. 언덕 너머 마을은 두 언덕·붉은 지붕·돌길·찻잎 말리는 자리, 둘째 대사에서 달려오는 웬델의 동생, 셋째 대사에서 내미는 말린 꽃잎을 구현했다. 찻집 웬델(poppy)의 실제 피부·머리색을 기준으로 기본 여자아이 비율을 적용하고 오빠를 그 마을에 추가하지 않았다. 꽃잎은 기존 dryFlowers 도트이며 짧은 손 안에서 얼굴·몸통을 가리지 않는다. 원래 4개 대사와 달려오기 시작/중간/끝을 기본/실제 사용자 외형으로 각 13컷, 휴대폰/썸네일에서 확인. 관련 검사 1,700개 및 전체 사전 검사·TypeScript·Vite 빌드 통과. 여행 비용·보상·호감도·진행·원래 대사 유지. 미리보기 저장/앨범 보호, 기존 사진 보존 및 새 사진의 꽃잎 전달 컷 확인. 현재 전체 514개 연결/162개 미제작. 다음 위치 확인 대기 160개와 빵집/찻집 잔여 각 1개를 실제 배경별로 묶는다. 모음 http://localhost:5173/assets/events/index.html?background=travel-new'
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 512개, 남은 164개.','실제 그림 연결 514개, 남은 162개.',1).replace('| 이웃 마을·여행 | 2 |','| 이웃 마을·여행 | 0 |',1);s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 401','## 완료 403',1);s+='\n\n## 2026-10-15 여행 배정 2개 전체 완료\n\n- `growth:travel:full` — 이웃 마을로 떠나는 길: 마흔 장 뒤의 해금 안내. 기존 강가 배경과 길 그림, 실제 여행 출발 전.\n- `trip:hillTown` — 언덕 너머 마을: 도착→찻잎 말리던 동생이 달려옴→말린 꽃잎 전달의 원래 3대사. 가족 외형·짧은 팔과 아이 비율을 유지. 기존 앨범 그림은 보존하고 새 사진은 전달 컷을 사용.\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('artifacts/scenery/travel-production-brief.json');d=json.loads(p.read_text(encoding='utf-8'));d.update(status='2개 전체 제작·시각 확인·검사·빌드 완료',verification='원래 4대사+걷기 시작/중간/끝 포함 13컷씩 기본/실제 외형, 휴대폰/썸네일, 1700 tests, prebuild/tsc/vite build 통과',inventory={'drawn':514,'pending':162});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('514 connected / 162 pending; travel batch 2 complete.')
