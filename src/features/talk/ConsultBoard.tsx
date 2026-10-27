// 사랑방 게시판의 고민 쪽지 (2026-10-27 사용자: 주민 결혼 상담은 게시판에서) — 상담이 열린 연인마다 한 장.
// 하루 한 번 답하고, 세 번 답하면 끝난다. 이웃 대화칸에서 그 사람을 찾아다니던 상담을 옮겨 왔다.
import { useState } from 'react'
import { fill, T } from '../../content/text'
import { answerConsult, consultNotes, consultQuestion, pairOf } from '../../engine/gen-marriage'
import { CONSULT_QUESTIONS } from '../../engine/gen-config'
import { t } from '../../shared/i18n'
import { BlockedButton } from '../../shared/BlockedButton'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'
import { partnerVars, personName } from './GenTalk'

const G = T.gen

export function ConsultBoard() {
  const game = useGame((s) => s.game)
  const [open, setOpen] = useState<string | null>(null)
  // 세 번째 답을 하면 쪽지가 목록에서 빠지므로, 답장은 쪽지와 따로 들고 있다
  const [reply, setReply] = useState<{ title: string; line: string } | null>(null)
  const day = game.clock.day
  const notes = consultNotes(game.gen, game.hearts, day)
  const note = notes.find((n) => n.r.id === open)

  if (reply)
    return (
      <section aria-label={reply.title}>
        <h3>{reply.title}</h3>
        <p className="talk-line">{reply.line}</p>
        <div className="actions menu column">
          <button onClick={() => { setOpen(null); setReply(null) }}>{T.ui.back}</button>
        </div>
      </section>
    )

  if (note && game.gen) {
    const partner = pairOf(note.r, note.by)
    const vars = partnerVars(partner)
    const n = note.r.consult?.answers.length ?? 0
    return (
      <section aria-label={t('consultBoard.note', { who: personName(note.by) })}>
        <h3>{t('consultBoard.note', { who: personName(note.by) })}</h3>
        <p className="hint">{t('consultBoard.progress', { n, all: CONSULT_QUESTIONS })}</p>
        <p className="talk-line">{fill(G.consult[consultQuestion(game.gen, note.r)], vars)}</p>
        <div className="actions menu column">
          {(['cheer', 'wait'] as const).map((a) => (
            <BlockedButton key={a} why={note.due ? null : t('consultBoard.tomorrow')} onClick={() => {
              const cur = useGame.getState().game
              if (!cur.gen) return
              const r = answerConsult(cur.gen, note.r.id, a, day)
              applyLifeState({ ...cur, gen: r.g })
              const say = r.result === 'cheered' ? G.replies.cheered : r.result === 'wait' ? G.replies.waited : G.replies[a]
              setReply({ title: t('consultBoard.note', { who: personName(note.by) }), line: fill(say, vars) })
            }}>{G.answers[a]}</BlockedButton>
          ))}
          <button onClick={() => { setOpen(null); setReply(null) }}>{T.ui.back}</button>
        </div>
      </section>
    )
  }
  if (!notes.length) return <p className="hint">{t('consultBoard.none')}</p>
  return (
    <ul className="rows" aria-label={t('consultBoard.tab')}>
      {notes.map(({ r, by, due }) => (
        <li key={r.id}>
          <button className="row" onClick={() => { setOpen(r.id); setReply(null) }}>
            <span className="row-main">
              <b>{t('consultBoard.note', { who: personName(by) })}</b>
              <small>{t('consultBoard.about', { partner: personName(pairOf(r, by)) })} · {t('consultBoard.progress', { n: r.consult?.answers.length ?? 0, all: CONSULT_QUESTIONS })}{due ? '' : ` · ${t('consultBoard.tomorrowShort')}`}</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
