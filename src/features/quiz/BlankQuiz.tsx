// 빈칸 퀴즈 (2026-10-14 사용자): 말씀 메뉴의 탭과 장을 마친 화면의 단추가 같은 퀴즈를 연다.
// 지금까지 필사를 마친 장에서 무작위 절의 빈칸 하나를 낱말 보기 넷에서 고른다. 한 판 5문제, 맞힌 만큼 닢, 판수 제한 없음.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CONTENT } from '../../content/catalog'
import { copyBookName } from '../../content/text'
import { ensureOtBook, otLoaded } from '../../content/ot-catalog'
import { BLANK_COIN, BLANK_PERFECT, BLANK_QUIZ_SIZE, blankQuizPay, copiedChapters, makeBlankQuiz } from '../../engine/blank-quiz'
import { isOtBook, type OtBook } from '../../engine/ot-books'
import type { Book } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { NtContent } from '../passage/NtContent'

/** 필사한 책의 본문을 불러온 뒤 퀴즈를 연다 (신약은 NtContent, 구약은 책마다 불러오기) */
export function BlankQuiz() {
  const copy = useGame((s) => s.game.copy)
  const chapters = copiedChapters({ copy })
  const nt = [...new Set(chapters.map((c) => c.book).filter((b): b is Book => !isOtBook(b)))]
  const ot = [...new Set(chapters.map((c) => c.book).filter((b): b is OtBook => isOtBook(b)))]
  const otKey = ot.join(',')
  const [otReady, setOtReady] = useState(() => ot.every(otLoaded))
  useEffect(() => {
    let alive = true
    const list = otKey ? (otKey.split(',') as OtBook[]) : []
    if (!list.every(otLoaded)) void Promise.allSettled(list.map(ensureOtBook)).then(() => { if (alive) setOtReady(true) })
    else setOtReady(true)
    return () => { alive = false }
  }, [otKey])
  if (!chapters.length) return <p className="hint">필사를 한 장 마치면 그 장에서 빈칸 퀴즈가 나와요.</p>
  if (!otReady) return <p className="hint" role="status">본문을 불러오는 중이에요.</p>
  return <NtContent books={nt}><Round /></NtContent>
}

function Round() {
  const game = useGame((s) => s.game)
  const [seed, setSeed] = useState(() => Date.now())
  // 판을 시작할 때 한 번만 문제를 만든다 (풀면서 닢이 바뀌어도 문제는 그대로)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => makeBlankQuiz(game, CONTENT, seed), [seed])
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [right, setRight] = useState(0)
  const [paid, setPaid] = useState<number | null>(null)
  if (!questions.length) return <p className="hint">문제를 만들 수 있는 절이 아직 없어요. 필사를 조금 더 해 주세요.</p>
  const again = () => {
    setSeed(Date.now())
    setAt(0)
    setPicked(null)
    setRight(0)
    setPaid(null)
  }
  if (paid !== null) {
    return (
      <div className="blank-quiz">
        <p className="talk-line">{questions.length}문제 가운데 {right}문제를 맞혔어요. {paid}닢을 받았어요.</p>
        <div className="actions"><button className="primary" onClick={again}>한 판 더</button></div>
      </div>
    )
  }
  const q = questions[at]
  const done = picked !== null
  const next = () => {
    if (at + 1 < questions.length) {
      setAt(at + 1)
      setPicked(null)
      return
    }
    useGame.getState().finishBlankQuiz(right, questions.length)
    setPaid(blankQuizPay(right, questions.length))
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
      <p className="hint">{at + 1} / {questions.length} · 맞히면 {BLANK_COIN}닢{questions.length >= BLANK_QUIZ_SIZE ? `, 다 맞히면 ${BLANK_PERFECT}닢 더` : ''}</p>
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

/** 장을 마친 화면에서 여는 창 */
export function BlankQuizDialog() {
  const close = useGame((s) => s.closeModal)
  return (
    <div className="dialog blank-quiz-dialog" role="dialog" aria-label="빈칸 퀴즈">
      <h2>빈칸 퀴즈</h2>
      <BlankQuiz />
      <div className="actions"><button data-close onClick={close}>닫기</button></div>
    </div>
  )
}
