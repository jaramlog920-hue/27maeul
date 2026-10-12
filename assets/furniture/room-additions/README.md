# 생활 가구 30종과 크기 점검

직접 찍은 정수 픽셀 도트. 기존 FURNI_PALETTE와 16px 기준을 유지합니다.

1. 창가 벤치 — windowBench.png (32×16px)
2. 둥근 안락의자 — armchair.png (16×16px)
3. 발 받침 — footstool.png (16×16px)
4. 모서리 선반 — cornerShelf.png (16×16px)
5. 담요 사다리 — blanketLadder.png (16×16px)
6. 긴 서랍장 — longDresser.png (32×16px)
7. 옷장 — wardrobe.png (32×16px)
8. 옷걸이 기둥 — coatTree.png (16×16px)
9. 화장대 — vanity.png (32×16px)
10. 보석함 — jewelryBox.png (16×16px)
11. 향신료 선반 — spiceShelf.png (32×16px)
12. 그릇꽂이 — plateRack.png (16×16px)
13. 냄비 걸이 — potHanger.png (32×16px)
14. 맷돌 받침 — millstoneStand.png (16×16px)
15. 절임 항아리대 — pickleStand.png (32×16px)
16. 빵 식힘 선반 — breadCoolingRack.png (32×16px)
17. 과일 진열대 — fruitDisplay.png (32×16px)
18. 설거지 작업대 — dishwashingTable.png (32×16px)
19. 작은 바느질함 — sewingBox.png (16×16px)
20. 천 보관 선반 — fabricShelf.png (32×16px)
21. 그림 작업대 — drawingDesk.png (32×16px)
22. 종이 건조대 — paperDryingRack.png (32×16px)
23. 지도 탁자 — mapTable.png (32×16px)
24. 편지 분류장 — letterSorter.png (32×16px)
25. 악보 받침 — musicStand.png (16×16px)
26. 작은 하프 — smallHarp.png (16×16px)
27. 인형 침대 — dollBed.png (16×16px)
28. 장난감 수레 — toyCart.png (16×16px)
29. 우산꽂이 — umbrellaStand.png (16×16px)
30. 씨앗 정리장 — seedCabinet.png (32×16px)

## 크기 점검

기존 게임 원본 39종, 앞서 만든 18종, 새 30종을 확인했습니다. 이전 실패 꽂이는 실루엣 14×12px에서 10×9px로 축소했습니다. 다른 이전 도트는 기존 가구 비율과 맞아 유지했습니다.

의자·1칸 장은 16×16px, 넓은 탁자·선반은 32×16px. 보석함·바느질함 같은 소품은 16px 캔버스 내부에서 작은 실루엣으로 그립니다. 모든 도트와 인물을 같은 최근접 이웃 배율로 표시합니다. 앞으로 키 큰 가구를 추가하면 그림 높이와 실제 배치 칸을 별도로 정의해야 합니다.

preview.html: 이름·크기와 48종 전체 보기. size-review-4x.png: 첫 두 줄 기존 가구 12종, 이후 이전 18종과 새 30종; 각 가구 옆 실제 캐릭터. preview-6x.png: 새 30종. atlas.png 및 개별 PNG: 투명 원본. size-audit.json: 전체 실루엣·크기·검사 결과.

이전 고해상도 home-space-furniture-v1.png는 참고용 이미지이며 16px 게임 자산과 구분합니다. 이 파일을 게임에 그대로 표시하면 크기가 맞지 않습니다.

상태: 앞모습 도트 자산, 게임 지급·구매·배치 연결 전. 검증 범위는 원본 도트·PNG와 같은 배율의 미리보기이며 실제 배치 동선과 화면 배율은 게임 연결 후 확인합니다.

재생성 순서: node scripts/export-cozy-furniture.mjs, node scripts/export-household-furniture.mjs, node scripts/export-room-furniture.mjs
