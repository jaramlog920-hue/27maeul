import { useEffect } from 'react'
import { unlockAudio } from '../../audio/sound'
import { useGame } from '../../store/game-store'

const directions: Record<string, [number, number]> = {
  KeyW: [0, -1], KeyA: [-1, 0], KeyS: [0, 1], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowRight: [1, 0],
}

const inputTarget = (target: EventTarget | null) => target instanceof HTMLElement &&
  (target.isContentEditable || !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="menu"]'))
const blocked = (state: ReturnType<typeof useGame.getState>) =>
  !!(state.modal || state.decorating || state.copyResult?.length || state.piecePopups.length || state.trip)

export function useKeyboardMovement() {
  useEffect(() => {
    const held = new Set<string>()
    const clear = () => held.clear()
    const step = () => {
      const state = useGame.getState()
      if (blocked(state) || document.hidden || inputTarget(document.activeElement)) { clear(); return }
      const code = [...held].at(-1)
      if (code) state.walk(...directions[code])
    }
    const down = (event: KeyboardEvent) => {
      const target = event.target
      if (event.ctrlKey || event.altKey || event.metaKey || inputTarget(target) || document.hidden || blocked(useGame.getState())) {
        clear()
        return
      }
      // 스페이스: 앞에 있는 이웃·물건을 누른 것처럼 (글 입력칸·창 안에서는 원래대로)
      if (event.code === 'Space' && !event.repeat) {
        const state = useGame.getState()
        // 화면 위쪽 버튼에 초점이 남아 있으면 그 버튼이 눌리지 않게 한다
        event.preventDefault()
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.blur()
        unlockAudio()
        state.interact()
        return
      }
      if (!directions[event.code]) return
      event.preventDefault()
      if (!event.repeat) {
        held.add(event.code)
        unlockAudio()
        step()
      }
    }
    const up = (event: KeyboardEvent) => { held.delete(event.code) }
    // HUD buttons can receive focus while a movement key is still held.
    // Only text entry and menus invalidate that hold; a fresh press is then required.
    const focus = (event: FocusEvent) => { if (inputTarget(event.target)) clear() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    document.addEventListener('focusin', focus)
    const unsubscribe = useGame.subscribe((state, previous) => {
      if (blocked(state) || state.loadEpoch !== previous.loadEpoch) clear()
      else if (previous.game.player.path.length && !state.game.player.path.length) step()
    })
    const timer = window.setInterval(step, 30)
    return () => {
      clearInterval(timer)
      unsubscribe()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
      document.removeEventListener('focusin', focus)
    }
  }, [])
}
