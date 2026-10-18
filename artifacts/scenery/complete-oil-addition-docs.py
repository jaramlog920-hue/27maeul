from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
ids=['ev:romance:presser:'+x for x in ['askFirst','invitation','untimedTea','imperfectHouse']]
inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'))
drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')}
assert len(drawn)==525 and set(ids)<=drawn
summary='기름 작업장 추가 배정 4개 전체 완료. 물어보고 짜는 하루는 내일 일정의 두 칸과 원래 선택에 맞춘 자기 칸 비우기/하나만 수정. 손님 말고 당신은 빈 손님 의자 곁에서 오늘 저녁을 상의하며 미래 정자·찻집 이동이나 약속한 의자를 미리 추가하지 않는다. 시간을 재지 않은 차는 기존 작업장 배경·비어 있는 휴식 칸 시간표·의자 곁 상자 위 두 잔, 마시는 선택에서 기존 짧은 손에 닿는 두 잔과 식은 차, 다른 선택에서 출입구 너머 올리브 잎의 고정 크기 색 변화. 조금 덜 반듯한 집은 바닥의 반으로 나눈 집 그림·물건 자리의 돌 네 개, 창가 표시/정돈 방향/기존 돌 자리 이동을 각 선택에 반영. 실제 22,125 발생 장소와 기본 올리버 및 실제 사용자 외형을 유지했다. 원래 대사·선택 19단계를 기본/실제 외형 각각 19컷, 휴대폰 4컷씩과 통합 미리보기·썸네일 확인. 얼굴·몸통 가림 검사와 기존 11개 장면 포함 관련 검사 2,167개, 사전 검사·TypeScript·전체 빌드 통과. 선택·보상·시간·호감도·해금과 미리보기 저장/앨범 보호 유지. 전체 525개 연결/151개 미제작. 다음 광장 추가 4개 전체→서고·배움터 추가 7개 전체→현재 위치 확인 대기 140개. 모음 http://localhost:5173/assets/events/index.html?background=oil-new'
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'))
for g in d['groups']:
 for e in g['entries']:
  if e['id'] in ids:e.update(status='완료',needsLocationCheck=False,renderer='drawOilEvent',basis='실제 작업장 좌표 22,125. 일정/손님 의자/시간표 빈 휴식 칸과 차/바닥 집 그림·돌 네 개의 원래 대사와 모든 선택을 대조·시각 검증.')
 g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=len(g['entries'])-g['completed']
d.update(drawn=525,pending=151,note='기름 작업장 잔여 4개 전체 완료. 다음 광장 4→서고·배움터 7→현재 위치 확인 대기 140개. 같은 배경 전체 묶음으로 진행.')
assert sum(g['pending'] for g in d['groups'])==151
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=525,pending=151,counts={t:sum(e['tier']==t and e['id'] not in drawn for e in d['entries']) for t in ['dialogue','illustration','event']});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 521개, 미제작 155개.','현재 실제 연결 525개, 미제작 151개.',1);p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 521개, 남은 155개.','실제 그림 연결 525개, 남은 151개.',1).replace('| 기름 작업장·올리브 그늘 | 4 |','| 기름 작업장·올리브 그늘 | 0 |',1);s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 410','## 완료 414',1);s+='\n\n## 2026-10-15 기름 작업장 추가 4개 전체 완료\n\n'+ '\n'.join('- `'+eid+'`' for eid in ids)+'\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
originals=[e for e in json.loads(Path('artifacts/scenery/current-production-brief.json').read_text(encoding='utf-8'))['entries'] if e['id'] in ids]
Path('artifacts/scenery/oil-addition-brief.json').write_text(json.dumps({'status':'4개 전체 제작·시각 확인·검사·빌드 완료','entries':originals,'verification':summary},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('525 connected / 151 pending; oil addition 4 complete.')
