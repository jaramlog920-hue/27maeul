import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { createHash } from 'node:crypto'

const signature = Buffer.from([137,80,78,71,13,10,26,10])
const crcTable = Array.from({length:256}, (_, n) => {
  let c=n; for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0); return c>>>0
})
function chunk(type, data) {
  const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  let c=0xffffffff
  for(const b of name)c=(c>>>8)^crcTable[(c^b)&255]
  for(const b of data)c=(c>>>8)^crcTable[(c^b)&255]
  crc.writeUInt32BE((c^0xffffffff)>>>0)
  return Buffer.concat([len,name,data,crc])
}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c}
function readPNG(file) {
  const png=fs.readFileSync(file),width=png.readUInt32BE(16),height=png.readUInt32BE(20),channels=png[25]===6?4:3
  if(png[24]!==8||![2,6].includes(png[25])||png[28]!==0)throw Error(`지원하지 않는 미리보기 PNG: ${file}`)
  const data=[]
  for(let p=8;p<png.length;){const n=png.readUInt32BE(p),type=png.toString('ascii',p+4,p+8);if(type==='IDAT')data.push(png.subarray(p+8,p+8+n));p+=n+12}
  const raw=zlib.inflateSync(Buffer.concat(data)),stride=width*channels,unfiltered=Buffer.alloc(stride*height)
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)]
    if(filter>4)throw Error(`잘못된 PNG 필터: ${file}`)
    for(let x=0;x<stride;x++){
      const a=x>=channels?unfiltered[y*stride+x-channels]:0,b=y?unfiltered[(y-1)*stride+x]:0,c=y&&x>=channels?unfiltered[(y-1)*stride+x-channels]:0
      const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter]
      unfiltered[y*stride+x]=(raw[y*(stride+1)+1+x]+predictor)&255
    }
  }
  if(channels===4)return {width,height,pixels:unfiltered}
  const pixels=Buffer.alloc(width*height*4)
  for(let i=0;i<width*height;i++){pixels[i*4]=unfiltered[i*3];pixels[i*4+1]=unfiltered[i*3+1];pixels[i*4+2]=unfiltered[i*3+2];pixels[i*4+3]=255}
  return {width,height,pixels}
}
function animation(root, out, frames, id, cache, loop) {
  const width=Math.max(...frames.map(f=>f.width)),height=Math.max(...frames.map(f=>f.height)),hd=Buffer.alloc(13),actl=Buffer.alloc(8)
  hd.writeUInt32BE(width);hd.writeUInt32BE(height,4);hd[8]=8;hd[9]=6
  actl.writeUInt32BE(frames.length);actl.writeUInt32BE(0,4)
  const parts=[signature,chunk('IHDR',hd),chunk('acTL',actl)]
  let sequence=0
  for(const [i,f]of frames.entries()){
    if(!cache.has(f.file))cache.set(f.file,readPNG(path.join(root,f.file)))
    const original=cache.get(f.file),pixels=Buffer.alloc(width*height*4),ox=Math.floor((width-f.width)/2),oy=height-f.height
    for(let y=0;y<f.height;y++)original.pixels.copy(pixels,((oy+y)*width+ox)*4,((f.y+y)*original.width+f.x)*4,((f.y+y)*original.width+f.x+f.width)*4)
    const ctl=Buffer.alloc(26)
    ctl.writeUInt32BE(sequence++);ctl.writeUInt32BE(width,4);ctl.writeUInt32BE(height,8)
    ctl.writeUInt16BE(Math.min(65535,f.duration+(!loop&&i===frames.length-1?900:0)),20);ctl.writeUInt16BE(1000,22)
    ctl[24]=0;ctl[25]=0
    parts.push(chunk('fcTL',ctl))
    const scan=Buffer.alloc(height*(width*4+1))
    for(let y=0;y<height;y++)pixels.copy(scan,y*(width*4+1)+1,y*width*4,(y+1)*width*4)
    const compressed=zlib.deflateSync(scan)
    if(i===0)parts.push(chunk('IDAT',compressed))
    else{const seq=Buffer.alloc(4);seq.writeUInt32BE(sequence++);parts.push(chunk('fdAT',Buffer.concat([seq,compressed])))}
  }
  parts.push(chunk('IEND',Buffer.alloc(0)))
  const filename=createHash('sha1').update(id).digest('hex').slice(0,20)+'.png'
  fs.writeFileSync(path.join(out,'motion',filename),Buffer.concat(parts))
  return `all-preview/motion/${filename}`
}
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const url=value=>value.split('/').map(encodeURIComponent).join('/')
const directions={down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽',default:'공통'}
const pageName=(pack,mode,page)=>`${pack==='all'?'all':`pack-${pack}`}-${mode}-${page+1}.html`
const titles={all:'전체',motion:'모션만',still:'정지 도트만',raw:'모든 원본 PNG'}

export function exportStaticPreview(root, inventory) {
  const out=path.join(root,'all-preview'),cache=new Map(),packMap=new Map(inventory.packs.map((p,i)=>[p.id,{...p,index:i}]))
  fs.mkdirSync(path.join(out,'motion'),{recursive:true})
  const assets=inventory.entries.map(e=>({...e,preview:Object.fromEntries(Object.entries(e.views).map(([d,frames])=>[d,e.kind==='motion'?animation(root,out,frames,`${e.id}/${d}`,cache,e.loop):frames[0].file]))}))
  const raw=inventory.raw.map(([file,width,height,pack])=>({id:file,label:file.split('/').at(-1),group:'원본 PNG',kind:'still',pack,preview:{default:file},views:{default:[{file,width,height}]}}))
  const cardHTML=(entry,prefix='',allDirections=false)=>{
    const keys=Object.keys(entry.views),chosen=entry.views.down?'down':keys[0]
    const views=(allDirections?keys:[chosen]).map(d=>{
      const frames=entry.views[d],w=Math.max(...frames.map(f=>f.width)),h=Math.max(...frames.map(f=>f.height)),scale=Math.min(5,196/w,170/h),file=entry.preview[d]
      return `<figure><div class="stage"><a href="${prefix}${url(file)}" target="_blank" rel="noopener"><img loading="lazy" src="${prefix}${url(file)}?v=${version}" width="${Math.max(1,Math.round(w*scale))}" height="${Math.max(1,Math.round(h*scale))}" alt="${escape(entry.label)} · ${escape(directions[d]||d)}"></a></div><figcaption>${escape(directions[d]||d)}${entry.kind==='motion'?' · 자동 재생':''}</figcaption></figure>`
    }).join('')
    return `<article class="static-card"><small>${escape(packMap.get(entry.pack)?.label||entry.pack)} · ${escape(entry.group)}</small><h3>${escape(entry.label)}</h3><div class="static-views">${views}</div></article>`
  }
  const version=Date.now().toString(36)
  const navHTML=(prefix='',selected='all',mode='all')=>`<a href="${prefix}all-preview/${pageName('all',mode,0)}"${selected==='all'?' aria-current="page"':''}>전체 묶음</a>`+inventory.packs.map((p,i)=>`<a href="${prefix}all-preview/${pageName(i,mode,0)}"${selected===i?' aria-current="page"':''}>${escape(p.label)}</a>`).join('')
  const tabsHTML=(pack='all',mode='all')=>Object.entries(titles).map(([id,title])=>`<a href="${pageName(pack,id,0)}"${id===mode?' aria-current="page"':''}>${title}</a>`).join('')
  const statsHTML=`<span><b>${inventory.packs.length}</b> 묶음</span><span><b>${inventory.totals.motions}</b> 모션</span><span><b>${inventory.totals.stills.toLocaleString()}</b> 정지 도트</span><span><b>${inventory.totals.pngs.toLocaleString()}</b> 원본 PNG</span>`
  const css=`*{box-sizing:border-box}body{margin:0;background:#f6eedf;color:#493b30;font:14px/1.5 system-ui,"Malgun Gothic",sans-serif}a{color:#4c7368}header{background:#fffaf0;padding:24px;border-bottom:1px solid #ded0b7}h1{margin:0 0 6px;font-size:25px}header p{margin:0;font-size:12px;color:#897662}.stats{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;margin-top:12px}.stats b{font-size:18px}.layout{display:grid;grid-template-columns:225px 1fr}nav.packs{padding:18px 12px;border-right:1px solid #ded0b7}nav.packs a{display:block;text-decoration:none;border-radius:6px;padding:8px 10px}a[aria-current=page]{background:#647f73;color:white}.content{padding:20px;min-width:0}.tabs,.pages{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}.tabs a,.pages a{padding:8px 13px;border:1px solid #ded0b7;background:#fffaf0;border-radius:6px;text-decoration:none}.tabs a[aria-current]{background:#647f73}.count{font-size:12px;color:#897662;margin-bottom:14px}.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px}.static-card{padding:14px;background:#fffaf0;border:1px solid #ded0b7;border-radius:9px;min-width:0}.static-card small{font-size:10px;color:#647f73}.static-card h3{font-size:14px;line-height:1.4;margin:7px 0 10px;overflow-wrap:anywhere}.static-views{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}figure{margin:0;flex:1;min-width:95px}figcaption{font-size:10px;color:#897662;text-align:center;padding:5px}.stage{background:#ede1cb;height:180px;display:flex;align-items:center;justify-content:center;border-radius:5px;overflow:hidden}.stage img{image-rendering:pixelated;max-width:100%;object-fit:contain}.pages{justify-content:center;align-items:center;margin-top:24px}.pages span{font-size:12px}.empty{padding:60px;text-align:center;color:#897662}.back{display:inline-block;margin-top:12px;font-size:12px}@media(max-width:800px){.layout{grid-template-columns:1fr}nav.packs{display:flex;overflow:auto;gap:4px;border-right:0;padding:10px}nav.packs a{white-space:nowrap}.content{padding:12px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.static-card{padding:9px}.static-card h3{font-size:12px}.stage{height:155px}.stage img{max-height:145px;width:auto;max-width:100%}}`
  let pageCount=0
  const writtenPages=new Set()
  const writePages=(pack,mode)=>{
    const packId=pack==='all'?null:inventory.packs[pack].id
    const source=mode==='raw'?raw:assets
    const list=source.filter(e=>(!packId||e.pack===packId)&&(mode==='all'||mode==='raw'||e.kind===mode)),pages=Math.max(1,Math.ceil(list.length/36))
    for(let page=0;page<pages;page++){
      const cards=list.slice(page*36,(page+1)*36).map(e=>cardHTML(e,'../',mode!=='raw')).join('')||'<p class="empty">이 묶음에는 이 종류의 그림이 없어요.</p>'
      const pagination=`${page>0?`<a href="${pageName(pack,mode,page-1)}">이전</a>`:''}<span>${page+1} / ${pages} 페이지</span>${page+1<pages?`<a href="${pageName(pack,mode,page+1)}">다음</a>`:''}`
      const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>27마을 · ${titles[mode]}</title><style>${css}</style></head><body><header><h1>모든 도트와 모션</h1><p>움직이는 그림은 자동으로 재생돼요. 그림을 누르면 크게 볼 수 있어요.</p><div class="stats">${statsHTML}</div><a class="back" href="../preview.html">검색·속도·프레임 조절 미리보기 ↗</a></header><div class="layout"><nav class="packs">${navHTML('../',pack,mode)}</nav><main class="content"><nav class="tabs">${tabsHTML(pack,mode)}</nav><p class="count">${escape(packId?inventory.packs[pack].label:'전체 묶음')} · ${titles[mode]} · ${list.length.toLocaleString()}개</p><div class="gallery">${cards}</div><nav class="pages">${pagination}</nav></main></div></body></html>`
      const filename=pageName(pack,mode,page)
      fs.writeFileSync(path.join(out,filename),html);writtenPages.add(filename);pageCount++
    }
  }
  for(const mode of Object.keys(titles)){writePages('all',mode);for(let i=0;i<inventory.packs.length;i++)writePages(i,mode)}
  // Remove only generated pagination pages that no longer belong to the list.
  for(const file of fs.readdirSync(out,{withFileTypes:true}))if(file.isFile()&&/^(?:all|pack-\d+)-(?:all|motion|still|raw)-\d+\.html$/.test(file.name)&&!writtenPages.has(file.name))fs.unlinkSync(path.join(out,file.name))
  return {nav:navHTML(),cards:assets.slice(0,36).map(e=>cardHTML(e)).join(''),stats:statsHTML,result:`전체 묶음 · ${assets.length.toLocaleString()}개 · 1–36 표시`,pageLabel:`1 / ${Math.ceil(assets.length/36)} 페이지`,pageCount,animations:assets.filter(e=>e.kind==='motion').reduce((n,e)=>n+Object.keys(e.views).length,0)}
}
