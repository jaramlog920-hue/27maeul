# 비 표현과 어부 집 수정 — 2026-10-17

사용자가 지적한 postman:small:rainCover의 비는 하늘 위쪽의 고정 높이에서 옆으로만 움직이고 있었다. 다른 사건을 대조해 청혼13종(개별8종·공용4종·우편 배경1종), 장날 광장, 빵집 편지, 약초 산길 및 공유 장소 배경에서도 같은 높이 제한/정지 비를 확인했다.

- event-precipitation.ts의 시간 기반 낙하를 공통 사용한다. 비는 전체 화면 아래까지 비스듬히 떨어지고 눈은 느리게 내린다. 인물을 그리기 전에 날씨를 그려 머리·얼굴·몸통·손·발을 가리지 않는다.
- 우편 배경의 젖은 길과 작은 물웅덩이를 조정했다. 비가 없는 날과 실내에는 야외 강수를 추가하지 않는다.
- 사랑방·포도밭 실내의 창밖 비는 실제 유리 영역으로 잘라 창틀/십자틀/실내 벽에 새지 않는다. 광장의 공유 배경에서는 강수를 이중으로 그리지 않는다.
- 어부 이야기1·4와 movedIn:fisher에는 실제 마을 집 대신 professionBuildingArt의 새 터 어업 작업장이 연결돼 있었다. 실제 HOUSES 어부 집의 houseWallTile/drawRoof를 재사용하며 원래 청록 기와, 둥근 창, 문, 굴뚝과 칸 수를 유지한다. 인물과 동일한 원본2배 크기다. 게임 지도·집 위치·인물·원문·선택·보상은 변경하지 않는다.

검증: 10개 파일6,125개 통과(event-weather-house-tests.log), 해변 전 대사/선택/인물 가림 추가1개 파일1,480개 통과(event-weather-house-shore-tests.log). 전체 npm run build 통과(event-weather-house-build.log). 기존 대형 청크 경고는 성공 결과와 구분한다.

로컬 PNG로 청혼13종, 우편/빵집/약초/사랑방/포도밭/광장의 두 시점, 휴대폰·썸네일, 어부 이야기/이사 장면의 기본·실제 외형을 확인했다. 원본/해시는 artifacts/scenery/event-weather-house-review.json에 기록했다. 브라우저 접근은 재시도하지 않았고 실제 브라우저 검증 완료로 기록하지 않는다. 전 이벤트의 모든 실제 UI 검증이 완료됐다는 뜻도 아니다.

비교 모음: http://localhost:5184/artifacts/scenery/event-weather-house-review.html
