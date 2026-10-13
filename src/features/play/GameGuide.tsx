import { useEffect, useRef } from 'react'
import { T } from '../../content/text'
import { neighborById } from '../../content/catalog'
import { FEATURE_RULES, type FeatureId } from '../../engine/feature-rules'
import { ZONES } from '../../engine/world'
import { useGame } from '../../store/game-store'

/** 도움말 › 열리는 때 (2026-10-14 사용자: 모든 해금 조건) — 조건은 FEATURE_RULES에서 그대로 읽는다 */
const FEATURE_NAME: Record<FeatureId, string> = {
  decorate: '집 꾸미기', mailbox: '우편함 편지', visitor: '이웃이 찾아옴', smallRequest: '작은 부탁',
  board: '사랑방 게시판 부탁', cooking: '요리', clubs: '소모임', stall: '내 좌판', community: '공동 시설 짓기',
  travel: '여행', deepRelation: '더 깊은 사이(5하트 넘게)', suitors: '연애 후보', convenience: '목수 살림·편한 거래',
  dating: '연애', library: '서고지기', guestbook: '서고 방명록', autonomy: '주민 자율 생활', spouseRoom: '배우자 방',
  events: '마을 행사', marriage: '결혼', rank: '마을별 서고 순위', spouseLife: '배우자와 생활', childRoom: '아이 방',
  childBirth: '아이', childActivities: '아이와 함께하기', school: '배움터', generations: '다음 세대', retirement: '은퇴',
  ending: '마무리',
}
const ZONE_NAME: Record<string, string> = { vineyard: '포도원', dock: '나루', hives: '벌통 들판' }
type Req = { chapters?: number; books?: number }
const reqText = (r: Req) => (r.books ? `신약 ${r.books}권` : `신약 ${r.chapters}장`)
const UNLOCKS = (Object.entries(FEATURE_RULES) as [FeatureId, { preview?: Req; full?: Req }][]).map(([id, rule]) => ({
  name: FEATURE_NAME[id],
  when: [rule.preview && `${reqText(rule.preview)} 체험`, rule.full && reqText(rule.full)].filter(Boolean).join(' · '),
}))
const PLACE_UNLOCKS = [
  ...ZONES.map((z) => ({ name: ZONE_NAME[z.id] ?? z.id, when: `${z.books}권` })),
  ...['carpenter', 'apothecary', 'fisher', 'beekeeper', 'weaver'].flatMap((id) => {
    const d = neighborById(id)
    return d?.joinsAtBooks ? [{ name: `${d.role}(${d.job}) 이사`, when: `${d.joinsAtBooks}권` }] : []
  }),
].sort((a, b) => parseInt(a.when.replace(/\D/g, '')) - parseInt(b.when.replace(/\D/g, '')))

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
      <p>화면을 누르면 그곳으로 걸어가요. 키보드는 WASD나 방향키로 걷고, <b>스페이스</b>를 누르면 바라보는 쪽의 이웃·물건을 누른 것처럼 상호작용해요. 설정의 화면 조작에서 아래 조작판이나 떠 있는 조이스틱을 고르면 그것으로도 걸을 수 있어요(마우스·터치 모두).</p>
      <h3>집 안</h3>
      <table className="guide-places" aria-label="집 안 장소 안내">
        <thead><tr><th>장소</th><th>할 수 있는 일</th><th>위치</th></tr></thead>
        <tbody>
          <tr><th scope="row">침대</th><td>잠자기, 다음 날로 넘어가기</td><td>왼쪽 위</td></tr>
          <tr><th scope="row">책상</th><td>모은 이야기 정리·기록</td><td>왼쪽 아래</td></tr>
          <tr><th scope="row">선반</th><td>말씀의 서고 칸 열기 — 꽂은 책과 나의 한 줄 (집 안에서는 메뉴 옆 [가구 배치])</td><td>오른쪽 위</td></tr>
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
      <h3>열리는 때</h3>
      <table className="guide-places" aria-label="기능이 열리는 때">
        <thead><tr><th>기능</th><th>마친 만큼</th></tr></thead>
        <tbody>
          {UNLOCKS.map((u) => <tr key={u.name}><th scope="row">{u.name}</th><td>{u.when}</td></tr>)}
        </tbody>
      </table>
      <table className="guide-places" aria-label="장소가 열리는 때">
        <thead><tr><th>장소·이웃</th><th>서고에 꽂은 책</th></tr></thead>
        <tbody>
          {PLACE_UNLOCKS.map((u) => <tr key={u.name}><th scope="row">{u.name}</th><td>{u.when}</td></tr>)}
        </tbody>
      </table>
      <div className="actions"><button data-close ref={button} onClick={close}>닫기</button></div>
    </div>
  )
}
