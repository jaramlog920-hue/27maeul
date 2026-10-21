# 프로덕션 배포 — 2026-10-20

- 사용자 요청: 배포.
- 프로젝트: qhrdma/27maeul (prj_Zvhj1wmVb9Tl3yuR9QkLubgcpC46).
- 소스: 로컬 HEAD 3c5ffb0에 이 대화의 미커밋 수정 포함. Git 커밋/푸시는 실행하지 않았다.
- 로컬 npm run build와 원격 콘텐츠·TypeScript·Vite/PWA 빌드 통과.
- 배포: dpl_CbFdoV3dN7on6NjYMbkCQpK4anvC, READY, production.
- 배포 URL: https://27maeul-bvub9snj5-qhrdma.vercel.app
- 위 정확한 배포의 promote 완료. 실제 서비스: https://27maeul.vercel.app
- 서비스 version.json: 26.10.20.08:34. 공개 주소 모바일 임시 Edge 검사 통과, JavaScript 오류 없음. 실제 사용자 저장 접근 없음.
- 집 옛 외관·부착 소품 제거 및 기존 버그 수정 포함.
- 배포 제외 규칙: artifacts/qa/작업 메모 제외. 빌드가 참조하는 docs/content-audit.md와 docs/event-art-remaining-138-plan.json만 예외로 포함.
- 초기 두 원격 빌드는 제외 규칙에서 필요한 문서 누락으로 실패했다. 두 문서 의존성을 보완한 뒤 동일 소스로 정상 배포했다.
- 고유 배포 URL은 Vercel 인증 보호가 있어 HTTP는 인증된 CLI로 확인했다. 공개 서비스 주소는 별도 임시 브라우저에서 첫 화면·버전·오류 여부를 확인했다. 보호 설정은 바꾸지 않았다.
- 증거: artifacts/bugfix-all-20261020/production-build.log, deployment-final.log, deployment-promote.log, public-version.log, public-smoke.log, deployed-smoke.json, deployed-mobile.png.
