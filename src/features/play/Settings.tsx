import { useState } from 'react'
import {
  currentMusicChoice,
  currentVolume,
  setMusicChoice,
  setVolume,
  sfx,
  unlockAudio,
  type MusicChoice,
  type VolumeKind,
} from '../../audio/sound'
import { eraseSave } from '../../engine/save'
import { useGame, ZOOMS } from '../../store/game-store'

const TRACKS = [['default', 'A'], ['D', 'B'], ['E', 'C'], ['F', 'D']] as const

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
  const zoom = useGame((s) => s.zoom)
  const { setMuted, setJoystick, setZoom, open } = useGame.getState()
  const [music, setMusic] = useState<MusicChoice>(() => currentMusicChoice())
  const [resetting, setResetting] = useState(false)
  return (
    <div className="dialog settings" role="dialog" aria-label="설정">
      <h2>설정</h2>
      <section className="settings-section">
        <h3>배경음악</h3>
        <div className="settings-options">
          {TRACKS.map(([id, label]) => (
            <button
              key={id}
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
        <div className="settings-row">
          <h3>모바일 조이스틱</h3>
          <button className={joystick ? 'on' : ''} aria-pressed={joystick} onClick={() => setJoystick(!joystick)}>
            {joystick ? '켜짐' : '꺼짐'}
          </button>
        </div>
        <p className="hint">터치 화면 오른쪽 아래에 나타나요. 누르고 있는 동안 계속 걸어요.</p>
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
