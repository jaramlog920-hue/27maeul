# Vercel 빌드 실패 수정 — 2026-10-17

사용자가 전달한 실패 배포: `27maeul-gs3w6x89i-qhrdma.vercel.app`.
Vercel 연결 API는 팀 권한 403이었으나 사용자 로그인 후 CLI의 동일 팀/프로젝트 조회는 성공했다.

## 실제 실패
서버 로그의 TypeScript 오류: `src/content/text.ts`의 `Record<AdditionUse,string>`에 새 동작 `copyFurniture` 설명이 누락되었다. 로그인이나 요금 문제는 아니었다.

현재 로컬 소스에서는 추가로 아이 외형의 선택 필드를 완전한 외형으로 전달하지 않은 타입 오류와, 확장한 통합 가구 그림 목록의 문자열 인덱스 타입 오류도 확인했다.

## 최소 수정
- 새 가구 동작의 공통 설명을 등록했다. 개별 가구 설명은 그대로 우선한다.
- 아이 외형은 기존 `withLookDefaults`로 빠진 필드만 채워 그림/팔레트에 전달한다. 이미 정한 외형 값은 보존한다.
- 모든 기존 및 새 가구 그림을 합친 `ADDITION_ART`에 기존 자료 구조에 맞는 `Record<string,FurnitureArt>` 타입을 명시했다. 기존 그림과 추가 그림 모두 유지한다.

## 확인
- `npm run build` 전체 (prebuild 콘텐츠 검사, TypeScript, Vite, PWA) 통과.
- 관련 검사 21개 통과. 네 방향에서 옛 저장의 최소 아이 외형이 기본값을 채운 외형과 같은 그림·팔레트를 만드는지 확인했다.
- 배포 대상은 CLI project inspect에서 팀 `team_DYUNVUbVVLclPuNP7JvQuUdz`, 프로젝트 `prj_Zvhj1wmVb9Tl3yuR9QkLubgcpC46` (`27maeul`)로 확인했다.
- 다른 대화의 가구·예복 등 변경은 되돌리지 않았다.

## 배포 결과
- 운영 배포 READY: `dpl_FUsXtDBAB2ua1A9viqiLwF7uRmYd`.
- 운영 주소: https://27maeul.vercel.app
- 고정 배포 주소: https://27maeul-a78089ymu-qhrdma.vercel.app
- 대상: production, Vite, 원격 빌드30초. Git 기준점 `cf6c0a8` + 현재 작업 파일(다른 대화 변경 포함)을 업로드했다.
- CLI inspect에서 운영 별칭을 확인했고 운영 주소가 HTTP200을 응답했다.
