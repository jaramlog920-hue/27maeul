// 주인공 만들기: 스타듀밸리 생성창처럼 미리보기(돌리기·무작위), 이름, 모습, ◀ ▶ 항목, 색 막대
import { useEffect, useRef, useState } from 'react'
import { T } from '../../content/text'
import {
  ACCS,
  BOTTOMS,
  HAIR_BACKS,
  HAIR_FRONTS,
  SKINS,
  TOPS,
  cleanAvatarName,
  cycle,
  hsvToHex,
  nameProblem,
  randomAvatar,
  withLookDefaults,
  type Avatar,
  type FullAvatar,
  type Hsv,
  type Look,
} from '../../engine/avatar'
import type { Facing } from '../../engine/types'
import { SPRITE_H, SPRITE_W, spriteRows, writerPalette } from '../../render/sprites'

const TURN: Facing[] = ['down', 'left', 'up', 'right']
const SCALE = 8

export function Preview({ avatar, facing }: { avatar: FullAvatar; facing: Facing }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    g.clearRect(0, 0, SPRITE_W * SCALE, SPRITE_H * SCALE)
    const pal = writerPalette('spring', avatar)
    spriteRows('writer', facing, { frame: 0, blink: false, avatar }).forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = pal[ch]
        if (ch === '.' || !col) return
        g.fillStyle = col
        g.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
      }),
    )
  }, [avatar, facing])
  return <canvas ref={ref} className="creator-sprite" width={SPRITE_W * SCALE} height={SPRITE_H * SCALE} aria-hidden="true" />
}

type RowKey = 'skin' | 'hairFront' | 'hairBack' | 'top' | 'bottom' | 'acc'
type ColorKey = 'eyeColor' | 'hairColor' | 'bottomColor' | 'accColor'

const ROWS: { key: RowKey; names: readonly string[] }[] = [
  { key: 'skin', names: SKINS.map((_, i) => `${i + 1}`) },
  { key: 'hairFront', names: HAIR_FRONTS },
  { key: 'hairBack', names: HAIR_BACKS },
  { key: 'top', names: TOPS.map((t) => t[0]) },
  { key: 'bottom', names: BOTTOMS },
  { key: 'acc', names: ACCS },
]
export const SLIDER_MAX = [360, 100, 100]

export function AvatarForm({ onDone, onBack }: { onDone: (a: Avatar) => void; onBack: () => void }) {
  const [look, setLook] = useState<Look>('f')
  const [name, setName] = useState('')
  const [a, setA] = useState<FullAvatar>(() => withLookDefaults({ look: 'f', name: '' }))
  const [turn, setTurn] = useState(0)
  const [colorKey, setColorKey] = useState<ColorKey>('hairColor')
  const problem = nameProblem(name)
  const looks = T.avatar.looks as Record<Look, string>
  const problems = T.avatar.problems as Record<Exclude<ReturnType<typeof nameProblem>, null>, string>
  const rowLabels = T.avatar.rows as Record<RowKey, string>
  const colorLabels = T.avatar.colors as Record<ColorKey, string>

  const chooseLook = (l: Look) => {
    setLook(l)
    // 스타듀처럼 성별을 바꾸면 그에 맞는 처음 모양으로 돌아간다
    setA(withLookDefaults({ look: l, name: '' }))
  }
  const step = (key: RowKey, n: number, delta: number) => setA((cur) => ({ ...cur, [key]: cycle(cur[key], delta, n) }))
  const slide = (i: number, v: number) =>
    setA((cur) => {
      const next = [...(cur[colorKey] ?? [10, 55, 70])] as Hsv
      next[i] = v
      return { ...cur, [colorKey]: next }
    })
  const hsv = a[colorKey] ?? [10, 55, 70]
  const track = (i: number) => {
    // 막대 바탕: 그 칸만 바꿨을 때의 색 변화
    const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const c = [...hsv] as Hsv
      c[i] = t * SLIDER_MAX[i]
      if (i === 0) {
        c[1] = Math.max(c[1], 60)
        c[2] = Math.max(c[2], 70)
      }
      return hsvToHex(c)
    })
    return `linear-gradient(to right, ${stops.join(', ')})`
  }

  return (
    <main className="title avatar-form">
      <div className="dialog creator" role="dialog" aria-label={T.avatar.title}>
        <h2>{T.avatar.title}</h2>
        <p className="hint">{T.avatar.lead}</p>

        <div className="creator-top">
          <div className="creator-portrait">
            <div className="creator-frame">
              <Preview avatar={{ ...a, look, name }} facing={TURN[turn]} />
            </div>
            <div className="creator-turn">
              <button aria-label={T.avatar.turnLeft} onClick={() => setTurn((t) => cycle(t, 1, 4))}>
                ◀
              </button>
              <button aria-label={T.avatar.random} title={T.avatar.random} onClick={() => setA(randomAvatar(look, name))}>
                🎲
              </button>
              <button aria-label={T.avatar.turnRight} onClick={() => setTurn((t) => cycle(t, -1, 4))}>
                ▶
              </button>
            </div>
          </div>
          <div className="creator-id">
            <label className="avatar-name">
              {T.avatar.nameLabel}
              <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
            </label>
            {name && problem && (
              <p className="desk-message wrong" role="status">
                {problems[problem]}
              </p>
            )}
            <div className="creator-looks" role="radiogroup" aria-label={T.avatar.lookLabel}>
              {(['f', 'm'] as const).map((l) => (
                <button key={l} role="radio" aria-checked={look === l} className={look === l ? 'primary' : ''} onClick={() => chooseLook(l)}>
                  {looks[l]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="creator-rows">
          {ROWS.map(({ key, names }) => (
            <div className="creator-row" key={key}>
              <button aria-label={`${rowLabels[key]} 이전`} onClick={() => step(key, names.length, -1)}>
                ◀
              </button>
              <span className="creator-row-label">{rowLabels[key]}</span>
              <span className="creator-row-value">
                {key === 'skin' ? <i className="creator-swatch" style={{ background: SKINS[a.skin] }} /> : names[a[key]]}
              </span>
              <button aria-label={`${rowLabels[key]} 다음`} onClick={() => step(key, names.length, 1)}>
                ▶
              </button>
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
              <input
                type="range"
                min={0}
                max={SLIDER_MAX[i]}
                value={hsv[i]}
                style={{ background: track(i) }}
                onChange={(e) => slide(i, Number(e.target.value))}
              />
            </label>
          ))}
        </div>

        <div className="actions">
          <button onClick={onBack}>{T.ui.back}</button>
          <button className="primary" disabled={problem !== null} onClick={() => onDone({ ...a, look, name: cleanAvatarName(name) })}>
            {T.avatar.ok}
          </button>
        </div>
      </div>
    </main>
  )
}
