const {chromium}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs/promises'),path=require('path'),assert=require('assert/strict');const out='artifacts/youth-activity-audit-20261020/browser';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/',{waitUntil:'domcontentloaded'});await page.addScriptTag({type:'module',url:process.env.AUDIT_STATIC_BRIDGE});await page.waitForFunction(()=>!!window.__activity);
 await page.getByRole('button',{name:'새로 시작하기'}).click();await page.getByLabel('이름',{exact:true}).fill('활동검사');await page.getByRole('button',{name:'이대로 시작',exact:true}).click();
 const cases=[...[41,42].flatMap(age=>['make','cook','walk'].map(act=>({age,act,mode:'full'}))),{age:41,act:'make',mode:'free'},{age:42,act:'make',mode:'chest'},{age:42,act:'make',mode:'fullChest'}];
 for(const c of cases){
  await page.evaluate(c=>{const s=window.__gd.store;s.getState().load(window.__activity.fixture(c.age,c.mode));s.setState({modal:{kind:'kidTime'},toast:null,piecePopups:[],copyResult:null,clockMs:0})},c);
  const name={make:/같이 만들기/,cook:/같이 요리하기/,walk:/산책하기/}[c.act];await page.getByRole('button',{name}).click();
  const data=await page.evaluate(()=>{const s=window.__gd.store.getState(),g=s.game,m=s.modal;if(m.kind!=='kidTime')throw Error('Missing modal');const [id,n]=Object.entries(m.done.got)[0],restored=window.__activity.deserialize(window.__activity.serialize(g),window.__auditModules.CONTENT);return{got:m.done.got,id,claimed:n,bag:g.inv[id]??0,chest:g.chest?.[id]??0,minute:g.clock.minute,acts:g.flags.kidActs,kidMade:g.flags.kidMade,restoredBag:restored.inv[id]??0,restoredChest:restored.chest?.[id]??0}});
  const dialog=page.getByRole('dialog',{name:'함께하는 시간',exact:true});await dialog.waitFor();const text=await dialog.innerText();
  assert.equal(data.claimed,1);if(c.mode==='full')assert.equal(data.bag+data.chest,0);if(c.mode==='free')assert.equal(data.bag,1);if(c.mode==='chest')assert.equal(data.chest,1);if(c.mode==='fullChest')assert.equal(data.chest,30);
  const file=`${c.age}-${c.act}-${c.mode}.png`;await page.screenshot({path:path.join(out,file),fullPage:true});results.push({...c,...data,text,file});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
