import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=fileURLToPath(new URL('../assets/furniture/baby-care/',import.meta.url))
const types={'.html':'text/html; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8'}
http.createServer(async(req,res)=>{
  try{
    let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    name=name.replace(/^\/assets\/furniture\/baby-care\//,'/').replace(/^\//,'')||'preview.html'
    const file=path.resolve(root,name)
    if(!file.startsWith(root)){res.writeHead(403);res.end();return}
    const data=await fs.readFile(file)
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'})
    res.end(data)
  }catch{res.writeHead(404);res.end('Not found')}
}).listen(5174,'127.0.0.1',()=>console.log('Baby care preview: http://127.0.0.1:5174/preview.html'))
