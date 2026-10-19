import { useEffect, useRef, useState } from 'react'
import { checkVoice, VOICE_ACCEPT } from '../../engine/copying'
import { newRecognizer, transcriptsOf, voiceAvailable, type VoiceRecognizer } from '../desk/copy-voice'
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
  const [listening, setListening] = useState(false)
  const [note, setNote] = useState('')
  // 마이크로 내가 읽는다 (2026-10-19 사용자: 들려주는 낭독이 아니라 내가 소리 내어 읽기) — 음성 인식이 없거나 막히면 직접 넘기기
  const [manual, setManual] = useState(() => !voiceAvailable())
  const rec = useRef<VoiceRecognizer | null>(null)
  function stopListening() {
    const r = rec.current
    rec.current = null
    if (r) {
      r.onresult = null
      r.onerror = null
      r.onend = null
      try { r.abort() } catch { /* 이미 끝났다 */ }
    }
    setListening(false)
  }
  useEffect(() => () => stopListening(), [])
  function next() {
    if (index + 1 < verses.length) setIndex(index + 1)
    else setDone(true)
  }
  function listen() {
    stopListening()
    const r = newRecognizer()
    if (!r) { setManual(true); setNote(R.unsupported); return }
    const target = verses[index].text
    let heard: string[] = []
    let judged = false
    const judge = (texts: string[]) => {
      if (judged || rec.current !== r) return
      judged = true
      stopListening()
      if (!texts.length) return setNote(R.silent)
      const best = Math.max(...texts.map(t => checkVoice(t, target).similarity))
      if (best >= VOICE_ACCEPT) { setNote(''); next() }
      else setNote(R.miss)
    }
    r.onresult = (e) => {
      const { texts, final } = transcriptsOf(e)
      if (texts.length) heard = texts
      if (final) judge(heard)
    }
    r.onerror = (e) => {
      if (rec.current !== r || e.error === 'aborted') return
      judged = true
      stopListening()
      const denied = e.error === 'not-allowed' || e.error === 'service-not-allowed'
      if (denied) setManual(true)
      setNote(denied ? R.denied : R.silent)
    }
    r.onend = () => judge(heard)
    rec.current = r
    try { r.start() } catch { rec.current = null; setManual(true); setNote(R.startFail); return }
    setNote(R.listening)
    setListening(true)
  }
  const verse = verses[index]
  const guests = hallGuestsToday(game, CONTENT).map(id => neighborById(id)?.role).filter(Boolean).join(' · ')
  return <div className="dialog reading-meeting" role="dialog" aria-label={T.meetings.reading}>
    <h2>{T.meetings.reading}</h2>
    <p>{guests ? `${guests}와 함께 읽어요.` : '사랑방에서 함께 말씀을 읽어요.'}</p>
    <h3>{piece.title}</h3>
    <p className="hint">오늘의 본문 · {piece.ref}</p>
    <p>{manual ? R.leadManual : R.lead}</p>
    <p role="status">{done ? '본문을 끝까지 읽었어요.' : `${index + 1} / ${verses.length}절${listening ? ' · 듣는 중' : ''}`}</p>
    <Passage refText={`${piece.ref.split(' ')[0]} ${verse.chapter}:${verse.verse}`} />
    {note && <p role="alert">{note}</p>}
    <div className="actions">
      {!manual && !done && <button className="primary" onClick={listening ? stopListening : listen}>{listening ? R.stop : R.read}</button>}
      {manual && <button disabled={done} onClick={next}>{index + 1 < verses.length ? '읽었어요 · 다음 절' : '마지막 절 읽었어요'}</button>}
      <button className={done ? 'primary' : undefined} disabled={!done} onClick={() => { stopListening(); useGame.getState().completeReadingMeeting() }}>함께 읽기 마치기</button>
      <button onClick={() => { stopListening(); useGame.getState().closeModal() }}>그만 읽기</button>
    </div>
    <p className="hint">끝까지 읽고 마치면 모인 이웃의 호감도 +2 · 지능 경험치 +2. 오늘 한 번 받을 수 있어요.</p>
  </div>
}

const R = {
  lead: '🎙 소리 내어 읽기를 누르고 이 절을 천천히 읽어 주세요. 맞게 들리면 다음 절로 넘어가요.',
  leadManual: '이 기기에서는 마이크로 읽을 수 없어요. 본문을 소리 내어 읽고 다음 절로 넘겨 주세요.',
  read: '🎙 소리 내어 읽기',
  stop: '듣기 멈추기',
  listening: '듣고 있어요. 이 절을 천천히 읽어 주세요.',
  miss: '조금 다르게 들렸어요. 다시 읽어 보세요.',
  silent: '소리가 들리지 않았어요. 다시 읽어 보세요.',
  denied: '마이크를 쓸 수 없어요. 브라우저에서 마이크를 허락하거나, 직접 읽고 넘겨 주세요.',
  startFail: '듣기를 시작하지 못했어요. 직접 읽고 넘겨 주세요.',
  unsupported: '이 기기에서는 음성 인식을 쓸 수 없어요. 직접 읽고 넘겨 주세요.',
}
