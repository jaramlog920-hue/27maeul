import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { GameState } from '../engine/game'
import { StorageCleanup } from './StorageCleanup'

const mocks = vi.hoisted(() => ({
  active: '1',
  saves: [
    { slot: '1', name: '현재기록', day: 27, coins: 500, books: 9, look: 'f' as const, savedAt: 10 },
    { slot: '2', name: '옛기록', day: 8, coins: 100, books: 2, look: 'm' as const, savedAt: 9 },
  ],
  load: vi.fn(),
  export: vi.fn(),
  download: vi.fn(),
  remove: vi.fn(),
  save: vi.fn(),
  sync: vi.fn(),
  busy: vi.fn(),
  current: { clock: { day: 27 }, flags: { current: 1 } },
  old: { clock: { day: 8 }, flags: { old: 1 } },
}))

vi.mock('../engine/save', () => ({
  activeSlot: () => mocks.active,
  listSaves: () => mocks.saves,
  loadGame: (...args: unknown[]) => mocks.load(...args),
  exportSave: (...args: unknown[]) => mocks.export(...args),
  deleteSaveAsync: (...args: unknown[]) => mocks.remove(...args),
  saveGame: (...args: unknown[]) => mocks.save(...args),
}))
vi.mock('../engine/game', () => ({ syncHome: (...args: unknown[]) => mocks.sync(...args) }))
vi.mock('../store/game-store', () => ({ useGame: { getState: () => ({ game: mocks.current }) } }))
vi.mock('../shared/save-file-download', () => ({ downloadSaveFile: (...args: unknown[]) => mocks.download(...args) }))

const current = () => mocks.current as unknown as GameState

beforeEach(() => {
  mocks.active = '1'
  mocks.saves = [
    { slot: '1', name: '현재기록', day: 27, coins: 500, books: 9, look: 'f', savedAt: 10 },
    { slot: '2', name: '옛기록', day: 8, coins: 100, books: 2, look: 'm', savedAt: 9 },
  ]
  mocks.load.mockReset().mockReturnValue(mocks.old)
  mocks.export.mockReset().mockReturnValue('{"save":"old","album":{"old-photo":"data:image/png;base64,pic"}}')
  mocks.download.mockReset().mockResolvedValue('downloaded')
  mocks.remove.mockReset().mockImplementation(async (slot: string) => { mocks.saves = mocks.saves.filter((save) => save.slot !== slot); return true })
  mocks.save.mockReset().mockReturnValue(true)
  mocks.sync.mockReset()
  mocks.busy.mockReset()
})

afterEach(() => cleanup())

function openCleanup(props: Partial<Parameters<typeof StorageCleanup>[0]> = {}) {
  render(<StorageCleanup getCurrentGame={current} onBusy={mocks.busy} {...props} />)
  fireEvent.click(screen.getByText('오래된 저장 칸 정리'))
}

async function backUp() {
  fireEvent.click(screen.getByRole('button', { name: '옛기록 8일차 백업 파일 받기' }))
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeVisible())
}

async function confirmBackup() {
  await backUp()
  fireEvent.click(screen.getByRole('checkbox', { name: '백업 파일이 실제로 저장된 것을 확인했어요.' }))
  fireEvent.click(screen.getByRole('button', { name: '옛기록 8일차 저장 칸 삭제' }))
}

describe('저장 공간 부족 중 오래된 저장 칸 정리', () => {
  it('현재 칸은 목록에서 빼고 다른 칸도 백업 전에는 삭제할 수 없다', () => {
    openCleanup()
    expect(screen.queryByText(/현재기록/)).toBeNull()
    expect(screen.getByRole('heading', { name: '옛기록 · 8일차' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /저장 칸 삭제/ })).toBeNull()
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('제목 화면에서 선택한 현재 칸도 activeSlot과 함께 보호한다', () => {
    openCleanup({ getCurrentSlot: () => '2' })
    expect(screen.getByText('정리할 다른 저장 칸이 없어요.')).toBeVisible()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('선택한 옛 칸의 진행·사진을 내보내고 현재 지도는 즉시 복구한다', async () => {
    openCleanup()
    await backUp()
    expect(mocks.load).toHaveBeenCalledWith(expect.anything(), undefined, '2')
    expect(mocks.export).toHaveBeenCalledWith(mocks.old, undefined, '2')
    expect(mocks.download).toHaveBeenCalledWith(mocks.export.mock.results[0].value, '27maeul-slot2-8day.json')
    expect(mocks.sync).toHaveBeenCalledWith(mocks.current)
    expect(screen.getByRole('button', { name: '옛기록 8일차 저장 칸 삭제' })).toBeDisabled()
    expect(mocks.busy).toHaveBeenNthCalledWith(1, true)
    expect(mocks.busy).toHaveBeenLastCalledWith(false)
  })

  it('파일 보관 확인과 삭제 확인을 모두 거친 뒤 실제 삭제 완료를 기다린다', async () => {
    let finish!: (value: boolean) => void
    mocks.remove.mockImplementation(() => new Promise<boolean>((resolve) => { finish = resolve }))
    openCleanup()
    await confirmBackup()
    expect(mocks.remove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '백업 확인했고 삭제' }))
    expect(screen.getByRole('button', { name: '백업 확인했고 삭제' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: '옛기록 · 8일차' })).toBeVisible()
    expect(screen.queryByText(/저장 칸과 사진을 삭제했어요/)).toBeNull()
    mocks.saves = mocks.saves.filter((save) => save.slot !== '2')
    finish(true)
    await waitFor(() => expect(screen.queryByRole('heading', { name: '옛기록 · 8일차' })).toBeNull())
    expect(mocks.remove).toHaveBeenCalledWith('2')
    expect(mocks.save).toHaveBeenCalledWith(mocks.current, undefined, undefined)
    expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0])
    expect(mocks.saves.map((save) => save.slot)).toEqual(['1'])
    expect(screen.getByRole('status')).toHaveTextContent('저장 칸과 사진을 삭제했어요')
  })

  it('삭제 실패 시에는 옛 칸도 그대로 보이고 성공으로 알리지 않는다', async () => {
    mocks.remove.mockResolvedValue(false)
    openCleanup()
    await confirmBackup()
    fireEvent.click(screen.getByRole('button', { name: '백업 확인했고 삭제' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('삭제하지 못했어요'))
    expect(screen.getByRole('heading', { name: '옛기록 · 8일차' })).toBeVisible()
    expect(mocks.saves).toHaveLength(2)
    expect(mocks.busy).toHaveBeenLastCalledWith(false)
  })

  it('현재의 최신 진행을 저장 대기열에 넣지 못하면 옛 칸도 삭제하지 않는다', async () => {
    mocks.save.mockReturnValue(false)
    openCleanup()
    await confirmBackup()
    fireEvent.click(screen.getByRole('button', { name: '백업 확인했고 삭제' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('삭제하지 못했어요'))
    expect(mocks.remove).not.toHaveBeenCalled()
    expect(mocks.saves).toHaveLength(2)
    expect(mocks.busy).toHaveBeenLastCalledWith(false)
  })

  it('백업 취소·실패 시 삭제를 열지 않으며 불러오기 실패에도 현재 지도를 복구한다', async () => {
    mocks.download.mockResolvedValue('cancelled')
    openCleanup()
    fireEvent.click(screen.getByRole('button', { name: '옛기록 8일차 백업 파일 받기' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('파일 받기를 취소했어요'))
    expect(screen.queryByRole('checkbox')).toBeNull()
    mocks.load.mockReturnValue(null)
    fireEvent.click(screen.getByRole('button', { name: '옛기록 8일차 백업 파일 받기' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('백업하지 못했어요'))
    expect(screen.queryByRole('button', { name: /저장 칸 삭제/ })).toBeNull()
    expect(mocks.sync).toHaveBeenCalledTimes(2)
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('클립보드 백업은 다른 곳에 붙여 보관했다는 확인을 요구한다', async () => {
    mocks.download.mockResolvedValue('copied')
    openCleanup()
    await backUp()
    expect(screen.getByRole('checkbox', { name: '복사한 저장 글을 다른 곳에 붙여 넣어 보관했어요.' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: '옛기록 8일차 저장 칸 삭제' })).toBeDisabled()
  })

  it('목록을 연 뒤 현재 칸이 바뀌면 삭제 직전에 다시 보호한다', async () => {
    openCleanup()
    await confirmBackup()
    mocks.active = '2'
    fireEvent.click(screen.getByRole('button', { name: '백업 확인했고 삭제' }))
    expect(screen.getByRole('alert')).toHaveTextContent('지금 플레이 중인 저장 칸은 지우지 않았어요')
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
