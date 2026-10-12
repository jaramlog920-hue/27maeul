import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {png,draw} from './pixel-png.mjs'
const {bookReopenRows,BOOK_REOPEN_STAGES,BOOK_REOPEN_DURATIONS}=await import('../src/render/book-reopen-art.ts')
const {libraryPalette}=await import('../src/render/library-art.ts')
const {COVER_COLORS,COVER_PATTERNS,SPINE_DECOS}=await import('../src/engine/binding.ts')
const {BOOKS}=await import('../src/engine/types.ts')
const root='assets/book-reopen'
fs.mkdirSync(`${root}/frames`,{recursive:true});fs.mkdirSync(`${root}/sheets`,{recursive:true})
const names={cream:'크림',sage:'풀빛',sky:'하늘',lavender:'연보라',sand:'모래',slate:'회청',plain:'무늬 없음',lines:'줄무늬',dots:'점무늬',diamonds:'마름모',leather:'가죽',navy:'남색',bronze:'청동'}
const sequences=[]
function exportSequence(id,label,book,binding){
 const palette=libraryPalette(book,binding,2),frames=[],sheet=new Uint8Array(640*48*4)
 for(let f=0;f<10;f++){
  const rows=bookReopenRows(book,f,binding,2),pixels=new Uint8Array(64*48*4),file=`frames/${id}-${f}.png`
  draw(pixels,64,rows,palette);png(`${root}/${file}`,64,48,pixels);draw(sheet,640,rows,palette,f*64)
  frames.push({file,duration:BOOK_REOPEN_DURATIONS[f],stage:BOOK_REOPEN_STAGES[f],anchor:{x:32,y:41}})
 }
 const file=`sheets/${id}-sheet.png`;png(`${root}/${file}`,640,48,sheet)
 sequences.push({id,label,group:'books',book,binding:binding?.special,grade:2,loop:false,width:64,height:48,views:{default:frames},sheet:file})
}
for(const color of COVER_COLORS)for(const pattern of COVER_PATTERNS)for(const deco of SPINE_DECOS){const id=`${color}-${pattern}-${deco}`;exportSequence(id,`${names[color]||color} · ${names[pattern]||pattern} · ${names[deco]||deco} 표지 다시 펼치기`,'mt',{day:0,special:{color,pattern,deco}})}
for(const book of BOOKS)exportSequence(`default-${book}`,`${book} · 기본 표지 다시 펼치기`,book)
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({description:'책장에서 꺼내 꾸민 표지를 확인하고 다시 펼쳐 읽기',sequences},null,2))
const examples=[['cream','plain','leather'],['sage','diamonds','bronze'],['sky','lines','navy'],['lavender','dots','cream']]
const stages=[0,2,4,6,9],review=new Uint8Array(960*576*4)
for(let i=0;i<review.length;i+=4)review.set([246,237,218,255],i)
examples.forEach(([color,pattern,deco],i)=>{const binding={day:0,special:{color,pattern,deco}},pal=libraryPalette('mt',binding,2);stages.forEach((f,j)=>draw(review,960,bookReopenRows('mt',f,binding,2),pal,j*192,i*144,3))})
png(`${root}/reopen-review.png`,960,576,review)
const cards=sequences.map(s=>{const key=`book-reopen/sequences/books/${s.id}/////default`,hash=createHash('sha1').update(key).digest('hex').slice(0,20);return `<article><h3>${s.label}</h3><img width="256" height="192" src="../all-preview/motion/${hash}.png" alt="${s.label}"><p><a href="${s.sheet}">전체 프레임 PNG</a> · <a href="${s.views.default[2].file}">표지 확인</a></p></article>`}).join('')
fs.writeFileSync(`${root}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>꾸민 성경 다시 펼치기</title><style>body{background:#f6edda;color:#594234;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}article{background:#fff9ef;border:1px solid #dcc8ad;border-radius:10px;padding:14px;text-align:center}img{image-rendering:pixelated;background:#eee0c9}h3{font-size:14px}a{color:#427b79}</style><h1>꾸민 성경 다시 펼치기</h1><p>책장 → 책 꺼내기 → 꾸민 표지를 보여주기 → 표지 펼치기 → 한 장 넘기기 → 다시 읽기.</p><p>꾸미기 96조합과 27권 기본 표지. 표지를 1초간 보여준 뒤 펼칩니다. 다시 재생하려면 페이지를 새로고침하세요.</p><p><a href="../library/preview.html">표지·책등 꾸미기 보기</a> · <a href="../preview.html">모든 도트·모션 보기</a></p><main>${cards}</main></html>`)
fs.writeFileSync(`${root}/README.md`,`# 꾸민 성경 다시 펼치기\n\n96개 기존 표지 조합과 27권 기본 표지: 총 123세트, 64×48, 10프레임.\n\n원본 표지 그림을 그대로 보여준 뒤 책등 왼쪽을 축으로 표지를 회전시켜 펼칩니다. 펼친 후에도 표지 테두리와 선택한 장식색의 책갈피가 남습니다. 본문은 추상적인 잉크 선이며 실제 성경 텍스트가 아닙니다.\n\nmanifest.json의 views.default 순서와 duration(ms)를 사용합니다. loop:false이며 마지막 펼친 책 상태를 유지합니다. 다시 보기 요청 시 0프레임부터 재생합니다.\n\n기본 책등 금박은 grade:2로 내보냈습니다. 함수 bookReopenRows(book,frame,binding,grade,sealed)는 실제 보관한 책과 제본 값을 받아 다시 그릴 수 있습니다.\n\n게임의 책장 클릭 및 성경 읽기 화면은 연결하지 않았습니다.\n\n재생성: node scripts/export-book-reopen.mjs → node scripts/export-all-assets-preview.mjs\n`)
console.log(`책 다시 펼치기 ${sequences.length}세트 · ${sequences.length*10}프레임`)
