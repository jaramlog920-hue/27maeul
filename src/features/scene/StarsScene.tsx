import { useEffect, useRef } from 'react'
import { drawStargazing } from '../../render/stargazing-art'
import { drawSunset } from '../../render/sunset-scene-art'
import { storeAlbumImage, useGame } from '../../store/game-store'
import './stars-scene.css'

export function LandscapeScene({ kind = 'stars', onFinish, preview = false }: { kind?: 'stars' | 'sunset'; onFinish?: () => void; preview?: boolean }) {
  const avatar = useGame(s => s.game.avatar)
  const day = useGame(s => s.game.clock.day)
  const nextScene = useGame(s => s.nextScene)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let frame = 0, last = -1000, captured = false
    const draw = (now: number) => {
      if (now - last >= 80) {
        last = now
        const bounds = canvas.getBoundingClientRect()
        const width = 320, height = Math.max(180, Math.round(width * (bounds.height || 180) / (bounds.width || 320)))
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
        const time = reduced ? 0 : (now - start) / 1000
        if (kind === 'sunset') drawSunset(g, width, height, time, avatar)
        else drawStargazing(g, width, height, time, avatar, day)
        if (!captured && !preview) { storeAlbumImage(kind, canvas.toDataURL('image/png')); captured = true }
      }
      if (!reduced) frame = requestAnimationFrame(draw)
    }
    draw(start)
    const resize = () => { if (reduced) { last = -1000; draw(performance.now()) } }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [avatar, day, kind, preview])
  const sunset = kind === 'sunset'
  return <section className={`stars-scene${sunset ? ' sunset-scene' : ''}`} role="dialog" aria-modal="true" aria-label={sunset ? '호숫가 노을' : '별 보는 밤'}>
    <canvas ref={ref} width={320} height={180} aria-hidden="true" />
    <header className="stars-scene-title"><span>{sunset ? '호숫가 정자에서' : '언덕에서'}</span><h2>{sunset ? '호숫가 노을' : '별 보는 밤'}</h2></header>
    <div className="stars-scene-caption">
      <p>{sunset ? '물결 위로 주황빛이 번졌다.' : '언덕에 앉아 별을 올려다보았다.'}</p>
      <button autoFocus onClick={onFinish ?? nextScene}>마을로 돌아가기 <span aria-hidden="true">›</span></button>
    </div>
  </section>
}
