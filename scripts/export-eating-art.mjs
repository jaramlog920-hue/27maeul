import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import {png,draw} from './pixel-png.mjs'
const {eatingFrame,EAT_FOODS}=await import('../src/render/eating-art.ts')
const {writerPalette}=await import('../src/render/sprites.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const {withLookDefaults}=await import('../src/engine/avatar.ts')
const root='assets/eating',sequences=[]
for(const folder of ['frames','layers','sheets'])fs.mkdirSync(`${root}/${folder}`,{recursive:true})
const props={...FURNI_PALETTE,z:'#5a4638'}
const looks={female:withLookDefaults({look:'f',name:'여성',skin:2,hairFront:8,hairBack:4,top:13,bottom:4}),male:withLookDefaults({look:'m',name:'남성',skin:4,hairFront:3,hairBack:0,top:10,bottom:6})}
const review=new Uint8Array(576*192*4)
for(let i=0;i<review.length;i+=4)review.set([246,237,218,255],i)
for(const [gender,avatar]of Object.entries(looks))for(const[food,label]of Object.entries(EAT_FOODS)){
 const id=`${gender}-${food}`,pal=writerPalette('spring',avatar),seq={id,label:`${gender==='female'?'여성':'남성'} · ${label}`,group:'motions',width:24,height:24,loop:false,views:{},sheets:{}}
 for(const facing of ['down','up','left','right']){
  const sheet=new Uint8Array(144*24*4);seq.views[facing]=[]
  for(let f=0;f<6;f++){
   const a=eatingFrame('writer',facing,f,{avatar,frame:0,blink:false,season:'spring'},food),p=new Uint8Array(24*24*4),layers={}
   for(const[key,rows]of [['back',a.propBack],['actor',a.actor],['front',a.propFront]]){
    const colors=key==='actor'?pal:props,file=`layers/${id}-${facing}-${key}-${f}.png`,layer=new Uint8Array(24*24*4)
    draw(layer,24,rows,colors);png(`${root}/${file}`,24,24,layer);layers[key]=file
    draw(p,24,rows,colors);draw(sheet,144,rows,colors,f*24)
    if(food==='bread'&&facing==='down')draw(review,576,rows,colors,f*96,gender==='female'?0:96,4)
   }
   const file=`frames/${id}-${facing}-${f}.png`;png(`${root}/${file}`,24,24,p)
   seq.views[facing].push({file,layers,duration:a.duration,anchor:a.anchor})
  }
  const file=`sheets/${id}-${facing}-sheet.png`;png(`${root}/${file}`,144,24,sheet);seq.sheets[facing]=file
 }
 sequences.push(seq)
}
png(`${root}/eating-review.png`,576,192,review)
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({description:'먹기 버튼에 연결된 음식 들기·한입·씹기·손 내리기',sequences},null,2))
fs.writeFileSync(`${root}/README.md`,'# 먹기 모션\n\n남녀 예시 × 빵·무화과·그릇·꿀 = 8세트, 각 4방향 6프레임. 인물 외형은 게임 주인공의 값을 사용합니다. 원본 24×24 PNG 및 분리 레이어.\n\n순서: back → actor → front. actor는 인물 팔레트, 소품은 가구 팔레트. 재생 시간 합계 1900ms, loop:false. 기존 옷·목선을 보존하고 작은 손과 음식을 입 가까이 올립니다.\n\n통합 미리보기: ../preview.html#pack=eating\n\n재생성: node scripts/export-eating-art.mjs → node scripts/export-all-assets-preview.mjs\n')
console.log('먹기 모션 8세트 · 4방향 · 6프레임')
