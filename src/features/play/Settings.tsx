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
import { eraseSave, saveGame } from '../../engine/save'
import { setGenOn } from '../../engine/gen-settle'
import { t } from '../../shared/i18n'
import { T } from '../../content/text'
import { loadTheme, setTheme, THEMES, type ThemeId } from '../../app/theme'
import { useGame, ZOOMS } from '../../store/game-store'
import { copySoundOn, copyVibrateOn, setCopySound, setCopyVibrate } from '../desk/copy-feel'
import { copyVoiceOn, setCopyVoice, voiceAvailable } from '../desk/copy-voice'
import { copyAlwaysWrite, setCopyAlwaysWrite } from '../desk/copy-way-setting'

const C = T.controls

/** 주민 자율 생활 켜기/끄기 (계획 20 2부 P14): 끄면 새 만남·전환이 멈추고, 다시 켜도 밀린 기간을 몰아 처리하지 않는다. 설명 줄 없이 이름만 */
function GenSetting() {
  const on = useGame((s) => s.game.gen?.on ?? true)
  const has = useGame((s) => !!s.game.gen)
  if (!has) return null
  const pick = (v: boolean) => {
    const next = setGenOn(useGame.getState().game, v)
    saveGame(next)
    useGame.setState({ game: next })
  }
  return (
    <section className="settings-section">
      <h3>{t('gen.setting')}</h3>
      <div className="settings-options pair-options" role="group" aria-label={t('gen.setting')}>
        <button className={on ? 'on' : ''} aria-pressed={on} onClick={() => pick(true)}>{t('gen.on')}</button>
        <button className={!on ? 'on' : ''} aria-pressed={!on} onClick={() => pick(false)}>{t('gen.off')}</button>
      </div>
    </section>
  )
}

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

/** 필사 손맛 켜고 끄기 (펜 긁는 소리·절마다 진동) — 기본은 켬, 기기에 저장 */
function CopyFeelToggle({ label, get, put, id }: { label: string; get: () => boolean; put: (on: boolean) => void; id: string }) {
  const [on, setOn] = useState(get)
  return (
    <div className="settings-row">
      <h4>{label}</h4>
      <div className="settings-options pair-options" role="group" aria-label={label}>
        {(
          [
            [true, '켬'],
            [false, '끔'],
          ] as const
        ).map(([v, text]) => (
          <button
            key={text}
            data-copy-feel={`${id}-${v ? 'on' : 'off'}`}
            className={on === v ? 'on' : ''}
            aria-pressed={on === v}
            onClick={() => {
              put(v)
              setOn(v)
            }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
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
        <h3>필사</h3>
        <CopyFeelToggle id="sound" label="펜 긁는 소리" get={copySoundOn} put={setCopySound} />
        <CopyFeelToggle id="vibrate" label="절마다 진동" get={copyVibrateOn} put={setCopyVibrate} />
        {/* 필사 방식 (계획 21 R1): 켜면 퍼즐 없이 늘 손으로 쓴다 */}
        <CopyFeelToggle id="way" label={t('copyWays.always')} get={copyAlwaysWrite} put={setCopyAlwaysWrite} />
        {/* 소리 내어 읽기: 음성 인식이 있는 브라우저에서만 (기본은 끔) */}
        {voiceAvailable() && (
          <>
            <CopyFeelToggle id="voice" label={T.copyFocus.voiceSetting} get={copyVoiceOn} put={setCopyVoice} />
            <p className="hint">{T.copyFocus.voiceSettingNote}</p>
          </>
        )}
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
      </section>
      <GenSetting />
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
        {resetting && (
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
        )}
      </section>
      <div className="actions">
        <button data-close onClick={close}>닫기</button>
      </div>
    </div>
  )
}
