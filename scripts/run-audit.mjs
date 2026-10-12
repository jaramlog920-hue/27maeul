// 자동 점검기 실행: npm run audit (기본 40일) / npm run audit -- 10 (10일만)
// 결과: docs/audits/invariants-latest.md
import { spawnSync } from 'node:child_process'
const days = process.argv[2] ?? '40'
const r = spawnSync('npx', ['vitest', 'run', 'src/audit'], { stdio: 'inherit', shell: true, env: { ...process.env, AUDIT: '1', AUDIT_DAYS: days } })
process.exit(r.status ?? 1)
