# 먹기 모션

남녀 예시 × 빵·무화과·그릇·꿀 = 8세트, 각 4방향 6프레임. 인물 외형은 게임 주인공의 값을 사용합니다. 원본 24×24 PNG 및 분리 레이어.

순서: back → actor → front. actor는 인물 팔레트, 소품은 가구 팔레트. 재생 시간 합계 1900ms, loop:false. 기존 옷·목선을 보존하고 작은 손과 음식을 입 가까이 올립니다.

통합 미리보기: ../preview.html#pack=eating

재생성: node scripts/export-eating-art.mjs → node scripts/export-all-assets-preview.mjs
