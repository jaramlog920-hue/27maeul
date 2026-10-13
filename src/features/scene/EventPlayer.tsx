import {useContext,useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {SCENES,callName,kidFill,spouseFill,partnerFill} from '../../content/text'
import {neighborById} from '../../content/catalog'
import {previewPerson} from './event-preview-art'
import {AuthoredStoryScene,StoryArtBeat,StoryArtChoice} from './AuthoredStoryScene'
import {hasAuthoredStory} from '../../render/authored-story-art'
import {LandscapeScene} from './StarsScene'
import {landscapeKind} from '../../render/scenic-moments-art'
import './event-gallery.css'
import '../../app/global.css'
const params=new URLSearchParams(location.search),id=params.get('event')??'completeBible',kind=landscapeKind(id)
const sequence=(params.get('sequence')??'').split(',').filter(Boolean),at=sequence.indexOf(id)
const next=at>=0&&at<sequence.length-1?sequence[at+1]:null
function finish(){location.href=next?`play.html?event=${encodeURIComponent(next)}&sequence=${encodeURIComponent(sequence.join(','))}`:'index.html'}
const fill=(text:string)=>partnerFill(spouseFill(kidFill(callName(text,'기록자'),'아이'),'배우자'),'이웃').replace(/\{[^}]+\}/g,'이웃')
function StoryPreview({cinematic=false}:{cinematic?:boolean}){
 const scene=SCENES[id], [page,setPage]=useState(0),[choice,setChoice]=useState<number|null>(null)
 const setArtBeat=useContext(StoryArtBeat),setArtChoice=useContext(StoryArtChoice)
 useEffect(()=>setArtBeat(page),[page,setArtBeat])
 useEffect(()=>setArtChoice(choice),[choice,setArtChoice])
 if(!scene)return <main className="story-preview"><h1>장면을 찾을 수 없어요.</h1><a href="index.html">목록으로</a></main>
 const lines=[...scene.lines,...(choice===null?[]:scene.choices?.[choice]?.reply??[])],line=lines[page]
 const more=page<lines.length-1,ask=!more&&choice===null&&!!scene.choices?.length
 return <section className={cinematic?"cinematic-scene-dialog story-overlay":"story-preview"}><span>저장하지 않는 미리보기</span><h1>{fill(scene.title)}</h1><section aria-label="이벤트 대화"><p className="story-speaker">{line&&line.speaker!=='narration'?neighborById(line.speaker)?.role??'이웃':''}</p><p>{fill(line?.text??'')}</p></section>
 {more?<button onClick={()=>setPage(page+1)}>다음 대사</button>:ask?scene.choices!.map((c,i)=><button key={i} onClick={()=>{setChoice(i);if(c.reply?.length)setPage(scene.lines.length)}}>{fill(c.label)}</button>):<button onClick={finish}>{next?'다음 이벤트':'목록으로 돌아가기'}</button>}
 <a href="index.html">모든 이벤트 목록</a></section>
}
createRoot(document.getElementById('root')!).render(<><a className="preview-home" href="index.html">모든 이벤트 목록</a>{hasAuthoredStory(id)?<AuthoredStoryScene id={id} title={fill(SCENES[id].title)} preview><StoryPreview cinematic/></AuthoredStoryScene>:kind?<LandscapeScene kind={kind} sceneId={id} personId={previewPerson(id)} preview titleOverride={SCENES[id]?fill(SCENES[id].title):undefined} finishLabel={next?'다음 이벤트':'목록으로 돌아가기'} previewAt={params.has('at')?Number(params.get('at')):undefined} onFinish={finish}>{SCENES[id]&&(SCENES[id].choices?.length||kind==='childLeaves'||kind==='childStays')?<StoryPreview cinematic/>:undefined}</LandscapeScene>:<StoryPreview/>}</>)
