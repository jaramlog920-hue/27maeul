import {neighborById} from '../../content/catalog'
import {slotPerson} from '../../engine/gen-growth'
import {useState} from 'react'
import {useGame,albumImage} from '../../store/game-store'
import {SCENES} from '../../content/text'

const MUST_MEMORIES=[/^firstChapter$/,/^wedding:/,/^(childBorn|babyBorn)$/,/^(allFeast|fullLibrary)$/,/^firstOtBook$/]

/** 이미 본 장면과 완성 당시 기록만 보여 주는 엔딩 앨범. */
export function EndingMemories({preview=false}:{preview?:boolean}) {
  const game=useGame(s=>s.game)
  const [page,setPage]=useState(0)
  const endDay=game.flags.bibleCompletedDay??game.clock.day
  const memories=game.album.filter(a=>a.day<=endDay && a.id!=='completeBible' && SCENES[a.id]?.album)
  const pool=memories.filter(a=>!['stars','sunset','rainCopy','springWalk','summerCreek','autumnPath'].includes(a.id))
  // 큰 순간(첫 장·결혼·아이·스물일곱 권·첫 구약 책)은 꼭 넣고 나머지를 최근 것으로 — 마지막 여덟 장만 보이면 오래 한 판의 처음이 빠졌다 (2026-10-27 플레이 점검 25)
  const must=MUST_MEMORIES.map(re=>pool.find(a=>re.test(a.id))).filter((a):a is typeof pool[number]=>!!a)
  const chosen=[...must,...pool.filter(a=>!must.includes(a)).slice(-Math.max(0,8-must.length))].sort((a,b)=>a.day-b.day)
  const entries=preview?[{id:'lastManuscript',day:12},{id:'fullLibrary',day:120},{id:'bibleLastLetter',day:365}]:chosen.length?chosen:memories.slice(-8)
  const at=Math.min(page,Math.max(0,entries.length-1)),entry=entries[at]
  const image=preview?['/artifacts/scenery/21-last-manuscript.jpg','/artifacts/scenery/25-library-photo.jpg','/artifacts/scenery/27-first-desk.jpg'][at]:entry?albumImage(entry.id):null
  const verses=preview?31102:game.flags.bibleEndingVerses??game.copyStats.verses
  const days=preview?365:game.flags.bibleEndingDays??(game.copyStats.firstDay===null?0:endDay-game.copyStats.firstDay+1)
  const neighbors=preview?['이웃들','배우자','아이']:Object.entries(game.hearts).filter(([,heart])=>heart>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id])=>game.gen?.persons[slotPerson(game.gen,id)]?.name??neighborById(id)?.role).filter(Boolean)
  return <section className="ending-memories" aria-label="엔딩 추억 앨범">
    <h3>{preview?'추억 앨범 · 미리보기 예시':'내가 살아온 마을'}</h3>
    <p className="ending-record">신약 27권 · 구약 39권<br/>{verses.toLocaleString('ko-KR')}절을 적은 기록{days>0?` · ${days}일의 시간`:''}</p>
    {entry?<><figure>{image&&<img src={image} alt={SCENES[entry.id]?.album??'마을의 기억'}/>}<figcaption>{SCENES[entry.id]?.album??'마을의 기억'} · {entry.day}일째</figcaption></figure>
      <nav aria-label="추억 넘기기"><button disabled={at===0} onClick={()=>setPage(at-1)}>이전 기억</button><span>{at+1} / {entries.length}</span><button disabled={at===entries.length-1} onClick={()=>setPage(at+1)}>다음 기억</button></nav></>:<p>기록한 장면은 없어도, 한 장씩 채워 온 시간이 여기 남아 있다.</p>}
    <p>{neighbors.length?`함께한 이웃 · ${neighbors.join(' · ')}`:'함께 살아온 사람들과, 이제 함께 읽을 책들.'}</p>
  </section>
}
