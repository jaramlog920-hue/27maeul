// 이웃 이야기 장면 — 모두 게임 창작. 말하는 이는 이웃이나 해설(기록자는 말하지 않는다)
import { useEffect } from 'react'
import { neighborById } from '../../content/catalog'
import { SCENES, T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function speakerName(speaker: string): string | null {
  if (speaker === 'narration') return null
  return neighborById(speaker)?.role ?? null
}

export function SceneView({ id }: { id: string }) {
  const nextScene = useGame((s) => s.nextScene)
  const scene = SCENES[id]
  // 문구가 없는 장면은 건너뛴다 — 그리는 도중에 상태를 바꾸지 않도록 효과에서
  useEffect(() => {
    if (!scene) nextScene()
  }, [scene, nextScene])
  if (!scene) return null
  return (
    <div className="dialog scene" role="dialog" aria-label={scene.title}>
      <h2>{scene.title}</h2>
      <div className="scene-lines">
        {scene.lines.map((l, i) => {
          const who = speakerName(l.speaker)
          return (
            <p key={i} className={who ? 'scene-line said' : 'scene-line narration'}>
              {who && <span className="talk-role">{who}</span>}
              {l.text}
            </p>
          )
        })}
      </div>
      {scene.album && <p className="stamp-note">📷 {T.ui.album}: {scene.album}</p>}
      <div className="actions">
        <button className="primary" onClick={nextScene}>
          {T.ui.close}
        </button>
      </div>
    </div>
  )
}
