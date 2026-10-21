// 성격 한눈에 (2026-10-21 사용자): 이름 아래 "씩씩한 · 먹보 · 동물 친구", 오늘의 한마디, 말버릇 정해 주기
import { useState } from 'react'
import { catchIdeas, CATCH_MAX, likesLine, personaLine, personaTags, temperName, traitName, type Persona } from '../../engine/persona'
import { weatherOf } from '../../engine/calendar'
import { useGame } from '../../store/game-store'

export function PersonaCard({ persona, who, salt, parent, player, job, onCatch, growing }: {
  persona: Persona
  who: 'kid' | 'grown' | 'villager'
  salt: string
  parent?: string
  player?: string
  job?: string
  onCatch: (word: string) => void
  /** 성격이 아직 자리 잡지 않은 걷는 아이 — "다정한 쪽으로 자라는 중" */
  growing?: boolean
}) {
  const clock = useGame((s) => s.game.clock)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(persona.catch ?? '')
  const line = personaLine(persona, who, { day: clock.day, minute: clock.minute, weather: weatherOf(clock.day), parent, player, job, salt })
  return (
    <div className="persona-card">
      <p className="hint">{growing ? [`${temperName(persona.temper)} 쪽으로 자라는 중`, ...persona.traits.map(traitName)].join(' · ') : personaTags(persona)}{persona.catch ? ` · 말버릇 "${persona.catch}"` : ''}</p>
      {likesLine(persona) && <p className="hint">{likesLine(persona)}</p>}
      {line && <p className="talk-line">“{line}”</p>}
      {editing ? (
        <div className="persona-catch">
          <label htmlFor={`catch-${salt}`}>말버릇</label>
          <input id={`catch-${salt}`} value={draft} maxLength={CATCH_MAX} onChange={(e) => setDraft(e.target.value)} placeholder="비우면 없음" />
          <div className="actions">
            {catchIdeas(persona.temper).map((w) => <button key={w} onClick={() => setDraft(w)}>{w}</button>)}
          </div>
          <div className="actions">
            <button className="primary" onClick={() => { onCatch(draft); setEditing(false) }}>정하기</button>
            <button onClick={() => setEditing(false)}>그만두기</button>
          </div>
        </div>
      ) : (
        <div className="actions"><button onClick={() => { setDraft(persona.catch ?? ''); setEditing(true) }}>말버릇 정해 주기</button></div>
      )}
    </div>
  )
}
