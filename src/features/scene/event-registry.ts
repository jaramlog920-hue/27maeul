import {hasAuthoredStory} from '../../render/authored-story-art'
import {SCENES} from '../../content/text'
import {neighborById} from '../../content/catalog'
import moments from '../../content/scenic-moments.json'
import {landscapeKind,type LandscapeKind} from '../../render/scenic-moments-art'
export interface EventPreviewEntry {id:string;title:string;caption:string;kind:LandscapeKind|null;category:string;image?:string;fresh:boolean;authored?:boolean}
const images:Record<string,string>={firstOtBook:'progress-0.jpg',psalmRest:'progress-1.jpg',firstHomeBook:'progress-2.jpg',childLeaves:'progress-3.jpg',childStays:'progress-4.jpg',workSuccession:'progress-5.jpg',bibleLastLetter:'ending-0.jpg',completeBible:'ending-3.jpg',lastManuscript:'21-last-manuscript.jpg',fullLibrary:'25-library-photo.jpg',readingFinished:'living-0.jpg',firstDinner:'living-1.jpg',coverFinished:'living-2.jpg',childLetterReceived:'living-3.jpg',facilityFinished:'living-4.jpg'}
function category(id:string,kind:LandscapeKind|null){
 if(['completeBible','bibleLastLetter','fullLibrary','lastManuscript'].includes(kind??''))return '완성과 엔딩'
 if(['readingFinished','firstDinner','coverFinished','childLetterReceived','facilityFinished'].includes(kind??''))return '생활과 이웃'
 if(id.startsWith('workSuccession:')||kind==='workSuccession'||/^(fam:|wedding:)/.test(id)||/child|baby|spouse|firstMorning|family/.test(id))return '가족과 성장'
 if(/^(ev:|saw:|confess:|romance|date:|loverTrust:)/.test(id)||kind==='firstConfession'||kind==='dateSunset')return '이웃 이야기와 연애'
 if(/Book|Ot|psalm|shelv|Chapter|Bound|manuscript|bind/i.test(id))return '책과 필사'
 return '마을과 풍경'
}
/** 게임의 두 콘텐츠 목록을 직접 읽는다. 이벤트를 추가하면 미리보기도 자동으로 생긴다. */
export function eventPreviewEntries():EventPreviewEntry[]{
 const ids=new Set([...Object.keys(SCENES),...Object.keys(moments),'stars','sunset'])
 return [...ids].map(id=>{
  const kind=landscapeKind(id),m=kind&&kind in moments?moments[kind as keyof typeof moments]:null,scene=SCENES[id]
  const displayTitle=({feastFire:'복음서 4권 잔치',allFeastFire:'27권 완성 잔치'} as Record<string,string>)[id]
  const baseTitle=(displayTitle??scene?.title??m?.title??(id==='stars'?'별 보는 밤':'호숫가 노을')).replace(/\{[^}]+\}/g,'기록자')
  const suffix=id.split(':').slice(1).map(part=>neighborById(part)?.role??({longBench:'긴 벤치',flowerBed:'화단',shade:'그늘막',signPost:'표지판'} as Record<string,string>)[part]).filter(Boolean).join(' · ')
  const title=suffix?`${baseTitle} · ${suffix}`:baseTitle
  return {id,title,authored:hasAuthoredStory(id),caption:scene?.lines[0]?.text??m?.caption??'',kind,category:category(id,kind),image:kind&&images[kind]&&!/^(firstDinner|facilityFinished):/.test(id)?`/event-previews/${images[kind]}`:undefined,fresh:['readingFinished','firstDinner','coverFinished','childLetterReceived','facilityFinished'].includes(kind??'')}
 }).sort((a,b)=>Number(b.fresh)-Number(a.fresh)||Number(!!b.kind||!!b.authored)-Number(!!a.kind||!!a.authored)||a.title.localeCompare(b.title,'ko'))
}

