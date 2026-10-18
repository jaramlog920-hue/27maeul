from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
eid='ev:child:story:2'
inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'))
drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')}
assert len(drawn)==521 and eid in drawn
summary='목공방 잔여 1개 낮은 전시 칸(ev:child:story:2)까지 완료. 기존 공방 배경, 실제 목수 아서·윌로와 기록자, 넓은 돌 칸·얕은 잎 칸의 낮은 상자, 별도 낮은 그림판을 사용한다. 셋째 대사부터 아이가 종이에 두 칸을 그리며, 받침을 함께 잡는 선택은 기존 손 위치에 받침을 맞추고 손·팔을 새로 늘리지 않는다. 지켜보는 선택은 종이의 첫 칸을 넓히고, 두 칸이면 된다는 답변은 칸을 추가하지 않는다. 원래 3대사·3선택의 6단계를 기본/실제 사용자 외형으로 시각 확인하고 가로·휴대폰·썸네일 확인. 기존 19개를 포함한 관련 검사 2,496개, 사전 검사·TypeScript·전체 빌드 통과. 게임·미리보기·썸네일은 같은 렌더러이며 기존 선택·hold 놀이·보상·시간·관계·저장·앨범 처리는 보존. 실제 전체 521개 연결/155개 미제작. 다음 기름 작업장 추가 4개 전체→광장 추가 4개 전체→서고·배움터 추가 7개 전체→현재 위치 140개. 모음 http://localhost:5173/assets/events/index.html?background=wood-new'
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'))
for g in d['groups']:
 for e in g['entries']:
  if e['id']==eid:e.update(status='완료',needsLocationCheck=False,renderer='drawWoodEvent',basis='실제 7,24 공방. 목수·윌로의 낮은 상자/종이에 두 칸 그리기/받침 잡기·칸 넓히기 3선택 원문과 시각 검증 완료.')
 g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=len(g['entries'])-g['completed']
d.update(drawn=521,pending=155,note='목공방 잔여 1개까지 전체 완료. 다음 기름 작업장 4→광장 4→서고·배움터 7→현재 위치 확인 대기 140개. 같은 배경 전체 묶음으로 진행.')
assert sum(g['pending'] for g in d['groups'])==155
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id']==eid:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=521,pending=155,counts={t:sum(e['tier']==t and e['id'] not in drawn for e in d['entries']) for t in ['dialogue','illustration','event']});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 520개, 미제작 156개.','현재 실제 연결 521개, 미제작 155개.',1);p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 520개, 남은 156개.','실제 그림 연결 521개, 남은 155개.',1).replace('| 목공방·목수 집 앞 | 1 |','| 목공방·목수 집 앞 | 0 |',1);s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 409','## 완료 410',1);s+='\n\n## 2026-10-15 목공방 잔여 전체 완료\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
original=next(e for e in json.loads(Path('artifacts/scenery/current-production-brief.json').read_text(encoding='utf-8'))['entries'] if e['id']==eid)
Path('artifacts/scenery/wood-addition-brief.json').write_text(json.dumps({'status':'제작·시각 확인·검사·빌드 완료','entries':[original],'verification':summary},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('521 connected / 155 pending; carpenter remainder complete.')
