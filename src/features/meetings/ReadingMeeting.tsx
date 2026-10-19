import { useEffect, useRef, useState } from 'react'
import { CONTENT, neighborById, verseCountOf, versesOf } from '../../content/catalog'
import { T } from '../../content/text'
import { hallGuestsToday } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'

// Everyone at the meeting reads the same passage; collection ownership is not required.
export function meetingPassage(day: number) {
  const pool = CONTENT.pieces.filter(p => p.source && verseCountOf(p.ref) > 0 && verseCountOf(p.ref) <= 12)
  return pool[Math.floor(day / 7) % pool.length]
}

export function ReadingMeeting({ day }: { day: number }) {
  const game = useGame(s => s.game)
  const piece = meetingPassage(day)
  const verses = versesOf(piece.ref)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)
  const supported = typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'
  useEffect(() => () => {
    generation.current++
    if (utterance.current) window.speechSynthesis?.cancel()
  }, [])
  function stop() {
    generation.current++
    if (utterance.current) window.speechSynthesis?.cancel()
    utterance.current = null
    setSpeaking(false)
  }
  function narrate() {
    stop()
    setError('')
    setDone(false)
    setSpeaking(true)
    const token = generation.current
    function read(at: number) {
      if (generation.current !== token) return
      setIndex(at)
      const speech = new SpeechSynthesisUtterance(verses[at].text)
      utterance.current = speech
      speech.lang = 'ko-KR'
      speech.rate = 0.85
      const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ko'))
      if (voice) speech.voice = voice
      speech.onend = () => {
        if (generation.current !== token) return
        if (at + 1 < verses.length) read(at + 1)
        else { utterance.current = null; setSpeaking(false); setDone(true) }
      }
      speech.onerror = () => {
        if (generation.current !== token) return
        utterance.current = null
        setSpeaking(false)
        setError('음성 낭독을 시작하지 못했어요. 본문을 직접 읽고 다음 절로 넘겨 주세요.')
      }
      window.speechSynthesis.speak(speech)
    }
    // 끝까지 읽은 뒤 낭독하면 처음 절부터 (2026-10-19 감사 L-40: 마지막 절만 읽었다)
    read(done ? 0 : index)
  }
  const verse = verses[index]
  const guests = hallGuestsToday(game, CONTENT).map(id => neighborById(id)?.role).filter(Boolean).join(' · ')
  return <div className="dialog reading-meeting" role="dialog" aria-label={T.meetings.reading}>
    <h2>{T.meetings.reading}</h2>
    <p>{guests ? `${guests}와 함께 읽어요.` : '사랑방에서 함께 말씀을 읽어요.'}</p>
    <h3>{piece.title}</h3>
    <p className="hint">오늘의 본문 · {piece.ref}</p>
    {/* 마이크는 쓰지 않는다 — 직접 읽고 넘기거나 음성 낭독을 듣는다 (2026-10-19 사용자: 마이크로 말해야 하는 줄 알았다) */}
    <p>마이크는 쓰지 않아요. 본문을 읽고 다음 절로 넘기거나, '음성으로 낭독하기'를 눌러 들어 보세요.</p>
    <p role="status">{done ? '본문을 끝까지 읽었어요.' : `${index + 1} / ${verses.length}절${speaking ? ' · 낭독 중' : ''}`}</p>
    <Passage refText={`${piece.ref.split(' ')[0]} ${verse.chapter}:${verse.verse}`} />
    {error && <p role="alert">{error}</p>}
    {!supported && <p className="hint">이 브라우저에서는 음성 낭독을 지원하지 않아요. 본문을 직접 읽고 넘길 수 있어요.</p>}
    <div className="actions">
      {supported && <button onClick={speaking ? stop : narrate}>{speaking ? '낭독 멈추기' : '음성으로 낭독하기'}</button>}
      <button disabled={done || speaking} onClick={() => { if (index + 1 < verses.length) setIndex(index + 1); else setDone(true) }}>{index + 1 < verses.length ? '읽었어요 · 다음 절' : '마지막 절 읽었어요'}</button>
      <button className="primary" disabled={!done} onClick={() => { stop(); useGame.getState().completeReadingMeeting() }}>함께 읽기 마치기</button>
      <button onClick={() => { stop(); useGame.getState().closeModal() }}>그만 읽기</button>
    </div>
    <p className="hint">끝까지 읽고 마치면 모인 이웃의 호감도 +2 · 지능 경험치 +2. 오늘 한 번 받을 수 있어요.</p>
  </div>
}
