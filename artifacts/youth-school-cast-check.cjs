const fs=require('fs');let p='artifacts/youth-location-fixes-browser.cjs',s=fs.readFileSync(p,'utf8');s=s.replace('const before=await page.evaluate', 'const before=await page.evaluate');s=s.replace("return{name:k.name,school:k.kidFlags.schoolDay,at:y.siblingTile(s,k,0),coins:s.coins,raw:y.serialize(s)}", "(window.__schoolStates??=[]).push(s);return{name:k.name,school:k.kidFlags.schoolDay,at:y.siblingTile(s,k,0),coins:s.coins,raw:y.serialize(s)}");
const at=s.indexOf(' assert.deepEqual(errors,[])');s=s.slice(0,at)+`
 await page.evaluate(()=>{
  const root=document.createElement('main');root.id='school-gallery';root.style.cssText='display:flex;flex-wrap:wrap;gap:12px;background:#eee';document.body.append(root);
  const f=window.__fix,now=performance.now.bind(performance);
  try{for(const [index,original]of window.__schoolStates.entries())for(const dressed of [false,true])for(let phase=0;phase<4;phase++){
   const state=dressed?original:{...original,looks:undefined,siblings:original.siblings.map(k=>({...k,wardrobe:undefined}))};
   const canvas=document.createElement('canvas');canvas.className='audit-school';canvas.id='school-'+index+'-'+dressed+'-'+phase;canvas.width=384;canvas.height=480;canvas.style.cssText='width:192px;height:240px;image-rendering:pixelated';root.append(canvas);
   const r=f.createRenderer(canvas.getContext('2d'),window.__auditModules.CONTENT);r.view.w=16;r.view.h=20;r.view.scale=1.5;r.view.camera.x=13;r.view.camera.y=38;
   Object.defineProperty(performance,'now',{configurable:true,value:()=>phase/3*1000});f.setActiveMap('village');f.syncHome(state);r.draw(state,8,0);
  }}finally{Object.defineProperty(performance,'now',{configurable:true,value:now})}
 });
 for(const canvas of await page.locator('canvas.audit-school').all())await canvas.screenshot({path:path.join(out,(await canvas.getAttribute('id'))+'.png'),animations:'disabled'});
`+s.slice(at);fs.writeFileSync(p,s);
