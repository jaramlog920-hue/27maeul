// 책 본문을 불러오기 전에 조각 분위기를 물으면 빈 목록이지만, 불러온 뒤에는 제대로 따진다 (2026-10-18 감사, Codex UI-06 — 빈 목록이 영구히 기억됐다)
it('본문을 불러온 뒤 다시 물으면 실제 분위기가 나온다', async () => {
  // setupTests가 모든 책을 미리 불러오므로, 새로 접속한 것처럼 모듈을 새로 읽는다
  vi.resetModules()
  const catalog = await import('./catalog')
  const loader = await import('./nt-loader')
  const moods = await import('./piece-moods')
  const id = 'php-004'
  expect(loader.ntLoaded('php')).toBe(false)
  expect(moods.pieceFacts([], id).moods).toEqual([])
  await loader.ensureNtBook('php')
  const actual = moods.moodsOfText(catalog.versesOf(catalog.pieceById(id).ref).map((v) => v.text).join(' '))
  expect(actual.length).toBeGreaterThan(0)
  expect(moods.pieceFacts([], id).moods).toEqual(actual)
}, 120000)
