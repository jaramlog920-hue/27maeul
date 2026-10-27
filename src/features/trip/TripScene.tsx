// 여행 주사위 판 (새 장면, 2026-09-30 사용자 설계): 팝업이 아니라 화면 전체가 여행지 동네다.
// 둘레 길 위 돌판 24개를 주인공이 직접 걸어서 옮겨 다니고, 데려온 아이는 한 걸음 뒤를 따른다. 함께 온 배우자는 바로 옆에서 나란히 걷는다.
// 가장자리에만 작은 것: 왼쪽 위 얼굴과 남은 턴 점, 오른쪽 아래 주사위. 칸에 닿으면 머리 위에 짧은 말풍선 (1초 남짓).
// 성경 구절은 판 위에서 주지 않는다 — 집에 돌아와 조용할 때 한 조각. 한 바퀴를 돌거나 다섯 번째가 끝나면 여행 수확을 정리해 보여 주고 마을 가게로.
import { useEffect, useRef, useState } from 'react'
import { CONTENT, pieceById } from '../../content/catalog'
import { itemName, T } from '../../content/text'
import { STAT_IDS, type StatId } from '../../engine/stats'
import { DESTS, tripCost, type DestId } from '../../engine/travel'
import { canExtend, extendTurns, EXTRA_PRICE, EXTRA_TURNS, NEW_BOARD, playTurn, rollDie, stoneTile, TRIP_TURNS, tripSeed, walkPath, type BoardState, type TripReward } from '../../engine/trip-board'
import { mulberry32 } from '../../engine/offers'
import type { Facing, ItemId } from '../../engine/types'
import { TILE, VIEW_W } from '../../engine/world'
import { createTripRenderer, type TripActor } from '../../render/renderer'
import { SPRITE_W, spriteRows, writerPalette } from '../../render/sprites'
import { withLookDefaults } from '../../engine/avatar'
import { useGame } from '../../store/game-store'

const STEP_SECONDS = 0.2
const BUBBLE_MS = 1300
const DIE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
/** 돌판 표식(renderer STONE_GLYPH) 뜻 */
const CELL_LEGEND: readonly [string, string][] = [
  ['깃발', '출발 · 한 바퀴 돌면 10닢'],
  ['물방울', '쉼터 · 운이 조금'],
  ['잎', '재료 하나나 둘'],
  ['별', '능력치 · 아이와 오면 아이도'],
  ['물음표', '길에서 생기는 일'],
  ['상자', '닢, 가끔 희귀품'],
  ['화살표', '지름길 · 두 칸 더'],
  ['하트', '인사 · 매력이 조금'],
  ['아이', '아이가 무언가를 주워 와요'],
]
const STAT_NAME = T.stats.names as Record<StatId, string>

/** 말풍선 한 줄 (짧게) */
function shortLine(rewards: readonly TripReward[], kid: string, lap: boolean, say = ''): string {
  if (lap) return '한 바퀴! +10닢'
  if (say === 'jump') return '지름길! 두 칸 더'
  if (say === 'rest') return '쉼터 · 잠깐 쉬어요'
  if (say === 'kidAlone') return '골목을 지나요'
  const one = (r: TripReward) => {
    switch (r.kind) {
      case 'piece':
        return ''
      case 'items': {
        const [id, n] = Object.entries(r.items)[0] as [ItemId, number]
        return `${itemName(id)} ${n} 획득`
      }
      case 'coins':
        return `${r.n}닢 획득`
      case 'stat':
        return `${r.who === 'child' ? `${kid} ` : ''}${STAT_NAME[r.stat]} +${r.xp}`
    }
  }
  return rewards.slice(0, 2).map(one).join(' · ')
}

const facingOf = (dx: number, dy: number, prev: Facing): Facing => (dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : prev)
const AHEAD: Record<Facing, { x: number; y: number }> = { right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, up: { x: 0, y: -1 } }
/** 배우자는 나아가는 쪽의 오른편(판 안쪽)에 나란히 선다 — 시안 나안 (2026-10-27 사용자) */
const besideOf = (f: Facing) => ({ x: -AHEAD[f].y, y: AHEAD[f].x })

/** 왼쪽 위의 작은 얼굴 */
function Face() {
  const avatar = useGame((s) => s.game.avatar)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    const full = avatar ? withLookDefaults(avatar) : undefined
    const pal = writerPalette('spring', full)
    g.clearRect(0, 0, SPRITE_W, 8)
    spriteRows('writer', 'down', { frame: 0, blink: false, avatar: full, look: avatar?.look })
      .slice(0, 8)
      .forEach((row, y) =>
        [...row].forEach((ch, x) => {
          const c = pal[ch]
          if (ch === '.' || !c) return
          g.fillStyle = c
          g.fillRect(x, y, 1, 1)
        }),
      )
  }, [avatar])
  return <canvas ref={ref} className="ts-face" width={SPRITE_W} height={8} aria-hidden="true" />
}

export function TripScene({ dest, withChild, withPartner = false }: { dest: DestId; withChild: boolean; withPartner?: boolean }) {
  const game = useGame((s) => s.game)
  // 이 판의 주사위 — 떠날 때의 세계·날·행선지로 정해진다 (새로고침해 다시 떠나도 같은 주사위, 감사 M-4)
  const [dice] = useState(() => mulberry32(tripSeed(useGame.getState().game, dest)))
  const modal = useGame((s) => s.modal)
  const finish = useGame((s) => s.finishTripBoard)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<BoardState>(NEW_BOARD)
  const [bubble, setBubble] = useState<{ text: string; key: number } | null>(null)
  const [walking, setWalking] = useState(false)
  const [harvest, setHarvest] = useState(false)
  const kidName = game.child?.name ?? '아이'
  // 움직이는 것은 매 프레임 그리므로 ref로 (다시 그리기와 상관없이)
  const start = stoneTile(0)
  const me = useRef<TripActor & { path: { x: number; y: number }[] }>({ x: start.x, y: start.y, facing: 'down', walking: false, path: [] })
  const kid = useRef<TripActor & { trail: { x: number; y: number }[] }>({ x: start.x - 1, y: start.y, facing: 'down', walking: false, trail: [] })
  const bubbleAt = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const partnerDef = withPartner ? CONTENT.neighbors.find((d) => d.id === game.romance?.partner) : undefined
  // 나란히 선 쪽 (모퉁이에서 부드럽게 돈다)
  const side = useRef(besideOf('down'))
  const mate = useRef<TripActor | null>(null)
  const pending = useRef<{ board: BoardState; rewards: TripReward[]; lap: boolean; say: string } | null>(null)

  // 그리기 루프
  useEffect(() => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const r = createTripRenderer(g)
    let raf = 0
    let last = performance.now()
    const t0 = last
    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      try {
        // 폭은 마을과 같은 16칸, 높이는 화면 비율대로 (판 전체 높이까지)
        const cw = canvas.clientWidth || 1
        const ch = canvas.parentElement?.clientHeight || cw
        // 화면 높이를 꽉 채운다 (올림 — 넘치는 몇 화소는 잘린다, 판보다 크면 판을 가운데에)
        const viewH = Math.max(12, Math.ceil((ch / cw) * VIEW_W))
        const k = Math.max(1, Math.min(6, Math.ceil((cw * (window.devicePixelRatio || 1)) / (VIEW_W * TILE))))
        if (canvas.width !== VIEW_W * TILE * k || r.view.h !== viewH) {
          r.view.w = VIEW_W
          r.view.h = viewH
          r.view.scale = k
          canvas.width = VIEW_W * TILE * k
          canvas.height = viewH * TILE * k
        }
        // 걷기: 길 칸을 하나씩
        const m = me.current
        if (m.path.length) {
          const next = m.path[0]
          const dx = next.x - m.x
          const dy = next.y - m.y
          const step = dt / STEP_SECONDS
          m.facing = facingOf(Math.sign(Math.round(dx * 10)), Math.sign(Math.round(dy * 10)), m.facing)
          if (Math.abs(dx) + Math.abs(dy) <= step) {
            kid.current.trail.push({ x: Math.round(m.x), y: Math.round(m.y) })
            m.x = next.x
            m.y = next.y
            m.path.shift()
          } else {
            m.x += Math.sign(dx) * Math.min(step, Math.abs(dx))
            m.y += Math.sign(dy) * Math.min(step, Math.abs(dy))
          }
          m.walking = true
          if (!m.path.length) arrive()
        } else m.walking = false
        // 아이는 한 걸음 뒤
        const kd = kid.current
        const aim = kd.trail[kd.trail.length - 1]
        if (aim) {
          const dx = aim.x - kd.x
          const dy = aim.y - kd.y
          kd.walking = Math.abs(dx) + Math.abs(dy) > 0.05
          kd.facing = facingOf(Math.sign(Math.round(dx * 10)), Math.sign(Math.round(dy * 10)), kd.facing)
          const k2 = Math.min(1, (dt / STEP_SECONDS) * 1.1)
          kd.x += dx * k2
          kd.y += dy * k2
        } else kd.walking = false
        // 길의 자리는 2×2 덩이의 왼쪽 위 칸 — 사람은 덩이 한가운데(반 칸 오른쪽·아래)에 선다
        const mid = (a: TripActor) => ({ ...a, x: a.x + 0.5, y: a.y + 0.5 })
        let meAt: TripActor = mid(m)
        let partner: { actor: TripActor; def: NonNullable<typeof partnerDef> } | null = null
        if (partnerDef) {
          const want = besideOf(m.facing)
          const ks = Math.min(1, dt * 6)
          side.current = { x: side.current.x + (want.x - side.current.x) * ks, y: side.current.y + (want.y - side.current.y) * ks }
          const sd = side.current
          const back = AHEAD[m.facing]
          meAt = { ...meAt, x: meAt.x - sd.x * 0.45, y: meAt.y - sd.y * 0.45 }
          const aim = { x: m.x + 0.5 + sd.x * 0.5 - back.x * 0.55, y: m.y + 0.5 + sd.y * 0.5 - back.y * 0.55 }
          const p = mate.current ?? { ...aim, facing: m.facing, walking: false }
          const kp = mate.current ? Math.min(1, dt * 10) : 1
          mate.current = { x: p.x + (aim.x - p.x) * kp, y: p.y + (aim.y - p.y) * kp, facing: m.facing, walking: m.walking }
          partner = { actor: mate.current, def: partnerDef }
        }
        r.draw(dest, useGame.getState().game, meAt, withChild ? mid(kd) : null, (now - t0) / 1000, dt, partner)
        // 말풍선 자리 (화면 비율로)
        const scale = cw / (VIEW_W * TILE)
        const offX = r.cam.x
        bubbleAt.current = { x: ((m.x + 1 - offX) * TILE) * scale, y: ((m.y + 0.5 - r.cam.y) * TILE - 18) * scale }
        const el = document.querySelector<HTMLElement>('.ts-bubble')
        if (el) {
          el.style.left = `${bubbleAt.current.x}px`
          el.style.top = `${bubbleAt.current.y}px`
        }
      } catch (err) {
        console.error(err)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // arrive는 ref만 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest, withChild, partnerDef])

  /** 돌판에 닿았을 때: 짧은 말풍선 */
  function arrive() {
    const p = pending.current
    if (!p) return
    pending.current = null
    setBoard(p.board)
    setWalking(false)
    const text = shortLine(p.rewards, kidName, p.lap, p.say)
    if (text) {
      const key = Date.now()
      setBubble({ text, key })
      setTimeout(() => setBubble((b) => (b?.key === key ? null : b)), BUBBLE_MS)
    }
    if (p.board.done) setTimeout(() => setHarvest(true), BUBBLE_MS)
  }

  const roll = () => {
    if (walking || board.done || modal) return
    const rnd = dice
    const n = rollDie(rnd)
    const r = playTurn(board, n, rnd, { withChild })
    pending.current = { board: r.board, rewards: r.landing.rewards, lap: r.landing.say === 'lap', say: r.landing.say }
    me.current.path = walkPath(board.pos, n + (r.landing.extra ?? 0))
    setBoard({ ...board, lastRoll: n })
    setWalking(true)
    setBubble(null)
  }

  // 더 굴리는 값은 돌아갈 배삯·숙박비를 남기고 낼 수 있을 때만 — 돌아올 때 닢이 모자라 마이너스가 되던 것 (2026-10-07)
  const spare = game.coins - tripCost(DESTS[dest], [])
  /** 두 번 더 굴리기 (여행 한 번에 한 번, 닢을 내고) — 수확 창에서도 */
  const extend = () => {
    if (walking) return
    setBoard(extendTurns(board, spare))
    setHarvest(false)
  }
  const turns = TRIP_TURNS + (board.bonus ?? 0)
  const [legend, setLegend] = useState(false)

  // 수확이 뜬 뒤에 본문 팝업을 닫았다면 그대로 수확을 보인다
  const showHarvest = harvest && !modal
  return (
    <div className="trip-scene" aria-label={`${DESTS[dest].name} 여행 판`}>
      <div className="ts-stage">
        <canvas ref={canvasRef} className="ts-canvas" aria-hidden="true" />
        {bubble && (
          <div key={bubble.key} className="ts-bubble" style={{ left: bubbleAt.current.x, top: bubbleAt.current.y }}>
            {bubble.text}
          </div>
        )}
      </div>
      <div className="ts-hud">
        <Face />
        <div className="ts-dots" aria-label={`${board.turn}/${turns}번째`}>
          {Array.from({ length: turns }, (_, i) => (
            <span key={i} className={i < board.turn ? 'used' : ''} />
          ))}
        </div>
      </div>
      {canExtend(board, spare) && !board.done && (
        <button className="ts-extra" onClick={extend} disabled={walking}>
          {EXTRA_TURNS}번 더 굴리기 · {EXTRA_PRICE}닢
        </button>
      )}
      {/* 칸 그림이 무엇인지 설명이 없었다 (2026-10-27 플레이 점검 41, trip-board land) */}
      <button className="ts-legend-toggle" aria-expanded={legend} onClick={() => setLegend(!legend)}>칸 설명</button>
      {legend && (
        <ul className="ts-legend" aria-label="칸 설명">
          {CELL_LEGEND.map(([mark, text]) => <li key={mark}><b>{mark}</b> {text}</li>)}
        </ul>
      )}
      <button className="ts-die" onClick={roll} disabled={walking || board.done} aria-label="주사위 굴리기">
        {board.lastRoll ? DIE[board.lastRoll - 1] : '🎲'}
      </button>
      {showHarvest && (
        <Harvest rewards={board.rewards} lapped={board.lapped} kid={kidName} onGo={() => finish(board.rewards)} onMore={canExtend(board, spare) ? extend : undefined} />
      )}
    </div>
  )
}

/** 여행 수확: 이번 여행에서 얻은 본문 조각·능력치·재료·닢을 정리해서 */
function Harvest({ rewards, lapped, kid, onGo, onMore }: { rewards: TripReward[]; lapped: boolean; kid: string; onGo: () => void; onMore?: () => void }) {
  const pieces = rewards.flatMap((r) => (r.kind === 'piece' ? [r.id] : []))
  const items: Partial<Record<ItemId, number>> = {}
  let coins = 0
  // 더 굴린 값(−닢)은 따로도 센다 — 얻은 닢과 섞이면 낸 돈이 보이지 않았다
  const paid = rewards.reduce((n, r) => n + (r.kind === 'coins' && r.n < 0 ? r.n : 0), 0)
  const me: Partial<Record<StatId, number>> = {}
  const child: Partial<Record<StatId, number>> = {}
  for (const r of rewards) {
    if (r.kind === 'items') for (const [id, n] of Object.entries(r.items) as [ItemId, number][]) items[id] = (items[id] ?? 0) + n
    if (r.kind === 'coins') coins += r.n
    if (r.kind === 'stat') (r.who === 'me' ? me : child)[r.stat] = ((r.who === 'me' ? me : child)[r.stat] ?? 0) + r.xp
  }
  const stats = (o: Partial<Record<StatId, number>>) =>
    STAT_IDS.filter((id) => o[id])
      .map((id) => `${STAT_NAME[id]} +${o[id]}`)
      .join(' · ')
  return (
    <div className="ts-harvest" role="dialog" aria-label="여행 수확">
      <h2>{lapped ? '한 바퀴를 다 돌았어요!' : '날이 저물었어요'}</h2>
      <p className="hint">이번 여행의 수확</p>
      <dl>
        {pieces.length > 0 && (
          <>
            <dt>📖 본문</dt>
            <dd>{pieces.map((id) => pieceById(id).ref).join(', ')}</dd>
          </>
        )}
        {Object.keys(me).length > 0 && (
          <>
            <dt>★ 능력치</dt>
            <dd>{stats(me)}</dd>
          </>
        )}
        {Object.keys(child).length > 0 && (
          <>
            <dt>★ {kid}</dt>
            <dd>{stats(child)}</dd>
          </>
        )}
        {Object.keys(items).length > 0 && (
          <>
            <dt>🌱 재료</dt>
            <dd>{(Object.entries(items) as [ItemId, number][]).map(([id, n]) => `${itemName(id)} ${n}`).join(' · ')}</dd>
          </>
        )}
        {/* 두 번 더 굴린 값(−10닢)도 합쳐 보인다 — 낸 돈이 어디에도 안 보였다 (2026-10-26 감사 A13) */}
        {(coins !== 0 || paid < 0) && (
          <>
            <dt>닢</dt>
            <dd>{paid < 0 ? `${coins}닢 (더 굴린 값 ${paid}닢 포함)` : `${coins}닢`}</dd>
          </>
        )}
      </dl>
      {!rewards.some((r) => r.kind !== 'coins' || r.n > 0) && <p>이번엔 빈손이지만, 좋은 구경을 했어요.</p>}
      <div className="actions">
        {onMore && (
          <button onClick={onMore}>
            {EXTRA_TURNS}번 더 굴리기 · {EXTRA_PRICE}닢
          </button>
        )}
        <button className="primary" onClick={onGo}>
          마을 가게로
        </button>
      </div>
    </div>
  )
}
