import {drawLivingMoment,LIVING_PHOTO_TIME,type LivingDetails} from '../../render/living-moments-art'
import {LIVING_KINDS,type LivingKind} from '../../engine/scenic-kinds'
import {FACILITY_IDS,type FacilityId} from '../../engine/village-sites'
import {livingGuests} from '../../engine/living-moments'
import {COVER_COLORS,COVER_PATTERNS,SPINE_DECOS,BOOK_DETAIL_CHOICES,type Binding} from '../../engine/binding'
import {KID_LETTERS,SCENES} from '../../content/text'
import {drawProgressMilestone,PROGRESS_PHOTO_TIME,type ProgressDetails} from '../../render/progress-milestones-art'
import {PROGRESS_KINDS,type ProgressKind} from '../../engine/scenic-kinds'
import {OT_BOOKS,otRow} from '../../engine/ot-books'
import {genAvatar} from '../../engine/gen-looks'
import {libraryPalette} from '../../render/library-art'
import {copyBookName,withObject,withSubject} from '../../content/text'
import {EndingMemories} from './EndingMemories'
import { drawCompleteBible, drawBibleLastLetter, completeBiblePhase, BIBLE_CAPTIONS, BIBLE_PHOTO_TIME } from '../../render/complete-bible-art'
import { BOOKS } from '../../engine/types'
import type { Grade } from '../../engine/library'
import { drawLibraryFinale, libraryFinalePhase, LIBRARY_CAPTIONS, LIBRARY_PHOTO_TIME, type LibraryFinaleCast } from '../../render/library-finale-art'
import { notYet } from '../../engine/game'
import { playerChildAvatar, playerChildSprite } from '../../render/player-child-look'
import { childStage } from '../../engine/child'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { drawStargazing } from '../../render/stargazing-art'
import { drawSunset } from '../../render/sunset-scene-art'
import { drawMoment, type MomentKind, type LandscapeKind } from '../../render/scenic-moments-art'
import moments from '../../content/scenic-moments.json'
import { appearanceSprite, shownDef } from '../../render/neighbor-look'
import { CONTENT, neighborById } from '../../content/catalog'
import { withLookDefaults } from '../../engine/avatar'
import { slotPerson } from '../../engine/gen-growth'
import type { Who } from '../../render/sprites'
import { albumImage, storeAlbumImage, useGame } from '../../store/game-store'
import './stars-scene.css'

export function LandscapeScene({ kind = 'stars', sceneId = kind, onFinish, preview = false, personId, acceptGift = true, children, titleOverride, previewAt, finishLabel }: { kind?: LandscapeKind; sceneId?: string; onFinish?: () => void; preview?: boolean; personId?: string; acceptGift?: boolean; children?: ReactNode; titleOverride?: string; previewAt?: number;finishLabel?:string }) {
  const avatar = useGame(s => s.game.avatar)
  const day = useGame(s => s.game.clock.day)
  // 새 터에서 본 장면은 그 자리로 돌아간다 — '마을로'라고 쓰면 첫 마을로 옮겨 가는 것처럼 읽혔다 (2026-10-27 플레이 점검)
  const away = useGame(s => (s.game.map ?? 'village') !== 'village')
  const nextScene = useGame(s => s.nextScene)
  const remembered = useGame(s => s.game.album.some(a => a.id === sceneId))
  const [phase, setPhase] = useState(0)
  const [replay, setReplay] = useState(0)
  const [endingAt,setEndingAt] = useState<number|null>(null)
  const hearts = useGame(s => s.game.hearts)
  const flags = useGame(s => s.game.flags)
  const grades = useGame(s => s.game.shelved)
  const bindings=useGame(s=>s.game.bound)
  const copyDays=useGame(s=>s.game.copy.days)
  const livingKind=(LIVING_KINDS as readonly string[]).includes(kind)
  const facilityRaw=sceneId.split(':')[1]
  const facility=(FACILITY_IDS as readonly string[]).includes(facilityRaw)?facilityRaw as FacilityId:'longBench'
  const village=useGame(s=>s.game.village)
  const coverBook=BOOKS[flags.coverMomentBook??(preview?BOOKS.indexOf('phm'):0)]??BOOKS[0]
  const progressKind=(PROGRESS_KINDS as readonly string[]).includes(kind)
  const homeBook=BOOKS[flags.firstHomeBookIndex??(preview?BOOKS.indexOf('phm'):0)]??BOOKS[0]
  const firstOt=OT_BOOKS[flags.firstOtBookIndex??0]??OT_BOOKS[0]
  const libraryCompletion = useGame(s => s.game.scenes.includes('fullLibrary'))
  const married = useGame(s => s.game.romance.stage === 'married')
  const romancePartnerId = useGame(s => s.game.romance.partner)
  const partnerId = personId ?? romancePartnerId
  const shelfCount = useGame(s => Object.keys(s.game.shelved).length)
  const gen = useGame(s => s.game.gen)
  const child = useGame(s => s.game.child)
  const looks = useGame(s => s.game.looks)
  const helpKind = useGame(s => s.game.flags.childHelpKind ?? 1)
  const babyName = useGame(s => s.game.child?.name ?? '아기')
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    const def = shownDef(neighborById(partnerId ?? (preview ? 'wendell' : '')))
    const partnerForced = looks?.[partnerId ?? ''] ? undefined : appearanceSprite(neighborById(partnerId ?? ''), !!gen?.retired?.[partnerId ?? ''])
    const person = partnerId ? gen?.persons[slotPerson(gen, partnerId)] : null
    const partner = def?.look ? withLookDefaults({ name: def.role, look: person?.look ?? def.look, ...def.avatar, ...person?.avatar, ...looks?.[partnerId ?? ''], ...(person?.hair ? { hairColor: person.hair } : {}) }) : null
    const partnerWho: Who = partnerForced ?? (def && ['merchant', 'presser', 'postman'].includes(def.id) && !def.avatar && !person?.avatar && !looks?.[partnerId ?? ''] && !gen?.retired?.[def.id] ? def.id as Who : 'writer')
    const stage = child ? childStage(child, day) : 'helper'
    const childSprite = playerChildSprite(stage, !!looks?.child)
    const family = { baby: !preview && !!child && stage === 'baby', helpKind,
      childGrowth: stage === 'adult' ? 3 : 1, childWho: childSprite.who, childShort: childSprite.short,
      childAvatar: playerChildAvatar({ child, avatar, looks }), helpSecond: !preview && day % 2 === 1 }
    const attendingPartner = married || preview ? partnerId ?? def?.id : null
    const guests = CONTENT.neighbors.filter(n => n.id !== 'child' && n.id !== attendingPartner && !n.marketOnly && (preview || !notYet(n, flags.villageLevel ?? 0, flags)))
      .sort((a, b) => (hearts[b.id] ?? 0) - (hearts[a.id] ?? 0) || (a.id === 'grandpa' ? -1 : b.id === 'grandpa' ? 1 : a.id.localeCompare(b.id)))
      .slice(0, 3).map(def => {
        const current = gen?.persons[slotPerson(gen, def.id)]
        const custom = looks?.[def.id]
        const shown = shownDef(def), forced = custom ? undefined : appearanceSprite(def, !!gen?.retired?.[def.id])
        const avatar = withLookDefaults({ look: current?.look ?? shown.look ?? 'm', name: current?.name ?? def.role, ...shown.avatar, ...current?.avatar, ...custom, ...(current?.hair ? { hairColor: current.hair } : {}) })
        return { avatar, who: forced ?? (!shown.avatar && !current?.avatar && !custom && !gen?.retired?.[def.id] ? shown.sprite as Who : 'writer' as const) }
      })
    const cast: LibraryFinaleCast = { guests, spouse: married || preview ? { avatar: partner, who: partnerWho } : null,
      child: (child && !child.left) || preview ? { avatar: family.childAvatar, who: family.childWho, short: family.childShort } : null,
      baby: family.baby, babyName }
    const parentId=sceneId.startsWith('workSuccession:')?sceneId.slice('workSuccession:'.length):'baker'
    const parentDef=neighborById(parentId),old=gen?.persons[parentId]
    const heirId=gen?.retired?.[parentId]?.heir,heir=heirId?gen?.persons[heirId]:undefined
    const parentAvatar=old?withLookDefaults({...genAvatar(old),hairColor:[0,0,68]}):parentDef?withLookDefaults({name:parentDef.role,look:parentDef.look??'f',...parentDef.avatar,hairColor:[0,0,68]}):null
    const details:ProgressDetails={bookColor:libraryPalette(homeBook,bindings[homeBook],grades[homeBook]).c,
      childAvatar:family.childAvatar,parentAvatar,
      heirAvatar:heir?withLookDefaults({...genAvatar(heir),...looks?.[parentId]}):preview?withLookDefaults({look:'f',name:'이웃의 자녀',skin:1,hairFront:3,hairBack:3,top:4,bottom:1}):null}
    const resolvePerson=(id:string)=>{
      const raw=neighborById(id)
      if(!raw)return null
      const p=gen?.persons[slotPerson(gen,id)],custom=looks?.[id]
      const def=shownDef(raw),forced=custom?undefined:appearanceSprite(raw,!!gen?.retired?.[id])
      return {avatar:withLookDefaults({name:p?.name??def.role,look:p?.look??def.look??'m',...def.avatar,...p?.avatar,...custom,...(p?.hair?{hairColor:p.hair}:{})}),who:forced??(!def.avatar&&!p?.avatar&&!custom&&!gen?.retired?.[id]?def.sprite as Who:'writer' as const)}
    }
    const participants=preview?['grandpa','baker','wendell']:livingGuests({flags},CONTENT,kind==='facilityFinished'?`facilityMomentCrew:${facility}:`:'readingMomentGuest:')
    const special:Binding={day:day,special:flags.coverMoment?{color:COVER_COLORS[flags.coverMomentColor]??'cream',pattern:COVER_PATTERNS[flags.coverMomentPattern]??'plain',deco:SPINE_DECOS[flags.coverMomentDeco]??'cream',detail:BOOK_DETAIL_CHOICES[flags.coverMomentDetail]??'none'}:{color:'sky',pattern:'diamonds',deco:'bronze',detail:'metalCorners'}}
    const living:LivingDetails={guests:participants.map(resolvePerson).filter((p):p is NonNullable<typeof p>=>!!p),host:resolvePerson(sceneId.startsWith('firstDinner:')?sceneId.split(':')[1]:'grandpa'),book:coverBook,binding:special,facility,decor:!!village?.projects[facility]?.look}
    const finaleGrades = preview ? Object.fromEntries(BOOKS.map((book, i) => [book, i % 3 as Grade])) : grades
    let frame = 0, last = -1000, captured = remembered && (kind === 'fullLibrary' || kind === 'lastManuscript' || kind === 'completeBible' || kind === 'bibleLastLetter' || progressKind || livingKind) && !!albumImage(sceneId), previousPhase = -1
    const step = (now: number) => {
      if (now - last >= 80) {
        last = now
        const bounds = canvas.getBoundingClientRect()
        const width = 320, height = Math.max(180, Math.round(width * (bounds.height || 180) / (bounds.width || 320)))
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
        const elapsed = kind === 'firstConfession' && !acceptGift ? 0 : preview && previewAt !== undefined && replay === 0 ? previewAt : reduced ? (kind === 'completeBible' ? BIBLE_PHOTO_TIME : kind === 'fullLibrary' ? LIBRARY_PHOTO_TIME : livingKind?LIVING_PHOTO_TIME:progressKind?PROGRESS_PHOTO_TIME:4) : (now - start) / 1000
        const time=kind==='completeBible'?(endingAt??(preview&&previewAt!==undefined&&replay===0?elapsed:Math.min(elapsed,30))):elapsed
        if(livingKind)drawLivingMoment(g,kind as LivingKind,width,height,time,avatar,living)
        else if(progressKind)drawProgressMilestone(g,kind as ProgressKind,width,height,time,avatar,details)
        else if (kind === 'bibleLastLetter') drawBibleLastLetter(g,width,height,time,avatar,finaleGrades,cast)
        else if (kind === 'completeBible') {
          drawCompleteBible(g, width, height, time, avatar, finaleGrades, cast)
          const at = completeBiblePhase(time)
          if (at !== previousPhase) { previousPhase = at; setPhase(at) }
        }
        else if (kind === 'fullLibrary') {
          drawLibraryFinale(g, width, height, time, avatar, finaleGrades, flags.libraryLastBook ?? 26, cast)
          const at = libraryFinalePhase(time)
          if (at !== previousPhase) { previousPhase = at; setPhase(at) }
        }
        else if (kind === 'lastManuscript') drawMoment(g, 'bookBound', width, height, time * 2, avatar, partner, babyName)
        else if (kind === 'sunset') drawSunset(g, width, height, time, avatar)
        else if (kind === 'stars') drawStargazing(g, width, height, time, avatar, day)
        else drawMoment(g, kind as MomentKind, width, height, time, avatar, partner, babyName, partnerWho, preview ? 17 : shelfCount, !!children, family, /^ev:.*:confess$/.test(sceneId)?partnerId??undefined:undefined)
        if (!captured && !preview && (kind === 'fullLibrary' || kind === 'lastManuscript' || kind === 'completeBible' || kind === 'bibleLastLetter' || progressKind || livingKind)) {
          const photo = document.createElement('canvas'); photo.width = width; photo.height = height
          const pg = photo.getContext('2d')
          if (pg) {
            if(livingKind)drawLivingMoment(pg,kind as LivingKind,width,height,LIVING_PHOTO_TIME,avatar,living)
            else if(progressKind)drawProgressMilestone(pg,kind as ProgressKind,width,height,PROGRESS_PHOTO_TIME,avatar,details)
            else if (kind === 'bibleLastLetter') drawBibleLastLetter(pg,width,height,3,avatar,finaleGrades,cast)
            else if (kind === 'completeBible') drawCompleteBible(pg, width, height, BIBLE_PHOTO_TIME, avatar, finaleGrades, cast)
            else if (kind === 'fullLibrary') drawLibraryFinale(pg, width, height, LIBRARY_PHOTO_TIME, avatar, finaleGrades, flags.libraryLastBook ?? 26, cast)
            else drawMoment(pg, 'bookBound', width, height, 8, avatar, partner, babyName)
            storeAlbumImage(sceneId, photo.toDataURL('image/png')); captured = true
          }
        }
        if (!captured && !preview && (!['bookBound', 'spouseReturn', 'childFirstHelp', 'afterCopy'].includes(kind) || time >= 4)) { storeAlbumImage(sceneId, canvas.toDataURL('image/png')); captured = true }
      }
    }
    // 그리다 한 번 실패해도 장면 창은 남고 다음 틀에서 다시 그린다 (2026-10-19 감사 L-33)
    let failed = false
    const draw = (now: number) => {
      try { step(now) } catch (e) { if (!failed) { failed = true; console.error(e) } }
      if (!reduced) frame = requestAnimationFrame(draw)
    }
    draw(start)
    const resize = () => { if (reduced) { last = -1000; draw(performance.now()) } }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [avatar, day, kind, sceneId, preview, partnerId, gen, babyName, shelfCount, acceptGift, !!children, child, helpKind, looks, hearts, flags, grades, married, replay, previewAt, remembered, endingAt, progressKind, homeBook, bindings, livingKind, coverBook, facility, village])
  const sunset = kind === 'sunset' || kind === 'dateSunset'
  const moment = kind === 'stars' || kind === 'sunset' ? null : moments[kind]
  // 집 넓히기는 배우자방·아이방·생활방이 같은 그림이라, 어느 방이 생겼는지 제목·글은 그 방 장면(home:N)에서 (2026-10-27 플레이 점검 16)
  const roomScene = kind === 'homeExpanded' ? SCENES[sceneId] : undefined
  const title = titleOverride ?? roomScene?.album ?? moment?.title ?? (sunset ? '호숫가 노을' : '별 보는 밤')
  const parentId=sceneId.startsWith('workSuccession:')?sceneId.slice('workSuccession:'.length):'baker'
  const parentPerson=gen?.persons[parentId],heirPerson=gen?.persons[gen?.retired?.[parentId]?.heir??'']
  const facilityName={longBench:'긴 벤치',flowerBed:'화단',shade:'그늘막',signPost:'표지판'}[facility]
  const letterBody=KID_LETTERS[((flags.childLetterMomentDay??day)*7)%KID_LETTERS.length]
  const livingCaption=kind==='childLetterReceived'?`${child?.name??'아이'}의 편지: “${letterBody}”`:kind==='facilityFinished'?`${withSubject(facilityName)} 완성됐다. 손을 보탠 이웃들과 이제 함께 쓸 자리를 바라보았다.`:kind==='coverFinished'?`${withObject(copyBookName(coverBook))} 새로 꾸몄다. 내가 고른 색과 무늬가 책에 남았다.`:moment?.caption
  const progressCaption=kind==='firstOtBook'?`${otRow(firstOt).name}, 첫 책이 빈 서고에 놓였다. 아직 남은 자리가 많지만, 시작한 한 권이 여기 남았다.`:
    kind==='firstHomeBook'?`${withObject(copyBookName(homeBook))} 내 방에 놓았다. ${copyDays?.[homeBook]?.start?`${copyDays[homeBook]!.start}일째 시작한 책.`:''} ${copyDays?.[homeBook]?.end?`${copyDays[homeBook]!.end}일째 마지막 장을 마쳤다.`:''}`:
    kind==='workSuccession'?`${parentPerson?.name??neighborById(parentId)?.role??'이웃'}의 일터에 ${withSubject(heirPerson?.name??(preview?'자녀':'다음 사람'))} 섰다. 일을 내려놓은 부모도 곁에 남아 그 시작을 바라보았다.`:moment?.caption
  return <section className={`stars-scene${preview ? ' scenic-preview' : ''}${kind !== 'stars' && kind !== 'rainCopy' && kind !== 'babySleep' ? ' sunset-scene' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
    <canvas ref={ref} width={320} height={180} aria-hidden="true" />
    {children ? children : <><header className="stars-scene-title"><span>{moment?.location ?? (sunset ? '호숫가 정자에서' : '언덕에서')}</span><h2>{title}</h2></header>
    {kind==='completeBible'&&phase===3&&<EndingMemories preview={preview}/>}
    <div className="stars-scene-caption">
      <p>{kind === 'completeBible' ? BIBLE_CAPTIONS[phase] : kind === 'fullLibrary' ? LIBRARY_CAPTIONS[phase] : (livingKind?livingCaption:progressKind?progressCaption:roomScene?.lines[0]?.text??moment?.caption) ?? (sunset ? '물결 위로 주황빛이 번졌다.' : '언덕에 앉아 별을 올려다보았다.')}</p>
      {(kind === 'fullLibrary' || kind === 'lastManuscript' || kind === 'completeBible' || kind === 'bibleLastLetter' || progressKind || livingKind) && <button className="scene-replay" onClick={() => {setEndingAt(null);setReplay(n => n + 1)}}>장면 다시 보기</button>}
      <button autoFocus onClick={kind==='completeBible'?()=>{if(phase<3)setEndingAt(30);else if(phase===3)setEndingAt(36);else (onFinish??nextScene)()}:onFinish??nextScene}>{kind==='completeBible'&&phase<3?'추억 앨범 펼치기':kind==='completeBible'&&phase===3?'다음 날 아침으로':finishLabel?finishLabel:preview ? kind === 'completeBible'||kind==='workSuccession' ? '장면 모아보기' : '다음 장면' : kind === 'fullLibrary' && libraryCompletion ? '완성 기록 보기' : away ? '돌아가기' : '마을로 돌아가기'} <span aria-hidden="true">›</span></button>
    </div></>}
  </section>
}
