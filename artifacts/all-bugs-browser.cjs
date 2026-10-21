const {chromium}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const out=path.resolve('artifacts/bugfix-all-20261020/browser')
;(async()=>{
 await fs.mkdir(out,{recursive:true})
 const browser=await chromium.launch({channel:'msedge',headless:true})
 try{
  const context=await browser.newContext({viewport:{width:1200,height:900}}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4197/audit-gallery.html',{waitUntil:'domcontentloaded'})
  await page.waitForFunction(()=>!!window.__fix)
  const observations=await page.evaluate(()=>{
   const {CONTENT,newGame,newChild}=window.__auditModules
   const {createRenderer,createTripRenderer,setActiveMap,newGenState,syncHome,lookOf,dressUp,withLookDefaults,siblingTile}=window.__fix
   const base=newGame(CONTENT),wearA=withLookDefaults({look:'f',name:'요리사',top:4,bottom:4,hairFront:21,hairBack:20,hairColor:[170,90,25]}),wearB=withLookDefaults({look:'m',name:'목공',top:1,bottom:1,hairFront:0,hairBack:0,hairColor:[10,90,25]})
   const older={...newChild(1,base.stats,undefined),name:'요리사',look:'girl',job:'cook',left:false,wardrobe:wearA},active={...newChild(2,base.stats,undefined),name:'목공',job:'woodworker',left:false}
   const state={...base,scenes:[],clock:{day:100,minute:600},child:active,siblings:[older],looks:{child:wearB},flags:{...base.flags,growthLegacy:1,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>['movedIn:'+n.id,1]))}}
   document.body.innerHTML='<h1>전체 버그 수정 검증</h1><main></main>'
   const add=(id,label)=>{const section=document.createElement('section'),h=document.createElement('h2'),c=document.createElement('canvas');h.textContent=label;c.id=id;c.width=768;c.height=960;c.style.width='384px';c.style.height='480px';section.append(h,c);document.querySelector('main').append(section);return c}
   const world=(id,label,g,focus)=>{g={...g,player:{...g.player,x:focus.x+2,y:focus.y+1}};setActiveMap(g.map??'village');syncHome(g);const c=add(id,label),r=createRenderer(c.getContext('2d'),CONTENT);r.scale=3;r.look=focus;r.draw(g,8,0);return c.toDataURL()}
   const at=siblingTile(state,older,0)
   const a=world('sibling-a','비선택 성인 · 개별 옷장 A',state,at),b=world('sibling-b','비선택 성인 · 개별 옷장 B',{...state,siblings:[{...older,wardrobe:wearB}]},at)
   const trip=(id,label,look)=>{setActiveMap('village');const c=add(id,label),r=createTripRenderer(c.getContext('2d'));r.view.w=16;r.view.h=20;r.view.scale=3;r.draw('harbor',{...state,looks:{child:look}},{x:5,y:5,facing:'down',walking:false},{x:5,y:8,facing:'down',walking:false},8,0);return c.toDataURL()}
   const ta=trip('trip-a','여행 · 성인 옷장 A',wearA),tb=trip('trip-b','여행 · 성인 옷장 B',wearB)
   const build=(id,x,owner,slot)=>({id,x,y:14,owner,kind:'kidWork',facing:'down',state:'done',orderedDay:1,paid:{coins:0,items:{}},refunded:false,slot})
   const work={...state,map:'newland',newland:{builds:[build('b1',4,'me:1',0),build('b2',12,'me:2',1)],tiles:{},nextId:3,settledDay:100},flags:{...state.flags,newlandGift:1,newlandRevealed:1},player:{...base.player,x:9,y:18}}
   for(const phase of [0,2,5]){const now=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>phase*1000});world('work-'+phase,'일터 주인별 동작 · '+phase+'초',work,{x:9,y:16});Object.defineProperty(performance,'now',{configurable:true,value:now})}
   let gen=newGenState(CONTENT,17,300)
   gen={...gen,persons:{...gen.persons,'g-0001':{id:'g-0001',origin:'born',born:100,stage:'adult',look:'f',name:'후계 배우자',parents:['cosmo'],spouse:null,household:null,avatar:{skin:5,hairFront:9,top:7}}},retired:{cosmo:{heir:'g-0001',day:250}}}
   let spouse={...state,clock:{day:300,minute:600},gen,romance:{stage:'married',partner:'cosmo',since:270,weddingDay:null,marriedDay:280},npcs:Object.fromEntries(Object.entries(base.npcs).map(([id,n])=>[id,{...n,visible:id==='cosmo',x:24,y:19,path:[]}])),player:{...base.player,x:26,y:20},child:null,siblings:[]}
   const before=lookOf(spouse,'spouse',CONTENT)
   const sa=world('spouse-before','현재 후계 배우자 · 변경 전',spouse,{x:24,y:19})
   spouse=dressUp(spouse,'spouse',{...before,top:8},CONTENT)
   const sb=world('spouse-after','현재 후계 배우자 · 변경 후',spouse,{x:24,y:19})
   return {siblingClothesDiffer:a!==b,tripClothesDiffer:ta!==tb,spouseClothesDiffer:sa!==sb,spouseName:lookOf(spouse,'spouse',CONTENT).name,spouseTop:lookOf(spouse,'spouse',CONTENT).top,originalLookUnchanged:spouse.looks.cosmo===undefined,canvases:document.querySelectorAll('canvas').length}
  })
  await fs.writeFile(path.join(out,'observations.json'),JSON.stringify(observations,null,2));console.log(JSON.stringify(observations))
  for(const canvas of await page.locator('canvas').all())await canvas.screenshot({path:path.join(out,(await canvas.getAttribute('id'))+'.png')})
  await page.screenshot({path:path.join(out,'gallery-wide.png'),fullPage:true})
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'gallery-mobile.png'),fullPage:true})
  assert.equal(observations.siblingClothesDiffer,true);assert.equal(observations.tripClothesDiffer,true);assert.equal(observations.spouseClothesDiffer,true);assert.equal(observations.spouseName,'후계 배우자');assert.equal(observations.spouseTop,8);assert.equal(observations.originalLookUnchanged,true)
  // Same-origin tabs initialize against the same revision, then only the first may commit.
  const second=await context.newPage();await second.goto('http://127.0.0.1:4197/audit-gallery.html',{waitUntil:'domcontentloaded'});await second.waitForFunction(()=>!!window.__fix)
  for(const p of [page,second])await p.evaluate(()=>window.__fix.initializeGameStorage())
  await page.evaluate(async()=>{const f=window.__fix,g=window.__auditModules.newGame(window.__auditModules.CONTENT);f.gameStorage().setItem('twenty-seven/save',f.serialize({...g,coins:123}));await f.flushGameStorage()})
  const conflict=await second.evaluate(async()=>{const f=window.__fix,g=window.__auditModules.newGame(window.__auditModules.CONTENT);try{f.gameStorage().setItem('twenty-seven/save',f.serialize({...g,coins:999}));await f.flushGameStorage();return{rejected:false,status:f.getGameStorageStatus()}}catch{return{rejected:true,status:f.getGameStorageStatus()}}})
  assert.equal(conflict.rejected,true)
  const savedCoins=await page.evaluate(()=>new Promise((resolve,reject)=>{const o=indexedDB.open('twenty-seven-storage',1);o.onerror=()=>reject(o.error);o.onsuccess=()=>{const db=o.result,t=db.transaction('game','readonly'),r=t.objectStore('game').get('twenty-seven/save');t.oncomplete=()=>{db.close();resolve(JSON.parse(r.result).coins)}}}))
  assert.equal(savedCoins,123)
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({observations,conflict,savedCoins,errors},null,2));assert.deepEqual(errors,[])
  console.log('PASS: live renderer wardrobe/stage/workplaces and real IndexedDB stale-tab protection')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
