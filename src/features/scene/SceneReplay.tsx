// 기억 정원에서 본 장면 다시 보기 (2026-10-14 사용자: 앨범 말고 구약 터 기억 정원 안에서).
// 이미 본 도트 장면만 — 고르는 말을 다시 골라도 마음·기록은 바뀌지 않는다 (저장하지 않는다)
import { useState } from 'react'
import { callName, kidFill, partnerFill, SCENES, spouseFill, T } from '../../content/text'
import { t } from '../../shared/i18n'
import { AUTHORED_STORY_IDS } from '../../render/authored-story-art'
import type { GameState } from '../../engine/game'
import { partnerName, useGame } from '../../store/game-store'
import { AuthoredStoryScene } from './AuthoredStoryScene'
import { speakerName } from './SceneView'

/** 기억 정원 도감에 올리는 모든 도트 장면 (문구가 있는 것만, 정해진 순서) */
export function storyBook(): string[] {
  return AUTHORED_STORY_IDS.filter((id) => !!SCENES[id])
}

/** 이미 본 도트 장면: 지난 일지·오늘 기록·앨범에서 모은다 (처음 본 날 순) */
export function seenStories(s: Pick<GameState, 'journal' | 'todayNotes' | 'album' | 'clock'>): { id: string; day: number }[] {
  const ids = new Set<string>(AUTHORED_STORY_IDS)
  const out = new Map<string, number>()
  const add = (id: string, day: number) => { if (ids.has(id) && SCENES[id] && !out.has(id)) out.set(id, day) }
  for (const a of [...s.album].sort((x, y) => x.day - y.day)) add(a.id, a.day)
  for (const j of s.journal) for (const id of j.notes ?? []) add(id, j.day)
  for (const id of s.todayNotes) add(id, s.clock.day)
  return [...out].map(([id, day]) => ({ id, day })).sort((a, b) => a.day - b.day)
}

/** 장면 글의 이름 자리({child}·{partner} 등)를 지금 저장의 이름으로 채운다 */
export function useSceneSay(): (text: string) => string {
  const me = useGame((s) => s.game.avatar?.name)
  const kid = useGame((s) => s.game.child?.name)
  const spouse = useGame((s) => (s.game.romance?.stage === 'married' ? partnerName(s.game) : ''))
  const partner = useGame((s) => partnerName(s.game))
  return (text: string) => partnerFill(spouseFill(kidFill(callName(text, me), kid), spouse), partner)
}

export function SceneReplay({ id }: { id: string }) {
  const close = useGame((s) => s.closeModal)
  const say = useSceneSay()
  const [page, setPage] = useState(0)
  const [chosen, setChosen] = useState<number | undefined>(undefined)
  const scene = SCENES[id]
  if (!scene) return null
  const asking = !!scene.choices?.length && chosen === undefined
  const all = [...scene.lines, ...(chosen !== undefined ? scene.choices?.[chosen]?.reply ?? [] : [])]
  const at = Math.min(page, Math.max(0, all.length - 1))
  const more = asking ? at < scene.lines.length - 1 : at < all.length - 1
  const l = all[at]
  const who = l ? speakerName(l.speaker) : null
  return (
    <AuthoredStoryScene id={id} title={say(scene.title)} beat={at} chosen={chosen}>
      <div className="dialog scene cinematic-scene-dialog">
        <h2>{say(scene.title)}</h2>
        <div className="scene-lines">
          {l && (
            <p key={at} className={who ? 'scene-line said' : 'scene-line narration'}>
              {who && <span className="talk-role">{who}</span>}
              {say(l.text)}
            </p>
          )}
        </div>
        {more ? (
          <div className="actions"><button className="primary" onClick={() => setPage(at + 1)}>{t('common.next')}</button></div>
        ) : asking ? (
          <div className="actions menu column">
            {scene.choices!.map((c, i) => (
              <button key={i} onClick={() => { setPage(scene.lines.length); setChosen(i) }}>{say(c.label)}</button>
            ))}
          </div>
        ) : (
          <div className="actions"><button className="primary" onClick={close}>{T.ui.close}</button></div>
        )}
      </div>
    </AuthoredStoryScene>
  )
}
