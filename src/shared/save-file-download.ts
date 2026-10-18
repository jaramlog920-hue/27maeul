export type SaveFileDownloadResult = 'shared' | 'downloaded' | 'copied' | 'cancelled'

/** 파일 공유 → 다운로드 요청 → 글 복사. downloaded는 브라우저가 요청을 받은 상태다. */
export async function downloadSaveFile(text: string, name: string): Promise<SaveFileDownloadResult> {
  const nav = globalThis.navigator
  try {
    if (typeof File === 'function' && typeof nav?.share === 'function' && typeof nav.canShare === 'function') {
      const file = new File([text], name, { type: 'application/json' })
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: '스물일곱 권의 마을 저장' })
        return 'shared'
      }
    }
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') return 'cancelled'
    // 파일 공유를 지원하지 않거나 실패하면 다운로드를 시도한다.
  }

  try {
    const anchor = document.createElement('a')
    if ('download' in anchor && typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      try {
        anchor.href = url
        anchor.download = name
        document.body.appendChild(anchor)
        anchor.click()
      } finally {
        anchor.remove()
        // 내려받기를 시작한 브라우저가 파일을 읽을 여유를 준다.
        setTimeout(() => URL.revokeObjectURL?.(url), 10000)
      }
      return 'downloaded'
    }
  } catch {
    // 다운로드가 막힌 환경은 마지막으로 글 복사를 시도한다.
  }

  // 선택적 호출은 지원하지 않는 환경에서도 성공으로 끝나므로 명시적으로 확인한다.
  if (typeof nav?.clipboard?.writeText !== 'function') throw new Error('저장 파일 내보내기를 지원하지 않는 환경이에요.')
  await nav.clipboard.writeText(text)
  return 'copied'
}
