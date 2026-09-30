// 기록하기 전 다섯 문제. 틀려도 벌은 없다 — 다시 고르면 된다.
// 문제에 나오는 성경 문장은 늘 출처(개역한글)와 함께 양피지 상자 안에 있다 (exclusion-list §0).
import { useState } from 'react'
import { pieceById, versesOf } from '../../content/catalog'
import { fill, T } from '../../content/text'
import type { GospelId, Question } from '../../engine/quiz'
import { isGospel, type Book } from '../../engine/types'
import { useGame, type Modal } from '../../store/game-store'
import { Passage } from '../passage/Passage'

const BOOK_NAME = T.quiz.books as Record<Book, string>

/** 성경 문장의 일부(빈칸 등)를 보일 때도 본문 상자와 출처를 쓴다 */
function VerseBox({ refText, children }: { refText: string; children: React.ReactNode }) {
  return (
    <section className="passage" aria-label={`성경 본문 ${refText}`}>
      <header className="passage-ref">
        <span>{refText}</span>
        <span className="passage-src">{T.ui.bibleSource}</span>
      </header>
      <div className="passage-body">
        <p>{children}</p>
      </div>
    </section>
  )
}

function Puzzle({ q, onAnswer, solved }: { q: Extract<Question, { kind: 'puzzle' }>; onAnswer: (w: string[]) => void; solved: boolean }) {
  const [picked, setPicked] = useState<number[]>([])
  const done = picked.length === q.words.length
  return (
    <>
      <p className="quiz-prompt">{T.quiz.puzzle}</p>
      {/* 본문 창에는 맞춘 뒤의 본문만 — 고르는 중인 낱말은 본문 창 밖 쟁반에 (§0) */}
      {solved ? (
        <VerseBox refText={q.ref}>{q.answer.join(' ')}</VerseBox>
      ) : (
        <>
          <p className="stamp-note">{fill(T.quiz.puzzleSource, { ref: q.ref })}</p>
          <p className="word-tray" aria-live="polite">{picked.map((i) => q.words[i]).join(' ') || '…'}</p>
          <div className="word-bank">
            {q.words.map((w, i) => (
              <button key={i} disabled={picked.includes(i)} onClick={() => setPicked([...picked, i])}>
                {w}
              </button>
            ))}
          </div>
          <div className="actions">
            <button onClick={() => setPicked([])}>{T.quiz.reset}</button>
            <button className="primary" disabled={!done} onClick={() => onAnswer(picked.map((i) => q.words[i]))}>
              {T.quiz.check}
            </button>
          </div>
        </>
      )}
    </>
  )
}

function Detective({ q, onAnswer, solved, pool }: { q: Extract<Question, { kind: 'detective' }>; onAnswer: (g: string[]) => void; solved: boolean; pool: boolean }) {
  const [chosen, setChosen] = useState<GospelId[]>([])
  const p = pieceById(q.pieceId)
  const toggle = (g: GospelId) => setChosen(chosen.includes(g) ? chosen.filter((x) => x !== g) : [...chosen, g])
  return (
    <>
      <p className="quiz-prompt">{fill(pool ? T.quiz.detectivePool : T.quiz.detective, { title: p.title, ref: p.ref })}</p>
      <div className="detective-grid">
        {q.options.map((g) => (
          <button key={g} className={(solved ? q.answer.includes(g) : chosen.includes(g)) ? 'on' : ''} aria-pressed={chosen.includes(g)} disabled={solved} onClick={() => toggle(g)}>
            {BOOK_NAME[g]}
          </button>
        ))}
      </div>
      <p className="stamp-note">{T.quiz.detectiveNote}</p>
      {!solved && (
        <div className="actions">
          <button className="primary" disabled={chosen.length === 0} onClick={() => onAnswer(chosen)}>
            {T.quiz.check}
          </button>
        </div>
      )}
    </>
  )
}

function Choices({ options, label, answer, wrong, solved, onAnswer }: { options: string[]; label: (o: string) => string; answer: string; wrong: string[]; solved: boolean; onAnswer: (o: string) => void }) {
  return (
    <div className="actions menu column">
      {options.map((o) => (
        <button key={o} className={solved && o === answer ? 'right' : wrong.includes(o) ? 'wrong' : ''} disabled={solved || wrong.includes(o)} onClick={() => onAnswer(o)}>
          {label(o)}
        </button>
      ))}
    </div>
  )
}

/** "어느 책?" — 본문은 그대로 보이고, 참조는 맞힌 뒤에 보인다 (exclusion-list §4-5) */
function BookQuestion({ q, wrong, solved, onAnswer }: { q: Extract<Question, { kind: 'book' }>; wrong: string[]; solved: boolean; onAnswer: (o: string) => void }) {
  const text = versesOf(q.ref)[0].text
  return (
    <>
      {/* 보기가 모두 복음서면 "어느 복음서", 사도행전이 섞이면 "어느 책" */}
      <p className="quiz-prompt">{q.options.every(isGospel) ? T.quiz.book : T.quiz.bookAny}</p>
      <section className="passage" aria-label={solved ? `성경 본문 ${q.ref}` : '성경 본문'}>
        <header className="passage-ref">
          <span>{solved ? q.ref : T.quiz.bookHidden}</span>
          <span className="passage-src">{T.ui.bibleSource}</span>
        </header>
        <div className="passage-body">
          <p>{text}</p>
        </div>
      </section>
      <Choices options={q.options} label={(o) => BOOK_NAME[o as Book]} answer={q.answer} wrong={wrong} solved={solved} onAnswer={onAnswer} />
    </>
  )
}

/**
 * 편지 첫머리 문제 (exclusion-list §4-6): 첫머리 구절(개역한글 그대로)에서 그 칸으로 "적힌 이름" 자리만 빈칸 — "누가 썼나요?"로 묻지 않고,
 * 책 이름도 말하지 않는다(답이 드러나므로). 참조는 맞힌 뒤에 보이고, 그때 빈칸이 채워져 구절 전체가 보인다
 */
function OpeningQuestion({ q, wrong, solved, onAnswer }: { q: Extract<Question, { kind: 'opening' }>; wrong: string[]; solved: boolean; onAnswer: (o: string) => void }) {
  return (
    <>
      <p className="quiz-prompt">{T.quiz.opening[q.role]}</p>
      <section className="passage" aria-label={solved ? `성경 본문 ${q.ref}` : '성경 본문'}>
        <header className="passage-ref">
          <span>{solved ? q.ref : T.quiz.bookHidden}</span>
          <span className="passage-src">{T.ui.bibleSource}</span>
        </header>
        <div className="passage-body">
          <p>
            {q.before}<span className="blank-slot">{solved ? q.answer : '＿＿＿'}</span>{q.after}
          </p>
        </div>
      </section>
      {solved && <p className="stamp-note">{T.quiz.openingAfter}</p>}
      <Choices options={q.options} label={(o) => o} answer={q.answer} wrong={wrong} solved={solved} onAnswer={onAnswer} />
    </>
  )
}

/** 먼저 나오는 구절 (편지): 두 구절의 본문만 보이고, 참조는 맞힌 뒤에 보인다 */
function VerseOrderQuestion({ q, wrong, solved, onAnswer }: { q: Extract<Question, { kind: 'verseOrder' }>; wrong: string[]; solved: boolean; onAnswer: (o: string) => void }) {
  const label = (o: string) => fill(T.quiz.verseOrderLabel, { n: q.options.indexOf(o) + 1 })
  return (
    <>
      <p className="quiz-prompt">{T.quiz.verseOrder}</p>
      {q.options.map((r) => (
        <section key={r} className="passage" aria-label={solved ? `성경 본문 ${r}` : `성경 본문 ${label(r)}`}>
          <header className="passage-ref">
            <span>{solved ? `${label(r)} · ${r}` : label(r)}</span>
            <span className="passage-src">{T.ui.bibleSource}</span>
          </header>
          <div className="passage-body">
            <p>{versesOf(r)[0].text}</p>
          </div>
        </section>
      ))}
      <Choices options={q.options} label={label} answer={q.answer} wrong={wrong} solved={solved} onAnswer={onAnswer} />
    </>
  )
}

export function QuizView({ modal }: { modal: Extract<Modal, { kind: 'quiz' }> }) {
  const { answerQuiz, nextQuiz, closeModal } = useGame.getState()
  const q = modal.questions[modal.index]
  const last = modal.index === modal.questions.length - 1
  const title = (id: string) => pieceById(id).title
  const lib = modal.mode.kind === 'library'
  return (
    <div className="dialog scroll-dialog quiz" role="dialog" aria-label={T.quiz.title}>
      <h2>
        {lib ? T.quiz.shelveTitle : T.quiz.title} <span className="desk-chapter">· {fill(T.quiz.progress, { n: modal.index + 1, all: modal.questions.length })}</span>
      </h2>
      <p className="quiz-kind">{T.quiz.kinds[q.kind]}</p>
      {/* 문제마다 선택 상태를 새로 (key) */}
      <div key={modal.index}>
        {q.kind === 'puzzle' && <Puzzle q={q} solved={modal.solved} onAnswer={answerQuiz} />}
        {q.kind === 'blank' && (
          <>
            <p className="quiz-prompt">{T.quiz.blank}</p>
            <VerseBox refText={q.ref}>
              {q.before} <span className="blank-slot">{modal.solved ? q.answer : '＿＿＿'}</span> {q.after}
            </VerseBox>
            <Choices options={q.options} label={(o) => o} answer={q.answer} wrong={modal.wrong} solved={modal.solved} onAnswer={answerQuiz} />
          </>
        )}
        {q.kind === 'detective' && <Detective q={q} solved={modal.solved} onAnswer={answerQuiz} pool={lib} />}
        {q.kind === 'book' && <BookQuestion q={q} wrong={modal.wrong} solved={modal.solved} onAnswer={answerQuiz} />}
        {q.kind === 'opening' && <OpeningQuestion q={q} wrong={modal.wrong} solved={modal.solved} onAnswer={answerQuiz} />}
        {q.kind === 'verseOrder' && <VerseOrderQuestion q={q} wrong={modal.wrong} solved={modal.solved} onAnswer={answerQuiz} />}
        {q.kind === 'verse' && (
          <>
            <p className="quiz-prompt">{T.quiz.verse}</p>
            <Passage refText={q.ref} />
            <Choices options={q.options} label={title} answer={q.answer} wrong={modal.wrong} solved={modal.solved} onAnswer={answerQuiz} />
          </>
        )}
        {q.kind === 'order' && (
          <>
            <p className="quiz-prompt">{lib ? T.quiz.orderBook : T.quiz.order}</p>
            <Choices options={q.options} label={title} answer={q.answer} wrong={modal.wrong} solved={modal.solved} onAnswer={answerQuiz} />
          </>
        )}
      </div>
      {modal.wrong.length > 0 && !modal.solved && <p className="desk-message wrong" role="status">{T.quiz.wrong}</p>}
      {modal.solved && (
        <p className="desk-message done" role="status">
          {T.quiz.right}
        </p>
      )}
      <div className="actions">
        {!modal.solved && !(modal.mode.kind === 'library' && modal.mode.retry) && <button onClick={closeModal}>{T.quiz.later}</button>}
        {modal.solved && (
          <button className="primary" onClick={nextQuiz}>
            {last ? (lib ? T.quiz.shelveRecord : T.quiz.record) : T.ui.next}
          </button>
        )}
      </div>
    </div>
  )
}
