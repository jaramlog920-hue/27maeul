import { act, fireEvent, render, screen } from '@testing-library/react'
import { StorageGate } from './StorageGate'

const backend = vi.hoisted(() => ({ initialize: vi.fn(), status: { quota: false } }))
vi.mock('../engine/game-storage', () => ({
  initializeGameStorage: backend.initialize,
  getGameStorageStatus: () => backend.status,
}))

beforeEach(() => { backend.initialize.mockReset(); backend.status.quota = false })

it('마을 저장소를 다 읽기 전에는 새 게임 화면을 열지 않는다', async () => {
  let ready!: () => void
  backend.initialize.mockReturnValue(new Promise<void>(resolve => { ready = resolve }))
  render(<StorageGate><button>새로 시작하기</button></StorageGate>)
  expect(screen.queryByRole('button', { name: '새로 시작하기' })).toBeNull()
  await act(async () => ready())
  expect(screen.getByRole('button', { name: '새로 시작하기' })).toBeInTheDocument()
})

it('이전 실패는 삭제 안내 없이 복구 방법을 보이고 재시도할 수 있다', async () => {
  backend.status.quota = true
  backend.initialize.mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError')).mockResolvedValueOnce(undefined)
  render(<StorageGate><button>새로 시작하기</button></StorageGate>)
  expect(await screen.findByRole('heading', { name: '저장 공간이 부족해요' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '새로 시작하기' })).toBeNull()
  expect(screen.getByText(/사이트 데이터 삭제.*하지 마세요/)).toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다시 시도' })) })
  expect(screen.getByRole('button', { name: '새로 시작하기' })).toBeInTheDocument()
})
