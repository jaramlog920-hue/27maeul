import {storyLocationContext,type StoryLocationContext} from '../../render/story-location-context'
import {weddingOutfitsFor} from '../../engine/wedding-attire'
import {weddingDressedAvatar} from '../../render/wedding-outfits'
import {WeddingAttirePicker} from './WeddingAttirePicker'
import {sceneLocationContext} from '../../render/scene-location-context'
import type {SharedBackgroundSceneSnapshot} from '../../render/shared-background-scene'
import {SharedBackgroundStoryScene} from './SharedBackgroundStoryScene'
import {isNeighborArrival} from '../../render/neighbor-arrival-art'
import {isBakeryDinner} from '../../render/bakery-dinner-art'
import {isFamilyRoomRemainder} from '../../render/family-room-remainder-art'
import {isHomeYardEvent} from '../../render/home-yard-events-art'
import {homeYardEventContext} from '../../render/home-yard-event-context'
import {isShopRemainder,isShopDate} from '../../render/shop-remainder-art'
import {isTravelEvent} from '../../render/travel-events-art'
import {isLibraryEvent} from '../../render/library-events-art'
import {isPostmanEvent} from '../../render/postman-events-art'
import {isHillEvent,isHillDate,isHillFamilyKid} from '../../render/hill-events-art'
import {isHallEvent} from '../../render/hall-events-art'
import {isSquareEvent,isSquareFamilyKid} from '../../render/square-events-art'
import {WALK_FINDS} from '../../engine/family'
import {isSheepEvent} from '../../render/sheep-events-art'
import {isVineEvent} from '../../render/vine-events-art'
import {isOilEvent} from '../../render/oil-events-art'
import {isWoodEvent} from '../../render/wood-events-art'
import {isHerbEvent} from '../../render/herb-events-art'
import {isBeeEvent} from '../../render/bee-events-art'
import {isShoreEvent} from '../../render/shore-events-art'
import {isWeaverEvent} from '../../render/weaver-events-art'
import {isSmithEvent} from '../../render/smith-events-art'
import {isTeaEvent} from '../../render/tea-events-art'
import {bakerBabyAt,BAKER_BABY_ID} from '../../engine/gen'
import {isBakeryEvent} from '../../render/bakery-events-art'
import {isHomeRoom,isHomeRoomKid,isHomeRoomActivity,HOME_ROOM_MEAL_IDS} from '../../render/home-family-art'
import {SCENES} from '../../content/text'
import {isIndoor} from '../../engine/world'
import {isWet,weatherOf} from '../../engine/calendar'
import {notYet,hallGuestsToday} from '../../engine/game'
import {birthFamilyCast} from '../../render/birth-family-cast'
import {timedGathering,gatheringPhoto} from '../../render/timed-gathering-art'
import {createContext,useEffect,useMemo,useRef,useState,type ReactNode,type ComponentProps} from 'react'
import {isSharedBackgroundStory} from '../../render/shared-background-draft-art'
import {sharedBackgroundSceneSnapshot,drawSharedBackgroundScene} from '../../render/shared-background-scene'
import {sharedBackgroundPreviewState} from '../../render/shared-background-preview'
import {neighborById,CONTENT} from '../../content/catalog'
import {withLookDefaults} from '../../engine/avatar'
import {slotPerson} from '../../engine/gen-growth'
import type {Who} from '../../render/sprites'
import type {FinalePerson} from '../../render/library-finale-art'
import {drawAuthoredStory,authoredStoryPeople} from '../../render/authored-story-art'
import {playerChildAvatar,playerChildSprite} from '../../render/player-child-look'
import {childStage} from '../../engine/child'
import {albumImage,storeAlbumImage,useGame} from '../../store/game-store'
import {previewActor,previewPerson,previewFamilyChild,previewBirthFamily} from './event-preview-art'
import './stars-scene.css'

export const StoryArtBeat=createContext<(page:number)=>void>(()=>{})
export const StoryArtChoice=createContext<(choice:number|null)=>void>(()=>{})
export function AuthoredStoryScene(props:ComponentProps<typeof AuthoredStorySceneBody>){
 if(props.id.startsWith('wedding:')&&!props.preview&&!props.readOnly)return <WeddingAttirePicker id={props.id}><AuthoredStorySceneBody {...props}/></WeddingAttirePicker>
 return isSharedBackgroundStory(props.id)&&!props.sharedScene?<ResolvedSharedStoryScene {...props}/>:<AuthoredStorySceneBody {...props}/>
}
function ResolvedSharedStoryScene(props:ComponentProps<typeof AuthoredStorySceneBody>){
 const game=useGame(s=>props.preview?null:s.game),origin=useGame(s=>props.preview?null:s.dateArtOrigin)
 const scene=useMemo(()=>{
  const input=game??sharedBackgroundPreviewState(props.id),snapshot=sharedBackgroundSceneSnapshot(input,props.id,{preview:props.preview,dateOrigin:origin})
  if(snapshot&&props.preview&&props.location)snapshot.location=props.location
  return snapshot
 },[game,origin,props.id,props.preview,props.location])
 useEffect(()=>{
  const source=SCENES[props.id]
  if(!scene||props.preview||props.readOnly||!source?.album||(props.beat??0)<source.lines.length-1||source.choices?.length&&props.chosen===undefined||albumImage(props.id))return
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180
  const g=canvas.getContext('2d');if(!g)return
  drawSharedBackgroundScene(g,scene,320,180,8,props.beat??0)
  storeAlbumImage(props.id,canvas.toDataURL('image/png'))
 },[scene,props.id,props.preview,props.readOnly,props.beat,props.chosen])
 return scene?<AuthoredStorySceneBody {...props} sharedScene={scene}/>:null
}
function AuthoredStorySceneBody({id,title,preview=false,readOnly=false,children,beat=0,chosen,location,sharedScene}:{id:string;title:string;preview?:boolean;readOnly?:boolean;children:ReactNode;beat?:number;chosen?:number;location?:StoryLocationContext;sharedScene?:SharedBackgroundSceneSnapshot}){
 if(sharedScene&&sharedScene.id!==id)throw new Error('Shared scene snapshot does not match the dialogue ID')
 const [previewBeat,setPreviewBeat]=useState(0),page=preview?previewBeat:beat
 const gathering=timedGathering(id),photoId=gatheringPhoto(id),squareVillagePhoto=['village:1','village:2','village:4'].includes(id)
 const phase=(isNeighborArrival(id)||isBakeryDinner(id)||isFamilyRoomRemainder(id)||isHomeYardEvent(id)||isShopRemainder(id)||isTravelEvent(id)||isLibraryEvent(id)||isPostmanEvent(id)||isHillEvent(id)||isHallEvent(id)||isSquareEvent(id)||isSheepEvent(id)||isVineEvent(id)||isOilEvent(id)||isWoodEvent(id)||isHerbEvent(id)||isBeeEvent(id)||isShoreEvent(id)||isWeaverEvent(id)||isSmithEvent(id)||isTeaEvent(id)||isBakeryEvent(id))?page:isHomeRoom(id)?Math.min(1,page):(isHomeRoom(id)||id==='propose:dexter'||id==='propose:rudy'||id==='propose:postman'||id==='propose:marigold'||id==='propose:basil'||id==='propose:merchant'||id==='propose:presser'||id==='propose:poppy'||id==='propose:juniper'||id==='propose:cosmo'||id==='propose:tilly'||id==='propose:wendell'||id==='propose:penelope')?Math.min(1,page):(id==='wedding:postman'||id==='wedding:merchant'||id==='wedding:presser')?Math.min(3,page):(id==='childBorn'||(id==='wedding:dexter'||id==='wedding:rudy'||id==='wedding:postman'||id==='wedding:marigold'||id==='wedding:basil'||id==='wedding:poppy'||id==='wedding:juniper'||id==='wedding:cosmo'||id==='wedding:tilly'||id==='wedding:wendell'||id==='wedding:penelope'||id==='wedding:merchant'||id==='wedding:presser'))?Math.min(2,page):id==='pregnancy'?Math.min(2,page):id==='siblingBorn'?Math.min(1,page):id==='ev:beekeeper:story:4'?Math.min(4,page):id==='ev:penelope:unpickTalk'?Math.min(3,page):id==='romance1:penelope'||id==='romance2:penelope'||id==='romance2:penelope:friend'?Math.min(1,page):id==='ev:juniper:story:2'?Math.min(7,page):id==='ev:poppy:love:1'?Math.min(2,page):id==='romance1:wendell'||id==='romance2:wendell'?Math.min(1,page):id==='ev:merchant:story:1'?Math.min(2,page):id==='ev:presser:love:1'?Math.min(1,page):id==='ev:basil:worry'?Math.min(4,page):id==='ev:rudy:love:1'?Math.min(3,page):id==='fam:read'?Math.min(1,page):gathering?Math.min(gathering.last,page):id==='ev:penelope:lunch'?Math.min(3,page):id==='ev:beekeeper:story:1'?Math.min(1,page):id==='village:3'?Math.min(1,page):id==='built:reedRack'?Math.min(1,page):id==='ev:baker:small:festBasket'?Math.min(1,page):id==='fam:trip'?Math.min(1,page):id==='ev:baker:story:3'||id==='lightShoes'||id==='ev:carpenter:story:3'||id==='ev:poppy:story:2'||id==='ev:rudy:small:signPost'?Math.min(2,page):0
 const [previewChoice,setPreviewChoice]=useState<number|null>(null),choice=preview?previewChoice:chosen
 const life=useGame(s=>s.game.life),familyMemory=life?.experiences?.[id]
 const artChoice=(isShopRemainder(id)||isTravelEvent(id)||isLibraryEvent(id)||isPostmanEvent(id)||isHillEvent(id)||isHallEvent(id)||isSquareEvent(id)||isSheepEvent(id)||isVineEvent(id)||isOilEvent(id)||isWoodEvent(id)||isHerbEvent(id)||isBeeEvent(id)||isShoreEvent(id)||isWeaverEvent(id)||isSmithEvent(id)||isTeaEvent(id)||isBakeryEvent(id))?choice:isHomeRoom(id)?(preview?choice??0:life?.experiences?.[id]?.choice??0):id==='ev:beekeeper:story:4'||id==='ev:penelope:unpickTalk'||id==='ev:juniper:story:2'||id==='ev:poppy:love:1'||id==='ev:merchant:story:1'||id==='ev:basil:worry'||id==='ev:rudy:love:1'||id==='ev:baker:small:festBasket'||id==='ev:poppy:story:2'||id==='ev:rudy:small:signPost'||id==='ev:beekeeper:story:1'||id==='ev:penelope:lunch'?choice:undefined
 const ref=useRef<HTMLCanvasElement>(null)
 const flags=useGame(s=>s.game.flags)
 const yard=useGame(s=>s.game.yard),companionKind=useGame(s=>s.game.companion?.kind),companionName=useGame(s=>s.game.companion?.name)
 const minute=useGame(s=>s.game.clock.minute),player=useGame(s=>s.game.player)
 const dateArtOrigin=useGame(s=>s.dateArtOrigin)
 const map=useGame(s=>s.game.map),homeLevel=useGame(s=>s.game.homeLevel),newland=useGame(s=>s.game.newland),scenes=useGame(s=>s.game.scenes)
 const roomFurniture=useGame(s=>s.game.room),ownedRooms=useGame(s=>s.game.rooms)
 const homeWalls=useGame(s=>s.game.homeWalls),romance=useGame(s=>s.game.romance)
 const siblings=useGame(s=>s.game.siblings)
 const partnerId=useGame(s=>s.game.romance.partner)
 const child=useGame(s=>s.game.child),day=useGame(s=>s.game.clock.day),remembered=useGame(s=>s.game.album.some(a=>a.id===photoId))
 const hallState=useGame(s=>id==='hallNight'?s.game:null)
 const avatar=useGame(s=>s.game.avatar),gen=useGame(s=>s.game.gen),looks=useGame(s=>s.game.looks)
 useEffect(()=>{
  if(sharedScene)return
  const canvas=ref.current,g=canvas?.getContext('2d');if(!canvas||!g)return
  const resolve=(npcId:string):FinalePerson&{id?:string}=>{
   const def=neighborById(npcId),current=gen?.persons[slotPerson(gen,npcId)],custom=looks?.[npcId]
   return preview?previewActor(`person:${npcId}`):{id:npcId,
    avatar:withLookDefaults({name:current?.name??def?.role??'이웃',look:current?.look??def?.look??'m',...def?.avatar,...current?.avatar,...custom,...(current?.hair?{hairColor:current.hair}:{})}),
    who:(!def?.avatar&&!current?.avatar&&!custom&&!gen?.retired?.[npcId]?def?.sprite??'writer':'writer') as Who}
  }
  const stage=child?childStage(child,day):'helper'
  const attire=id.startsWith('wedding:')&&!preview?weddingOutfitsFor(useGame.getState().game,id.slice('wedding:'.length)):null
  const familyChild=preview?previewFamilyChild():{avatar:playerChildAvatar({child,avatar,looks}),...playerChildSprite(stage,!!looks?.child),baby:stage==='baby'}
  const people=authoredStoryPeople(id),npc=(id==='fam:show'||id==='fam:trip'||id==='fam:read'||isHomeRoomKid(id)||isSquareFamilyKid(id)||isHillFamilyKid(id))?familyChild:resolve((isShopDate(id)||isHillDate(id)||id==='dateTea'||id==='pregnancy'||id==='siblingBorn'||id==='childBorn'||(HOME_ROOM_MEAL_IDS as readonly string[]).includes(id))?(preview?'wendell':partnerId??'wendell'):people[0]??previewPerson(id)??'wendell'),others=people.slice(1).filter(npcId=>(id!=='wedding:dexter'&&id!=='wedding:rudy'&&id!=='wedding:postman'&&id!=='wedding:marigold'&&id!=='wedding:basil'&&id!=='wedding:poppy'&&id!=='wedding:juniper'&&id!=='wedding:cosmo'&&id!=='wedding:tilly'&&id!=='wedding:wendell'&&id!=='wedding:penelope'&&id!=='wedding:merchant'&&id!=='wedding:presser')||preview||!notYet(neighborById(npcId)!,flags.villageLevel??0,flags)).map(resolve)
  if(id==='ev:dexter:story:3b'&&!preview)others.splice(0,others.length,...people.slice(1).filter(n=>!notYet(neighborById(n)!,flags.villageLevel??0,flags)).map(resolve))
  if(attire?.partner)npc.avatar=weddingDressedAvatar(npc.avatar,attire.partner)
  if(id==='hallNight'&&!preview&&hallState)others.splice(0,others.length,...hallGuestsToday(hallState,CONTENT).filter(n=>n!=='baker').map(resolve))
  if(isSquareFamilyKid(id)&&!preview)others.splice(0,others.length,...(familyMemory?.with??[]).filter(n=>n!=='family:child'&&n!=='child').sort((a,b)=>Number(a===partnerId)-Number(b===partnerId)).map(resolve))
  const familyFind=WALK_FINDS[(familyMemory?.first??day)%WALK_FINDS.length]
  if((isHomeRoomActivity(id)||['fam:supperAll','fam:meal','fam:bdayChild'].includes(id))&&(preview||child))others.push(familyChild)
  if((id==='ev:wendell:baby'||isBakeryDinner(id))&&!preview){
   const bakerId=gen?slotPerson(gen,'baker'):'baker',baker=gen?.persons[bakerId],house=baker?.household?gen?.households[baker.household]:undefined
   const fixedBaby=bakerBabyAt(day,gen?.persons[BAKER_BABY_ID]),houseBaby=house?.children.map(pid=>gen?.persons[pid]).filter(p=>p?.stage==='baby').at(-1)
   const baby=isBakeryDinner(id)?(bakerId==='baker'&&fixedBaby?.stage==='baby'?fixedBaby:houseBaby):fixedBaby??houseBaby
   if(baby)others.push({avatar:withLookDefaults({name:baby.name??'아기',look:baby.look??'f',...baby.avatar,...(baby.hair?{hairColor:baby.hair}:{})}),who:'writer'})
  }
  if(id==='childBorn')others.push(preview?previewBirthFamily().newborn:birthFamilyCast({child,siblings,avatar,looks,clock:{day,minute:0}}).firstborn)
  if(id==='siblingBorn'){const family=preview?previewBirthFamily():birthFamilyCast({child,siblings,avatar,looks,clock:{day,minute:0}});others.push(family.older,family.newborn)}
  // 기존 LandscapeScene과 같은 실제 표시 영역 기준. 화면 전체에 도트를 같은 비율로 확대한다.
  const resize=()=>{
   const bounds=canvas.getBoundingClientRect(),width=320,height=Math.max(180,Math.round(width*(bounds.height||180)/(bounds.width||320)))
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
  }
  resize()
  if(((isShopRemainder(id)||isTravelEvent(id)||isLibraryEvent(id)||isPostmanEvent(id)||isHillEvent(id)||isHallEvent(id)||isHomeRoom(id)||isBakeryEvent(id)||isTeaEvent(id)||squareVillagePhoto)&&!!SCENES[id]?.album||isSquareFamilyKid(id)||id==='fam:trip'||id==='fam:read'||id==='village:3'||id==='pregnancy'||id==='childBorn'||(id==='wedding:dexter'||id==='wedding:rudy'||id==='wedding:postman'||id==='wedding:marigold'||id==='wedding:basil'||id==='wedding:poppy'||id==='wedding:juniper'||id==='wedding:cosmo'||id==='wedding:tilly'||id==='wedding:wendell'||id==='wedding:penelope'||id==='wedding:merchant'||id==='wedding:presser')||gathering)&&!preview&&!readOnly&&(!squareVillagePhoto||!albumImage(photoId))&&(!albumImage(photoId)||!isTravelEvent(id)&&!isLibraryEvent(id)&&!isHillEvent(id)&&id!=='hallNight'&&!gathering&&!remembered)){
   const photo=document.createElement('canvas');photo.width=canvas.width;photo.height=canvas.height
   const pg=photo.getContext('2d');if(pg){drawAuthoredStory(pg,id,photo.width,photo.height,8,weddingDressedAvatar(avatar,attire?.player??null),npc,others,(id==='wedding:postman'||id==='wedding:merchant'||id==='wedding:presser')?3:(id==='childBorn'||(id==='wedding:dexter'||id==='wedding:rudy'||id==='wedding:postman'||id==='wedding:marigold'||id==='wedding:basil'||id==='wedding:poppy'||id==='wedding:juniper'||id==='wedding:cosmo'||id==='wedding:tilly'||id==='wedding:wendell'||id==='wedding:penelope'||id==='wedding:merchant'||id==='wedding:presser'))?2:id==='trip:harbor'?3:id==='trip:hillTown'||id==='hallNight'||id==='dateWalk'?2:id==='fam:read'?0:gathering?Math.min(2,gathering.last):1,artChoice,isHomeRoom(id)?{minute,indoors:true,wet:false,snow:false}:undefined,familyFind,familyMemory?.item??undefined);storeAlbumImage(photoId,photo.toDataURL('image/png'))}
  }
  const sceneLocation=preview?(location??storyLocationContext()):sceneLocationContext({map,homeLevel,newland,scenes,room:roomFurniture,rooms:ownedRooms,flags,homeWalls,romance,child,siblings,gen,player,clock:{day,minute}},id,dateArtOrigin)
  const yardContext=isHomeYardEvent(id)?homeYardEventContext(preview?undefined:{flags,yard,companion:companionKind?{kind:companionKind,name:companionName??''}:null}):undefined
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,start=performance.now()
  let frame=0,last=-1000,failed=false
  // 그리다 실패해도 장면 창은 남고 다음 틀에서 다시 그린다 (2026-10-19 감사 L-33)
  const paint=(now:number)=>{
   if(now-last>=100){try{resize();drawAuthoredStory(g,id,canvas.width,canvas.height,reduced?8:(now-start)/1000,preview?null:weddingDressedAvatar(avatar,attire?.player??null),npc,others,phase,artChoice,(isHomeRoom(id)||id==='propose:dexter'||id==='propose:rudy'||id==='propose:postman'||id==='propose:marigold'||id==='propose:basil'||id==='propose:merchant'||id==='propose:presser'||id==='propose:poppy'||id==='propose:juniper'||id==='propose:cosmo'||id==='propose:tilly'||id==='propose:wendell'||id==='propose:penelope')?{minute:preview?900:minute,indoors:preview?(id==='propose:presser'||id==='propose:poppy'||id==='propose:tilly'):isIndoor(player),wet:preview?false:isWet(weatherOf(day)),snow:!preview&&weatherOf(day)==='snow',at:preview?undefined:{x:player.x,y:player.y}}:undefined,familyFind,preview?undefined:familyMemory?.item??undefined,yardContext,sceneLocation)}catch(e){if(!failed){failed=true;console.error(e)}}last=now}
   if(!reduced)frame=requestAnimationFrame(paint)
  }
  const onResize=()=>{if(reduced){last=-1000;paint(performance.now())}}
  window.addEventListener('resize',onResize)
  frame=requestAnimationFrame(paint)
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',onResize)}
 },[id,preview,readOnly,avatar,gen,looks,flags,partnerId,phase,child,siblings,day,remembered,artChoice,gathering,photoId,minute,player,familyMemory,hallState,squareVillagePhoto,yard,companionKind,companionName,map,homeLevel,newland,scenes,location,dateArtOrigin,roomFurniture,ownedRooms,homeWalls,romance,sharedScene])
 return <StoryArtBeat.Provider value={setPreviewBeat}><StoryArtChoice.Provider value={setPreviewChoice}>{sharedScene?<SharedBackgroundStoryScene scene={sharedScene} title={title} beat={page}>{children}</SharedBackgroundStoryScene>:<div className={`stars-scene authored-story-scene${id.startsWith('wedding:')?' wedding-ceremony':''}`} role="dialog" aria-label={title}><canvas ref={ref} aria-hidden="true"/>{children}</div>}</StoryArtChoice.Provider></StoryArtBeat.Provider>
}





