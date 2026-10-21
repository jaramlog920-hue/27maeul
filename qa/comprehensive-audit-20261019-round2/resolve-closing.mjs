import fs from 'node:fs'
import crypto from 'node:crypto'
const out='qa/comprehensive-audit-20261019-round2'
const base=JSON.parse(fs.readFileSync(`${out}/source-closing.json`,'utf8'))
const changed=base.filter(x=>!fs.existsSync(x.path)||crypto.createHash('sha256').update(fs.readFileSync(x.path)).digest('hex')!==x.sha256).map(x=>x.path)
const integrity={checkedAt:new Date().toISOString(),baseline:'source-closing.json',baselineFiles:base.length,changedSinceClosing:changed,notes:'External changes across earlier phases are in source-drift-at-resume/late-drift/closing-drift. The auditor changed only qa artifacts and BUG_AUDIT.md.'}
fs.writeFileSync(`${out}/integrity-final.json`,JSON.stringify(integrity,null,2))
let r=fs.readFileSync('BUG_AUDIT.md','utf8')
r=r.replace(/확정 문제는 \*\*14건:[\s\S]*?미확인 위험은 확정 버그 수에서 제외했다\./,'현행 미해결 제품 문제는 **13건: Critical 0 / High 0 / Medium 5 / Low 8**이다. 추가로 발견한 테스트 타입 빌드 차단1건은 마감 전 외부 수정 후 타입 검사 통과를 확인해 미해결 수에서 제외했다. Critical/High를 발견하지 못했다는 뜻이며 없다는 보장이 아니다. 과거 발견과 겹치는 항목도 포함하므로 이전 보고서 수와 합산하지 않는다. 미확인 위험도 확정 버그 수에서 제외했다.')
r=r.replace(/### M-00\.[\s\S]*?(?=### M-01\.)/,'')
r=r.replace('마지막 타입 실패1건 | 제품0/빌드1','마지막 타입 수정 확인·빌드 통과 | 0')
r=r.replace('제품13건+빌드 차단1건 | 미발견은 무결함 보장이 아님 | **14**','제품13건(빌드 차단1건은 수정 확인 후 제외) | 미발견은 무결함 보장이 아님 | **13**')
r=r.replace(/\| 타입 \|[^\n]+/,'| 타입 | 마감 전 `tsc --noEmit --incremental false` 통과(`closing-typecheck.log`). 중간의 새 outdoor.test.ts TS2345 4개는 외부에서 it.each 인수에 as const를 추가한 뒤 회복됨. 기존 tsbuildinfo는 갱신하지 않음 |')
r=r.replace(/\| 프로덕션 빌드 \|[^\n]+/,'| 프로덕션 빌드 | 재개·마당·마감 전 Vite 단독 build 모두 통과. 최종 타입도 통과. 기존 dist 대신 resumed-build/late-build/closing-build에 출력. 큰청크 경고는 남음. 정식 npm build를 직접 실행해 기존 tsbuildinfo를 갱신하지 않고 타입·Vite 단계를 분리 실행함 |')
r=r.replace('타입 오류는 별도이며 마지막 마당 기능의 실제 브라우저 픽셀 검증은 미실시','마감 직전3파일45개 검사도 통과(closing-targeted.json). 중간 타입 오류는 아래 수정 이력 참조. 마당/미리보기의 실제 브라우저 픽셀 검증은 미실시')
r=r.replace('마지막에 새로 확인한 타입 빌드 실패(M-00)와 혼동하지 않는다.','추가로 `src/engine/outdoor.test.ts:33–40`의 it.each 숫자 인수가 number로 추론되어 GameState.homeLevel(0|1|2|3) 계약에 맞지 않는 TS2345 4개를 두 번 확인했다(Medium/빌드 차단). 이후 외부에서 리터럴 튜플 `as const`로 수정했고 마감 타입 검사 통과를 확인했다. 이는 수정 확인 이력이며 현행 미해결13건에는 포함하지 않는다. 원인·재현은 late-typecheck.log/final-typecheck.log, 회복은 closing-typecheck.log에 보존했다. 감사자는 소스를 수정하지 않았다.')
r=r.replace('1. 먼저 M-00의 테스트 타입 오류를 바로잡아 정식 빌드를 복구한다. 이어 M-01','1. M-01')
r=r.replace('최종 기준 파일은 `source-late.json`','최종 기준 파일은 `source-closing.json`')
r=r.replace(/\n\n최종 마감 중 기준 이후 외부 변경이 추가 감지됐다:[\s\S]*$/,'\n\n마감 직전 추가 변경7개는 closing-drift.json에 보존했다. 현재 소스/연결을 검토하고 타입·Vite 빌드·마당/방 배치45개 표적 검사를 보완했다. 미리보기의 실제 브라우저 픽셀 검사는 미실시다.\n')
if(changed.length)r+=`\n종료 확인 이후 추가 외부 변경: ${changed.map(x=>'`'+x+'`').join(', ')}. 이 변경은 최종 기준 검사에서 제외하며 다음 작업에서 먼저 재검증한다.\n`
r=r.replace('13건(Medium5/Low8), 마지막에 추가된 테스트의 타입 오류로 인한 빌드 차단은1건(Medium)','13건(Medium5/Low8)')
fs.writeFileSync('BUG_AUDIT.md',r);fs.writeFileSync(`${out}/REPORT_DRAFT.md`,r)
fs.appendFileSync(`${out}/PROGRESS.md`,`\n\n### 마감 정정 ${new Date().toISOString()}\n- 중간 타입 오류는 외부 as const 수정 후 closing-typecheck 통과. 미해결 제품13건(Medium5/Low8)으로 정정. 이전14건 기록은 발견 당시 이력이다.\n- closing-targeted:3파일45/45, closing Vite build통과. 마감 추가7파일 소스 검토를 coverage에 기록.\n- 최종 기준 source-closing.json, 종료 뒤 변경${changed.length}개. root BUG_AUDIT 갱신 완료.\n`)
console.log(JSON.stringify({bytes:Buffer.byteLength(r),unresolved:13,severity:{Medium:5,Low:8},historicalResolvedBuild:1,integrity},null,2))
