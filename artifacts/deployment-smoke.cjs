const fs=require('fs');
const {chromium}=require('C:/Users/wn410/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const base=process.argv[2];if(!/^https:\/\/[^/]+\.vercel\.app$/.test(base))throw new Error('Invalid target');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  if(response.status()!==200)throw new Error('HTTP '+response.status());
  await page.locator('#root').waitFor({state:'visible'});
  const version=await page.evaluate(async()=>await(await fetch('/version.json',{cache:'no-store'})).json());
  const text=await page.locator('body').innerText();
  if(text.length<10||/Application error|배포를 찾을 수 없/.test(text))throw new Error('App did not load');
  if(await page.evaluate(()=>!!window.__fix||!!window.__auditModules))throw new Error('Audit bridge included');
  await page.screenshot({path:'artifacts/bugfix-all-20261020/deployed-mobile.png',fullPage:true});
  const result={url:base,status:response.status(),version,errors,text:text.slice(0,700)};
  fs.writeFileSync('artifacts/bugfix-all-20261020/deployed-smoke.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));if(errors.length)throw new Error('Browser errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
