// 완성한 장을 골라 10문제를 풀고, 장별 첫 완주에만 보상을 받는다.
import { useEffect, useState, type ReactNode } from 'react'
import { CONTENT } from '../../content/catalog'
import { copyBookName } from '../../content/text'
import { ensureOtBook, otLoaded } from '../../content/ot-catalog'
import { BLANK_COIN, BLANK_PERFECT, blankChapterKey, blankQuizRewarded, copiedChapters, makeBlankQuiz, type BlankChapter } from '../../engine/blank-quiz'
import { isOtBook } from '../../engine/ot-books'
import { useGame } from '../../store/game-store'
import { NtContent } from '../passage/NtContent'

export function BlankQuiz({ initialTarget }: { initialTarget?: BlankChapter }) {
  const game = useGame(s => s.game)
  const chapters = copiedChapters(game)
  const validInitial = initialTarget && chapters.find(c => blankChapterKey(c) === blankChapterKey(initialTarget))
  const [selected, setSelected] = useState(() => blankChapterKey(validInitial || chapters.find(c => !blankQuizRewarded(game, c)) || chapters[0] || { book: 'mt', chapter: 1 }))
  const [active, setActive] = useState<BlankChapter | null>(() => validInitial || null)
  if (!chapters.length) return <p className="hint">필사를 한 장 마치면 그 장에서 빈칸 퀴즈 10문제가 나와요.</p>
  if (active) return <>
    <button onClick={() => setActive(null)}>다른 장 고르기</button>
    <ChapterContent key={blankChapterKey(active)} target={active} />
  </>
  const target = chapters.find(c => blankChapterKey(c) === selected) ?? chapters[0]
  return <div className="blank-quiz">
    <p className="hint">완성한 장마다 10문제를 풀 수 있어요. 보상은 각 장의 첫 풀이에만 받고, 다시 풀기는 보상이 없어요.</p>
    <label>퀴즈를 풀 장
      <select value={blankChapterKey(target)} onChange={e => setSelected(e.target.value)}>
        {chapters.map(c => <option key={blankChapterKey(c)} value={blankChapterKey(c)}>
          {copyBookName(c.book)} {c.chapter}장 · {blankQuizRewarded(game, c) ? '다시 풀기 · 보상 없음' : '첫 풀이 보상'}
        </option>)}
      </select>
    </label>
    <div className="actions"><button className="primary" onClick={() => setActive(target)}>10문제 풀기</button></div>
  </div>
}

/** 선택한 책만 로드한다. 구약 로드 실패 때 퀴즈를 생성하지 않고 재시도를 제공한다. */
function ChapterContent({ target }: { target: BlankChapter }) {
  const { book } = target
  const [ready, setReady] = useState(() => !isOtBook(book) || otLoaded(book))
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    if (isOtBook(book)) void ensureOtBook(book).then(
      () => { if (alive) setReady(true) },
      () => { if (alive) setError(true) },
    )
    return () => { alive = false }
  }, [book, attempt])
  if (!isOtBook(book)) return <NtContent books={[book]}><Round target={target} /></NtContent>
  if (!ready) return <div>
    <p role={error ? 'alert' : 'status'}>{error ? '본문을 불러오지 못했어요.' : '본문을 불러오는 중이에요.'}</p>
    {error && <button onClick={() => { setError(false); setAttempt(n => n + 1) }}>다시 불러오기</button>}
  </div>
  return <Round target={target} />
}

function Round({ target }: { target: BlankChapter }) {
  const game = useGame(s => s.game)
  const [questions, setQuestions] = useState(() => makeBlankQuiz(useGame.getState().game, CONTENT, Date.now(), target))
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [right, setRight] = useState(0)
  const [paid, setPaid] = useState<{ amount: number; first: boolean } | null>(null)
  const rewarded = blankQuizRewarded(game, target)
  if (!questions.length) return <p className="hint">이 장에서 문제를 만들 수 없어요. 다른 장을 골라 주세요.</p>
  const again = () => {
    setQuestions(makeBlankQuiz(useGame.getState().game, CONTENT, Date.now(), target))
    setAt(0)
    setPicked(null)
    setRight(0)
    setPaid(null)
  }
  if (paid !== null) return <div className="blank-quiz">
    <p className="talk-line">{questions.length}문제 가운데 {right}문제를 맞혔어요. {paid.first ? `${paid.amount}닢을 받았어요.` : '다시 풀기는 보상이 없어요.'}</p>
    <div className="actions"><button className="primary" onClick={again}>다시 풀기</button></div>
  </div>
  const q = questions[at]
  const done = picked !== null
  const next = () => {
    if (picked === null) return
    if (at + 1 < questions.length) { setAt(at + 1); setPicked(null); return }
    const first = !blankQuizRewarded(useGame.getState().game, target)
    const amount = useGame.getState().finishBlankQuiz(target, right, questions.length)
    setPaid({ amount, first })
  }
  const verse: ReactNode[] = []
  q.words.forEach((w, i) => {
    if (i) verse.push(' ')
    verse.push(i === q.index
      ? <b key={i} className={done ? (picked === q.answer ? 'right' : 'wrong') : ''}>{done ? q.answer : '＿＿＿'}</b>
      : <span key={i}>{w}</span>)
  })
  return (
    <div className="blank-quiz">
      <p className="hint">{at + 1} / {questions.length} · {rewarded ? '다시 풀기 · 보상 없음' : `첫 풀이 · 맞히면 ${BLANK_COIN}닢, 다 맞히면 ${BLANK_PERFECT}닢 더`}</p>
      <h3>{copyBookName(q.book)} {q.chapter}:{q.verse}</h3>
      <p className="blank-quiz-verse">{verse}</p>
      <div className="blank-quiz-options" role="group" aria-label="보기">
        {q.options.map((o) => (
          <button
            key={o}
            disabled={done}
            className={done && o === q.answer ? 'on' : done && o === picked ? 'wrong' : ''}
            onClick={() => {
              setPicked(o)
              if (o === q.answer) setRight(right + 1)
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {done && (
        <div className="actions">
          <p className="hint">{picked === q.answer ? '맞았어요.' : `정답은 '${q.answer}'예요.`}</p>
          <button className="primary" onClick={next}>{at + 1 < questions.length ? '다음 문제' : '마치기'}</button>
        </div>
      )}
    </div>
  )
}

/** 장 완료 화면과 말씀 메뉴에서 같은 장별 보상 규칙을 쓴다. */
export function BlankQuizDialog({ initialTarget }: { initialTarget?: BlankChapter }) {
  const close = useGame(s => s.closeModal)
  return <div className="dialog blank-quiz-dialog" role="dialog" aria-label="빈칸 퀴즈">
    <h2>빈칸 퀴즈</h2>
    <BlankQuiz initialTarget={initialTarget} />
    <div className="actions"><button data-close onClick={close}>닫기</button></div>
  </div>
}
