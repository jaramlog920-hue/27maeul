# 꾸민 성경 다시 펼치기

96개 기존 표지 조합과 27권 기본 표지: 총 123세트, 64×48, 10프레임.

원본 표지 그림을 그대로 보여준 뒤 책등 왼쪽을 축으로 표지를 회전시켜 펼칩니다. 펼친 후에도 표지 테두리와 선택한 장식색의 책갈피가 남습니다. 본문은 추상적인 잉크 선이며 실제 성경 텍스트가 아닙니다.

manifest.json의 views.default 순서와 duration(ms)를 사용합니다. loop:false이며 마지막 펼친 책 상태를 유지합니다. 다시 보기 요청 시 0프레임부터 재생합니다.

기본 책등 금박은 grade:2로 내보냈습니다. 함수 bookReopenRows(book,frame,binding,grade,sealed)는 실제 보관한 책과 제본 값을 받아 다시 그릴 수 있습니다.

게임의 책장 클릭 및 성경 읽기 화면은 연결하지 않았습니다.

재생성: node scripts/export-book-reopen.mjs → node scripts/export-all-assets-preview.mjs
