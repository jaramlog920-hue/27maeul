from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
ids=['teaFirst','date:tea:2'];drawn={e['id'] for e in json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8')) if e.get('kind') or e.get('authored')};assert len(drawn)==538 and set(ids)<=drawn
summary='현재 위치 대기 140개의 실제 원문·발생 코드를 재대조하여 찻집에 고정된 마지막 2개 정원 찻집(teaFirst)·어릴 적 이야기(date:tea:2)를 같은 배경 묶음으로 완료. 첫 방문은 기존 창가·말린 꽃 소품·기본 앉은 자세의 기록자 한 사람과 차 한 잔, 둘째 대사에서 짧은 손에 잔을 옮긴다. 어릴 적 이야기는 실제 나들이 상대 13명의 외형과 두 찻잔, 둘째 대사의 달그락거림을 고정 크기의 1픽셀 동작으로 반영. 기존 두 나들이와 같은 상대 해결 함수를 사용한다. 과거 이야기를 현재 어린 시절 회상 배경으로 바꾸거나 다른 NPC를 추가하지 않았다. 원래 4대사 기본/실제 사용자 외형 각각 4컷과 휴대폰·통합 미리보기·썸네일 확인. 관련 검사 2,546개와 사전 검사·TypeScript·전체 빌드 통과. 기존 첫 차 비용 2닢/피로·배부름/한 번 발생, 데이트 보상·시간·호감도·해금, 미리보기 저장·앨범 보호 유지. 실제 538개 연결/138개 미제작. 나머지 현재 위치·발생 문맥 확인을 계속하며 같은 배경끼리 전체 묶음으로 제작한다. 모음 http://localhost:5173/assets/events/index.html?background=shop-remainder'
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'));current=next(g for g in d['groups'] if g['id']=='current');tea=next(g for g in d['groups'] if g['id']=='tea')
for eid in ids:
 e=next(e for e in current['entries'] if e['id']==eid);current['entries'].remove(e);e.update(group='tea',status='완료',needsLocationCheck=False,renderer='drawShopRemainder',basis='실제 drinkTea 첫 방문 / 찻집 나들이 세 번째 이야기 발생 경로와 원래 2대사 대조. 기존 찻집 배경·실제 상대 외형 검증.');tea['entries'].append(e)
for g in d['groups']:
 g['count']=len(g['entries']);g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=g['count']-g['completed']
d.update(drawn=538,pending=138,note='찻집 고정 잔여 2개 전체 완료. 현재 위치·발생 문맥 확인 대기 138개를 같은 배경 전체 묶음으로 진행.');assert sum(g['pending'] for g in d['groups'])==138;p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=538,pending=138,counts={t:sum(e['tier']==t and e['id'] not in drawn for e in d['entries']) for t in ['dialogue','illustration','event']});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 536개, 미제작 140개.','현재 실제 연결 538개, 미제작 138개.',1);p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 536개, 남은 140개.','실제 그림 연결 538개, 남은 138개.',1).replace('| 현재 위치·장소 확인 대기 | 140 |','| 현재 위치·장소 확인 대기 | 138 |',1);s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 425','## 완료 427',1);s+='\n\n## 2026-10-15 실제 찻집 고정 잔여 2개 전체 완료\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
originals=[e for e in json.loads(Path('artifacts/scenery/current-production-brief.json').read_text(encoding='utf-8'))['entries'] if e['id'] in ids];Path('artifacts/scenery/tea-final-brief.json').write_text(json.dumps({'status':'2개 전체 제작·시각 확인·검사·빌드 완료','entries':originals,'verification':summary},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('538 connected / 138 pending; fixed tea batch complete.')
