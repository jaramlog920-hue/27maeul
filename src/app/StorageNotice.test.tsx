import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StorageNotice } from './StorageNotice'
import { isStorageNoticeOpen } from '../shared/storage-notice-state'

const mocks = vi.hoisted(() => ({
  status: { state: 'saved' as 'saved' | 'pending' | 'error', error: null as Error | null, quota: false, errorId: 0 },
  listeners: new Set<() => void>(),
  flush: vi.fn<() => Promise<void>>(),
  report: vi.fn(),
  save: vi.fn(),
  exportSave: vi.fn(),
  download: vi.fn(),
  game: { clock: { day: 27 }, coins: 300, album: [{ id: 'memory-only' }] },
}))

vi.mock('../engine/game-storage', () => ({
  getGameStorageStatus: () => mocks.status,
  subscribeGameStorage: (listener: () => void) => { mocks.listeners.add(listener); return () => mocks.listeners.delete(listener) },
  flushGameStorage: () => mocks.flush(),
  reportGameStorageError: (error: unknown) => mocks.report(error),
}))
vi.mock('../engine/save', () => ({ saveGame: (...args: unknown[]) => mocks.save(...args), exportSave: (...args: unknown[]) => mocks.exportSave(...args) }))
vi.mock('../store/game-store', () => ({ useGame: { getState: () => ({ game: mocks.game }) } }))
vi.mock('../shared/save-file-download', () => ({ downloadSaveFile: (...args: unknown[]) => mocks.download(...args) }))
vi.mock('./StorageCleanup', () => ({ StorageCleanup: () => null }))

function notify(next: Partial<typeof mocks.status>) {
  act(() => {
    mocks.status = { ...mocks.status, ...next }
    for (const listener of mocks.listeners) listener()
  })
}

function fail(quota = true, errorId = 1) {
  notify({ state: 'error', error: new Error('write failed'), quota, errorId })
}

beforeEach(() => {
  mocks.status = { state: 'saved', error: null, quota: false, errorId: 0 }
  mocks.listeners.clear()
  mocks.flush.mockReset()
  mocks.report.mockReset()
  mocks.save.mockReset().mockReturnValue(true)
  mocks.exportSave.mockReset().mockReturnValue('{"game":"current","albumPics":{"memory-only":"data:image/png;base64,pic"}}')
  mocks.download.mockReset().mockResolvedValue('downloaded')
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true } })
})

afterEach(() => cleanup())

describe('저장 실패 안내', () => {
  it('용량이 모자라면 안내를 열고 기록 파일·공간 정리·다시 저장 순서를 알려 준다', () => {
    fail()
    render(<StorageNotice />)
    expect(screen.getByRole('dialog', { name: '저장 공간이 부족해요' })).toBeVisible()
    expect(screen.getByText(/저장을 마칠 때까지 게임을 닫거나 새로고침하지 마세요/)).toBeVisible()
    expect(screen.getByText(/불필요한 파일이나 앱을 정리/)).toBeVisible()
    expect(screen.getByText(/‘사이트 데이터 삭제’는 하지 마세요/)).toBeVisible()
    expect(screen.getByRole('button', { name: '현재 기록 파일로 받기' })).toBeEnabled()
    expect(isStorageNoticeOpen()).toBe(true)
  })

  it('자동 저장의 새 실패도 알리며, 나중에 누른 같은 실패는 반복해서 열지 않는다', () => {
    render(<StorageNotice />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fail()
    fireEvent.click(screen.getByRole('button', { name: '나중에' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(isStorageNoticeOpen()).toBe(false)
    notify({ state: 'pending' })
    fail(true, 1)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /저장하지 못한 기록이 있어요/ }))
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it('오류를 해결한 뒤 생긴 새 실패는 다시 알린다', () => {
    fail()
    render(<StorageNotice />)
    fireEvent.click(screen.getByRole('button', { name: '나중에' }))
    notify({ state: 'saved', error: null, quota: false })
    expect(screen.queryByRole('button', { name: /안내 보기/ })).toBeNull()
    fail(true, 2)
    expect(screen.getByRole('dialog', { name: '저장 공간이 부족해요' })).toBeVisible()
  })

  it('다시 저장은 IndexedDB 기록이 끝나기 전에는 완료라고 하지 않는다', async () => {
    let finish!: () => void
    mocks.flush.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve }))
    fail()
    render(<StorageNotice />)
    fireEvent.click(screen.getByRole('button', { name: '다시 저장' }))
    expect(mocks.save).toHaveBeenCalledWith(mocks.game)
    expect(screen.getByRole('button', { name: '저장하는 중…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '나중에' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: '저장을 마쳤어요' })).toBeNull()
    await act(async () => {
      mocks.status = { state: 'saved', error: null, quota: false, errorId: 1 }
      finish()
    })
    expect(screen.getByRole('heading', { name: '저장을 마쳤어요' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(isStorageNoticeOpen()).toBe(false)
  })

  it('저장 재시도가 실패하거나 오류가 남으면 성공으로 안내하지 않는다', async () => {
    const error = new Error('still full')
    mocks.flush.mockRejectedValue(error)
    fail()
    render(<StorageNotice />)
    fireEvent.click(screen.getByRole('button', { name: '다시 저장' }))
    await waitFor(() => expect(mocks.report).toHaveBeenCalledWith(error))
    expect(screen.getByRole('status')).toHaveTextContent('아직 저장하지 못했어요')
    expect(screen.queryByRole('heading', { name: '저장을 마쳤어요' })).toBeNull()
    mocks.flush.mockResolvedValue(undefined)
    fireEvent.click(screen.getByRole('button', { name: '다시 저장' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('아직 저장을 마치지 못했어요'))
    expect(screen.queryByRole('heading', { name: '저장을 마쳤어요' })).toBeNull()
  })

  it('기기 저장이 실패한 상태여도 메모리에 있는 최신 진행·앨범을 직접 내보낸다', async () => {
    fail()
    render(<StorageNotice />)
    fireEvent.click(screen.getByRole('button', { name: '현재 기록 파일로 받기' }))
    await waitFor(() => expect(mocks.download).toHaveBeenCalledWith(mocks.exportSave.mock.results[0].value, '27maeul-27day.json'))
    expect(mocks.exportSave).toHaveBeenCalledWith(mocks.game)
    expect(mocks.save).not.toHaveBeenCalled()
    expect(mocks.flush).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: '저장 공간이 부족해요' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('다운로드 목록에서 확인해 주세요')
  })

  it('최신 진행을 대기열에 넣지 못하면 이전 저장이 완료돼 있어도 성공으로 처리하지 않는다', async () => {
    mocks.save.mockReturnValue(false)
    fail()
    render(<StorageNotice />)
    fireEvent.click(screen.getByRole('button', { name: '다시 저장' }))
    await waitFor(() => expect(mocks.report).toHaveBeenCalledWith(mocks.status.error))
    expect(mocks.flush).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('아직 저장하지 못했어요')
    expect(screen.queryByRole('heading', { name: '저장을 마쳤어요' })).toBeNull()
  })

  it.each(['GameStorageConflictError', 'GameStorageVersionChangeError'])('다른 탭에서 저장소가 바뀌면 먼저 백업한 뒤 다시 열도록 안내한다 (%s)', (name) => {
    const error = new Error('another tab changed storage')
    error.name = name
    notify({ state: 'error', error, quota: false, errorId: 1 })
    render(<StorageNotice />)
    expect(screen.getByText(/백업 파일이 있는지 확인한 뒤 이 화면을 새로고침/)).toBeVisible()
    expect(screen.getByRole('button', { name: '현재 기록 파일로 받기' })).toBeVisible()
    expect(screen.queryByRole('button', { name: '다시 저장' })).toBeNull()
  })

  it('파일 내보내기도 실패하면 성공 메시지 대신 다시 시도할 안내를 보여 준다', async () => {
    mocks.download.mockRejectedValue(new Error('unsupported'))
    fail()
    render(<StorageNotice />)
    fireEvent.click(screen.getByRole('button', { name: '현재 기록 파일로 받기' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('파일을 내보내지 못했어요'))
    expect(screen.getByRole('button', { name: '현재 기록 파일로 받기' })).toBeEnabled()
    expect(screen.queryByRole('heading', { name: '저장을 마쳤어요' })).toBeNull()
  })

  it('저장 권한 오류는 공간 부족으로 단정하지 않으며 시작 화면의 기록도 내보낼 수 있다', async () => {
    const titleGame = { ...mocks.game, clock: { day: 9 } } as unknown as ReturnType<NonNullable<Parameters<typeof StorageNotice>[0]['getCurrentGame']>>
    fail(false)
    const { unmount } = render(<StorageNotice getCurrentGame={() => titleGame} />)
    expect(screen.getByRole('dialog', { name: '기기에 저장하지 못했어요' })).toBeVisible()
    expect(screen.getByText(/이 사이트의 저장을 허용했는지/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '현재 기록 파일로 받기' }))
    await waitFor(() => expect(mocks.exportSave).toHaveBeenCalledWith(titleGame))
    expect(mocks.download).toHaveBeenCalledWith(expect.any(String), '27maeul-9day.json')
    unmount()
    expect(isStorageNoticeOpen()).toBe(false)
  })

  it('시작 화면에서 선택한 칸이 activeSlot과 달라도 같은 칸의 사진을 백업하고 재저장한다', async () => {
    fail()
    render(<StorageNotice getCurrentSlot={() => '2'} />)
    fireEvent.click(screen.getByRole('button', { name: '현재 기록 파일로 받기' }))
    await waitFor(() => expect(mocks.exportSave).toHaveBeenCalledWith(mocks.game, undefined, '2'))
    fireEvent.click(screen.getByRole('button', { name: '다시 저장' }))
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(mocks.game, undefined, '2'))
  })
})
