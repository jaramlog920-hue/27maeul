const {chromium}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const out=path.resolve('artifacts/bugfix-all-20261020/browser')
;(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true})
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true})
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort())
  const page=await context.newPage();page.setDefaultTimeout(15000)
  await page.goto('http://127.0.0.1:4197/',{waitUntil:'domcontentloaded'})
  await page.addScriptTag({type:'module',url:process.env.AUDIT_STATIC_BRIDGE})
  await page.getByRole('button',{name:'새로 시작하기'}).click();await page.getByLabel('이름',{exact:true}).fill('저장검사');await page.getByRole('button',{name:'이대로 시작',exact:true}).click()
  const quota=await page.evaluate(async()=>{
   const {CONTENT,newGame}=window.__auditModules,s=window.__gd.store,f=window.__fix
   const b=newGame(CONTENT);s.getState().load({...b,coins:321,scenes:[]});s.setState({modal:null,piecePopups:[],copyResult:null})
   await f.flushGameStorage()
   window.__originalPut=IDBObjectStore.prototype.put
   IDBObjectStore.prototype.put=function(){throw new DOMException('Audit-only simulated quota','QuotaExceededError')}
   s.getState().commitGame({...s.getState().game,coins:322})
   try{await f.flushGameStorage()}catch{}
   return {status:f.getGameStorageStatus(),coins:s.getState().game.coins}
  })
  assert.equal(quota.status.quota,true);assert.equal(quota.coins,322)
  const dialog=page.getByRole('dialog',{name:'저장 공간이 부족해요',exact:true})
  await dialog.waitFor();assert.ok((await dialog.innerText()).includes('사이트 데이터 삭제'))
  await page.screenshot({path:path.join(out,'quota-guidance.png'),fullPage:true})
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'현재 기록 파일로 받기',exact:true}).tap()
  const file=await download;await file.saveAs(path.join(out,'quota-backup.json'))
  const backup=JSON.parse(await fs.readFile(path.join(out,'quota-backup.json'),'utf8'));assert.ok(Object.keys(backup).length>0)
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.__originalPut})
  await page.getByRole('button',{name:'다시 저장',exact:true}).tap()
  await page.waitForFunction(()=>window.__fix.getGameStorageStatus().state==='saved'&&!window.__fix.getGameStorageStatus().error)
  await page.screenshot({path:path.join(out,'quota-recovered.png'),fullPage:true})
  const recovered=await page.evaluate(()=>({status:window.__fix.getGameStorageStatus(),coins:window.__gd.store.getState().game.coins}))
  assert.equal(recovered.coins,322)
  await fs.writeFile(path.join(out,'quota-results.json'),JSON.stringify({quota,backupKeys:Object.keys(backup),recovered},null,2))
  console.log('PASS: injected quota failure opens native guidance, exports backup, and retries durably without losing current progress')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
