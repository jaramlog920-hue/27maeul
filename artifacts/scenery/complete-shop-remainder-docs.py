from pathlib import Path
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
ids=['ev:tilly:bread','ev:penelope:teaOrder','ev:poppy:love:2','ev:poppy:sister','date:tea:0','date:tea:1']
inv=json.loads(Path('artifacts/scenery/event-art-inventory.json').read_text(encoding='utf-8'))
drawn={e['id'] for e in inv if e.get('kind') or e.get('authored')}
assert len(drawn)==520 and set(ids)<=drawn
assign={
 'carpenter':['ev:child:story:2'],
 'press':['ev:romance:presser:'+x for x in ['askFirst','invitation','untimedTea','imperfectHouse']],
 'square':['ev:romance:merchant:lateReturn','ev:romance:merchant:noSale','ev:romance:postman:noParcel','ev:romance:postman:ownMessage'],
 'library':['ev:child:small:pocketSort','ev:child:story:1','ev:romance:postman:otherDay','ev:romance:postman:lastDelivery','ev:child:story:3','ev:child:story:4','ev:child:small:labelTurn'],
 'tea':ids[2:]
}
basis={
 'carpenter':'실제 발생 좌표 7,24와 목공방의 낮은 전시 상자 원문 확인. 목수와 아이가 등장.',
 'press':'실제 발생 좌표 22,125의 기름 작업장과 원래 개인 이야기 대조.',
 'square':'실제 발생 좌표 상인 21,14 / 배달부 27,14의 광장 원문 대조.',
 'library':'실제 발생 좌표 서고 길 8,9 / 22,8 및 배움터 19,46과 원래 아이·배달부 이야기 대조.',
 'tea':'실제 찻집 앞 15,24 또는 실내 차 자리 원문 확인. 고향 방문·동생 방문 약속은 미래 계획으로 표현.'
}
p=Path('docs/event-art-background-groups.json');d=json.loads(p.read_text(encoding='utf-8'));groups={g['id']:g for g in d['groups']}
for target, moved in assign.items():
 for eid in moved:
  source=next(g for g in d['groups'] if any(e['id']==eid for e in g['entries']))
  e=next(e for e in source['entries'] if e['id']==eid)
  if source['id']!=target:
   source['entries'].remove(e);groups[target]['entries'].append(e)
  e.update(group=target,needsLocationCheck=False,basis=basis[target])
for g in d['groups']:
 for e in g['entries']:
  if e['id'] in ids:e.update(status='완료',renderer='drawShopRemainder',needsLocationCheck=False)
 g.update(count=len(g['entries']),completed=sum(e['id'] in drawn for e in g['entries']))
 g['pending']=g['count']-g['completed']
d.update(drawn=520,pending=156,note='빵집·찻집 잔여 및 실제 같은 장소 추가 6개 전체 완료. 원문 위치가 확인된 16개를 목공 1→기름 작업장 4→광장 4→서고·배움터 7로 재배정. 현재 위치 확인 대기 140개는 실제 발생 문맥을 확인하며 진행. 임의 소수 제한 없음.')
assert sum(g['pending'] for g in d['groups'])==156
assert groups['current']['pending']==140
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.json');d=json.loads(p.read_text(encoding='utf-8'))
for e in d['entries']:
 if e['id'] in ids:e.update(status='기존 그림 유지',owner='이 창')
d.update(existing=520,pending=156,counts={t:sum(e['tier']==t and e['id'] not in drawn for e in d['entries']) for t in ['dialogue','illustration','event']})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('docs/event-art-selection.md');s=p.read_text(encoding='utf-8').replace('현재 실제 연결 514개, 미제작 162개.','현재 실제 연결 520개, 미제작 156개.',1);p.write_text(s,encoding='utf-8')
summary='빵집·찻집 잔여 및 원문으로 확인한 같은 장소 6개 전체 완료. 마지막 올리브 빵은 원래 마지막 나눔 대사에서만 두 조각으로 나뉘고, 어깨를 두드리는 선택은 짧은 기본 팔을 쓴다. 세 번째 주문은 망설임 뒤 꽃차 두 잔을 실제 답변 시점에 놓는다. 고향 길·답장은 지도와 편지로 미래 방문 계획을 표시한다. 찻집의 오후·두 잔의 차는 실제 데이트 상대 13명을 반영하고 과자는 원래 대사에서만 나눈다. 원래 32개 대사·선택 단계를 기본/실제 사용자 외형 각각 32컷, 가로·휴대폰·썸네일에서 확인. 얼굴·몸통·짧은 손·발 가림 검사 포함 관련 검사 2,385개와 사전 검사·TypeScript·전체 Vite 빌드 통과. 미리보기 저장·앨범 보호와 원래 대사·선택·보상·시간·호감도·해금 조건 유지. 전체 520개 연결/156개 미제작. 다음 목공 추가 1개→기름 작업장 추가 4개→광장 추가 4개→서고·배움터 추가 7개→위치 확인 대기 140개. 모음 http://localhost:5173/assets/events/index.html?background=shop-remainder'
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8').replace('실제 그림 연결 514개, 남은 162개.','실제 그림 연결 520개, 남은 156개.',1)
for name,count in [('빵집·화덕·빵 좌판',0),('찻집·차 자리',0),('목공방·목수 집 앞',1),('기름 작업장·올리브 그늘',4),('광장·장터·우물',4),('서고·필사 책상·시설',7),('현재 위치·장소 확인 대기',140)]:
 import re
 s=re.sub(r'\| '+re.escape(name)+r' \| \d+ \|','| '+name+' | '+str(count)+' |',s,count=1)
s+='\n\n2026-10-15 '+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('docs/event-art-progress.md');s=p.read_text(encoding='utf-8').replace('## 완료 403','## 완료 409',1);s+='\n\n## 2026-10-15 빵집·찻집 추가 6개 전체 완료\n\n'+ '\n'.join('- `'+eid+'`' for eid in ids)+'\n\n'+summary+'\n';p.write_text(s,encoding='utf-8')
p=Path('artifacts/scenery/shop-remainder-brief.json');d=json.loads(p.read_text(encoding='utf-8'));current=json.loads(Path('artifacts/scenery/current-production-brief.json').read_text(encoding='utf-8'))
d['entries'] += [e for e in current['entries'] if e['id'] in ids and e['id'] not in {x['id'] for x in d['entries']}]
d.update(status='6개 전체 제작·시각 확인·검사·빌드 완료',verification=summary,inventory={'drawn':520,'pending':156});p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('520 connected / 156 pending; shop remainder 6 complete; next fixed-location 16 regrouped.')
