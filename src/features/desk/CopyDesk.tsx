// 필사 집중 화면 (계획 14 작업 2). 책상에 앉으면 마을·위 줄·조작판·마을 소리가 사라지고 조용한 필사 화면이 된다.
// 개역한글 본문 한 절을 보고 그대로 따라 적는다 — 맞게 쓴 부분만 은은하게 진해지고, 틀린 글자는 그 자리에 아주 살짝 표시.
// 붙여넣기·끌어 놓기·자동완성은 받지 않는다. 휴대폰 한글 키보드: 조합 중인 글자는 되돌리지 않고, 조합 중인 마지막 글자를
// 오타로 깜빡이지 않으며(compositionstart/end + InputEvent.inputType), 조합이 끝난 뒤에 절을 마친다.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type Ref, type RefObject } from 'react'
import { chapterGuide, CONTENT, GOD_KEYWORDS, versesOf } from '../../content/catalog'
import { fill, roomTitle, T, withAnd, withSubject } from '../../content/text'
import { setQuiet } from '../../audio/sound'
import { chaptersOf, groupByRoom } from '../../engine/books'
import { BLOCKED_INPUT_TYPES, checkCopy, copySpot, copyVerses, normalizeCopy, originalEnd, type CopySpot, type CopyVerse } from '../../engine/copying'
import { deskKidWith, deskPose, spouseReading } from '../../engine/family'
import { BOOKS, type Book } from '../../engine/types'
import { COPY_PEN, FAMILY_DESK, ICON_PALETTE } from '../../render/sprites'
import { partnerName, useGame, type Modal } from '../../store/game-store'
import { prefersStill, quillScratch, verseBuzz } from './copy-feel'

const BOOK_NAME = T.quiz.books as Record<string, string>
const C = T.copyFocus
/** 절을 다 맞게 쓰고 조합 중인 채로 이만큼 멈추면 조합을 확정한다 */
const COMMIT_IDLE_MS = 700
// 필사 손맛: 잉크 번짐(글자) · 도장과 날아오르는 줄(절) · 접히는 쪽(장). 시간은 CSS 애니메이션과 맞춘다
/** 새로 맞게 쓴 글자가 번졌다가 가라앉는 시간 */
export const BLOOM_MS = 220
/** 마친 절: 도장 → (흔들림) → 위의 쪽으로 날아가 사라질 때까지 */
export const GHOST_MS = 950
/** 장을 마치면 쪽이 접히는 시간 (그 뒤로 장 완료 화면이 떠오른다) */
export const FOLD_MS = 900
/** 화면에만 쓰는 짧은 말 */
const FEEL = { page: '이 장에 적은 쪽 · {n}/{count}절' }
/** 작은 쪽의 줄 수와 줄마다 길이(%) — 손으로 쓴 쪽처럼 조금씩 들쭉날쭉 */
const PAGE_ROWS = 8
const ROW_LENGTH = [100, 92, 97, 86, 100, 90, 95, 70]

/** 27권을 서고 방으로 묶어 고른다 (처음부터 모두) */
function CopyBookPick() {
  const progress = useGame((s) => s.game.progress)
  const current = useGame((s) => s.game.copy.book)
  const { copyBook, copyView, copyExit } = useGame.getState()
  return (
    <div className="copy-panel">
      <h2>{C.pickTitle}</h2>
      {groupByRoom(BOOKS).map(({ room, books }) => (
        <details key={room.id} className="pick-room" open={current ? room.books.includes(current) : room.id === 'gospels'}>
          <summary>{roomTitle(room)}</summary>
          <div className="book-grid">
            {books.map((b) => {
              const status = fill(C.pickStatus, { done: progress[b].completed.length, all: chaptersOf(b, CONTENT).length })
              return (
                <button key={b} className={b === current ? 'primary' : ''} aria-label={`${BOOK_NAME[b]} · ${status}`} onClick={() => copyBook(b)}>
                  <span className="pick-name">{BOOK_NAME[b]}</span>
                  <span className="pick-status">{status}</span>
                </button>
              )
            })}
          </div>
        </details>
      ))}
      <div className="actions">
        <button onClick={current ? () => copyView('menu') : copyExit}>{current ? C.back : C.exit}</button>
      </div>
    </div>
  )
}

/** 책상 메뉴: [이어서 필사] [다른 책 선택] */
function CopyMenu({ book }: { book: Book }) {
  const game = useGame((s) => s.game)
  const { copyView, copyExit } = useGame.getState()
  const spot = copySpot(game, book, CONTENT)
  const name = BOOK_NAME[book]
  return (
    <div className="copy-panel copy-menu">
      <h2>{C.deskTitle}</h2>
      <p className="copy-menu-at">{spot ? fill(C.menuAt, { book: name, chapter: spot.chapter, verse: spot.verse.verse }) : fill(C.menuDone, { book: name })}</p>
      <div className="copy-menu-actions">
        {spot && (
          <button className="primary" onClick={() => copyView('write', true)}>
            {C.continue}
          </button>
        )}
        <button onClick={() => copyView('pick')}>{C.pickOther}</button>
        <button onClick={copyExit}>{C.exit}</button>
      </div>
    </div>
  )
}

/** 새로 맞게 쓴 글자 범위 (정규화 글자 수로: from째 다음 글자부터 to째 글자까지) */
interface Bloom {
  from: number
  to: number
  id: number
}
/** 본문(정규화)의 n+1째 글자가 시작하는 자리 */
function charStart(text: string, n: number): number {
  const end = originalEnd(text, n + 1)
  const ch = [...text.slice(0, end)].pop() ?? ''
  return end - ch.length
}
/** 맞게 쓴 부분 — 방금 맞게 쓴 글자만 잉크가 번졌다가 진하게 가라앉는다 (입력칸이 아니라 본문 쪽에 그린다) */
function DonePart({ text, matched, bloom }: { text: string; matched: number; bloom: Bloom | null }) {
  const cut = originalEnd(text, matched)
  if (!bloom || bloom.to > matched || bloom.from >= bloom.to) return <span className="copy-done-part">{text.slice(0, cut)}</span>
  const start = charStart(text, bloom.from)
  return (
    <span className="copy-done-part">
      {text.slice(0, start)}
      <span key={bloom.id} className="copy-bloom" data-bloom="">
        {text.slice(start, cut)}
      </span>
    </span>
  )
}

/** 본문 한 절: 맞게 쓴 부분은 진하게, 틀린 글자는 그 자리에 살짝 (조합 중인 마지막 글자는 표시하지 않는다) */
function VerseLine({
  text,
  matched,
  typo,
  label,
  bloom,
  arriving,
}: {
  text: string
  matched: number
  typo: boolean
  label: string
  bloom: Bloom | null
  arriving: boolean
}) {
  const cut = originalEnd(text, matched)
  const cls = arriving ? 'copy-focus-verse copy-verse-arrive' : 'copy-focus-verse'
  if (!typo)
    return (
      <p className={cls} aria-label={label}>
        <DonePart text={text} matched={matched} bloom={bloom} />
        {text.slice(cut)}
      </p>
    )
  // 틀린 자리 = 본문(정규화)의 matched째 글자 — 그 사이의 띄어쓰기·문장부호는 그대로 둔다
  const end = originalEnd(text, matched + 1)
  return (
    <p className={cls} aria-label={label}>
      <DonePart text={text} matched={matched} bloom={bloom} />
      {text.slice(cut, end - 1)}
      <span className="copy-typo" data-typo="">
        {text.slice(end - 1, end)}
      </span>
      {text.slice(end)}
    </p>
  )
}

/** 손에 쥔 펜 그림: 좋은 펜이 있으면 금빛 좋은 펜, 없으면 갈대 펜 (쓰는 느낌만 바뀐다 — 빠르게 하지 않는다) */
export function CopyPen() {
  const good = useGame((s) => (s.game.inv.goodPen ?? 0) > 0)
  const ref = useRef<HTMLCanvasElement>(null)
  const kind = good ? 'good' : 'plain'
  useEffect(() => {
    const g = ref.current?.getContext?.('2d')
    if (!g) return
    g.clearRect(0, 0, 8, 8)
    COPY_PEN[kind].forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const c = ICON_PALETTE[ch]
        if (ch === '.' || !c) return
        g.fillStyle = c
        g.fillRect(x, y, 1, 1)
      }),
    )
  }, [kind])
  return <canvas ref={ref} className={`copy-pen copy-pen-${kind}`} width={8} height={8} role="img" aria-label={good ? C.penGood : C.penPlain} />
}

// ── 가족과 함께 있는 필사 (계획 14 작업 10): 곁에 앉은 아이와 같은 방에서 책을 읽는 배우자 — 보상 없는 작은 그림 ──
const FD = T.family.desk
type FamilyPose = keyof typeof FAMILY_DESK

/** 가족 그림 한 칸 (16×12, 화면에서 두 배 이상으로 키운다). 아이 옷은 모습대로 (여자아이 보랏빛) */
function FamilySprite({ pose, girl = false }: { pose: FamilyPose; girl?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext?.('2d')
    if (!g) return
    g.clearRect(0, 0, 16, 12)
    FAMILY_DESK[pose].forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const c = ICON_PALETTE[girl && ch === 'g' ? 'q' : ch]
        if (ch === '.' || !c) return
        g.fillStyle = c
        g.fillRect(x, y, 1, 1)
      }),
    )
  }, [pose, girl])
  return <canvas ref={ref} className="copy-family-art" width={16} height={12} aria-hidden="true" data-pose={pose} />
}

/** 아이가 옆에 앉고 싶어 해요 → [같이 있기] / [혼자 쓰기] */
function CopyAsk() {
  const kid = useGame((s) => s.game.child)
  const { deskAnswer } = useGame.getState()
  return (
    <div className="copy-panel copy-ask">
      <h2>{FD.title}</h2>
      <FamilySprite pose="draw" girl={kid?.look === 'girl'} />
      <p>{fill(FD.ask, { who: withSubject(kid?.name ?? '') })}</p>
      <p className="hint">{FD.askNote}</p>
      <div className="copy-menu-actions">
        <button className="primary" onClick={() => deskAnswer(true)}>
          {FD.together}
        </button>
        <button onClick={() => deskAnswer(false)}>{FD.alone}</button>
      </div>
    </div>
  )
}

/** 쓰는 동안 곁의 가족: 아이(그림 그리기 → 책 넘겨 보기 → 졸다 잠들기)와 저녁의 배우자 */
function CopyFamily() {
  const game = useGame((s) => s.game)
  const kid = deskKidWith(game) ? game.child : null
  const spouse = spouseReading(game) ? partnerName(game) : ''
  if (!kid && !spouse) return null
  const pose = deskPose(game)
  return (
    <div className="copy-family">
      {kid && (
        <p className="copy-family-one" data-kid={pose}>
          <FamilySprite pose={pose} girl={kid.look === 'girl'} />
          <span>{fill(FD[pose], { who: withSubject(kid.name) })}</span>
        </p>
      )}
      {spouse && (
        <p className="copy-family-one" data-spouse="">
          <FamilySprite pose="spouse" />
          <span>{fill(FD.spouse, { who: withSubject(spouse) })}</span>
        </p>
      )}
    </div>
  )
}

/** 위의 작은 양피지 쪽: 마친 절마다 한 줄씩 잉크가 찬다 (장이 끝나면 꽉 찬 쪽이 접힌다) */
function CopyPage({
  verses,
  done,
  fresh,
  fold,
  still,
  pageRef,
}: {
  verses: CopyVerse[]
  done: number
  fresh?: number
  fold?: boolean
  still?: boolean
  pageRef?: Ref<HTMLDivElement>
}) {
  const count = verses.length
  const n = Math.min(done, count)
  const rows = Math.min(count, PAGE_ROWS)
  const freshAt = fresh === undefined ? -1 : verses.findIndex((v) => v.verse === fresh)
  const cls = fold ? (still ? 'copy-page copy-page-fold copy-page-fold-still' : 'copy-page copy-page-fold') : 'copy-page'
  return (
    <div ref={pageRef} className={cls} role="img" aria-label={fill(FEEL.page, { n, count })} data-lines={n}>
      {Array.from({ length: rows }, (_, r) => {
        // 줄 하나 = 절 몇 개 (짧은 장은 절마다 한 줄, 긴 장은 한 줄을 절 수만큼 나눠 조금씩 늘어난다)
        const from = Math.floor((r * count) / rows)
        const to = Math.floor(((r + 1) * count) / rows)
        const filled = Math.max(0, Math.min(n, to) - from) / (to - from)
        const isNew = freshAt >= from && freshAt < to
        return (
          <span key={r} className={isNew ? 'copy-page-row copy-page-new' : 'copy-page-row'}>
            <span className="copy-page-ink" style={{ width: `${Math.round(filled * ROW_LENGTH[r % ROW_LENGTH.length])}%` }} />
          </span>
        )
      })}
    </div>
  )
}

/** 마친 절: 그 자리에 도장 "장:절"이 꾹 찍히고(살짝 흔들림), 줄이 위의 쪽으로 날아가 들어간다 */
interface Ghost {
  text: string
  chapter: number
  verse: number
  id: number
}
function VerseGhost({ ghost, still, pageRef }: { ghost: Ghost; still: boolean; pageRef: RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLParagraphElement>(null)
  // 마친 절이 다음 절보다 길면 그동안 본문 칸 높이를 그대로 둔다 — 입력칸을 가리거나 밀어 올리지 않게
  useLayoutEffect(() => {
    const el = ref.current
    const wrap = el?.parentElement
    if (!el || !wrap) return
    wrap.style.minHeight = `${el.offsetHeight}px`
    return () => {
      wrap.style.minHeight = ''
    }
  }, [ghost.id])
  // 날아갈 곳: 쪽의 가운데 (움직임 줄이기면 제자리에서 사라진다)
  useLayoutEffect(() => {
    const el = ref.current
    const page = pageRef.current
    if (!el || !page || still) return
    const a = el.getBoundingClientRect()
    const b = page.getBoundingClientRect()
    el.style.setProperty('--fly-x', `${Math.round(b.left + b.width / 2 - (a.left + a.width / 2))}px`)
    el.style.setProperty('--fly-y', `${Math.round(b.top + b.height / 2 - (a.top + a.height / 2))}px`)
  }, [ghost.id, still, pageRef])
  return (
    <p ref={ref} className={`copy-focus-verse copy-ghost ${still ? 'copy-ghost-fade' : 'copy-ghost-fly'}`} aria-hidden="true" data-ghost={ghost.verse}>
      <span className="copy-done-part">{ghost.text}</span>
      <span className={`copy-stamp ${still ? 'copy-stamp-fade' : 'copy-stamp-press'}`}>{`${ghost.chapter}:${ghost.verse}`}</span>
    </p>
  )
}

/**
 * 필사 길잡이: 그 장 전체에서 같은 길잡이 (말씀의 배경 · 필사하며 살펴보기). 본문 아래의 차분한 상자 — 본문과 다른 바탕·글꼴,
 * "본문을 바탕으로 쓴 설명" 표시. 입력칸 아래에 두어 쓰는 자리를 밀지 않고, 접기·펼치기는 플레이어 저장에 남는다.
 * 단추를 눌러도 입력칸의 초점(휴대폰 키보드)을 빼앗지 않는다
 */
export function CopyGuide({ book, chapter }: { book: Book; chapter: number }) {
  const folded = useGame((s) => !!s.game.copy.guideFolded)
  const guide = chapterGuide(book, chapter)
  if (!guide) return null
  const { copyGuide } = useGame.getState()
  return (
    <section className="copy-guide" aria-label={C.guideTitle} data-guide={`${book}:${chapter}`}>
      <div className="copy-guide-head">
        <p className="copy-guide-title">{C.guideTitle}</p>
        <button
          type="button"
          className="copy-guide-toggle"
          aria-expanded={!folded}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => copyGuide(!folded)}
        >
          {folded ? C.guideOpen : C.guideFold}
        </button>
      </div>
      {!folded && (
        <>
          <p className="copy-guide-part">
            <span className="copy-guide-label">{C.guideBackground}</span>
            {guide.background}
          </p>
          <p className="copy-guide-part">
            <span className="copy-guide-label">{C.guideLook}</span>
            {guide.look}
          </p>
          <p className="copy-guide-note">{C.guideNote}</p>
        </>
      )}
    </section>
  )
}

let feelSeq = 0

/** 한 절씩 따라 적기 */
function CopyWrite({ book, spot, modal, still }: { book: Book; spot: CopySpot; modal: Extract<Modal, { kind: 'copy' }>; still: boolean }) {
  const { copyType, copySave, copyExit } = useGame.getState()
  const name = BOOK_NAME[book]
  const box = useRef<HTMLTextAreaElement>(null)
  /** 한글을 조합하는 중 (compositionstart ~ compositionend) */
  const composing = useRef(false)
  /** 마지막으로 처리한 입력 — 조합이 끝날 때 한 번, 뒤따르는 input 이벤트로 또 한 번 오는 같은 글을 두 번 받지 않게 */
  const lastSent = useRef<string | null>(null)
  const [ime, setIme] = useState(false)
  const [value, setValue] = useState(spot.draft)
  // 절이 바뀌면(한 절을 기록했다) 입력칸을 그 절의 쓰다 만 입력으로 (렌더 중에 맞춘다 — 깜빡임 없이)
  const key = `${book}:${spot.chapter}:${spot.verse.verse}`
  const [seen, setSeen] = useState(key)
  if (seen !== key) {
    setSeen(key)
    setValue(spot.draft)
  }

  // 붙여넣기·끌어 놓기·자동완성(고쳐 쓰기 제안)은 들어오기 전에 막는다
  useEffect(() => {
    const el = box.current
    if (!el) return
    const before = (e: InputEvent) => {
      if (BLOCKED_INPUT_TYPES.includes(e.inputType)) e.preventDefault()
    }
    el.addEventListener('beforeinput', before)
    return () => el.removeEventListener('beforeinput', before)
  }, [])
  // 잠깐 손을 멈추면 쓰다 만 입력을 저장한다 (자동 저장)
  useEffect(() => {
    const t = setTimeout(copySave, 1500)
    return () => clearTimeout(t)
  }, [value, copySave])

  const send = (text: string, how: { inputType?: string; composing: boolean }) => {
    if (!how.composing && text === lastSent.current) return
    const ok = copyType(text, how)
    if (!how.composing) lastSent.current = text
    // 받지 않은 입력(붙여넣기·본문과 맞지 않는 뭉치)은 지운다 — 다만 조합 중인 글자는 절대 되돌리지 않는다.
    // 되돌린 글을 마지막 입력으로 삼는다 — 같은 뭉치가 다시 들어와도 또 지우게 (입력칸과 저장이 어긋나지 않게)
    if (!ok && !how.composing) {
      const g = useGame.getState().game
      const restored = copySpot(g, book, CONTENT)?.draft ?? ''
      lastSent.current = restored
      setValue(restored)
    }
  }
  /** 조합이 끝났다 — 이제 마지막 글자가 정해졌으니 절을 마칠 수 있다 */
  const endComposition = (text: string) => {
    composing.current = false
    setIme(false)
    setValue(text)
    send(text, { composing: false })
  }
  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const native = e.nativeEvent as InputEvent
    const inputType = typeof native.inputType === 'string' ? native.inputType : undefined
    if (inputType && BLOCKED_INPUT_TYPES.includes(inputType)) return
    const text = e.target.value
    const now = composing.current || native.isComposing === true || inputType === 'insertCompositionText'
    setValue(text)
    send(text, { inputType, composing: now })
  }

  const check = checkCopy(value, spot.verse.text)
  // 조합 중인 마지막 글자는 아직 바뀔 수 있다 — 오타로 표시하지 않는다
  const typo = check.typo && !(ime && check.matched === [...normalizeCopy(value)].length - 1)
  // 한글 키보드는 마지막 글자를 조합 중으로 붙잡아 둔다 — 절을 다 맞게 쓰고 잠깐 멈추면 조합을 확정해 절을 마친다
  // (입력칸을 잠깐 떠났다 돌아오면 브라우저가 compositionend를 보낸다. 그래도 안 오면 직접 끝낸다)
  const verseDone = check.done

  // ── 잉크 번짐: 이 절에서 처음으로 더 멀리 맞게 쓴 글자만 (조합 중에 마지막 글자가 바뀌며 오르내려도 다시 번지지 않게) ──
  const matched = check.matched
  const high = useRef({ key, n: matched })
  const [bloom, setBloom] = useState<Bloom | null>(null)
  useEffect(() => {
    const h = high.current
    if (h.key !== key) {
      high.current = { key, n: matched }
      setBloom(null)
      return
    }
    if (matched <= h.n) return
    const from = h.n
    h.n = matched
    setBloom({ from, to: matched, id: ++feelSeq })
    quillScratch()
  }, [matched, key])
  useEffect(() => {
    if (!bloom) return
    const t = setTimeout(() => setBloom(null), BLOOM_MS)
    return () => clearTimeout(t)
  }, [bloom])

  // ── 한 절을 마쳤다: 도장 + 진동 + 줄이 쪽으로 ──
  const verses = useMemo(() => copyVerses(book, spot.chapter, CONTENT), [book, spot.chapter])
  const pageRef = useRef<HTMLDivElement>(null)
  const seenLast = useRef(modal.last)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  useEffect(() => {
    const last = modal.last
    if (last === seenLast.current) return
    seenLast.current = last
    if (last?.kind !== 'verse') return
    const text = copyVerses(book, last.chapter, CONTENT).find((v) => v.verse === last.verse)?.text ?? ''
    setGhost({ text, chapter: last.chapter, verse: last.verse, id: ++feelSeq })
    verseBuzz()
  }, [modal.last, book])
  useEffect(() => {
    if (!ghost) return
    const t = setTimeout(() => setGhost(null), GHOST_MS)
    return () => clearTimeout(t)
  }, [ghost])
  useEffect(() => {
    if (!ime || !verseDone) return
    const t = setTimeout(() => {
      const el = box.current
      if (!el || !composing.current) return
      el.blur()
      el.focus()
      if (composing.current) endComposition(el.value)
    }, COMMIT_IDLE_MS)
    return () => clearTimeout(t)
    // 이 렌더의 endComposition을 쓴다 — 입력이 바뀔 때마다 새로 건다
  }, [ime, verseDone, value])
  const last = modal.last
  const status =
    last?.kind === 'verse'
      ? fill(C.verseDone, { book: name, chapter: last.chapter, verse: last.verse })
      : modal.resume
        ? fill(C.resume, { book: name, chapter: spot.chapter, verse: spot.verse.verse })
        : ''
  const label = fill(C.progress, { book: name, chapter: spot.chapter })
  return (
    <div className="copy-write">
      <header className="copy-focus-head">
        <CopyPen />
        <h2>{fill(C.header, { book: name, chapter: spot.chapter, n: spot.index + 1, count: spot.count })}</h2>
        <CopyPage verses={verses} done={spot.index} fresh={ghost?.chapter === spot.chapter ? ghost.verse : undefined} pageRef={pageRef} />
        <button className="copy-exit" onClick={copyExit}>
          {C.exit}
        </button>
      </header>
      <div className="copy-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={spot.count} aria-valuenow={spot.index}>
        <span style={{ width: `${(spot.index / spot.count) * 100}%` }} />
      </div>
      <p className="copy-status" role="status">
        {status}
      </p>
      <CopyFamily />
      <div className="copy-verse-wrap">
        <VerseLine
          text={spot.verse.text}
          matched={check.matched}
          typo={typo}
          label={fill(C.verseLabel, { book: name, chapter: spot.chapter, verse: spot.verse.verse })}
          bloom={bloom}
          arriving={ghost !== null}
        />
        {ghost && <VerseGhost key={ghost.id} ghost={ghost} still={still} pageRef={pageRef} />}
      </div>
      <textarea
        ref={box}
        className="copy-input"
        aria-label={C.input}
        aria-invalid={typo || undefined}
        value={value}
        rows={3}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="done"
        onChange={onChange}
        onCompositionStart={() => {
          composing.current = true
          setIme(true)
        }}
        onCompositionEnd={(e) => {
          // 잠깐 멈춤으로 이미 조합을 끝냈으면(아래 자동 확정) 늦게 온 compositionend는 받지 않는다
          if (!composing.current) return
          endComposition(e.currentTarget.value)
        }}
        onKeyDown={(e) => {
          // 줄바꿈은 본문에 없다 — 엔터는 아무것도 넣지 않는다 (조합 중이면 조합만 끝난다)
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.preventDefault()
        }}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      />
      <CopyGuide book={book} chapter={spot.chapter} />
    </div>
  )
}

/** 장 완료 화면: 절·글자, 하나님에 대한 새로운 기록, 능력치, [책 덮기] [N장 계속 쓰기] */
function CopyDone({ book, modal, folding }: { book: Book; modal: Extract<Modal, { kind: 'copy' }>; folding: boolean }) {
  const { copyView, copyExit, openBind } = useGame.getState()
  const unbound = useGame((s) => s.game.bound[book] === undefined && s.game.shelved[book] === undefined)
  // 아이가 곁에 있었으면 장 완료 화면 끝에 한 줄 (보상 없음)
  const kidName = useGame((s) => (deskKidWith(s.game) ? (s.game.child?.name ?? null) : null))
  const last = modal.last
  if (last?.kind !== 'chapter') return null
  const name = BOOK_NAME[book]
  const gains = (['wit', 'hand'] as const).filter((k) => last.gains[k] > 0).map((k) => fill(C.gain, { name: T.stats.names[k], n: last.gains[k] }))
  return (
    <div className={folding ? 'copy-panel copy-done copy-after-fold' : 'copy-panel copy-done'}>
      <h2>{fill(C.chapterDone, { book: name, chapter: last.chapter, verses: last.verses, chars: last.chars })}</h2>
      {last.finds.length > 0 && (
        <section className="copy-god" aria-label={fill(C.godNew, { n: last.finds.length })}>
          <h3>{fill(C.godNew, { n: last.finds.length })}</h3>
          <ul>
            {last.finds.map((f) => (
              <li key={`${f.keyword}|${f.ref}`} className="copy-god-new">
                <p className="copy-god-key">
                  {GOD_KEYWORDS[f.keyword]?.name ?? f.keyword} — {f.ref}
                </p>
                <p className="copy-god-verse">{versesOf(f.ref).map((v) => v.text).join(' ')}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {gains.length > 0 && <p className="copy-gains">{gains.join(' · ')}</p>}
      {last.bookDone && <p className="copy-book-done">{fill(C.bookDone, { book: name })}</p>}
      {kidName && <p className="copy-family-quiet">{fill(FD.quiet, { with: withAnd(kidName) })}</p>}
      <div className="copy-menu-actions">
        <button onClick={copyExit}>{C.closeBook}</button>
        {/* 한 권을 마쳤으면 바로 제본 창으로 (책상에서 나가며 쓰다 만 입력은 저장된다) */}
        {last.bookDone && unbound && (
          <button
            className="primary"
            onClick={() => {
              copyExit()
              openBind(book)
            }}
          >
            {C.bind}
          </button>
        )}
        {last.next !== null && (
          <button className="primary" onClick={() => copyView('write')}>
            {fill(C.nextChapter, { chapter: last.next })}
          </button>
        )}
      </div>
    </div>
  )
}

export function CopyDesk({ modal }: { modal: Extract<Modal, { kind: 'copy' }> }) {
  const game = useGame((s) => s.game)
  const book = game.copy.book
  // 마을 배경음·빗소리를 잠시 끈다 (나가면 돌아온다)
  useEffect(() => {
    setQuiet(true)
    return () => setQuiet(false)
  }, [])
  const [still] = useState(prefersStill)
  // 장을 마쳤다: 꽉 찬 쪽이 접히고(책장 넘기는 소리는 가게가 낸다), 그 뒤로 장 완료 화면이 떠오른다
  const seenLast = useRef(modal.last)
  const [fold, setFold] = useState<{ chapter: number; id: number } | null>(null)
  useEffect(() => {
    const last = modal.last
    if (last === seenLast.current) return
    seenLast.current = last
    if (last?.kind !== 'chapter' || modal.view !== 'done') return
    setFold({ chapter: last.chapter, id: ++feelSeq })
    verseBuzz()
  }, [modal.last, modal.view])
  useEffect(() => {
    if (!fold) return
    const t = setTimeout(() => setFold(null), FOLD_MS)
    return () => clearTimeout(t)
  }, [fold])
  let body
  if (modal.view === 'ask') body = <CopyAsk />
  else if (!book || modal.view === 'pick') body = <CopyBookPick />
  else if (modal.view === 'menu') body = <CopyMenu book={book} />
  else if (modal.view === 'done')
    body =
      modal.last?.kind === 'chapter' ? (
        <>
          {fold && (
            <div className="copy-fold-stage" aria-hidden="true">
              <CopyPage key={fold.id} verses={copyVerses(book, fold.chapter, CONTENT)} done={Infinity} fold still={still} />
            </div>
          )}
          <CopyDone book={book} modal={modal} folding={fold !== null} />
        </>
      ) : (
        <CopyMenu book={book} />
      )
  else {
    const spot = copySpot(game, book, CONTENT)
    body = spot ? <CopyWrite book={book} spot={spot} modal={modal} still={still} /> : <CopyMenu book={book} />
  }
  return (
    <section className={still ? 'copy-focus copy-still' : 'copy-focus'} role="dialog" aria-modal="true" aria-label={C.screen}>
      <div className="copy-focus-inner">{body}</div>
    </section>
  )
}
