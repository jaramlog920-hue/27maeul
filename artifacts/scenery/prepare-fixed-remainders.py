from pathlib import Path
import json
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
write=lambda p,d:Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
content=read('src/content/people.json');brief=read('artifacts/scenery/current-production-brief.json')
sightings={}
for thread in content['threads']:
 for phase in thread.get('phases',[]):
  for e in phase.get('sightings',[]):sightings['saw:'+e['id']]={**e,'thread':thread['id'],'phaseDay':phase['day']}
assign={'saw:boat:argue':('shore','원래 목격 조건 25,33 / 13:00–15:00. 코스모·루디의 뱃머리 논쟁과 마지막 대패 내려놓기·둥글고 조금 뾰족한 설계 그림. 기존 나루 배경 재사용.'),'saw:bread:swap':('square','원래 목격 조건 25,20 / 12:00–13:00과 장 마감 원문을 함께 보존. 모자를 눌러쓴 웬델·파피가 빵/과자를 서로 사고 마지막에 광장 양 끝에서 먹음. 기존 광장 배경 재사용.'),'trip:harbor':('travel','원래 여행 도착 장면에 항구·돛대·갈매기·좌판, 골목 빵집 주인과 싸 주는 빵이 명시되어 있음. 여행 비용·보상·앨범 보존 필요.')}
d=read('docs/event-art-background-groups.json');groups={g['id']:g for g in d['groups']};entries=[]
for eid,(target,basis) in assign.items():
 e=next(e for e in groups['current']['entries'] if e['id']==eid);groups['current']['entries'].remove(e);e.update(group=target,basis=basis,needsLocationCheck=False);groups[target]['entries'].append(e)
 original=next(e for e in brief['entries'] if e['id']==eid);entries.append({**original,'confirmedGroup':target,'sighting':sightings.get(eid),'verificationStatus':'원문·발생 장소 대조 완료, 렌더러 미제작'})
for g in d['groups']:g['count']=len(g['entries']);g['pending']=sum(e['status']!='완료' for e in g['entries'])
assert sum(g['pending'] for g in d['groups'])==138
d['note']='538개 연결/138개 미제작 유지. 실제 목격 조건을 대조해 나루 1→광장 1→항구 여행 1을 전체 배경 묶음으로 재배정. 그 외 현재 위치 확인 대기 135개. 제작 완료 처리 아님.'
write('docs/event-art-background-groups.json',d);write('artifacts/scenery/fixed-remainders-brief.json',{'status':'원문·장소 대조, 구현 전','entries':entries,'unresolvedForge':sightings.get('saw:forge:handle')})
p=Path('docs/event-art-production-plan.md');s=p.read_text(encoding='utf-8')
for name,old,new in [('나루·호숫가',0,1),('광장·장터·우물',0,1),('이웃 마을·여행',0,1),('현재 위치·장소 확인 대기',138,135)]:s=s.replace(f'| {name} | {old} |',f'| {name} | {new} |',1)
s+='\n\n2026-10-15 발생 경로 추가 대조: 나루의 말다툼(saw:boat:argue, 25,33) → 장터의 비밀(saw:bread:swap, 25,20) → 바닷가 항구 마을(trip:harbor) 순으로 기존 배경 묶음을 이어간다. 나루·광장 각각 해당 잔여 전체 1개, 항구 여행 잔여 전체 1개이며 임의 소수 제한이 아니다. 그 외 현재 위치 대기 135개. 원래 목격 시간과 원문 표현이 다른 부분도 원본을 변경하지 않는다. 새벽의 망치 자루는 발생 좌표 22,125와 틸리 방 창문 원문이 함께 있어 실제 지도를 더 확인한 뒤 배경을 정한다. 새 완료 없음: 538개 연결/138개 미제작 유지.\n';p.write_text(s,encoding='utf-8')
