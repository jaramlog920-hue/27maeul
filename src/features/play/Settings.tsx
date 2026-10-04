import { useState } from 'react'
import {
  currentMusicChoice,
  currentVolume,
  MUSIC_CHOICES,
  setMusicChoice,
  setVolume,
  sfx,
  unlockAudio,
  type MusicChoice,
  type VolumeKind,
} from '../../audio/sound'
import { eraseSave } from '../../engine/save'
import { T } from '../../content/text'
import { loadTheme, setTheme, THEMES, type ThemeId } from '../../app/theme'
import { useGame, ZOOMS } from '../../store/game-store'

const C = T.controls

const TRACKS = MUSIC_CHOICES.map((id) => [id, (C.tracks as Record<MusicChoice, string>)[id]] as const)

function VolumeSlider({ kind, label }: { kind: VolumeKind; label: string }) {
  const [value, setValue] = useState(() => Math.round(currentVolume(kind) * 100))
  return (
    <label className="volume-row">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={`${label} 크기`}
        onChange={(e) => {
          unlockAudio()
          const v = Number(e.target.value)
          setValue(v)
          setVolume(kind, v / 100)
        }}
        // 효과음은 손을 뗄 때 한 번 들려준다
        onPointerUp={() => kind === 'sfx' && sfx('tap')}
      />
      <output>{value}%</output>
    </label>
  )
}

export function Settings() {
  const close = useGame((s) => s.closeModal)
  const muted = useGame((s) => s.muted)
  const joystick = useGame((s) => s.joystick)
  const shape = useGame((s) => s.joystickShape)
  const side = useGame((s) => s.joystickSide)
  const zoom = useGame((s) => s.zoom)
  const deck = useGame((s) => s.deck)
  const mode = deck ? 'deck' : joystick ? 'float' : 'none'
  const { setDeck, setMuted, setJoystick, setJoystickShape, setJoystickSide, setZoom, open } = useGame.getState()
  const [music, setMusic] = useState<MusicChoice>(() => currentMusicChoice())
  const [resetting, setResetting] = useState(false)
  const [theme, setThemeState] = useState<ThemeId>(() => loadTheme())
  return (
    <div className="dialog settings" role="dialog" aria-label="설정">
      <h2>설정</h2>
      <section className="settings-section">
        <h3>{C.music}</h3>
        <div className="settings-options" role="group" aria-label={C.music}>
          {TRACKS.map(([id, label]) => (
            <button
              key={id}
              data-track={id}
              className={music === id && !muted ? 'on' : ''}
              aria-pressed={music === id && !muted}
              onClick={() => {
                unlockAudio()
                setMuted(false)
                setMusic(id)
                setMusicChoice(id)
              }}
            >
              {label}
            </button>
          ))}
          <button className={muted ? 'on' : ''} aria-pressed={muted} onClick={() => setMuted(true)}>
            음소거
          </button>
        </div>
      </section>
      <section className="settings-section">
        <h3>소리 크기</h3>
        <VolumeSlider kind="music" label="배경음" />
        <VolumeSlider kind="sfx" label="효과음" />
      </section>
      <section className="settings-section">
        <h3>{C.theme}</h3>
        <div className="settings-options theme-options" role="group" aria-label={C.theme}>
          {THEMES.map((id) => (
            <button
              key={id}
              data-theme-pick={id}
              className={theme === id ? 'on' : ''}
              aria-pressed={theme === id}
              onClick={() => {
                setTheme(id)
                setThemeState(id)
              }}
            >
              <span className={`theme-swatch swatch-${id}`} aria-hidden="true" />
              {(C.themes as Record<ThemeId, string>)[id]}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h3>화면 크기</h3>
        <div className="settings-options zoom-options" role="group" aria-label="화면 확대">
          {ZOOMS.map((z) => (
            <button key={z} className={zoom === z ? 'on' : ''} aria-pressed={zoom === z} onClick={() => setZoom(z)}>
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
        <p className="hint">크게 할수록 필사가 주변이 크게 보이고, 한 화면에 보이는 마을은 좁아져요.</p>
      </section>
      <section className="settings-section">
        <h3>{C.mode}</h3>
        <div className="settings-options" role="group" aria-label={C.mode}>
          {(
            [
              ['deck', C.modeDeck],
              ['float', C.modeFloat],
              ['none', C.modeNone],
            ] as const
          ).map(([id, label]) => {
            const on = mode === id
            return (
              <button
                key={id}
                data-mode={id}
                className={on ? 'on' : ''}
                aria-pressed={on}
                onClick={() => {
                  setDeck(id === 'deck')
                  setJoystick(id === 'float')
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        {mode === 'float' && (
          <>
            <div className="settings-row">
              <h4>{C.shape}</h4>
              <div className="settings-options pair-options" role="group" aria-label={C.shape}>
                {(
                  [
                    ['pad', C.shapePad],
                    ['round', C.shapeRound],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} data-shape={id} className={shape === id ? 'on' : ''} aria-pressed={shape === id} onClick={() => setJoystickShape(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <h4>{C.side}</h4>
              <div className="settings-options pair-options" role="group" aria-label={C.side}>
                {(
                  [
                    ['right', C.sideRight],
                    ['left', C.sideLeft],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} data-side={id} className={side === id ? 'on' : ''} aria-pressed={side === id} onClick={() => setJoystickSide(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <p className="hint">{mode === 'deck' ? C.deckHint : C.hint}</p>
      </section>
      <section className="settings-section">
        <div className="settings-row">
          <h3>마을 지도</h3>
          <button aria-label="마을 지도" onClick={() => open({ kind: 'villageMap' })}>보기</button>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-row">
          <h3>도움말</h3>
          <button aria-label="도움말" onClick={() => open({ kind: 'guide' })}>열기</button>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-row">
          <h3>기록 초기화</h3>
          {!resetting && <button onClick={() => setResetting(true)}>처음부터</button>}
        </div>
        {resetting ? (
          <div className="reset-confirm">
            <p className="hint">엮은 책, 모은 조각, 서고, 가방, 이웃과의 정이 모두 지워지고 첫날부터 다시 시작해요. 되돌릴 수 없어요.</p>
            <div className="settings-options reset-options">
              <button onClick={() => setResetting(false)}>취소</button>
              <button
                className="danger"
                onClick={() => {
                  eraseSave()
                  globalThis.location?.reload()
                }}
              >
                모두 지우기
              </button>
            </div>
          </div>
        ) : (
          <p className="hint">잘못 눌러도 한 번 더 묻고 나서 지워요.</p>
        )}
      </section>
      <div className="actions">
        <button onClick={close}>닫기</button>
      </div>
    </div>
  )
}
