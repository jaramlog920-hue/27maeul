import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {eventPreviewEntries} from './event-registry'
import './event-gallery.css'
import {EventThumbnail} from './EventThumbnail'
const entries=eventPreviewEntries()
const categories=['전체',...new Set(entries.map(e=>e.category))]
export function EventGallery(){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('전체'),[mode,setMode]=useState('전체')
 const visible=entries.filter(e=>(category==='전체'||e.category===category)&&(mode==='전체'||(mode==='도트 모션'?!!(e.kind||e.authored):!(e.kind||e.authored)))&&`${e.title} ${e.caption} ${e.id}`.toLowerCase().includes(query.toLowerCase()))
 const link=(id:string)=>`play.html?event=${encodeURIComponent(id)}`
 return <main className="event-gallery"><header><span>스물일곱 권의 마을</span><h1>모든 이벤트 미리보기</h1><p>앞으로 추가되는 이벤트도 이곳에 모입니다. 미리보기는 게임 진행과 저장을 바꾸지 않아요.</p>{visible.length>0&&<a className="gallery-play" href={link(visible[0]?.id??'completeBible')+'&sequence='+encodeURIComponent(visible.map(e=>e.id).join(','))}>지금 목록 순서대로 보기</a>}</header>
 <section className="gallery-controls" aria-label="이벤트 찾기"><label>검색<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="이벤트 이름이나 내용"/></label><label>보기<select value={mode} onChange={e=>setMode(e.target.value)}>{['전체','도트 모션','대화 장면'].map(s=><option key={s}>{s}</option>)}</select></label><nav aria-label="이벤트 분류">{categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</nav></section>
 <p className="gallery-count">{visible.length}개 이벤트 · 도트 모션 {visible.filter(e=>e.kind||e.authored).length}개</p>
 <section className="gallery-grid" aria-label="이벤트 목록">{visible.map(e=><a key={e.id} className="event-card" href={link(e.id)}>{e.image?<img loading="lazy" src={e.image} alt=""/>:<EventThumbnail entry={e}/>}<div><span>{e.fresh?'새로 추가 · ':''}{e.category} · {e.kind||e.authored?'도트 모션':'대화 장면 · 전용 그림 준비 중'}</span><h2>{e.title}</h2><p>{e.caption.replace(/\{[^}]+\}/g,'이웃')}</p></div></a>)}</section>
 {!visible.length&&<p>검색 결과가 없어요.</p>}</main>
}
const root=document.getElementById('root')
if(root)createRoot(root).render(<EventGallery/>)
