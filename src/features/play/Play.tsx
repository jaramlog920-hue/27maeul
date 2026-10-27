import { useEffect } from 'react'
import { setAudioHidden } from '../../audio/sound'
import { saveGame } from '../../engine/save'
import { flushGameStorage, getGameStorageStatus } from '../../engine/game-storage'
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
import { TalkButton } from './TalkButton'
import { TripScene } from '../trip/TripScene'

export function Play() {
  useKeyboardMovement()
  useEventAlerts()
  const zoom = useGame((s) => s.zoom)
  const deck = useGame((s) => s.deck)
  const trip = useGame((s) => s.trip)
  // 필사 집중 화면 (계획 14 작업 2): 책상에 앉아 있는 동안 마을·위 줄·조작판·알림을 감춘다 (그림은 멈추지 않고 가려만 둔다)
  const focus = useGame((s) => s.modal?.kind === 'copy')
  // 탭을 닫거나 다른 앱으로 넘어갈 때 저장한다
  useEffect(() => {
    const save = () => {
      saveGame(useGame.getState().game)
      void flushGameStorage().catch(() => {})
    }
    const onHide = () => {
      const hidden = document.visibilityState === 'hidden'
      // 가려진 동안은 소리를 멈춘다 (2026-10-18 감사 M-10)
      setAudioHidden(hidden)
      if (hidden) save()
    }
    const beforeClose = (event: BeforeUnloadEvent) => {
      save()
      const status = getGameStorageStatus()
      if (status.state !== 'saved') { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('pagehide', save)
    window.addEventListener('beforeunload', beforeClose)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', save)
      window.removeEventListener('beforeunload', beforeClose)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])
  return (
    <div className={`play${deck ? ' has-deck' : ''}${focus ? ' focus' : ''}`}>
      <div className="village" hidden={focus}>
        <Hud />
        <div className="world-frame">
          <GameCanvas zoom={zoom} />
          <Joystick />
          {/* 알림과 업적 띠를 한 줄로 쌓는다 — 두 줄짜리 알림을 업적 띠가 덮었다 (2026-10-27 플레이 점검) */}
          <div className="notices">
            <Toast />
            <AwardBanner />
          </div>
          <TalkButton />
        </div>
        <StatusPanel />
        <DecorateBar />
        {/* 다음 일정은 맨 아래 한 줄 (시작 30분 전·시작 알림은 지도 위에 뜬다) */}
        <NextEventBar />
        {/* 휴대폰에선 아래 조작판이 위 단추·몸 상태·다음 일정을 대신한다 */}
        <ControlDeck />
        {/* 여행 주사위 판: 화면 전체를 덮는 새 장면 (본문 팝업은 그 위에) */}
        {trip && <TripScene dest={trip.dest} withChild={trip.withChild} withPartner={!!trip.withPartner} />}
      </div>
      <ModalLayer />
    </div>
  )
}
