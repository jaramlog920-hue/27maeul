// 새 터 서고 문을 처음 밟았을 때 (계획 20 작업 4, 결정 D8): 어두운 안이 아침빛으로 밝아지고(약 2.5초, 탭·Esc로 건너뜀),
// 이어 창 1:3 본문 카드와 단추 둘. 본문은 불러온 구약에서 Passage가 읽는다 — 글 파일에 옮겨 적지 않는다.
import { useEffect, useRef, useState } from 'react'
import { T } from '../../content/text'
import { OT_NAME, ensureOtBook, otLoaded } from '../../content/ot-catalog'
import { isOtBook } from '../../engine/ot-books'
import { FIRST_LIGHT_DARK, FIRST_LIGHT_SECONDS, FIRST_REF } from '../../engine/newland-config'
import { setDarknessOverride } from '../../render/renderer'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'
import { firstChapterDesk } from './first-desk'

export function FirstLight() {
  const [phase, setPhase] = useState<'light' | 'card'>('light')
  // 본문 불러오기: loading → ready, 못 불러오면 failed (오류 문구 없이 "책을 펼치는 중" 줄만 지운다)
  const [load, setLoad] = useState<'loading' | 'ready' | 'failed'>(() => (otLoaded('gen') ? 'ready' : 'loading'))
  const done = useRef(false)

  // 아침빛: 시작 어둠에서 0까지 (끝나거나 건너뛰면 덮어쓰기를 풀고 카드로)
  useEffect(() => {
    if (phase !== 'light') return
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / (FIRST_LIGHT_SECONDS * 1000))
      setDarknessOverride(FIRST_LIGHT_DARK * (1 - k * k * (3 - 2 * k)))
      if (k >= 1) setPhase('card')
      else raf = requestAnimationFrame(step)
    }
    setDarknessOverride(FIRST_LIGHT_DARK)
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase])
  useEffect(() => () => setDarknessOverride(null), [])

  // 본문은 카드가 열리기 전에 미리 불러온다 (연출 중에도 불러오기는 진행)
  useEffect(() => {
    let alive = true
    ensureOtBook('gen').then(
      () => alive && setLoad('ready'),
      () => alive && setLoad('failed'),
    )
    return () => {
      alive = false
    }
  }, [])

  const skip = () => {
    if (phase === 'light') setPhase('card')
  }
  const later = () => {
    if (done.current) return
    done.current = true
    useGame.getState().closeModal()
  }
  const write = () => {
    if (done.current) return
    done.current = true
    const s = useGame.getState()
    // 이미 구약 책을 고른 적이 없고 창세기를 불러왔으면 바로 창세기 첫 장으로, 아니면 새 터 책상의 구약 칸으로
    if (!isOtBook(s.game.copy.book) && otLoaded('gen')) s.copyBook('gen')
    else s.open(firstChapterDesk(s.game))
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (phase === 'light') setPhase('card')
      else later()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  if (phase === 'light')
    return <div className="first-light-veil" role="presentation" aria-label={T.newland.lightTitle} onPointerDown={skip} />
  return (
    <div className="dialog first-light" role="dialog" aria-label={T.newland.lightTitle}>
      {load === 'ready' && (
        <>
          <Passage refText={FIRST_REF} />
          <p className="hint">{`${T.ui.bibleSource} · ${OT_NAME.gen} 1:3`}</p>
        </>
      )}
      {load === 'loading' && <p>{T.newland.opening}</p>}
      <div className="actions menu column">
        <button className="primary" onClick={write}>
          {T.newland.firstWrite}
        </button>
        <button onClick={later}>{T.newland.later}</button>
      </div>
    </div>
  )
}

/** 입구 표지·서고 문 앞의 "땅 둘러보기" */
export function LookAround() {
  const { lookAround, closeModal } = useGame.getState()
  return (
    <div className="dialog" role="dialog" aria-label={T.newland.lookTitle}>
      <h2>{T.newland.lookTitle}</h2>
      <div className="actions menu column">
        <button className="primary" onClick={lookAround}>
          {T.newland.look}
        </button>
        <button onClick={closeModal}>{T.newland.lookClose}</button>
      </div>
    </div>
  )
}
