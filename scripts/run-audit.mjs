// 자동 점검기 실행 (결과: docs/audits/invariants-latest.md)
//   npm run audit            — 40일씩 + 후반 생활 한 해(160일), 약 30분
//   npm run audit -- 10 20   — 10일씩 + 후반 생활 20일, 빠른 확인용
import { spawnSync } from 'node:child_process'
const days = process.argv[2] ?? '40'
const late = process.argv[3] ?? '160'
const r = spawnSync('npx', ['vitest', 'run', 'src/audit'], { stdio: 'inherit', shell: true, env: { ...process.env, AUDIT: '1', AUDIT_DAYS: days, AUDIT_LATE_DAYS: late } })
process.exit(r.status ?? 1)
