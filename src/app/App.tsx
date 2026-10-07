import { useState } from 'react'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { activeSlot, listSaves, loadGame, newSlot, saveGame, setActiveSlot } from '../engine/save'
import { AvatarForm } from '../features/intro/AvatarForm'
import { Intro } from '../features/intro/Intro'
import { SaveSlots } from '../features/intro/SaveSlots'
import { Play } from '../features/play/Play'
import { unlockAudio } from '../audio/sound'
import { useGame } from '../store/game-store'

// 시작 화면 → 새로 시작하기(새 칸) 또는 불러오기(칸 고르기) → 플레이 (2026-10-07 사용자: 스타듀밸리처럼 저장 여러 개)
export function App() {
  const [screen, setScreen] = useState<'intro' | 'avatar' | 'load' | 'play'>('intro')
  // 제목 그림의 주인공은 마지막으로 하던 칸의 모습
  const [last] = useState(() => loadGame(CONTENT, undefined, activeSlot()) ?? (listSaves()[0] ? loadGame(CONTENT, undefined, listSaves()[0].slot) : null))
  const [hasSaves] = useState(() => listSaves().length > 0)
  if (screen === 'play') return <Play />
  if (screen === 'load')
    return (
      <SaveSlots
        onBack={() => setScreen('intro')}
        onPick={(slot) => {
          const game = loadGame(CONTENT, undefined, slot)
          if (!game) return
          unlockAudio()
          setActiveSlot(slot)
          useGame.getState().load(game)
          setScreen('play')
        }}
      />
    )
  if (screen === 'avatar')
    return (
      <AvatarForm
        onBack={() => setScreen('intro')}
        onDone={(avatar) => {
          unlockAudio()
          // 새 게임은 늘 새 칸에 — 다른 저장을 덮어쓰지 않는다
          setActiveSlot(newSlot())
          const game = newGame(CONTENT, avatar)
          saveGame(game)
          useGame.getState().load(game)
          setScreen('play')
        }}
      />
    )
  return <Intro hasSave={hasSaves} avatar={last?.avatar} onContinue={() => setScreen('load')} onStart={() => setScreen('avatar')} />
}
