import { useState } from 'react'
import { CONTENT } from '../content/catalog'
import { syncHome, type GameState } from '../engine/game'
import { activeSlot, deleteSaveAsync, exportSave, listSaves, loadGame, saveGame, type SaveSlot } from '../engine/save'
import { downloadSaveFile, type SaveFileDownloadResult } from '../shared/save-file-download'

const saveName = (save: SaveSlot) => save.name || '이름 없는 기록'

/** 용량 부족 상태에서 시작 화면으로 나가지 않고 다른 칸을 백업한 뒤 정리한다. */
export function StorageCleanup({ getCurrentGame, getCurrentSlot, disabled = false, onBusy }: {
  getCurrentGame: () => GameState
  getCurrentSlot?: () => string
  disabled?: boolean
  onBusy?: (busy: boolean) => void
}) {
  const protectedSlot = (slot: string) => slot === activeSlot() || slot === getCurrentSlot?.()
  const oldSaves = () => {
    const active = activeSlot()
    const current = getCurrentSlot?.()
    return listSaves().filter((save) => save.slot !== active && save.slot !== current)
  }
  const [saves, setSaves] = useState(oldSaves)
  const [working, setWorking] = useState<string | null>(null)
  const [backups, setBackups] = useState<Record<string, SaveFileDownloadResult>>({})
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  const [deleteSlot, setDeleteSlot] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const busy = disabled || working !== null

  const begin = (slot: string) => {
    setWorking(slot)
    onBusy?.(true)
    setMessage('')
    setFailed(false)
  }
  const finish = () => { setWorking(null); onBusy?.(false) }

  const backup = async (save: SaveSlot) => {
    if (protectedSlot(save.slot)) {
      setFailed(true)
      setMessage('지금 플레이 중인 저장 칸은 이곳에서 지울 수 없어요.')
      setSaves(oldSaves())
      return
    }
    begin(save.slot)
    setConfirmed((value) => ({ ...value, [save.slot]: false }))
    setDeleteSlot(null)
    try {
      let text: string
      try {
        const game = loadGame(CONTENT, undefined, save.slot)
        if (!game) throw new Error('저장 기록을 읽지 못했어요.')
        text = exportSave(game, undefined, save.slot)
      } finally {
        // 다른 칸의 불러오기 검증이 바꾼 지도·가구를 현재 플레이 기록으로 즉시 되돌린다.
        syncHome(getCurrentGame())
      }
      const result = await downloadSaveFile(text, `27maeul-slot${save.slot}-${save.day}day.json`)
      setBackups((value) => ({ ...value, [save.slot]: result }))
      setMessage(result === 'cancelled' ? '파일 받기를 취소했어요. 백업한 뒤 저장 칸을 정리할 수 있어요.'
        : result === 'copied' ? '저장 글을 복사했어요. 메모장 등에 붙여 넣어 보관한 다음 확인해 주세요.'
          : '파일 받기를 요청했어요. 다운로드 목록이나 선택한 위치에 파일이 있는지 확인해 주세요.')
    } catch {
      setFailed(true)
      setBackups((value) => { const next = { ...value }; delete next[save.slot]; return next })
      setMessage('이 저장 칸을 백업하지 못했어요. 기록과 사진을 지우지 않았어요. 파일 저장 권한을 확인한 뒤 다시 시도해 주세요.')
    } finally { finish() }
  }

  const remove = async (save: SaveSlot) => {
    if (!confirmed[save.slot] || !backups[save.slot] || backups[save.slot] === 'cancelled') return
    if (protectedSlot(save.slot)) {
      setFailed(true)
      setMessage('지금 플레이 중인 저장 칸은 지우지 않았어요.')
      setDeleteSlot(null)
      setSaves(oldSaves())
      return
    }
    begin(save.slot)
    try {
      // 공간을 확보하는 트랜잭션에 현재의 최신 진행도 함께 넣는다.
      if (!saveGame(getCurrentGame(), undefined, getCurrentSlot?.())) throw new Error('current save failed')
      if (!await deleteSaveAsync(save.slot)) throw new Error('delete failed')
      setSaves(oldSaves())
      setDeleteSlot(null)
      setMessage(`‘${saveName(save)}’ 저장 칸과 사진을 삭제했어요. 공간을 확보했으면 ‘다시 저장’을 눌러 주세요.`)
    } catch {
      setFailed(true)
      setMessage('이 저장 칸을 삭제하지 못했어요. 기록과 사진은 그대로 남아 있어요. 다시 시도해 주세요.')
    } finally { finish() }
  }

  return <details className="storage-cleanup">
    <summary onClick={(event) => { if (busy) event.preventDefault() }} aria-disabled={busy}>오래된 저장 칸 정리</summary>
    <p>지금 플레이 중인 칸은 목록에서 뺐어요. 다른 칸도 먼저 기록과 앨범 사진을 백업한 뒤 지울 수 있어요.</p>
    {saves.length === 0 ? <p>정리할 다른 저장 칸이 없어요.</p> : <ul>
      {saves.map((save) => <li key={save.slot}>
        <h3>{saveName(save)} · {save.day}일차</h3>
        <p>{save.books}권 · {save.coins}닢 · 저장 칸 {save.slot}</p>
        <button disabled={busy} onClick={() => void backup(save)} aria-label={`${saveName(save)} ${save.day}일차 백업 파일 받기`}>
          {working === save.slot ? '처리하는 중…' : '이 칸 백업 파일 받기'}
        </button>
        {backups[save.slot] && backups[save.slot] !== 'cancelled' && <>
          <label className="storage-cleanup-confirm">
            <input type="checkbox" checked={!!confirmed[save.slot]} disabled={busy}
              onChange={(event) => { setConfirmed((value) => ({ ...value, [save.slot]: event.target.checked })); setDeleteSlot(null) }} />
            {backups[save.slot] === 'copied' ? '복사한 저장 글을 다른 곳에 붙여 넣어 보관했어요.' : '백업 파일이 실제로 저장된 것을 확인했어요.'}
          </label>
          {deleteSlot === save.slot ? <div className="storage-cleanup-delete">
            <p>‘{saveName(save)}’ {save.day}일차 기록과 앨범 사진을 이 기기에서 삭제할까요? 백업 파일로 다시 가져올 수 있어요.</p>
            <button disabled={busy} onClick={() => setDeleteSlot(null)}>취소</button>
            <button disabled={busy || !confirmed[save.slot]} onClick={() => void remove(save)}>백업 확인했고 삭제</button>
          </div> : <button disabled={busy || !confirmed[save.slot]} onClick={() => setDeleteSlot(save.slot)}
            aria-label={`${saveName(save)} ${save.day}일차 저장 칸 삭제`}>이 저장 칸 삭제</button>}
        </>}
      </li>)}
    </ul>}
    {message && <p className="storage-notice-message" role={failed ? 'alert' : 'status'}>{message}</p>}
  </details>
}
