import { useEffect } from 'react'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { DecorateBar } from './DecorateBar'
import { GameCanvas } from './GameCanvas'
import { Hud, Toast, AwardBanner } from './Hud'
import { StatusPanel } from './StatusPanel'
import { useKeyboardMovement } from './useKeyboardMovement'
import { NextEventBar, useEventAlerts } from './EventSchedule'
import { Joystick } from './Joystick'
import { ControlDeck } from './ControlDeck'

export function Play() {
  useKeyboardMovement()
  useEventAlerts()
  const zoom = useGame((s) => s.zoom)
  const deck = useGame((s) => s.deck)
  // 탭을 닫거나 다른 앱으로 넘어갈 때 저장한다
  useEffect(() => {
    const save = () => saveGame(useGame.getState().game)
    const onHide = () => document.visibilityState === 'hidden' && save()
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])
  return (
    <div className={`play${deck ? ' has-deck' : ''}`}>
      <Hud />
      <div className="world-frame">
        <GameCanvas zoom={zoom} />
        <Joystick />
        <Toast />
        <AwardBanner />
      </div>
      <StatusPanel />
      <DecorateBar />
      {/* 다음 일정은 맨 아래 한 줄 (시작 30분 전·시작 알림은 지도 위에 뜬다) */}
      <NextEventBar />
      {/* 휴대폰에선 아래 조작판이 위 단추·몸 상태·다음 일정을 대신한다 */}
      <ControlDeck />
      <ModalLayer />
    </div>
  )
}
