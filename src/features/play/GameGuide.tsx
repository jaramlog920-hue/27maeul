import { useEffect, useRef } from 'react'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function GameGuide() {
  const close = useGame(s => s.closeModal)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    button.current?.focus()
    return () => { if (previous instanceof HTMLElement) previous.focus() }
  }, [])
  return (
    <div className="dialog game-guide" role="dialog" aria-modal="true" aria-label="도움말"
      onKeyDown={event => {
        if (event.key === 'Escape') close()
        if (event.key === 'Tab') { event.preventDefault(); button.current?.focus() }
      }}>
      <h2>도움말</h2>
      <h3>이야기 엮기</h3>
      <ol className="guide-flow">
        {T.ui.guide.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <h3>움직이기</h3>
      <p>화면을 누르면 그곳으로 걸어가요. 키보드는 WASD나 방향키로 걷고, <b>스페이스</b>를 누르면 바라보는 쪽의 이웃·물건을 누른 것처럼 상호작용해요. 터치 화면에서는 설정에서 조이스틱을 켜면 조이스틱으로도 걸을 수 있어요.</p>
      <h3>집 안</h3>
      <table className="guide-places" aria-label="집 안 장소 안내">
        <thead><tr><th>장소</th><th>할 수 있는 일</th><th>위치</th></tr></thead>
        <tbody>
          <tr><th scope="row">침대</th><td>잠자기, 다음 날로 넘어가기</td><td>왼쪽 위</td></tr>
          <tr><th scope="row">책상</th><td>모은 이야기 정리·기록</td><td>왼쪽 아래</td></tr>
          <tr><th scope="row">선반</th><td>📖 말씀의 서고 칸 열기 — 꽂은 책과 나의 한 줄 (집 안에서는 메뉴 옆 [집 꾸미기])</td><td>오른쪽 위</td></tr>
          <tr><th scope="row">작업대</th><td>파피루스·잉크·담요 만들기</td><td>오른쪽 아래</td></tr>
          <tr><th scope="row">벽난로</th><td>불 쬐기, 음식 먹기, 빵 굽기</td><td>위쪽 가운데</td></tr>
        </tbody>
      </table>
      <h3>마을</h3>
      <p className="hint">위치는 전체 지도 기준이에요.</p>
      <table className="guide-places" aria-label="마을 장소 안내">
        <thead><tr><th>장소</th><th>할 수 있는 일</th><th>위치</th></tr></thead>
        <tbody>
          <tr><th scope="row">우물</th><td>물 긷기</td><td>내 집 오른쪽, 언덕 아래</td></tr>
          <tr><th scope="row">벤치</th><td>앉아서 성경구절 읽기 — 읽을 때마다 피로 30 회복</td><td>위쪽 언덕 / 장터 오른쪽</td></tr>
          <tr><th scope="row">갈대</th><td>갈대 채집</td><td>오른쪽 끝 강가, 나루 아래</td></tr>
          <tr><th scope="row">보리밭</th><td>보리 수확</td><td>아래쪽 가운데</td></tr>
          <tr><th scope="row">올리브나무</th><td>올리브 채집</td><td>오른쪽 아래, 기름틀 아래</td></tr>
          <tr><th scope="row">포도나무</th><td>익은 포도 수확</td><td>오른쪽 위, 할아버지 집 아래</td></tr>
          <tr><th scope="row">기름틀</th><td>올리브로 기름 만들기</td><td>오른쪽 아래</td></tr>
          <tr><th scope="row">장터</th><td>장날에 상인과 거래</td><td>마을 가운데</td></tr>
        </tbody>
      </table>
      <div className="actions"><button ref={button} onClick={close}>닫기</button></div>
    </div>
  )
}
