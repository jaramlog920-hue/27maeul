# 생활 가구 도트 10종

기존 HOME_SPACE_ART의 16픽셀 단위·FURNI_PALETTE·바닥 정렬에 맞춰 정수 좌표로 직접 제작.

미리보기는 왼쪽에서 오른쪽, 위에서 아래 순서:

1. 재봉 탁자 — sewingTable.png (32×16px)
2. 실패 꽂이 — spoolStand.png (16×16px)
3. 물동이 받침 — waterJarStand.png (16×16px)
4. 반죽 작업대 — kneadingTable.png (32×16px)
5. 채소 보관함 — vegetableCrate.png (16×16px)
6. 낮은 찻상 — lowTeaTable.png (32×16px)
7. 이불장 — linenCupboard.png (32×16px)
8. 수건 걸이 — towelRack.png (16×16px)
9. 화분 진열대 — plantSteps.png (32×16px)
10. 장화 받침 — bootStand.png (16×16px)

개별 PNG와 atlas는 투명 원본. preview-8x.png는 최근접 이웃 확대. comparison-8x.png는 첫 줄에 기존 가구 5종, 아래 두 줄에 새 가구 10종.

현재 앞모습 도트 자산이며 게임 아이템 지급·구매·배치에는 연결하지 않음.

원본: src/render/household-furniture-art.ts

재생성: node scripts/export-household-furniture.mjs
