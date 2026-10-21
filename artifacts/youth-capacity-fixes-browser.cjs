const {chromium}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs/promises'),path=require('path'),assert=require('assert/strict');const out='artifacts/youth-fixes-20261020/capacity';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/',{waitUntil:'domcontentloaded'});await page.addScriptTag({type:'module',url:process.env.AUDIT_STATIC_BRIDGE});await page.waitForFunction(()=>!!window.__activity);
 await page.getByRole('button',{name:'새로 시작하기'}).click();await page.getByLabel('이름',{exact:true}).fill('가방복구');await page.getByRole('button',{name:'이대로 시작',exact:true}).click();
 const cases=[...[41,42].flatMap(age=>['make','cook','walk'].map(act=>({age,act,mode:'full'}))),{age:41,act:'make',mode:'free'},{age:42,act:'make',mode:'chest'},{age:42,act:'make',mode:'fullChest'}];
 for(const c of cases){
  const start=await page.evaluate(c=>{const s=window.__gd.store;s.getState().load(window.__activity.fixture(c.age,c.mode));s.setState({modal:{kind:'kidTime'},toast:null,piecePopups:[],copyResult:null,clockMs:0});return {minute:s.getState().game.clock.minute,acts:s.getState().game.flags.kidActs??0}},c);
  await page.getByRole('button',{name:{make:/같이 만들기/,cook:/같이 요리하기/,walk:/산책하기/}[c.act]}).click();
  let blocked;
  if(c.mode==='full'||c.mode==='fullChest'){
   await page.getByRole('dialog',{name:'가방 공간이 부족해요',exact:true}).waitFor();
   blocked=await page.evaluate(()=>{const g=window.__gd.store.getState().game;return{minute:g.clock.minute,acts:g.flags.kidActs??0,made:g.flags.kidMade??0}});
   assert.equal(blocked.minute,start.minute);assert.equal(blocked.acts,start.acts);assert.equal(blocked.made,0);
   await page.screenshot({path:path.join(out,`${c.age}-${c.act}-${c.mode}-prompt.png`),fullPage:true,animations:'disabled'});
   // 공간 확보 전의 재시도는 자원을 소모하지 않는다.
   await page.getByRole('button',{name:'공간 확인하고 다시 받기',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__gd.store.getState().game.clock.minute),start.minute);
   await page.getByRole('button',{name:'가방 비우기',exact:true}).click();
   await page.screenshot({path:path.join(out,`${c.age}-${c.act}-${c.mode}-bag.png`),fullPage:true,animations:'disabled'});
   await page.locator('.bag-grid button.bag-slot').first().click();
   await page.getByRole('button',{name:'버리기',exact:true}).click();
   await page.getByRole('button',{name:'하나 버리기',exact:true}).click();
   await page.getByRole('button',{name:'공간 확인하고 다시 받기',exact:true}).click();
  }
  await page.getByRole('dialog',{name:'함께하는 시간',exact:true}).waitFor();
  const data=await page.evaluate(()=>{const s=window.__gd.store; s.getState().retryKidAct();s.getState().retryKidAct();const g=s.getState().game,m=s.getState().modal;if(m.kind!=='kidTime'||!m.done)throw Error('Missing completion');const [id,n]=Object.entries(m.done.got)[0],restored=window.__activity.deserialize(window.__activity.serialize(g),window.__auditModules.CONTENT);return{got:m.done.got,id,claimed:n,bag:g.inv[id]??0,chest:g.chest?.[id]??0,minute:g.clock.minute,acts:g.flags.kidActs,made:g.flags.kidMade,restoredBag:restored.inv[id]??0,restoredChest:restored.chest?.[id]??0}});
  assert.equal(data.claimed,1);assert.equal(data.minute,640);assert.equal(data.acts,1);if(c.mode==='chest')assert.equal(data.chest,1);else assert.equal(data.bag,1);
  const file=`${c.age}-${c.act}-${c.mode}-received.png`;await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});results.push({...c,start,blocked,...data,file});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
