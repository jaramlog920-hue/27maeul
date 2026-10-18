import { downloadSaveFile } from './save-file-download'

const text = '{"game":"latest","albumPics":{"photo":"data:image/png;base64,pic"}}'

beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn().mockReturnValue('blob:save-file')
    static revokeObjectURL = vi.fn()
  })
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('저장 파일 받기', () => {
  it('파일 공유를 지원하면 진행과 사진이 든 파일을 공유한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    expect(await downloadSaveFile(text, '27maeul.json')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [expect.objectContaining({ name: '27maeul.json', type: 'application/json' })], title: '스물일곱 권의 마을 저장' })
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('공유를 취소하면 파일을 받았다고 하지 않고 다른 동작도 하지 않는다', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')) })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    expect(await downloadSaveFile(text, '27maeul.json')).toBe('cancelled')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
  })

  it('공유를 못 쓰면 다운로드 링크를 눌러 요청하고 링크·파일 주소를 정리한다', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('27maeul.json')
      expect(this.href).toBe('blob:save-file')
      expect(document.body.contains(this)).toBe(true)
    })
    expect(await downloadSaveFile(text, '27maeul.json')).toBe('downloaded')
    expect(click).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(document.querySelector('a[download]')).toBeNull()
    vi.runOnlyPendingTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:save-file')
  })

  it('다운로드가 막히면 저장 글을 복사한다', async () => {
    vi.mocked(URL.createObjectURL).mockImplementation(() => { throw new Error('unsupported') })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    expect(await downloadSaveFile(text, '27maeul.json')).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(text)
  })

  it('다운로드와 클립보드를 지원하지 않으면 복사 성공으로 끝나지 않는다', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: undefined })
    await expect(downloadSaveFile(text, '27maeul.json')).rejects.toThrow('지원하지 않는 환경')
  })

  it('클립보드 권한도 거부되면 실패를 호출자에게 전달한다', async () => {
    vi.mocked(URL.createObjectURL).mockImplementation(() => { throw new Error('unsupported') })
    const error = new DOMException('denied', 'NotAllowedError')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(error) } })
    await expect(downloadSaveFile(text, '27maeul.json')).rejects.toBe(error)
  })
})
