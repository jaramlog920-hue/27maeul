// 불러오기 (2026-10-07 사용자: 스타듀밸리처럼 저장을 여러 개): 칸마다 이름·날·닢·꽂은 책, 누르면 그 칸으로 시작.
// 지우기는 그 줄에서 한 번 더 묻는다. 서고 목록식 줄(.rows/.row)
import { useEffect, useRef, useState } from 'react'
import { deleteSave, listSaves, type SaveSlot } from '../../engine/save'
import { withLookDefaults, type Avatar } from '../../engine/avatar'
import { SPRITE_H, SPRITE_W, spriteRows, writerPalette } from '../../render/sprites'
import { t } from '../../shared/i18n'

/** 칸 그림: 그 기록의 주인공 (정면, 작게) */
function Face({ avatar }: { avatar: Avatar }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    const full = withLookDefaults(avatar)
    const pal = writerPalette('spring', full)
    g.clearRect(0, 0, SPRITE_W, SPRITE_H)
    spriteRows('writer', 'down', { frame: 0, blink: false, avatar: full }).forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = pal[ch]
        if (ch === '.' || !col) return
        g.fillStyle = col
        g.fillRect(x, y, 1, 1)
      }),
    )
  }, [avatar])
  return <canvas ref={ref} className="save-face" width={SPRITE_W} height={SPRITE_H} aria-hidden="true" />
}

function when(ms: number): string {
  if (!ms) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SaveSlots({ onPick, onBack }: { onPick: (slot: string) => void; onBack: () => void }) {
  const [saves, setSaves] = useState<SaveSlot[]>(() => listSaves())
  const [asking, setAsking] = useState<string | null>(null)
  return (
    <main className="title title-island save-slots">
      <div className="dialog save-slots-box" role="dialog" aria-label={t('saves.title')}>
        <h2>{t('saves.title')}</h2>
        {saves.length === 0 ? (
          <p className="hint">{t('saves.none')}</p>
        ) : (
          <ul className="rows">
            {saves.map((s) => (
              <li key={s.slot}>
                {asking === s.slot ? (
                  <div className="row save-confirm">
                    <span className="row-main"><b>{t('saves.deleteAsk', { name: s.name || t('saves.noName') })}</b></span>
                    <button onClick={() => setAsking(null)}>{t('saves.no')}</button>
                    <button
                      className="danger"
                      onClick={() => {
                        deleteSave(s.slot)
                        setAsking(null)
                        setSaves(listSaves())
                      }}
                    >
                      {t('saves.delete')}
                    </button>
                  </div>
                ) : (
                  <div className="row save-row">
                    <button className="save-pick" onClick={() => onPick(s.slot)}>
                      {s.avatar && <Face avatar={s.avatar} />}
                      <span className="row-main"><b>{s.name || t('saves.noName')}</b></span>
                      <span className="row-meta">{t('saves.line', { day: s.day, coins: s.coins, books: s.books })}</span>
                      {s.savedAt > 0 && <span className="row-meta">{when(s.savedAt)}</span>}
                    </button>
                    <button className="save-del" onClick={() => setAsking(s.slot)}>
                      {t('saves.delete')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="actions">
          <button data-close onClick={onBack}>{t('common.back')}</button>
        </div>
      </div>
    </main>
  )
}
