import { useCallback, type SyntheticEvent } from 'react'
import { isGhostClick } from '../shared/ghost'
import { useGame } from '../store/game-store'
import { Bag } from './bag/Bag'
import { AdoptForm } from './companion/AdoptForm'
import { Desk } from './desk/Desk'
import { GardenMenu } from './garden/GardenMenu'
import { Journal } from './journal/Journal'
import { Library } from './library/Library'
import { RoomShelf } from './library/RoomShelf'
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
import { Shelf } from './shelf/Shelf'
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

function Body() {
  const modal = useGame((s) => s.modal)
  if (!modal) return null
  switch (modal.kind) {
    case 'settings':
      return <Settings />
    case 'guide':
      return <GameGuide />
    case 'schedule':
      return <ScheduleDialog />
    case 'talk':
      return <TalkBox modal={modal} />
    case 'passage':
      return <PassageWindow pieceId={modal.pieceId} askLine={modal.askLine} back={modal.back} />
    case 'myLine':
      return <MyLineForm key={modal.lineKey} lineKey={modal.lineKey} />
    case 'desk':
      return <Desk result={modal.result} dark={modal.dark} />
    case 'review':
      return <Review pieceId={modal.pieceId} attic={modal.attic} />
    case 'journal':
      return <Journal />
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
    case 'bag':
      return <Bag />
    case 'shelf':
      return <Shelf tab={modal.tab} />
    case 'companion':
      return <AdoptForm animal={modal.animal} />
    case 'library':
      return <Library />
    case 'roomShelf':
      return <RoomShelf key={modal.room} room={modal.room} />
    case 'journey':
      return <JourneyBoard key={modal.board ?? 'acts'} board={modal.board ?? 'acts'} />
    case 'garden':
      return <GardenMenu at={modal.at} />
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
