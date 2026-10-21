const {chromium}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs/promises'),path=require('path'),assert=require('assert/strict');
const out='artifacts/youth-fixes-20261020/locations';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
 const page=await context.newPage(),errors=[],results=[];page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/',{waitUntil:'domcontentloaded'});
 await page.addScriptTag({type:'module',url:process.env.AUDIT_STATIC_BRIDGE});await page.waitForFunction(()=>!!window.__youth);
 await page.getByRole('button',{name:'새로 시작하기'}).click();await page.getByLabel('이름',{exact:true}).fill('유년검사');await page.getByRole('button',{name:'이대로 시작',exact:true}).click();
 for(const [age,stage]of [[20,'toddler'],[50,'helper']]){
  await page.evaluate(age=>{const s=window.__gd.store;s.getState().load(window.__youth.fixture(age));s.setState({modal:{kind:'school'},toast:null,piecePopups:[],copyResult:null,clockMs:0})},age);
  await page.getByRole('button',{name:'맡기기',exact:true}).first().click();
  const before=await page.evaluate(()=>{const s=window.__gd.store.getState().game;return{coins:s.coins,at:window.__youth.childTile(s),day:s.clock.day,school:s.flags.schoolDay}});
  assert.deepEqual(before.at,{x:21,y:45});assert.equal(before.coins,185);
  await page.screenshot({path:path.join(out,stage+'-before.png'),fullPage:true,animations:'disabled'});
  await page.evaluate(()=>window.__gd.store.getState().open({kind:'family'}));
  await page.getByRole('button',{name:/다른아이/}).click();
  console.log('family buttons',await page.getByRole('button').allTextContents());await page.screenshot({path:path.join(out,stage+'-family-picked.png'),fullPage:true,animations:'disabled'});await page.locator('[data-close]').last().click();
  const switched=await page.evaluate(()=>{const y=window.__youth,s=window.__gd.store.getState().game,k=s.siblings[0];(window.__schoolStates??=[]).push(s);return{name:k.name,school:k.kidFlags.schoolDay,at:y.siblingTile(s,k,0),coins:s.coins,raw:y.serialize(s)}});
  assert.equal(switched.school,before.day);assert.equal(switched.at.y,45);assert.equal(switched.at.x,22);
  await page.screenshot({path:path.join(out,stage+'-after.png'),fullPage:true,animations:'disabled'});
  const restored=await page.evaluate(raw=>{const y=window.__youth,s=y.deserialize(raw,window.__auditModules.CONTENT),k=s.siblings[0];return{at:y.siblingTile(s,k,0),school:k.kidFlags.schoolDay,coins:s.coins}},switched.raw);
  const {raw,...after}=switched;results.push({age,stage,before,after,restored});
  await page.evaluate(age=>window.__gd.store.getState().selectKid(100-age),age);
  await page.screenshot({path:path.join(out,stage+'-reselected.png'),fullPage:true,animations:'disabled'});
 }

 await page.evaluate(()=>{const s=window.__gd.store,g=window.__youth.fixture(50);g.player={...g.player,...window.__auditModules.HOME_ENTRY,x:window.__auditModules.HOME_ENTRY.x+2};s.getState().load(g);s.setState({modal:{kind:'follow',who:'child'},toast:null,piecePopups:[],copyResult:null})});
 await page.getByRole('button',{name:'집에 두기',exact:true}).click();
 const homeBefore=await page.evaluate(()=>{const g=window.__gd.store.getState().game;return{at:window.__youth.childTile(g),mode:g.child.mode}});
 await page.screenshot({path:path.join(out,'home-before.png'),fullPage:true,animations:'disabled'});
 await page.evaluate(()=>window.__gd.store.getState().open({kind:'family'}));await page.getByRole('button',{name:/다른아이/}).click();await page.locator('[data-close]').last().click();
 const homeAfter=await page.evaluate(()=>{const g=window.__gd.store.getState().game,k=g.siblings[0];return{at:window.__youth.siblingTile(g,k,0),mode:k.mode}});
 assert.equal(homeAfter.mode,'home');assert.ok(homeAfter.at.y>=100&&homeAfter.at.y<=116);
 await page.screenshot({path:path.join(out,'home-after.png'),fullPage:true,animations:'disabled'});results.push({case:'home',before:homeBefore,after:homeAfter});

 await page.evaluate(()=>{
  const root=document.createElement('main');root.id='school-gallery';root.style.cssText='display:flex;flex-wrap:wrap;gap:12px;background:#eee';document.body.append(root);
  const f=window.__fix,now=performance.now.bind(performance);
  try{for(const [index,original]of window.__schoolStates.entries())for(const dressed of [false,true])for(let phase=0;phase<4;phase++){
   const state=dressed?original:{...original,looks:undefined,siblings:original.siblings.map(k=>({...k,wardrobe:undefined}))};
   const canvas=document.createElement('canvas');canvas.className='audit-school';canvas.id='school-'+index+'-'+dressed+'-'+phase;canvas.width=384;canvas.height=480;canvas.style.cssText='width:384px;height:480px;image-rendering:pixelated';root.append(canvas);
   const r=f.createRenderer(canvas.getContext('2d'),window.__auditModules.CONTENT);r.scale=1.5;r.look={x:22,y:45};
   Object.defineProperty(performance,'now',{configurable:true,value:()=>phase/3*1000});f.setActiveMap('village');f.syncHome(state);r.draw(state,phase/3,0);
  }}finally{Object.defineProperty(performance,'now',{configurable:true,value:now})}
 });
 await page.setViewportSize({width:1600,height:1000});await page.locator('#school-gallery').screenshot({path:path.join(out,'school-frames.png'),animations:'disabled'});
 for(const canvas of await page.locator('canvas.audit-school').all())await canvas.screenshot({path:path.join(out,(await canvas.getAttribute('id'))+'.png'),animations:'disabled'});
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
