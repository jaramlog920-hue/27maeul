# 생활 가구 도트 8종

기존 HOME_SPACE_ART와 같은 16픽셀 단위, FURNI_PALETTE, 정수 좌표로 직접 제작. 생성 이미지 사용 없음.

미리보기 순서: 흔들의자 / 세면대 / 찻잔 수레 / 꽃무늬 병풍 / 약초 건조대 / 빵 보관장 / 전신거울 / 작은 인형집. comparison-8x.png의 첫 줄은 기존 가구, 나머지 두 줄은 새 가구.

개별 PNG와 atlas는 투명 배경 원본. 확대 미리보기는 nearest-neighbor 8배. 병풍과 건조대는 32×16px, 나머지는 16×16px. 현재 앞모습 자산이며 게임 아이템 지급·구매·배치에는 연결하지 않음.

재생성: node scripts/export-cozy-furniture.mjs
