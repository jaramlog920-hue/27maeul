import {NEIGHBOR_ARRIVAL_IDS} from '../../render/neighbor-arrival-art'
import {BAKERY_DINNER_IDS} from '../../render/bakery-dinner-art'
import {FAMILY_ROOM_REMAINDER_IDS} from '../../render/family-room-remainder-art'
import {HOME_YARD_EVENT_IDS} from '../../render/home-yard-events-art'
import {SHOP_REMAINDER_IDS} from '../../render/shop-remainder-art'
import {TRAVEL_EVENT_IDS} from '../../render/travel-events-art'
import {LIBRARY_EVENT_IDS} from '../../render/library-events-art'
import {POSTMAN_EVENT_IDS} from '../../render/postman-events-art'
import {HILL_EVENT_IDS} from '../../render/hill-events-art'
import {HALL_EVENT_IDS} from '../../render/hall-events-art'
import {SQUARE_EVENT_IDS} from '../../render/square-events-art'
import {SHEEP_EVENT_IDS} from '../../render/sheep-events-art'
import {VINE_EVENT_IDS} from '../../render/vine-events-art'
import {OIL_EVENT_IDS} from '../../render/oil-events-art'
import {WOOD_EVENT_IDS} from '../../render/wood-events-art'
import {HERB_EVENT_IDS} from '../../render/herb-events-art'
import {BEE_EVENT_IDS} from '../../render/bee-events-art'
import {SHORE_EVENT_IDS} from '../../render/shore-events-art'
import {WEAVER_EVENT_IDS} from '../../render/weaver-events-art'
import {SMITH_EVENT_IDS} from '../../render/smith-events-art'
import {TEA_EVENT_IDS} from '../../render/tea-events-art'
import {BAKERY_EVENT_IDS} from '../../render/bakery-events-art'
import {HOME_ROOM_IDS} from '../../render/home-family-art'
import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {eventGalleryEntries} from './event-registry'
import './event-gallery.css'
import {EventThumbnail} from './EventThumbnail'
const entries=eventGalleryEntries()
const shopRemainderIds=new Set<string>(SHOP_REMAINDER_IDS)
const travelIds=new Set<string>(TRAVEL_EVENT_IDS)
const libraryIds=new Set<string>(LIBRARY_EVENT_IDS)
const postmanIds=new Set<string>(POSTMAN_EVENT_IDS)
const hillIds=new Set<string>(HILL_EVENT_IDS)
const hallIds=new Set<string>(HALL_EVENT_IDS)
const squareIds=new Set<string>(SQUARE_EVENT_IDS)
const sheepIds=new Set<string>(SHEEP_EVENT_IDS)
const vineIds=new Set<string>(VINE_EVENT_IDS)
const oilIds=new Set<string>(OIL_EVENT_IDS)
const woodIds=new Set<string>(WOOD_EVENT_IDS)
const herbIds=new Set<string>(HERB_EVENT_IDS)
const beeIds=new Set<string>(BEE_EVENT_IDS)
const shoreIds=new Set<string>(SHORE_EVENT_IDS)
const weaverIds=new Set<string>(WEAVER_EVENT_IDS)
const smithIds=new Set<string>(SMITH_EVENT_IDS)
const teaIds=new Set<string>(TEA_EVENT_IDS)
const bakeryIds=new Set<string>(BAKERY_EVENT_IDS)
const newHomeRoomIds=new Set<string>(HOME_ROOM_IDS)
const homeRoomIds=new Set<string>([...HOME_ROOM_IDS,'fam:read','pregnancy','childBorn','siblingBorn'])
const yardIds=new Set<string>(HOME_YARD_EVENT_IDS)
const familyRoomRemainderIds=new Set<string>(FAMILY_ROOM_REMAINDER_IDS)
const bakeryDinnerIds=new Set<string>(BAKERY_DINNER_IDS)
const arrivalIds=new Set<string>(NEIGHBOR_ARRIVAL_IDS)
const categories=['전체','새 이웃 이사','빵집 저녁','병상·아이네 저녁','새 마당','빵집·찻집 추가','새 여행','새 서고','새 편지 집','새 언덕','새 사랑방','새 광장','새 양 우리','새 포도원','새 기름 작업장','새 목공','새 약방','새 벌통','새 나루','새 베틀','새 대장간','새 찻집 26개','새 빵집 14개','새 가족방 29개','내 집·가족 방',...new Set(entries.map(e=>e.category))]
export function EventGallery(){
 const [query,setQuery]=useState(()=>new URLSearchParams(window.location.search).get('q')??''),[category,setCategory]=useState(()=>new URLSearchParams(window.location.search).get('background')==='neighbor-arrivals'?'새 이웃 이사':new URLSearchParams(window.location.search).get('background')==='bakery-dinner'?'빵집 저녁':new URLSearchParams(window.location.search).get('background')==='family-room-new'?'병상·아이네 저녁':new URLSearchParams(window.location.search).get('background')==='yard-new'?'새 마당':new URLSearchParams(window.location.search).get('background')==='shop-remainder'?'빵집·찻집 추가':new URLSearchParams(window.location.search).get('background')==='travel-new'?'새 여행':new URLSearchParams(window.location.search).get('background')==='library-new'?'새 서고':new URLSearchParams(window.location.search).get('background')==='postman-new'?'새 편지 집':new URLSearchParams(window.location.search).get('background')==='hill-new'?'새 언덕':new URLSearchParams(window.location.search).get('background')==='hall-new'?'새 사랑방':new URLSearchParams(window.location.search).get('background')==='square-new'?'새 광장':new URLSearchParams(window.location.search).get('background')==='sheep-new'?'새 양 우리':new URLSearchParams(window.location.search).get('background')==='vine-new'?'새 포도원':new URLSearchParams(window.location.search).get('background')==='oil-new'?'새 기름 작업장':new URLSearchParams(window.location.search).get('background')==='wood-new'?'새 목공':new URLSearchParams(window.location.search).get('background')==='herb-new'?'새 약방':new URLSearchParams(window.location.search).get('background')==='bee-new'?'새 벌통':new URLSearchParams(window.location.search).get('background')==='shore-new'?'새 나루':new URLSearchParams(window.location.search).get('background')==='weaver-new'?'새 베틀':new URLSearchParams(window.location.search).get('background')==='smith-new'?'새 대장간':new URLSearchParams(window.location.search).get('background')==='tea-new'?'새 찻집 26개':new URLSearchParams(window.location.search).get('background')==='bakery-new'?'새 빵집 14개':new URLSearchParams(window.location.search).get('background')==='home-new'?'새 가족방 29개':new URLSearchParams(window.location.search).get('background')==='home'?'내 집·가족 방':'전체'),[mode,setMode]=useState('전체')
 const visible=entries.filter(e=>(category==='전체'||(category==='새 이웃 이사'?arrivalIds.has(e.id):category==='빵집 저녁'?bakeryDinnerIds.has(e.id):category==='병상·아이네 저녁'?familyRoomRemainderIds.has(e.id):category==='새 마당'?yardIds.has(e.id):category==='빵집·찻집 추가'?shopRemainderIds.has(e.id):category==='새 여행'?travelIds.has(e.id):category==='새 서고'?libraryIds.has(e.id):category==='새 편지 집'?postmanIds.has(e.id):category==='새 언덕'?hillIds.has(e.id):category==='새 사랑방'?hallIds.has(e.id):category==='새 광장'?squareIds.has(e.id):category==='새 양 우리'?sheepIds.has(e.id):category==='새 포도원'?vineIds.has(e.id):category==='새 기름 작업장'?oilIds.has(e.id):category==='새 목공'?woodIds.has(e.id):category==='새 약방'?herbIds.has(e.id):category==='새 벌통'?beeIds.has(e.id):category==='새 나루'?shoreIds.has(e.id):category==='새 베틀'?weaverIds.has(e.id):category==='새 대장간'?smithIds.has(e.id):category==='새 찻집 26개'?teaIds.has(e.id):category==='새 빵집 14개'?bakeryIds.has(e.id):category==='새 가족방 29개'?newHomeRoomIds.has(e.id):category==='내 집·가족 방'?homeRoomIds.has(e.id):e.category===category))&&(mode==='전체'||(mode==='도트 모션'?!!(e.kind||e.authored):!(e.kind||e.authored)))&&`${e.title} ${e.caption} ${e.id}`.toLowerCase().includes(query.toLowerCase()))
 const link=(id:string)=>`play.html?event=${encodeURIComponent(id)}`
 return <main className="event-gallery"><header><span>스물일곱 권의 마을</span><h1>모든 이벤트 미리보기</h1><p>앞으로 추가되는 이벤트도 이곳에 모입니다. 미리보기는 게임 진행과 저장을 바꾸지 않아요.</p>{visible.length>0&&<a className="gallery-play" href={link(visible[0]?.id??'completeBible')+'&sequence='+encodeURIComponent(visible.map(e=>e.id).join(','))}>지금 목록 순서대로 보기</a>}</header>
 <section className="gallery-controls" aria-label="이벤트 찾기"><label>검색<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="이벤트 이름이나 내용"/></label><label>보기<select value={mode} onChange={e=>setMode(e.target.value)}>{['전체','도트 모션','그림 준비 중'].map(s=><option key={s}>{s}</option>)}</select></label><nav aria-label="이벤트 분류">{categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</nav></section>
 <p className="gallery-count">{visible.length}개 이벤트 · 도트 모션 {visible.filter(e=>e.kind||e.authored).length}개</p>
 <section className="gallery-grid" aria-label="이벤트 목록">{visible.map(e=><a key={e.id} className="event-card" href={link(e.id)}>{e.image?<img loading="lazy" src={e.image} alt=""/>:<EventThumbnail entry={e}/>}<div><span>{e.fresh?'새로 추가 · ':''}{e.category} · {e.kind||e.authored?'도트 모션':'그림 준비 중'}</span><h2>{e.title}</h2><p>{e.caption.replace(/\{[^}]+\}/g,'이웃')}</p></div></a>)}</section>
 {!visible.length&&<p>검색 결과가 없어요.</p>}</main>
}
const root=document.getElementById('root')
if(root)createRoot(root).render(<EventGallery/>)
