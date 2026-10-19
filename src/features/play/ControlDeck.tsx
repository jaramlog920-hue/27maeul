// 휴대폰 아래 조작판: 왼쪽 십자 단추, 오른쪽 둥근 "확인" 단추와 작은 메뉴(말씀·가방·일지·가족·설정, 집 안이면 집 꾸미기).
// 위 가장자리에는 몸 상태 눈금과 다음 일정 한 줄. 설정에서 선택하면 마우스·터치 화면 모두에서 보인다.
import { useState } from 'react'
import { unlockAudio } from '../../audio/sound'
import { fill, T } from '../../content/text'
import { nextEvent, eventSummary } from '../../engine/events'
import { useEvents } from './EventSchedule'
import { seasonalNeed } from '../../engine/game'
import { moodOf } from '../../engine/mood'
import { markMapTap } from '../../shared/ghost'
import { useGame } from '../../store/game-store'
import { DecorateButton } from './DecorateButton'
import { BuildButton } from './BuildButton'
import { DirectionPad } from './Joystick'


/** 몸 상태 도트 아이콘 (8×8): 빵·초승달·해·눈송이·웃는 얼굴 */
const PIX: Record<string, string> = { k: '#151a16', y: '#d9a55a', Y: '#f0c985', m: '#f3e3a0', c: '#a8d8ea', s: '#f5a742', f: '#f0c75e' }
const NEED_PIX: Record<string, string[]> = {
  hunger: ['........', '..kkkk..', '.kyYYyk.', 'kyyyyyyk', 'kyYyyYyk', 'kyyyyyyk', '.kkkkkk.', '........'],
  fatigue: ['..kkk...', '.kmmk...', 'kmmk....', 'kmk.....', 'kmk.....', 'kmmk..k.', '.kmmkkk.', '..kkk...'],
  cold: ['...c....', '.c.c.c..', '..ccc...', 'ccccccc.', '..ccc...', '.c.c.c..', '...c....', '........'],
  heat: ['...s....', '.s.s.s..', '..sss...', 'sssssss.', '..sss...', '.s.s.s..', '...s....', '........'],
  mood: ['..kkkk..', '.kffffk.', 'kfkffkfk', 'kffffffk', 'kfkffkfk', 'kffkkffk', '.kffffk.', '..kkkk..'],
}
function NeedPix({ id }: { id: string }) {
  const rows = NEED_PIX[id] ?? NEED_PIX.mood
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((ch, x) => (ch === '.' ? null : <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={PIX[ch]} />)))}
    </svg>
  )
}

function DeckNeeds() {
  const game = useGame((s) => s.game)
  const extra = seasonalNeed(game)
  const rows: [string, number, boolean][] = [
    ['hunger', game.needs.hunger, false],
    ['fatigue', game.needs.fatigue, false],
    ...(extra ? [[extra, game.needs[extra], false] as [string, number, boolean]] : []),
    ['mood', moodOf(game), true],
  ]
  return (
    <div className="deck-needs">
      {rows.map(([k, v, good]) => {
        const label = T.ui.needs[k as keyof typeof T.ui.needs]
        const warn = good ? v < 30 : v >= 70
        const help = (T.controls.needHelp as Record<string, string>)[k]
        // 누르면 무엇인지 한 줄로 알려 준다
        return (
          <button key={k} className={`deck-need${warn ? ' warn' : ''}${good ? ' good' : ''}`} onClick={() => useGame.getState().say(fill(help, { n: Math.round(v) }), 3200)}>
            <NeedPix id={k} />
            <b role="meter" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
              <em style={{ width: `${v}%` }} />
            </b>
          </button>
        )
      })}
    </div>
  )
}

function DeckNext() {
  const { day, minute, events } = useEvents()
  const next = nextEvent(events, day, minute)
  const now = !!next && next.day === day && minute >= next.from
  return (
    <button className={`deck-next${now ? ' now' : ''}`} onClick={() => useGame.getState().open({ kind: 'schedule' })} aria-label={`다음 일정: ${eventSummary(next, day, minute)}. 눌러서 전체 일정 보기`}>
      {eventSummary(next, day, minute)}
    </button>
  )
}

export function ControlDeck() {
  const deck = useGame((s) => s.deck)
  // 메뉴 단추를 누르면 가방·일지·일정·설정이 위로 펼쳐진다
  const [menu, setMenu] = useState(false)
  const modalOpen = useGame((s) => s.modal !== null)
  if (!deck) return null
  const { open, press } = useGame.getState()
  const D = T.controls
  const go = (m: Parameters<typeof open>[0]) => {
    setMenu(false)
    open(m)
  }
  return (
    <section className="deck" aria-label={D.deckLabel}>
      <div className="deck-strip">
        <DeckNeeds />
        <DeckNext />
      </div>
      <div className="deck-main">
        <DirectionPad className="deck-pad" />
        <div className="deck-right">
          <div className="deck-menu-wrap">
            <button className={`deck-menu${menu ? ' on' : ''}`} aria-expanded={menu} onClick={() => setMenu(!menu)}>
              {D.menu}
            </button>
            {menu && !modalOpen && (
              <div className="deck-menu-pop" role="menu">
                <button role="menuitem" className="menu-word" onClick={() => go({ kind: 'word' })}>{T.word.open}</button>
                <button role="menuitem" onClick={() => go({ kind: 'bag' })}>{T.ui.bag}</button>
                {/* 마을 지도는 설정 안에만 있어 서고를 찾기 어려웠다 (2026-10-19 플레이 점검 P1) */}
                <button role="menuitem" onClick={() => go({ kind: 'villageMap' })}>{T.ui.map}</button>
                <button role="menuitem" onClick={() => go({ kind: 'journal' })}>{T.ui.journalTitle}</button>
                <button role="menuitem" onClick={() => go({ kind: 'family' })}>가족</button>
                <DecorateButton role="menuitem" onPick={() => setMenu(false)} />
                <BuildButton role="menuitem" onPick={() => setMenu(false)} />
                <button role="menuitem" onClick={() => go({ kind: 'settings' })}>{D.settings}</button>
              </div>
            )}
          </div>
          <button
            className="deck-seal"
            onPointerDown={(e) => {
              e.preventDefault()
              unlockAudio()
              setMenu(false)
              markMapTap()
              press()
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && press()}
            aria-label={D.sealLabel}
          >
            {D.seal}
          </button>
        </div>
      </div>
    </section>
  )
}
