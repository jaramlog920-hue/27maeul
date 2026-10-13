import { ScreenBoundary } from "./ScreenBoundary"
import { useCallback, type SyntheticEvent } from 'react'
import { lazyScreen } from './lazy-screen'
import { isGhostClick } from '../shared/ghost'
import { useGame } from '../store/game-store'
import { Bag } from './bag/Bag'
import { Wardrobe } from './family/Wardrobe'
import { KidTime } from './family/KidTime'
import { AdoptForm } from './companion/AdoptForm'
import { Desk } from './desk/Desk'
import { CopyDesk } from './desk/CopyDesk'
import { CopyResult } from './desk/CopyResult'
import { GardenMenu } from './garden/GardenMenu'
import { Journal } from './journal/Journal'
import { Library } from './library/Library'
import { RoomShelf } from './library/RoomShelf'
import { BindView } from './library/BindView'
import { ShelfDone } from './library/ShelfDone'
import { BookView } from './library/BookView'
import { HomeShelf } from './library/HomeShelf'
import { JourneyBoard } from './journey/JourneyBoard'
import { LetterBox } from './letters/LetterBox'
import { CareMenu } from './menus/CareMenu'
import { SpaceMenu } from './menus/SpaceMenu'
import { PlaceMenu } from './menus/PlaceMenu'
import { YardMenu } from './menus/YardMenu'
import { ReadPick } from './menus/ReadPick'
import { CopiedReadPick } from './menus/CopiedReadPick'
import { QuizView } from './quiz/QuizView'
import { MiniGame } from './mini/MiniGame'
import { MyLineForm } from './passage/MyLineForm'
import { PassageWindow } from './passage/PassageWindow'
import { Review } from './review/Review'
import { SceneView } from './scene/SceneView'
import { LandscapeScene } from './scene/StarsScene'
import { landscapeKind } from '../render/scenic-moments-art'
import { FeastView } from './scene/FeastView'
import { OrdersView } from './talk/OrdersView'
import { GiftPicker } from './talk/GiftPicker'
import { TalkBox } from './talk/TalkBox'
import { TradeBoard } from './talk/TradeBoard'
import { BoardView } from './talk/BoardView'
import { TravelView } from './talk/TravelView'
import { ChildName } from './child/ChildName'
import { FollowMenu } from './companion/FollowMenu'
import { VillageMap } from './map/VillageMap'
import { RankView } from './library/RankView'
import { TravelMenu } from './map/TravelMenu'
import { FirstLight, LookAround } from './newland/FirstLight'
import { OtShelf } from './newland/OtShelf'
import { FarewellLetter } from './talk/FarewellLetter'
import { LoveVerseView } from './talk/LoveVerseView'
import { SellStandView } from './stall/SellStandView'
import { GameGuide } from './play/GameGuide'
import { Settings } from './play/Settings'
import { ScheduleDialog } from './play/EventSchedule'
import { watchScrollHints } from './scroll-hint'
import { Word } from './word/Word'
import { ReadingMeeting, meetingPassage } from './meetings/ReadingMeeting'
import { NtContent } from './passage/NtContent'
import { isOtBook } from '../engine/ot-books'
import type { Book } from '../engine/types'
import { VisitorTalk } from './library/VisitorTalk'
import { InnGuestTalk } from './talk/InnGuestTalk'
import { PieceAcquired } from './passage/PieceAcquired'

const CookingView = lazyScreen(() => import("./cooking/CookingView").then(m => m.CookingView))
const ClubList = lazyScreen(() => import("./clubs/ClubList").then(m => m.ClubList))
const ClubSession = lazyScreen(() => import("./clubs/ClubSession").then(m => m.ClubSession))
const FestList = lazyScreen(() => import("./fest/FestList").then(m => m.FestList))
const FestSession = lazyScreen(() => import("./fest/FestSession").then(m => m.FestSession))
const StallView = lazyScreen(() => import("./stall/StallView").then(m => m.StallView))
const VillageSite = lazyScreen(() => import("./village/VillageSite").then(m => m.VillageSite))
const Family = lazyScreen(() => import("./family/Family").then(m => m.Family))
const FamilyTree = lazyScreen(() => import("./journal/FamilyTree").then(m => m.FamilyTree))
const SchoolView = lazyScreen(() => import("./child/SchoolView").then(m => m.SchoolView))
const BuildMenu = lazyScreen(() => import("./newland/BuildMenu").then(m => m.BuildMenu))
const FacilityView = lazyScreen(() => import("./newland/FacilityView").then(m => m.FacilityView))

function Body() {
  const modal = useGame((s) => s.modal)
  if (!modal) return null
  switch (modal.kind) {
    case 'libraryVisitor':
      return <VisitorTalk key={modal.day} day={modal.day} />
    case 'innGuest':
      return <InnGuestTalk key={modal.id} id={modal.id} first={modal.first} />
    case 'settings':
      return <Settings />
    case 'crossing':
      return <TravelMenu to={modal.to} />
    case 'firstLight':
      return <FirstLight />
    case 'lookAround':
      return <LookAround />
    case 'build':
      return <BuildMenu />
    case 'otShelf':
      return <OtShelf />
    case 'guide':
      return <GameGuide />
    case 'clubs':
      return <ClubList />
    case 'clubSession':
      return <ClubSession id={modal.id} />
    case 'fests':
      return <FestList />
    case 'festSession':
      return <FestSession id={modal.id} />
    case 'stall':
      return <StallView />
    case 'cooking':
      return <CookingView />
    case 'village':
      return <VillageSite id={modal.id} />
    case 'schedule':
      return <ScheduleDialog />
    case 'readingMeeting':
      return <ReadingMeeting day={modal.day} />
    case 'talk':
      // 대화 내용이 바뀌면 새 큐를 만든다. 읽음 기록 갱신만으로는 큐를 다시 만들지 않는다.
      return <TalkBox key={JSON.stringify([modal.neighborId, modal.line, modal.letter, modal.popup])} modal={modal} />
    case 'passage':
      return <PassageWindow pieceId={modal.pieceId} askLine={modal.askLine} back={modal.back} said={modal.said} />
    case 'myLine':
      return <MyLineForm key={modal.lineKey} lineKey={modal.lineKey} />
    case 'desk':
      // 예전 엮기·옮겨 적기 창 — 계획 14부터 집 책상은 'copy'를 연다 (이 창으로 가는 길은 닫혔다)
      return <Desk result={modal.result} dark={modal.dark} />
    case 'copy':
      return <CopyDesk modal={modal} />
    case 'review':
      return <Review pieceId={modal.pieceId} />
    case 'journal':
      return <Journal tab={modal.tab} neighbor={modal.neighbor} />
    case 'familyTree':
      return <FamilyTree personId={modal.personId} neighborId={modal.neighborId} />
    case 'scene':
      if (['firstConfession','childLeaves','childStays'].includes(landscapeKind(modal.id)??'')) return <SceneView id={modal.id} chosen={modal.chosen} />
      if (landscapeKind(modal.id)) return <LandscapeScene key={modal.id} kind={landscapeKind(modal.id)!} sceneId={modal.id} />
      // 서고 잔치 모닥불: 음식·조각 이야기·내 한 줄 낭독 (2026-10-13)
      if (modal.id === 'feastFire' || modal.id === 'allFeastFire') return <FeastView key={modal.id} id={modal.id} />
      return <SceneView id={modal.id} chosen={modal.chosen} />
    case 'orders':
      return <OrdersView npc={modal.npc} />
    case 'mini':
      return <MiniGame state={modal.state} pending={modal.pending} />
    case 'gift':
      return <GiftPicker neighborId={modal.neighborId} />
    case 'trade':
      return <TradeBoard />
    case 'board':
      return <BoardView />
    case 'travel':
      return <TravelView dest={modal.dest} rewards={modal.rewards} />
    case 'childName':
      return <ChildName />
    case 'follow':
      return <FollowMenu who={modal.who} />
    case 'villageMap':
      return <VillageMap />
    case 'rank':
      return <RankView history={modal.history} />
    case 'farewell':
      return <FarewellLetter />
    case 'loveVerse':
      return <LoveVerseView />
    case 'sellStand':
      return <SellStandView />
    case 'facility':
      return <FacilityView id={modal.id} at={modal.at} />
    case 'school':
      return <SchoolView />
    case 'letter':
      return <LetterBox />
    case 'menu':
      return <PlaceMenu place={modal.place} />
    case 'yard':
      return <YardMenu item={modal.item} />
    case 'readPick':
      return modal.source === 'copied' ? <CopiedReadPick /> : <ReadPick />
    case 'quiz':
      return <QuizView modal={modal} />
    case 'care':
      return <CareMenu />
    case 'family':
      return <Family />
    case 'wardrobe':
      return <Wardrobe who={modal.who} />
    case 'bag':
      return <Bag tab={modal.tab} />
    case 'companion':
      return <AdoptForm animal={modal.animal} />
    case 'library':
      return <Library />
    case 'roomShelf':
      return <RoomShelf key={modal.room} room={modal.room} />
    case 'bind':
      return <BindView key={modal.book} modal={modal} />
    case 'shelfDone':
      return <ShelfDone />
    case 'journey':
      return <JourneyBoard key={modal.board ?? 'acts'} board={modal.board ?? 'acts'} />
    case 'garden':
      return <GardenMenu at={modal.at} />
    case 'word':
      return <Word tab={modal.tab} />
    case 'bookView':
      return <BookView key={modal.book} modal={modal} />
    case 'homeShelf':
      return <HomeShelf />
    case 'space':
      return <SpaceMenu id={modal.id} />
    case 'kidTime':
      return <KidTime done={modal.done} spouse={modal.spouse} />
  }
}

export function ModalLayer() {
  const modal = useGame((s) => s.modal)
  const book = useGame(s => s.game.copy.book)
  const deskBook = useGame(s => s.game.activeBook)
  const copyResult = useGame(s => s.copyResult)
  const acquired = useGame(s => s.piecePopups[0])
  // 창이 열려 있는 동안 스크롤되는 창에 "아래로 더 있어요"를 붙인다 (창이 바뀌면 MutationObserver가 다시 살핀다)
  const hints = useCallback((el: HTMLDivElement | null) => (el ? watchScrollHints(el) : undefined), [])
  if (!modal && !copyResult?.length && !acquired) return null
  const needed: Book[] = []
  if (modal?.kind === 'copy' && modal.view !== 'pick' && book && !isOtBook(book)) needed.push(book)
  if (modal?.kind === 'desk' && deskBook) needed.push(deskBook)
  if (modal?.kind === 'bookView') needed.push(modal.book)
  if (modal?.kind === 'readingMeeting') needed.push(meetingPassage(modal.day).book)
  // 지도를 누른 손가락을 뗄 때의 클릭이 방금 뜬 창의 단추를 누르지 않게 (shared/ghost.ts)
  const eatGhost = (e: SyntheticEvent) => {
    if (isGhostClick()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  return (
    <div className="modal-backdrop" ref={hints} onClickCapture={eatGhost}>
      {acquired ? <PieceAcquired key={acquired} id={acquired} /> : copyResult?.length ? <CopyResult /> : <NtContent books={needed} onCancel={() => useGame.getState().closeModal()}><ScreenBoundary key={modal?.kind}><Body /></ScreenBoundary></NtContent>}
    </div>
  )
}
