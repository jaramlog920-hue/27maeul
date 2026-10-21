const fs=require('fs');let p='artifacts/youth-browser.cjs',s=fs.readFileSync(p,'utf8');
s=s.replace("const page=await context.newPage(),errors=[],results=[];", "const page=await context.newPage(),errors=[],results=[];page.setDefaultTimeout(12000);");
s=s.replace("await page.getByRole('button',{name:'닫기',exact:true}).click();", "console.log('family buttons',await page.getByRole('button').allTextContents());await page.screenshot({path:path.join(out,stage+'-family-picked.png'),fullPage:true});await page.locator('[data-close]').last().click();");
const at=s.indexOf(' assert.deepEqual(errors,[])');s=s.slice(0,at)+`
 await page.evaluate(()=>{const s=window.__gd.store,g=window.__youth.fixture(50);g.player={...g.player,...window.__auditModules.HOME_ENTRY};s.getState().load(g);s.setState({modal:{kind:'follow',who:'child'},toast:null,piecePopups:[],copyResult:null})});
 await page.getByRole('button',{name:'집에 두기',exact:true}).click();
 const homeBefore=await page.evaluate(()=>{const g=window.__gd.store.getState().game;return{at:window.__youth.childTile(g),mode:g.child.mode}});
 await page.screenshot({path:path.join(out,'home-before.png'),fullPage:true});
 await page.evaluate(()=>window.__gd.store.getState().open({kind:'family'}));await page.getByRole('button',{name:/다른아이/}).click();await page.locator('[data-close]').last().click();
 const homeAfter=await page.evaluate(()=>{const g=window.__gd.store.getState().game,k=g.siblings[0];return{at:window.__youth.siblingTile(g,k,0),mode:k.mode}});
 assert.equal(homeAfter.mode,'home');assert.notDeepEqual(homeBefore.at,homeAfter.at);
 await page.screenshot({path:path.join(out,'home-after.png'),fullPage:true});results.push({case:'home',before:homeBefore,after:homeAfter});
`+s.slice(at);fs.writeFileSync(p,s);
