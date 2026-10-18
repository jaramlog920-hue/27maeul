from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
ids=['ev:child:small:pocketSort','ev:child:story:1','ev:child:story:3','ev:child:story:4','ev:child:small:labelTurn','ev:romance:postman:otherDay','ev:romance:postman:lastDelivery']
drawn={e['id'] for e in json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8')) if e.get('kind') or e.get('authored')}
assert len(drawn)==536 and set(ids)<=drawn
summary='서고 길·배움터 추가 7개 전체 완료. 주머니 두 칸/주운 것 펼치기는 실제 8,9의 서고 길, 젖은 잎과 마른 돌 분리·펼친 천·둘째 대사에서 돌과 잎 내려놓기·선택에 따른 돌 줄무늬 회전. 아직 없는 주머니는 미리 만들지 않는다. 내가 쓴 표지/작은 전시 자리/표지 돌려 놓기는 실제 19,46 배움터의 기존 방 배경·칠판·낮은 두 칸 상자·줄무늬 돌·잎과 직접 쓴 표지를 사용하며, 대사에 맞춰 표지 옆으로 옮기기·두 번째 표지 세우기·짧은 손 박수·뒷면 표지 바로 놓기를 구현했다. 전시물은 가로 대화창 위에서도 보이게 배치하고 표지는 상자에 접지했다. 다른 날짜를 말하는 연습/마지막 배달 뒤의 귀가는 실제 22,8 서고 길에서 수첩의 약속 줄·귀가 시각을 표시한다. 내일 빵·저녁·마중 약속을 현재 수행하지 않는다. 원래 29개 대사·선택 단계를 기본/실제 사용자 외형 각각 29컷, 휴대폰 7컷씩·게임과 같은 미리보기·썸네일에서 확인. 얼굴·몸통·발 접지 검사 포함 관련 검사 3,683개 및 사전 검사·TypeScript·전체 빌드 통과. 원래 선택·보상·시간·호감도·해금·전시 이야기 완료 조건과 미리보기 저장/앨범 보호 유지. 실제 전체 536개 연결/140개 미제작. 남은 140개는 현재 위치·발생 문맥을 확인하여 같은 배경별로 묶어 진행한다. 모음 http://localhost:5173/assets/events/index.html?background=library-new'
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'))
for g in d['groups']:
 for e in g['entries']:
  if e['id'] in ids:e.update(status='완료',needsLocationCheck=False,renderer='drawLibraryEvent',basis='실제 서고 길 8,9 / 22,8 및 배움터 19,46. 원래 잎·돌·천·전시 상자·표지와 약속 수첩, 모든 대사·선택 시각 확인 완료.')
 g['completed']=sum(e['id'] in drawn for e in g['entries']);g['pending']=len(g['entries'])-g['completed']
d.update(drawn=536,pending=140,note='서고·배움터 잔여 7개 전체 완료. 현재 위치 확인 대기 140개는 실제 발생 문맥을 확인하여 같은 배경 전체 묶음으로 진행.')
assert sum(g['pending'] for g in d['groups'])==140
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=536,pending=140,counts={t:sum(e['tier']==t and e['id'] not in drawn for e in d['entries']) for t in ['dialogue','illustration','event']});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 529개, 미제작 147개.','현재 실제 연결 536개, 미제작 140개.',1);p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 529개, 남은 147개.','실제 그림 연결 536개, 남은 140개.',1).replace('| 서고·필사 책상·시설 | 7 |','| 서고·필사 책상·시설 | 0 |',1);s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 418','## 완료 425',1);s+='\n\n## 2026-10-15 서고·배움터 추가 7개 전체 완료\n\n'+'\n'.join('- `'+eid+'`' for eid in ids)+'\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
originals=[e for e in json.loads(Path('artifacts/scenery/current-production-brief.json').read_text(encoding='utf-8'))['entries'] if e['id'] in ids]
Path('artifacts/scenery/library-addition-brief.json').write_text(json.dumps({'status':'7개 전체 제작·시각 확인·검사·빌드 완료','entries':originals,'verification':summary},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('536 connected / 140 pending; library addition 7 complete.')
