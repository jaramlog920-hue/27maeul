// 가족 옷장 (2026-09-30 사용자): 머리부터 옷·장신구·색까지 싹 바꾼다 — 피부만 그대로
import { useState } from 'react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { ACCS, BOTTOMS, HAIR_BACKS, HAIR_FRONTS, TOPS, cycle, hsvToHex, randomAvatar, type FullAvatar, type Hsv } from '../../engine/avatar'
import { lookOf, type WardrobeWho } from '../../engine/game'
import type { Facing } from '../../engine/types'
import { Preview, SLIDER_MAX } from '../intro/AvatarForm'
import { useGame } from '../../store/game-store'

type RowKey = 'hairFront' | 'hairBack' | 'top' | 'bottom' | 'acc'
type ColorKey = 'eyeColor' | 'hairColor' | 'bottomColor' | 'accColor'
const ROWS: { key: RowKey; names: readonly string[] }[] = [
  { key: 'hairFront', names: HAIR_FRONTS },
  { key: 'hairBack', names: HAIR_BACKS },
  { key: 'top', names: TOPS.map((t) => t[0]) },
  { key: 'bottom', names: BOTTOMS },
  { key: 'acc', names: ACCS },
]
const TURN: Facing[] = ['down', 'left', 'up', 'right']
const WHO_NAME: Record<WardrobeWho, string> = { me: '나', spouse: '배우자', child: '아이' }

export function Wardrobe({ who }: { who: WardrobeWho }) {
  const game = useGame((s) => s.game)
  const { dressUp, open } = useGame.getState()
  const start = lookOf(game, who, CONTENT)
  const [a, setA] = useState<FullAvatar | null>(start)
  const [turn, setTurn] = useState(0)
  const [colorKey, setColorKey] = useState<ColorKey>('hairColor')
  if (!a || !start) return null
  const rowLabels = T.avatar.rows as Record<RowKey, string>
  const colorLabels = T.avatar.colors as Record<ColorKey, string>
  const step = (key: RowKey, n: number, d: number) => setA({ ...a, [key]: cycle(a[key], d, n) })
  const slide = (i: number, v: number) => {
    const next = [...(a[colorKey] ?? [10, 55, 70])] as Hsv
    next[i] = v
    setA({ ...a, [colorKey]: next })
  }
  const hsv = a[colorKey] ?? [10, 55, 70]
  // 무작위도 피부는 그대로
  const shuffle = () => setA({ ...randomAvatar(a.look, a.name), skin: start.skin, look: a.look, name: a.name })
  return (
    <div className="dialog creator wardrobe" role="dialog" aria-label="옷장">
      <h2>옷장 · {who === 'me' ? '나' : `${WHO_NAME[who]} ${a.name}`}</h2>
      <p className="hint">머리부터 옷까지 바꿀 수 있어요. 피부색은 그대로예요.</p>
      <div className="creator-top">
        <div className="creator-portrait">
          <div className="creator-frame">
            <Preview avatar={a} facing={TURN[turn]} />
          </div>
          <div className="creator-turn">
            <button aria-label="왼쪽으로 돌리기" onClick={() => setTurn((t) => cycle(t, 1, 4))}>◀</button>
            <button aria-label="무작위" title="무작위" onClick={shuffle}>🎲</button>
            <button aria-label="오른쪽으로 돌리기" onClick={() => setTurn((t) => cycle(t, -1, 4))}>▶</button>
          </div>
        </div>
      </div>
      <div className="creator-rows">
        {ROWS.map(({ key, names }) => (
          <div className="creator-row" key={key}>
            <button aria-label={`${rowLabels[key]} 이전`} onClick={() => step(key, names.length, -1)}>◀</button>
            <span className="creator-row-label">{rowLabels[key]}</span>
            <span className="creator-row-value">{names[a[key]]}</span>
            <button aria-label={`${rowLabels[key]} 다음`} onClick={() => step(key, names.length, 1)}>▶</button>
          </div>
        ))}
      </div>
      <div className="creator-colors">
        <div className="creator-color-tabs" role="tablist">
          {(Object.keys(colorLabels) as ColorKey[]).map((k) => (
            <button key={k} role="tab" aria-selected={colorKey === k} className={colorKey === k ? 'primary' : ''} onClick={() => setColorKey(k)}>
              <i className="creator-swatch" style={{ background: hsvToHex(a[k] ?? [10, 55, 70]) }} /> {colorLabels[k]}
            </button>
          ))}
        </div>
        {colorKey === 'accColor' && <button onClick={() => setA((cur) => cur ? { ...cur, accColor: null } : cur)}>기본 배색으로</button>}{T.avatar.sliders.map((label: string, i: number) => (
          <label className="creator-slider" key={label}>
            <span>{label}</span>
            <input type="range" min={0} max={SLIDER_MAX[i]} value={hsv[i]} onChange={(e) => slide(i, Number(e.target.value))} />
          </label>
        ))}
      </div>
      <div className="actions">
        <button onClick={() => open({ kind: 'family' })}>{T.ui.back}</button>
        <button className="primary" onClick={() => dressUp(who, a)}>
          이대로 입기
        </button>
      </div>
    </div>
  )
}
