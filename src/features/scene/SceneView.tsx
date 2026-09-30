// 이웃 이야기 장면 — 모두 게임 창작. 말하는 이는 이웃이나 해설(기록자는 말하지 않는다)
import { useEffect } from 'react'
import { neighborById } from '../../content/catalog'
import { SCENES, T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function speakerName(speaker: string): string | null {
  if (speaker === 'narration') return null
  return neighborById(speaker)?.role ?? null
}

export function SceneView({ id, chosen }: { id: string; chosen?: number }) {
  const nextScene = useGame((s) => s.nextScene)
  const chooseScene = useGame((s) => s.chooseScene)
  const scene = SCENES[id]
  // 고르는 말이 있는 장면 (계획 6b): 고르기 전엔 닫지 않는다, 고르면 대답이 이어진다
  const asking = !!scene?.choices?.length && chosen === undefined
  const reply = chosen !== undefined ? (scene?.choices?.[chosen]?.reply ?? []) : []
  // 문구가 없는 장면은 건너뛴다 — 그리는 도중에 상태를 바꾸지 않도록 효과에서
  useEffect(() => {
    if (!scene) nextScene()
  }, [scene, nextScene])
  if (!scene) return null
  return (
    <div className="dialog scene" role="dialog" aria-label={scene.title}>
      <h2>{scene.title}</h2>
      <div className="scene-lines">
        {[...scene.lines, ...reply].map((l, i) => {
          const who = speakerName(l.speaker)
          return (
            <p key={i} className={who ? 'scene-line said' : 'scene-line narration'}>
              {who && <span className="talk-role">{who}</span>}
              {l.text}
            </p>
          )
        })}
      </div>
      {scene.album && !asking && <p className="stamp-note">📷 {T.ui.album}: {scene.album}</p>}
      {asking ? (
        <div className="actions menu column">
          {scene.choices!.map((c, i) => (
            <button key={i} onClick={() => chooseScene(i)}>
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="actions">
          <button className="primary" onClick={nextScene}>
            {T.ui.close}
          </button>
        </div>
      )}
    </div>
  )
}
