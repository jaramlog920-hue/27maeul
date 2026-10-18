from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
ids=['ev:romance:merchant:lateReturn','ev:romance:merchant:noSale','ev:romance:postman:noParcel','ev:romance:postman:ownMessage']
inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'));drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')}
assert len(drawn)==529 and set(ids)<=drawn
summary='광장 추가 배정 4개 전체 완료. 밀린 귀가는 낮 장터의 귀가 일정표와 원래 선택에 맞춘 저녁 약속/귀가 날 표기이며 미래 찻집 만남은 미리 그리지 않는다. 오늘은 파는 물건이 없어는 장 마감 빛·접힌 천·원래 첫 서술에서 이미 덮은 공책, 세 선택 모두 지금 광장에서 길 이야기를 나누며 과거 다리 일출을 현재 장소로 바꾸지 않는다. 오늘은 빈손이에요는 저녁 광장으로 다가오는 마일로, 끝까지 닫힌 가방과 빈손, 실제 전달물 없음. 직접 전할 말은 둘째 대사에서 낮게 든 개인 쪽지, 끝까지 듣기는 상대를 보며 말하기, 걸으며 듣기는 두 사람의 기본 걷기 자세·얼굴 방향으로 표시. 실제 상인 21,14 / 배달부 27,14와 시간 조건 대조. 원래 18단계와 걷기 시작·중간·끝 6컷을 기본/실제 사용자 외형 각각 24컷, 휴대폰 4컷씩·통합 미리보기·썸네일에서 확인. 얼굴·몸통·발 접지와 가림 포함 관련 검사 3,652개, 사전 검사·TypeScript·전체 빌드 통과. 게임·미리보기·썸네일 같은 렌더러, 원래 선택·보상·시간·호감도·해금과 미리보기 저장/앨범 보호 유지. 전체 529개 연결/147개 미제작. 다음 서고·배움터 추가 7개 전체→현재 위치 확인 대기 140개. 모음 http://localhost:5173/assets/events/index.html?background=square-new'
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'))
for g in d['groups']:
 for e in g['entries']:
  if e['id'] in ids:e.update(status='완료',needsLocationCheck=False,renderer='drawSquareEvent',basis='상인 21,14 / 배달부 27,14. 낮 일정표·장 마감 천과 닫힌 공책·저녁 빈손 인사·개인 쪽지와 함께 걷기 원문/모든 선택 검증.')
 g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=len(g['entries'])-g['completed']
d.update(drawn=529,pending=147,note='광장 잔여 4개 전체 완료. 다음 서고·배움터 7→현재 위치 확인 대기 140개. 같은 배경 전체 묶음으로 진행.')
assert sum(g['pending'] for g in d['groups'])==147
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=529,pending=147,counts={t:sum(e['tier']==t and e['id'] not in drawn for e in d['entries']) for t in ['dialogue','illustration','event']});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 525개, 미제작 151개.','현재 실제 연결 529개, 미제작 147개.',1);p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 525개, 남은 151개.','실제 그림 연결 529개, 남은 147개.',1).replace('| 광장·장터·우물 | 4 |','| 광장·장터·우물 | 0 |',1);s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 414','## 완료 418',1);s+='\n\n## 2026-10-15 광장 추가 4개 전체 완료\n\n'+'\n'.join('- `'+eid+'`' for eid in ids)+'\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
originals=[e for e in json.loads(Path('artifacts/scenery/current-production-brief.json').read_text(encoding='utf-8'))['entries'] if e['id'] in ids]
Path('artifacts/scenery/square-addition-brief.json').write_text(json.dumps({'status':'4개 전체 제작·시각 확인·검사·빌드 완료','entries':originals,'verification':summary},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('529 connected / 147 pending; square addition 4 complete.')
