import type {Look} from './avatar'

export const BASIC_TOP_COUNT=22
export const COPY_OUTFIT_CHANCE=.05
export interface CopyOutfit {id:string;name:string;look:Look;theme:string;main:string;shade:string;trim:string;accent:string;cut:number;motif:number}
const themes=[
 ['별빛','별빛 시퀸 재킷','별빛 시퀸 미니드레스','#34466e','#202d4d','#e7eaf2','#a6ccea'],
 ['달빛','달빛 테일러드 수트','달빛 새틴 슬립드레스','#929bc3','#616d94','#f7f4ef','#d3c2e8'],
 ['오로라','오로라 윈드브레이커','오로라 오간자 드레스','#5c9f9a','#346c75','#e5f3ed','#c4a1de'],
 ['장미','장미 벨벳 블레이저','장미 벨벳 미니드레스','#9b4964','#612e4b','#eddddc','#e3a6b5'],
 ['민트','민트 봄버 재킷','민트 크롭 재킷 세트','#81b6b1','#4c898b','#f5eee3','#dcb6c9'],
 ['라벤더','라벤더 바시티 재킷','라벤더 트위드 투피스','#8175ba','#514976','#f5f0e7','#b8d0ca'],
 ['버건디','버건디 더블 수트','버건디 칵테일 드레스','#713f66','#462e48','#e4dce6','#d98899'],
 ['눈빛','스노화이트 패딩','스노화이트 퍼 재킷','#dce7eb','#9aafc6','#fffaf1','#9bcdd6'],
 ['선셋','선셋 레이싱 재킷','선셋 컬러블록 투피스','#c4664d','#843f3b','#f5ead9','#e9a46c'],
 ['오션','오션 데님 재킷','오션 데님 스커트 세트','#327d91','#244e68','#e4e9ed','#9fddd2'],
 ['에메랄드','에메랄드 가죽 재킷','에메랄드 가죽 재킷 세트','#527e5c','#335245','#dce5df','#a8c99a'],
 ['샌드','샌드 트렌치코트','샌드 벨트 원피스','#bc9e79','#81705b','#f2e9d8','#b4c8c4'],
 ['공작빛','피콕 새틴 재킷','피콕 새틴 슬립드레스','#3c7a7c','#2b4d63','#e5e6e9','#9992c9'],
 ['라일락','퍼플 그래픽 후디','라일락 후디 스커트','#a779ae','#6d4d83','#f4e6ef','#a2cee0'],
 ['컬러블록','컬러블록 트랙 세트','컬러블록 크롭 트랙 세트','#536788','#34415f','#e6e9ed','#d59aaf'],
 ['체크','브라운 체크 수트','브라운 체크 프레피 세트','#927148','#5c4939','#eadfcb','#b1c7bf'],
 ['스카이','스카이블루 니트 세트','스카이블루 니트 원피스','#a9cbd4','#7499b2','#fff5e8','#deb9cb'],
 ['허니','허니 코듀로이 재킷','허니 코듀로이 투피스','#be9a52','#866b3f','#f2e9d0','#bb765c'],
 ['미드나이트','미드나이트 하이넥 코트','미드나이트 테일러드 수트','#4b4469','#2e2c49','#d0d5e9','#bca6d8'],
 ['스테이지','핑크 스테이지 수트','핑크 스테이지 미니드레스','#b05e7b','#744562','#f2e5ed','#8ccdc1'],
] as const
const maleCuts=[0,0,2,0,2,2,0,4,2,4,4,1,4,3,2,0,3,4,1,0]
const femaleCuts=[0,1,2,0,3,3,1,4,3,3,4,1,1,4,3,3,4,3,3,0]
export const COPY_OUTFITS:readonly CopyOutfit[]=themes.flatMap(([theme,m,f,main,shade,trim,accent],i)=>[
 {id:`m-${i+1}`,name:m,look:'m' as const,theme,main,shade,trim,accent,cut:maleCuts[i],motif:i},
 {id:`f-${i+1}`,name:f,look:'f' as const,theme,main,shade,trim,accent,cut:femaleCuts[i],motif:i},
])
export const copyOutfitAt=(top:number)=>COPY_OUTFITS[top-BASIC_TOP_COUNT]
export const copyOutfitTop=(id:string)=>{const i=COPY_OUTFITS.findIndex(o=>o.id===id);return i<0?-1:BASIC_TOP_COUNT+i}
export const ownsCopyOutfit=(flags:Record<string,number>,id:string)=>flags[`copyOutfit:${id}`]===1
export function wardrobeTopIndices(flags:Record<string,number>){return [...Array.from({length:BASIC_TOP_COUNT},(_,i)=>i),...COPY_OUTFITS.flatMap((o,i)=>ownsCopyOutfit(flags,o.id)?[BASIC_TOP_COUNT+i]:[])]}
/** First completion only. Stable per saved world/book/chapter; reloading cannot reroll. */
export function copyOutfitReward(flags:Record<string,number>,book:string,chapter:number,seed:number,look:Look):CopyOutfit|null{
 let h=(2166136261^(seed>>>0))>>>0
 for(const c of `copy-outfit-v1:${book}:${chapter}`){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}
 const random=()=>{h=(h+0x6d2b79f5)>>>0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}
 if(random()>=COPY_OUTFIT_CHANCE)return null
 const missing=COPY_OUTFITS.filter(o=>!ownsCopyOutfit(flags,o.id)),preferred=missing.filter(o=>o.look===look),pool=preferred.length?preferred:missing
 return pool.length?pool[Math.floor(random()*pool.length)]:null
}
