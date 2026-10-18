import { useEffect, useState, type ReactNode } from 'react'
import { getGameStorageStatus, initializeGameStorage } from '../engine/game-storage'

/** 저장을 읽기 전에 빈 새 게임이 먼저 그려지거나 옛 백업으로 되돌아가지 않게 한다. */
export function StorageGate({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  useEffect(() => {
    let live = true
    initializeGameStorage().then(
      () => { if (live) setState('ready') },
      () => { if (live) setState('failed') },
    )
    return () => { live = false }
  }, [attempt])
  if (state === 'ready') return children
  if (state === 'loading') return <main className="intro"><p role="status">저장된 마을을 확인하는 중이에요. 처음에는 기존 기록과 사진을 옮겨요.</p></main>
  const status = getGameStorageStatus()
  return <main className="intro">
    <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="storage-start-title">
      <h1 id="storage-start-title">{status.quota ? '저장 공간이 부족해요' : '저장된 마을을 열지 못했어요'}</h1>
      <p>{status.quota ? '기존 기록을 새 저장소로 옮길 공간이 모자라요. 불필요한 파일이나 앱을 정리한 뒤 다시 시도해 주세요.' : '다른 탭에서 27마을을 열었다면 그 탭을 닫고, 브라우저의 사이트 저장 허용 설정을 확인한 뒤 다시 시도해 주세요.'}</p>
      <p>기존 기록을 임의로 지우거나 빈 기록으로 덮어쓰지 않았어요. 브라우저의 ‘사이트 데이터 삭제’는 하지 마세요. 27마을 기록도 지워질 수 있어요.</p>
      <button onClick={() => { setState('loading'); setAttempt(n => n + 1) }}>다시 시도</button>
    </div>
  </main>
}
