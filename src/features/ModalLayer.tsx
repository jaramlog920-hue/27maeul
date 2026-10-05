import { ClubList } from './clubs/ClubList'
import { ClubSession } from './clubs/ClubSession'
import { useCallback, type SyntheticEvent } from 'react'
import { isGhostClick } from '../shared/ghost'
import { useGame } from '../store/game-store'
import { Bag } from './bag/Bag'
import { Family } from './family/Family'
import { Wardrobe } from './family/Wardrobe'
import { KidTime } from './family/KidTime'
import { AdoptForm } from './companion/AdoptForm'
import { Desk } from './desk/Desk'
import { CopyDesk } from './desk/CopyDesk'
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
import { PlaceMenu } from './menus/PlaceMenu'
import { ReadPick } from './menus/ReadPick'
import { QuizView } from './quiz/QuizView'
import { MiniGame } from './mini/MiniGame'
import { MyLineForm } from './passage/MyLineForm'
import { PassageWindow } from './passage/PassageWindow'
import { Review } from './review/Review'
import { SceneView } from './scene/SceneView'
import { OrdersView } from './talk/OrdersView'
import { GiftPicker } from './talk/GiftPicker'
import { TalkBox } from './talk/TalkBox'
import { TradeBoard } from './talk/TradeBoard'
import { BoardView } from './talk/BoardView'
import { TravelView } from './talk/TravelView'
import { ChildName } from './child/ChildName'
import { FollowMenu } from './companion/FollowMenu'
import { VillageMap } from './map/VillageMap'
import { SchoolView } from './child/SchoolView'
import { GameGuide } from './play/GameGuide'
import { Settings } from './play/Settings'
import { ScheduleDialog } from './play/EventSchedule'
import { watchScrollHints } from './scroll-hint'
import { Word } from './word/Word'

function Body() {
  const modal = useGame((s) => s.modal)
  if (!modal) return null
  switch (modal.kind) {
    case 'settings':
      return <Settings />
    case 'guide':
      return <GameGuide />
    case 'clubs':
      return <ClubList />
    case 'clubSession':
      return <ClubSession id={modal.id} />
    case 'schedule':
      return <ScheduleDialog />
    case 'talk':
      return <TalkBox modal={modal} />
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
      return <Review pieceId={modal.pieceId} attic={modal.attic} />
    case 'journal':
      return <Journal tab={modal.tab} />
    case 'scene':
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
    case 'school':
      return <SchoolView />
    case 'letter':
      return <LetterBox />
    case 'menu':
      return <PlaceMenu place={modal.place} />
    case 'readPick':
      return <ReadPick />
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
    case 'kidTime':
      return <KidTime done={modal.done} />
  }
}

export function ModalLayer() {
  const modal = useGame((s) => s.modal)
  // 창이 열려 있는 동안 스크롤되는 창에 "아래로 더 있어요"를 붙인다 (창이 바뀌면 MutationObserver가 다시 살핀다)
  const hints = useCallback((el: HTMLDivElement | null) => (el ? watchScrollHints(el) : undefined), [])
  if (!modal) return null
  // 지도를 누른 손가락을 뗄 때의 클릭이 방금 뜬 창의 단추를 누르지 않게 (shared/ghost.ts)
  const eatGhost = (e: SyntheticEvent) => {
    if (isGhostClick()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  return (
    <div className="modal-backdrop" ref={hints} onClickCapture={eatGhost}>
      <Body />
    </div>
  )
}
