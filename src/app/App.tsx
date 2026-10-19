import { t } from '../shared/i18n'
import { useEffect, useState } from 'react'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { activeSlot, createSaveAsync, listSaves, loadGame, newSlot, saveGame, selectSaveAsync, setActiveSlot } from '../engine/save'
import { AvatarForm } from '../features/intro/AvatarForm'
import { Intro } from '../features/intro/Intro'
import { SaveSlots } from '../features/intro/SaveSlots'
import { Play } from '../features/play/Play'
import { unlockAudio } from '../audio/sound'
import { useGame } from '../store/game-store'
import { StorageNotice } from './StorageNotice'

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
  const [busy, setBusy] = useState(false)
  const [loadNotice, setLoadNotice] = useState<string | null>(null)
  async function playSave(slot: string) {
    if (busy) return
    setBusy(true)
    // 시작 화면을 연 뒤 저장이 바뀌었어도 최신 상태로 이어 간다.
    const game = loadGame(CONTENT, undefined, slot)
    // 열 수 없는 칸이면 까닭을 알린다 (2026-10-19 감사 L-3)
    if (!game) { setTitle(titleSaves()); setLoadNotice(t('saves.cannotOpen')); setBusy(false); return }
    setLoadNotice(null)
    unlockAudio()
    if (!await selectSaveAsync(slot)) { setBusy(false); return }
    useGame.getState().load(game)
    setScreen('play')
    setBusy(false)
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
    // 개발용: ?test=max → 지금 이어 하던 저장의 능력치를 모두 100으로 (2026-10-14 사용자)
    if (test === 'max') {
      const game = loadGame(CONTENT)
      if (game) {
        const stats = Object.fromEntries(Object.entries(game.stats).map(([k, v]) => [k, { ...v, level: 5, xp: 0 }])) as typeof game.stats
        const maxed = { ...game, stats }
        saveGame(maxed)
        unlockAudio()
        useGame.getState().load(maxed)
        history.replaceState(null, '', location.pathname)
        setScreen('play')
      }
      return
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
  let content
  if (screen === 'play') content = <Play />
  else if (screen === 'load')
    content = (
      <SaveSlots
        notice={loadNotice}
        onBack={() => {
          setTitle(titleSaves())
          setLoadNotice(null)
          setScreen('intro')
        }}
        onPick={(slot) => { void playSave(slot) }}
      />
    )
  else if (screen === 'avatar')
    content = (
      <AvatarForm
        onBack={() => setScreen('intro')}
        onDone={async (avatar) => {
          if (busy) return
          setBusy(true)
          unlockAudio()
          const game = newGame(CONTENT, avatar)
          const slot = await createSaveAsync(game)
          if (slot) {
            useGame.getState().load(game)
            setScreen('play')
          }
          setBusy(false)
        }}
      />
    )
  else content = (
    <Intro
      hasSave={title.hasSaves}
      canContinue={title.last !== null}
      avatar={title.last?.game.avatar}
      onContinue={() => { if (title.last) void playSave(title.last.slot) }}
      onLoad={() => setScreen('load')}
      onStart={() => setScreen('avatar')}
    />
  )
  return <>
    <div style={{ display: 'contents' }} inert={busy}>{content}</div>
    {busy && <p className="storage-busy" role="status">저장을 확인하는 중이에요.</p>}
    <StorageNotice
      getCurrentGame={() => screen === 'play' ? useGame.getState().game : titleSaves().last?.game ?? useGame.getState().game}
      getCurrentSlot={() => screen === 'play' ? activeSlot() : titleSaves().last?.slot ?? activeSlot()}
    />
  </>
}
