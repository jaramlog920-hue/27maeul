import { useEffect, useState } from 'react'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { activeSlot, listSaves, loadGame, newSlot, saveGame, setActiveSlot } from '../engine/save'
import { AvatarForm } from '../features/intro/AvatarForm'
import { Intro } from '../features/intro/Intro'
import { SaveSlots } from '../features/intro/SaveSlots'
import { Play } from '../features/play/Play'
import { unlockAudio } from '../audio/sound'
import { useGame } from '../store/game-store'

/** 마지막으로 플레이한 칸을 먼저, 그 칸이 없으면 최근의 유효한 저장을 고른다. */
function titleSaves() {
  const saves = listSaves()
  for (const slot of new Set([activeSlot(), ...saves.map((s) => s.slot)])) {
    const game = loadGame(CONTENT, undefined, slot)
    if (game) return { hasSaves: true, last: { slot, game } }
  }
  return { hasSaves: saves.length > 0, last: null }
}

// 시작 화면 → 이어하기(하던 칸) · 불러오기(칸 고르기) · 새로 시작하기(새 칸) → 플레이
export function App() {
  const [screen, setScreen] = useState<'intro' | 'avatar' | 'load' | 'play'>('intro')
  // 제목 그림의 주인공은 마지막으로 하던 칸의 모습
  const [title, setTitle] = useState(titleSaves)
  function playSave(slot: string) {
    // 시작 화면을 연 뒤 저장이 바뀌었어도 최신 상태로 이어 간다.
    const game = loadGame(CONTENT, undefined, slot)
    if (!game) { setTitle(titleSaves()); return }
    unlockAudio()
    setActiveSlot(slot)
    useGame.getState().load(game)
    setScreen('play')
  }
  // 개발용: 주소 뒤 ?test=26 이면 마지막 한 절만 남은 시험 저장을 새 칸에 만들어 바로 시작 (배포 빌드에는 없다)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const test = new URLSearchParams(location.search).get('test')
    let cancelled = false
    if (test && ['tea-hall', 'tea-cafe', 'yard', 'feast', 'copy'].includes(test)) {
      void import('../dev/controls-playtest').then(async ({ controlsPlaytest }) => {
        const { game, modal } = await controlsPlaytest(CONTENT, test)
        if (cancelled) return
        setActiveSlot(newSlot())
        saveGame(game)
        unlockAudio()
        useGame.getState().load(game)
        if (modal) useGame.getState().open(modal)
        history.replaceState(null, '', location.pathname)
        setScreen('play')
      })
      return () => { cancelled = true }
    }
    if (test !== '26') return
    void import('../dev/test-saves').then(async ({ lastVerseGame }) => {
      const game = await lastVerseGame(CONTENT)
      if (cancelled) return
      setActiveSlot(newSlot())
      saveGame(game)
      unlockAudio()
      useGame.getState().load(game)
      history.replaceState(null, '', location.pathname)
      setScreen('play')
    })
    return () => { cancelled = true }
  }, [])
  if (screen === 'play') return <Play />
  if (screen === 'load')
    return (
      <SaveSlots
        onBack={() => {
          setTitle(titleSaves())
          setScreen('intro')
        }}
        onPick={playSave}
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
  return (
    <Intro
      hasSave={title.hasSaves}
      canContinue={title.last !== null}
      avatar={title.last?.game.avatar}
      onContinue={() => { if (title.last) playSave(title.last.slot) }}
      onLoad={() => setScreen('load')}
      onStart={() => setScreen('avatar')}
    />
  )
}
