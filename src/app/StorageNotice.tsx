import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { flushGameStorage, getGameStorageStatus, reportGameStorageError, subscribeGameStorage } from '../engine/game-storage'
import type { GameState } from '../engine/game'
import { exportSave, saveGame } from '../engine/save'
import { downloadSaveFile } from '../shared/save-file-download'
import { setStorageNoticeOpen } from '../shared/storage-notice-state'
import { useGame } from '../store/game-store'
import { StorageCleanup } from './StorageCleanup'
import './storage-notice.css'

/**
 * 저장할 지금 기록 — 아직 아무 칸도 불러오지 않았으면(시작 화면·주인공 만들기에서 깨짐) 없다.
 * 스토어의 처음 값은 빈 새 게임이라, 그대로 쓰면 '다시 저장'이 기존 칸을 빈 게임으로 덮었다 (2026-10-26 감사 A03)
 */
const currentGame = () => (useGame.getState().loadEpoch > 0 ? useGame.getState().game : null)

/** 저장 실패는 한 번 알리고, 사용자가 미루면 같은 실패의 자동 저장마다 다시 열지 않는다. */
export function StorageNotice({ getCurrentGame = currentGame, getCurrentSlot }: { getCurrentGame?: () => GameState | null; getCurrentSlot?: () => string }) {
  const [status, setStatus] = useState(getGameStorageStatus)
  const [open, setOpen] = useState(() => !!getGameStorageStatus().error)
  const [retrying, setRetrying] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [cleanupBusy, setCleanupBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [exportError, setExportError] = useState(false)
  const dismissedId = useRef<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyId = useId()
  const busy = retrying || exporting || cleanupBusy
  const saved = status.state === 'saved' && !status.error
  const conflict = status.error?.name === 'GameStorageConflictError'
  const reopenStorage = conflict || status.error?.name === 'GameStorageVersionChangeError'

  useEffect(() => {
    const update = () => {
      const next = getGameStorageStatus()
      setStatus(next)
      if (next.error && next.errorId !== dismissedId.current) setOpen(true)
      if (!next.error && next.state === 'saved') dismissedId.current = null
    }
    const unsubscribe = subscribeGameStorage(update)
    update()
    return unsubscribe
  }, [])

  useLayoutEffect(() => {
    setStorageNoticeOpen(open)
    const element = dialog.current
    if (open && element && !element.open) {
      if (typeof element.showModal === 'function') element.showModal()
      else element.open = true
    }
    return () => { setStorageNoticeOpen(false) }
  }, [open])

  const dismiss = () => {
    if (busy) return
    if (status.error) dismissedId.current = status.errorId
    setMessage('')
    setOpen(false)
  }

  const retry = async () => {
    setRetrying(true)
    setExportError(false)
    setMessage('기기에 저장하는 중이에요…')
    try {
      const game = getCurrentGame()
      // 지금 기록이 없으면 새로 쓰지 않고, 밀려 있던 저장만 다시 시도한다
      const queued = !game || (getCurrentSlot ? saveGame(game, undefined, getCurrentSlot()) : saveGame(game))
      if (!queued) throw getGameStorageStatus().error ?? new Error('최근 진행 내용을 저장 대기열에 넣지 못했어요.')
      await flushGameStorage()
      const next = getGameStorageStatus()
      setStatus(next)
      if (next.state !== 'saved' || next.error) {
        setMessage('아직 저장을 마치지 못했어요. 기록을 파일로 받은 뒤 다시 시도해 주세요.')
        return
      }
      setMessage('최근 진행 내용과 앨범 사진을 기기에 저장했어요.')
    } catch (error) {
      reportGameStorageError(error)
      setMessage('아직 저장하지 못했어요. 기록을 파일로 받은 뒤 다시 시도해 주세요.')
    } finally {
      setRetrying(false)
    }
  }

  const exportNow = async () => {
    setExporting(true)
    setExportError(false)
    setMessage('')
    try {
      // 디스크에 다시 쓰지 않아도, 메모리에 남은 최신 진행과 앨범 사진을 함께 내보낸다.
      const game = getCurrentGame()
      if (!game) { setMessage('아직 불러온 기록이 없어요. 저장 칸의 기록은 불러오기 화면에서 칸마다 받을 수 있어요.'); return }
      const text = getCurrentSlot ? exportSave(game, undefined, getCurrentSlot()) : exportSave(game)
      const result = await downloadSaveFile(text, `27maeul-${game.clock.day}day.json`)
      setMessage(result === 'shared' ? '저장 파일을 공유했어요. 선택한 위치에 파일이 있는지 확인해 주세요.'
        : result === 'downloaded' ? '저장 파일 다운로드를 시작했어요. 다운로드 목록에서 확인해 주세요.'
          : result === 'copied' ? '저장 글을 복사했어요. 메모장 등에 붙여 넣어 보관해 주세요. 기기 저장 문제는 아직 해결되지 않았어요.'
            : '파일 받기를 취소했어요.')
    } catch {
      setExportError(true)
      setMessage('파일을 내보내지 못했어요. 이 창을 닫거나 새로고침하지 말고, 기기 공간과 브라우저의 파일 저장 권한을 확인한 뒤 다시 시도해 주세요.')
    } finally {
      setExporting(false)
    }
  }

  return <>
    {!open && status.error && <button className="storage-notice-reopen" onClick={() => { setMessage(''); setOpen(true) }}>
      저장하지 못한 기록이 있어요 · 안내 보기
    </button>}
    {open && <div className="storage-notice-shade">
      <dialog ref={dialog} className="storage-notice" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId}
        onCancel={(event) => { event.preventDefault(); dismiss() }}
        onKeyDown={(event) => event.stopPropagation()}>
        <h2 id={titleId}>{saved ? '저장을 마쳤어요' : status.quota ? '저장 공간이 부족해요'
          : conflict ? '다른 탭의 기록이 바뀌었어요' : reopenStorage ? '저장소를 다시 열어야 해요' : '기기에 저장하지 못했어요'}</h2>
        {saved ? <p id={bodyId}>최근 진행 내용과 앨범 사진을 기기에 저장했어요. 계속 플레이해도 돼요.</p> : <>
          <p id={bodyId}>최근 진행 내용이나 사진이 기기에 저장되지 않았어요. 저장을 마칠 때까지 게임을 닫거나 새로고침하지 마세요.</p>
          <ol>
            <li>먼저 ‘현재 기록 파일로 받기’를 눌러 백업해 주세요. 지금 진행 내용과 앨범 사진을 함께 담아요.</li>
            {status.quota ? <li>휴대폰·컴퓨터에서 불필요한 파일이나 앱을 정리해 여유 공간을 확보해 주세요. 게임 안의 오래된 저장 칸도 백업한 뒤 삭제할 수 있어요.</li>
              : reopenStorage ? <li>다른 탭에서 열린 27마을을 닫아 주세요. 여러 탭에서 서로 다른 기록을 덮어쓰지 않도록 저장을 멈췄어요.</li>
              : <li>브라우저에서 이 사이트의 저장을 허용했는지 확인해 주세요. 비공개 모드나 브라우저의 저장 제한이 원인일 수 있어요.</li>}
            {reopenStorage ? <li>백업 파일이 있는지 확인한 뒤 이 화면을 새로고침해 주세요. 최신 기록을 불러오거나 백업 파일을 가져와 이어 할 수 있어요.</li>
              : <li>{status.quota ? '공간을 확보한 뒤' : '저장 설정을 확인한 뒤'} ‘다시 저장’을 눌러 주세요. 완료 메시지가 나오면 계속 플레이해도 돼요.</li>}
          </ol>
          <p className="storage-notice-warning">브라우저의 ‘사이트 데이터 삭제’는 하지 마세요. 27마을 기록도 지워질 수 있어요.</p>
        </>}
        {message && <p className="storage-notice-message" role={exportError ? 'alert' : 'status'}>{message}</p>}
        <div className="storage-notice-actions">
          {!saved && <>
            <button onClick={() => void exportNow()} disabled={busy}>{exporting ? '파일을 준비하는 중…' : '현재 기록 파일로 받기'}</button>
            {!reopenStorage && <button onClick={() => void retry()} disabled={busy}>{retrying ? '저장하는 중…' : '다시 저장'}</button>}
          </>}
          <button onClick={dismiss} disabled={busy}>{saved ? '확인' : '나중에'}</button>
        </div>
        {!saved && status.quota && <StorageCleanup getCurrentGame={getCurrentGame} getCurrentSlot={getCurrentSlot} disabled={retrying || exporting} onBusy={setCleanupBusy} />}
      </dialog>
    </div>}
  </>
}
