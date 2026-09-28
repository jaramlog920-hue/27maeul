import { useGame } from '../store/game-store'
import { Bag } from './bag/Bag'
import { AdoptForm } from './companion/AdoptForm'
import { Desk } from './desk/Desk'
import { Ending } from './ending/Ending'
import { Journal } from './journal/Journal'
import { Library } from './library/Library'
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
import { Shelf } from './shelf/Shelf'
import { GiftPicker } from './talk/GiftPicker'
import { TalkBox } from './talk/TalkBox'
import { TradeBoard } from './talk/TradeBoard'
import { GameGuide } from './play/GameGuide'
import { Settings } from './play/Settings'
import { ScheduleDialog } from './play/EventSchedule'

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
      return <MyLineForm pieceId={modal.pieceId} />
    case 'desk':
      return <Desk result={modal.result} dark={modal.dark} />
    case 'review':
      return <Review pieceId={modal.pieceId} />
    case 'journal':
      return <Journal />
    case 'scene':
      return <SceneView id={modal.id} />
    case 'mini':
      return <MiniGame state={modal.state} pending={modal.pending} />
    case 'gift':
      return <GiftPicker neighborId={modal.neighborId} />
    case 'trade':
      return <TradeBoard />
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
      return <Shelf />
    case 'companion':
      return <AdoptForm animal={modal.animal} />
    case 'ending':
      return <Ending />
    case 'library':
      return <Library />
  }
}

export function ModalLayer() {
  const modal = useGame((s) => s.modal)
  if (!modal) return null
  return (
    <div className="modal-backdrop">
      <Body />
    </div>
  )
}
