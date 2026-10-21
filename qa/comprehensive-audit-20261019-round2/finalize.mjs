import fs from 'node:fs'
import crypto from 'node:crypto'
const out='qa/comprehensive-audit-20261019-round2'
const baseline=JSON.parse(fs.readFileSync(`${out}/source-late.json`,'utf8'))
const records=baseline.map(x=>({...x,sha256:fs.existsSync(x.path)?crypto.createHash('sha256').update(fs.readFileSync(x.path)).digest('hex'):null}))
const changed=records.filter((x,i)=>x.sha256!==baseline[i].sha256).map(x=>x.path)
const d=JSON.parse(fs.readFileSync(`${out}/source-integrity.json`,'utf8'))
const added=d.added.filter(p=>!baseline.some(x=>x.path===p))
const integrity={checkedAt:new Date().toISOString(),baseline:'source-late.json',baselineFiles:baseline.length,changedSinceLate:changed,addedSinceLate:added,notes:'Changes between audit phases are external and explicitly tracked. Audit files are excluded from source comparison.'}
fs.writeFileSync(`${out}/integrity-final.json`,JSON.stringify(integrity,null,2))
const suite=JSON.parse(fs.readFileSync(`${out}/resumed-suite.json`,'utf8'))
const summary=`542개 파일(541통과/1건너뜀),30,707개 검사 중 **30,702통과·실패0·5건너뜀**. 18:41:13 시작,541.29초. 원본은 [resumed-suite.json](${out}/resumed-suite.json)과 resumed-suite.log에 보존했다. 실행 중 외부 마당 변경이 있어 마지막 변경 검증은 아래 별도 행을 따른다.`
let report=fs.readFileSync(`${out}/REPORT_DRAFT.md`,'utf8').replace('{{CURRENT_SUITE}}',summary).replace('{{RESUMED_BROWSER}}','현재감사1일차0닢과 감사가져오기7일차789닢 두 칸 보존,실제7일차789닢 로드,320×568에서 canvas4개·가로세로 넘침0·console warning/error0을 확인했다. 이 브라우저 빌드는18:41 기준이며 이후 추가된 마당 UI는 포함하지 않는다.')
report=report.replace('현재1889줄 부근','현재1895줄 부근').replace('src/engine/game.ts:5199–5220','src/engine/game.ts:5226–5247').replace('src/engine/game.ts:1277–1287','src/engine/game.ts:1297–1307').replace('src/render/renderer.ts:2105–2130','src/render/renderer.ts:2112–2137').replace('src/engine/game.ts:4825','src/engine/game.ts:4851').replace('src/render/renderer.ts:2786–2797','src/render/renderer.ts:2802–2813').replace('src/render/renderer.ts:3311–3323','src/render/renderer.ts:3327–3339')
if(changed.length||added.length)report+=`\n\n최종 마감 중 기준 이후 외부 변경이 추가 감지됐다: ${[...changed,...added].map(x=>'`'+x+'`').join(', ')}. 해당 새 변경은 본 보고서의 고정 기준 검증에 포함하지 않는다. 다음 작업에서 integrity-final.json 목록부터 재검증한다.\n`
if(/\{\{[A-Z_]+\}\}/.test(report))throw Error('Unresolved report placeholder')
if(!fs.existsSync(`${out}/BUG_AUDIT.before-final.md`))fs.copyFileSync('BUG_AUDIT.md',`${out}/BUG_AUDIT.before-final.md`)
fs.writeFileSync(`${out}/REPORT_DRAFT.md`,report)
fs.writeFileSync('BUG_AUDIT.md',report)
fs.appendFileSync(`${out}/PROGRESS.md`,`\n\n## 최종 통합 완료\n\n- 완료 시각: ${new Date().toISOString()} (UTC). 제품13건(Medium5/Low8)+마지막 테스트 타입 빌드차단1건(Medium).\n- 전체 현재 재실행:542파일/30707검사,30702pass/0fail/5skip,541.29s. 마지막 마당 변경은46관련검사+40감사하네스 통과,타입은TS2345 4곳 실패(M-00),Vite단독빌드는통과.\n- 577제품모듈의파일별검사깊이기록,미할당0. 전수정독/픽셀/실기기/모든분기완료를주장하지않음.\n- BUG_AUDIT.md 작성. 미확인cold다중책로딩/실기기/오프라인/동시수정한계는보고서에명시.\n- 마지막기준이후변경:${changed.length},추가:${added.length}. 상세 integrity-final.json.\n- 이어서할일: M-00타입복구확인→M01/M02정합성→후계id통일→cold로딩실제브라우저→실기기/픽셀. 기존소스는감사자가수정하지않음.\n`)
console.log(JSON.stringify({reportBytes:Buffer.byteLength(report),findings:{product:13,build:1,Medium:6,Low:8},suite:{pass:suite.numPassedTests,fail:suite.numFailedTests,skip:suite.numPendingTests},integrity},null,2))
