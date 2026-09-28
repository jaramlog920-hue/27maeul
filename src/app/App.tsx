import { useState } from 'react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { newGame } from '../engine/game'
import { loadGame, saveGame } from '../engine/save'
import { Intro } from '../features/intro/Intro'
import { Play } from '../features/play/Play'
import { unlockAudio } from '../audio/sound'
import { useGame } from '../store/game-store'

export function App() {
  const [screen, setScreen] = useState<'intro' | 'play'>('intro')
  const [saved] = useState(() => loadGame(CONTENT))
  if (screen === 'play') return <Play />
  return (
    <Intro
      hasSave={saved !== null}
      onContinue={() => {
        unlockAudio()
        if (saved) useGame.getState().load(saved)
        setScreen('play')
      }}
      onStart={() => {
        if (saved && !globalThis.confirm?.(T.ui.restartConfirm)) return
        unlockAudio()
        const game = newGame(CONTENT)
        saveGame(game)
        useGame.getState().load(game)
        setScreen('play')
      }}
    />
  )
}
