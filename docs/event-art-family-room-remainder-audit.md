# 가족 방 배경 잔여 전체 검증

가족 방 배경의 잔여 전체2개(sick·dinner:child)를 함께 완료. 같은 기존 창·시렁·마루를 재사용하되 병상은 FIXTURES.homeBed 원본 침대와 얼굴 위로 누운 공용 furnitureUseFrame, baker의 방문·침대 옆 별도 수프 자리로 구성했다. 아이네 저녁은 ROOMS.child의 침대 둘·궤짝·화덕·배움 탁자와 원래 물 긷는 아이 child의 글자 종이·약속 인사로 구성했다. 유저 자녀나 확인되지 않은 부모를 임의로 추가하지 않았다. 실제 사용자·NPC·다음 세대 외형과 짧은 팔·발을 유지하고 소품이 얼굴·몸·손·발을 가리지 않는다. 원문5행 전체와 동작0/.35/.7/1.2/8초, 기본/실제 외형, 가로·세로·휴대폰·썸네일을 확인했다. 게임/미리보기/썸네일은 동일 drawFamilyRoomRemainder를 사용하고 미리보기 저장·앨범 불변. 원래10시 기상·needs 회복, 저녁18시–20시30분 초대 조건·90분·배고픔60감소·우호도·그날 식사 조건은 엔진을 수정하지 않아 보존된다. 실제 ModalLayer 전 대사 및 미리보기/썸네일/모음, 몸 전체 가림 검사와 기존 게임·초대 회귀를 포함한6파일2,041검사 및 사전검사·TypeScript·Vite/PWA 전체 빌드 통과. 실제554개 연결/122개 미제작. 다음은 계획표의 빵집 저녁 배경 잔여 전체 묶음(dinner:baker).

React 검토: hooks를 모든 분기 앞에 유지, 기존 RAF cleanup 및 원문 대화 UI 사용, 별도 상태 쓰기·저장·앨범 생성 추가 없음. 다른 대화의 가구 자율행동·지도·보상 수정과 완료6개 기록을 재대조하고 보존했다.

검증 로그: artifacts/scenery/family-room-final-tests.log / family-room-final-build.log. 이미지: family-room-*-phases/mobile/thumbnail.png, family-room-mobile-overview.png.

자동화 설정 조회는 이번에도 도구의 승인 필수/never 정책으로 거부되어 중지·10분 프롬프트 변경을 완료하지 못했다. 기존 자동 메시지보다 최신 사용자 지시와 이 계획이 우선한다.

모음: http://localhost:5173/assets/events/index.html?background=family-room-new
