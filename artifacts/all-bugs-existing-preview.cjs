const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process')
;(async()=>{
 const out=path.resolve('artifacts/bugfix-all-20261020/browser'),dir=path.join(out,'runtime-build')
 const entry=(await fs.readdir(path.join(dir,'assets'))).find(f=>/^auditBridge-.*\.js$/.test(f))
 if(!entry)throw new Error('Missing existing audit bridge')
 const {preview}=await import('vite'),server=await preview({configFile:false,build:{outDir:dir},preview:{host:'127.0.0.1',port:4197,strictPort:true}})
 try{
  const child=spawn(process.execPath,['artifacts/all-bugs-quota.cjs'],{env:{...process.env,AUDIT_STATIC_BRIDGE:'/assets/'+entry},stdio:'inherit',windowsHide:true})
  const timer=setTimeout(()=>child.kill(),90000)
  const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject)});clearTimeout(timer)
  if(code!==0)throw new Error('Quota checker exited '+code)
 }finally{server.httpServer.closeAllConnections();await new Promise(r=>server.httpServer.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1})
