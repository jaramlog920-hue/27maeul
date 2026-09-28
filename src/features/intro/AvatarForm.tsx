// 주인공 고르기: 모습(여자/남자)과 이름
import { useState } from 'react'
import { T } from '../../content/text'
import { cleanAvatarName, nameProblem, type Avatar, type Look } from '../../engine/avatar'

export function AvatarForm({ onDone, onBack }: { onDone: (a: Avatar) => void; onBack: () => void }) {
  const [look, setLook] = useState<Look>('f')
  const [name, setName] = useState('')
  const problem = nameProblem(name)
  const looks = T.avatar.looks as Record<Look, string>
  const problems = T.avatar.problems as Record<Exclude<ReturnType<typeof nameProblem>, null>, string>
  return (
    <main className="title avatar-form">
      <div className="dialog" role="dialog" aria-label={T.avatar.title}>
        <h2>{T.avatar.title}</h2>
        <p className="hint">{T.avatar.lead}</p>
        <div className="actions" role="radiogroup" aria-label={T.avatar.lookLabel}>
          {(['f', 'm'] as const).map((l) => (
            <button key={l} role="radio" aria-checked={look === l} className={look === l ? 'primary' : ''} onClick={() => setLook(l)}>
              {looks[l]}
            </button>
          ))}
        </div>
        <label className="avatar-name">
          {T.avatar.nameLabel} <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
        </label>
        {name && problem && (
          <p className="desk-message wrong" role="status">
            {problems[problem]}
          </p>
        )}
        <div className="actions">
          <button onClick={onBack}>{T.ui.back}</button>
          <button className="primary" disabled={problem !== null} onClick={() => onDone({ look, name: cleanAvatarName(name) })}>
            {T.ui.start}
          </button>
        </div>
      </div>
    </main>
  )
}
