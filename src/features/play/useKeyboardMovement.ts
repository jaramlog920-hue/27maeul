import { useEffect } from 'react'
import { unlockAudio } from '../../audio/sound'
import { useGame } from '../../store/game-store'

const directions: Record<string, [number, number]> = {
  KeyW: [0, -1], KeyA: [-1, 0], KeyS: [0, 1], KeyD: [1, 0],
  ArrowUp: [0, -1], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowRight: [1, 0],
}

export function useKeyboardMovement() {
  useEffect(() => {
    const held = new Set<string>()
    const clear = () => held.clear()
    const step = () => {
      const state = useGame.getState()
      if (state.modal || state.decorating || document.hidden) { clear(); return }
      const code = [...held].at(-1)
      if (code) state.walk(...directions[code])
    }
    const down = (event: KeyboardEvent) => {
      const target = event.target
      // 스페이스: 앞에 있는 이웃·물건을 누른 것처럼 (글 입력칸·창 안에서는 원래대로)
      if (event.code === 'Space' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"]'))) return
        const state = useGame.getState()
        if (state.modal || state.decorating) return
        // 화면 위쪽 버튼에 초점이 남아 있으면 그 버튼이 눌리지 않게 한다
        event.preventDefault()
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.blur()
        unlockAudio()
        clear()
        state.interact()
        return
      }
      if (!directions[event.code] || event.ctrlKey || event.altKey || event.metaKey ||
        (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"]')))) return
      if (useGame.getState().modal || useGame.getState().decorating) return
      event.preventDefault()
      if (!event.repeat) {
        held.add(event.code)
        unlockAudio()
        step()
      }
    }
    const up = (event: KeyboardEvent) => { held.delete(event.code) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    document.addEventListener('focusin', clear)
    const unsubscribe = useGame.subscribe(state => { if (state.modal || state.decorating) clear() })
    const timer = window.setInterval(step, 30)
    return () => {
      clearInterval(timer)
      unsubscribe()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
      document.removeEventListener('focusin', clear)
    }
  }, [])
}
