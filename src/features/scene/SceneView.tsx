// 이웃 이야기 장면 — 모두 게임 창작. 말하는 이는 이웃이나 해설(기록자는 말하지 않는다)
import { useEffect, useState } from 'react'
import { t } from '../../shared/i18n'
import { neighborById } from '../../content/catalog'
import { callName, kidFill, partnerFill, SCENES, spouseFill, T } from '../../content/text'
import { partnerName, useGame } from '../../store/game-store'

export function speakerName(speaker: string): string | null {
  if (speaker === 'narration') return null
  return neighborById(speaker)?.role ?? null
}

export function SceneView({ id, chosen }: { id: string; chosen?: number }) {
  const nextScene = useGame((s) => s.nextScene)
  const chooseScene = useGame((s) => s.chooseScene)
  const me = useGame((s) => s.game.avatar?.name)
  const kid = useGame((s) => s.game.child?.name)
  const spouse = useGame((s) => (s.game.romance?.stage === 'married' ? partnerName(s.game) : ''))
  // 연인 이름 (함께 가기 장면): {partner}·{partnerSubj}·{partnerAnd}
  const partner = useGame((s) => partnerName(s.game))
  // 해마다 다시 나오는 장면(가족 생일)은 앨범에 이미 있으면 앨범 표시를 하지 않는다
  const inAlbum = useGame((s) => s.game.album.some((a) => a.id === id))
  // 아이 이름 (계획 12): {child}·{childSubj}·{childAnd}, 배우자 이름: {spouse}·{spouseSubj}·{spouseAnd}
  const say = (text: string) => partnerFill(spouseFill(kidFill(callName(text, me), kid), spouse), partner)
  const scene = SCENES[id]
  // 고르는 말이 있는 장면 (계획 6b): 고르기 전엔 닫지 않는다, 고르면 대답이 이어진다
  const asking = !!scene?.choices?.length && chosen === undefined
  const reply = chosen !== undefined ? (scene?.choices?.[chosen]?.reply ?? []) : []
  // 한 줄씩 넘겨 본다 (2026-10-07 사용자 — 한꺼번에 여러 줄이 보이면 읽기 힘들다). 장면이 바뀌면 처음부터
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [id])
  // 문구가 없는 장면은 건너뛴다 — 그리는 도중에 상태를 바꾸지 않도록 효과에서
  useEffect(() => {
    if (!scene) nextScene()
  }, [scene, nextScene])
  if (!scene) return null
  const all = [...scene.lines, ...reply]
  const at = Math.min(page, Math.max(0, all.length - 1))
  // 고르는 말은 장면 줄을 다 본 뒤에, 닫기는 대답까지 다 본 뒤에
  const more = asking ? at < scene.lines.length - 1 : at < all.length - 1
  const l = all[at]
  const who = l ? speakerName(l.speaker) : null
  return (
    <div className="dialog scene" role="dialog" aria-label={say(scene.title)}>
      <h2>{say(scene.title)}</h2>
      <div className="scene-lines">
        {l && (
          <p key={at} className={who ? 'scene-line said' : 'scene-line narration'}>
            {who && <span className="talk-role">{who}</span>}
            {say(l.text)}
          </p>
        )}
      </div>
      {scene.album && !asking && !more && !inAlbum && <p className="stamp-note">📷 {T.ui.album}: {say(scene.album)}</p>}
      {more ? (
        <div className="actions">
          <button className="primary" onClick={() => setPage(at + 1)}>
            {t('common.next')}
          </button>
        </div>
      ) : asking ? (
        <div className="actions menu column">
          {scene.choices!.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                // 고른 뒤엔 대답 첫 줄부터
                setPage(scene.lines.length)
                chooseScene(i)
              }}
            >
              {say(c.label)}
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
