import { useEffect, useRef, useState } from 'react'
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

/**
 * 도움말 책 (2026-10-14 사용자: 뻔한 설명 대신 꿀팁만, 목차와 넘김 단추로 책처럼, 마지막은 열리는 때).
 * 모든 숫자·규칙은 코드에서 확인한 것만 적는다 — 규칙을 바꾸면 여기도 함께 고친다:
 * 필사 verseMinutes·CARE_TYPOS·copyPay/libraryPay·SEASON_COPY_FROM/TO, 서고 library.ts, 벤치 READ_REST·READ_MINUTES,
 * 잠 sleepNeeds·fallsSick(LIMIT), 장날 isMarketDay, 잔치 festivalOf, 마음 GAIN·DAILY_HEART_CAP·BIRTHDAY_MUL·HALL_*,
 * 능력치 stats.ts, 새 터 newland.ts·newland-sites.ts(BUILD_DAYS_*·REFUND_*·DECOR_REFUND)·setCompanionStay, 연애 heart-balance-text.json
 */
const CHAPTERS: { title: string; tips: string[] }[] = [
  {
    title: '필사',
    tips: [
      '한 절을 마칠 때마다 시간이 5분 흘러요. 낱말 조각 퍼즐로 마친 절은 3분이에요.',
      '피로는 쓰는 동안이 아니라 장을 마칠 때 한 번에 붙어요. 퍼즐로 마친 절이 많을수록 덜 붙어요.',
      '한 장을 퍼즐 없이 모두 직접 쓰고 틀린 글자가 둘 이하면 그 장에 정성 도장을 받아요.',
      '처음 마친 장에는 필사 삯을 받아요. 절이 많은 장일수록 많고, 서고에 꽂은 책이 늘수록 더 올라요.',
      '계절마다 15일부터 21일 사이에 장을 마치면, 그 계절에 한 번 계절 장식을 받아요.',
    ],
  },
  {
    title: '서고와 다시 읽기',
    tips: [
      '퀴즈 없이 바로 꽂아도 불이익은 없어요. 책등이 맨 책으로 남을 뿐이에요.',
      '퀴즈를 풀고 꽂으면 맞힌 만큼 책등에 은박이나 금박이 입혀져요. 틀린 구절은 다시 읽을 구절로 돌아와요.',
      '잠들기 전에 읽을 구절을 고르면 다시 읽을 구절이 가장 먼저 나와요. 읽고 자면 목록에서 빠져요.',
      '벤치와 언덕 쉼터에서 모아 둔 구절을 읽으면 피로가 30 풀려요. 읽는 데 20분이 걸려요.',
    ],
  },
  {
    title: '하루와 몸',
    tips: [
      '새벽 1시가 넘어서 자면 다음 날 피로가 30 남은 채로 일어나요.',
      '배고픔이나 피로가 가득 찬 채로 잠들면 다음 날 앓아누워 오전 10시에 일어나요.',
      '장날은 7일마다 돌아와요(7일째, 14일째…).',
      '계절 잔치: 봄 20일 꽃 잔치, 여름 25일 보리 잔치, 가을 30일 포도 잔치, 겨울 20일 화롯가 잔치.',
      '빠른 시계(장날 5,000닢)가 있으면 시각 옆 단추로 하루를 1배·2배·3배로 흐르게 해요. 시간과 내 걸음, 이웃 걸음이 함께 빨라져요.',
      '시각 맞춤 시계(장날 10,000닢)는 가방에서 다음 정시부터 새벽 2시 사이의 시각을 골라 넘어가요. 지난 시각으로는 되돌릴 수 없어요.',
      '어딘가에 끼었으면 설정 › 도움의 비상 탈출로 집 앞(새 터에서는 왕래 표식 앞)으로 나와요. 따라오던 동물 친구도 함께 와요.',
    ],
  },
  {
    title: '이웃과 마음',
    tips: [
      '일상 교류로 오르는 마음은 이웃마다 하루 6점까지예요. 한 이웃과 채워도 다른 이웃과는 더 오를 수 있어요.',
      '한 번에 오르는 기본 크기: 이야기 1, 돕기 2, 함께 일하기 끝까지 3, 좋아하는 선물 3, 그냥 선물 1, 저녁 4, 부탁 6.',
      '선물은 이웃마다 하루 한 번이에요. 싫어하는 것을 건네면 마음이 오르지 않아요.',
      '생일에 건넨 선물은 마음이 두 배로 오르고, 하루 6점 제한도 받지 않아요.',
      '사랑방은 저녁 6시부터 8시 반까지 열려요. 하루 한 번 함께 놀면 같이 논 이웃마다 마음이 3점 올라요.',
    ],
  },
  {
    title: '능력치',
    tips: [
      '근력: 단계마다 일할 때 피로가 6%씩 덜 쌓여요.',
      '손재주(만들기)·근력(모으기): 단계마다 4%씩 하나 더 생길 수 있어요. 운도 단계마다 3%씩 보태요.',
      '매력: 3단계부터 이웃마다 하루 한 번 마음이 1점 더, 5단계면 2점 더 올라요. 3단계부터는 장날 파는 값도 1닢 더 받아요.',
      '지능: 3단계면 장 기록 퀴즈의 틀린 보기 하나가 흐리게, 5단계면 둘이 흐리게 보여요.',
      '운: 일로는 오르지 않아요. 맑은 밤 별 보기나 마을 잔치 같은 날에 조금씩 올라요.',
      '운: 단계마다 이웃이 찾아와 선물할 확률이 5%씩 올라요.',
    ],
  },
  {
    title: '새 터와 구약',
    tips: [
      '신약 스물일곱 권을 모두 서고에 꽂으면 새 터가 열려요. 마을과 새 터는 왕래 표식으로 오가요.',
      '새 터의 작은 구약 서고 책상에서 구약 서른아홉 권을 신약과 같은 방식으로 이어 써요. 시간과 피로도 신약과 같아요.',
      '건물은 주문한 다음 날 아침 공사를 시작해 그다음 날 아침에 다 지어져요.',
      '공사를 시작하기 전에 취소하면 값을 모두, 공사 중이면 절반을 돌려받아요. 다 지은 뒤 허물면 닢만 절반 돌아와요.',
      '길과 정원 칸은 걷어 내면 값이 모두 돌아오고, 꾸미기는 절반이 돌아와요.',
      '새 터에는 침대가 없어요. 새 터에서 잠들면 첫 마을 내 집 침대에서 깨요.',
      '동물 친구는 새 터에 따라가지 않고 첫 마을에서 기다려요.',
      '구약 서고 열쇠(장날 8,000닢)를 가방에서 쓰면 어디서든 곧장 구약 서고 안으로 가요. 새 터가 열린 뒤, 아침 6시부터 밤 9시 반 사이에 쓸 수 있어요.',
    ],
  },
  {
    title: '연애',
    tips: [
      '마음이 8하트에 닿으면 들꽃 다발로 마음을 전할 수 있어요.',
      '헤어진 뒤 14일이 지나야 다시 마음을 전할 수 있어요.',
      '10하트는 연애 14일, 데이트 3회, 연인 이야기를 마친 뒤에 열려요.',
    ],
  },
]
const UNLOCK_PAGE = CHAPTERS.length + 1

export function GameGuide() {
  const close = useGame(s => s.closeModal)
  const button = useRef<HTMLButtonElement>(null)
  // 0 목차, 1.. 장, 마지막 열리는 때
  const [page, setPage] = useState(0)
  useEffect(() => {
    const previous = document.activeElement
    button.current?.focus()
    return () => { if (previous instanceof HTMLElement) previous.focus() }
  }, [])
  const chapter = page >= 1 && page <= CHAPTERS.length ? CHAPTERS[page - 1] : null
  return (
    <div className="dialog game-guide guide-book" role="dialog" aria-modal="true" aria-label="도움말"
      onKeyDown={event => { if (event.key === 'Escape') close() }}>
      <h2>도움말</h2>
      {page === 0 && (
        <nav aria-label="목차">
          <p className="hint">게임 내용은 계속 업데이트 중이에요. 새 내용이 들어오면 이 도움말도 함께 바뀌어요.</p>
          <h3>목차</h3>
          <ol className="guide-toc">
            {[...CHAPTERS.map(c => c.title), '열리는 때'].map((title, i) => (
              <li key={title}><button className="row" onClick={() => setPage(i + 1)}><span className="row-main"><b>{title}</b></span></button></li>
            ))}
          </ol>
        </nav>
      )}
      {chapter && (
        <section aria-label={chapter.title}>
          <h3>{chapter.title}</h3>
          <ul className="guide-tips">
            {chapter.tips.map(tip => <li key={tip}>{tip}</li>)}
          </ul>
        </section>
      )}
      {page === UNLOCK_PAGE && (
        <section aria-label="열리는 때">
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
        </section>
      )}
      <div className="guide-turn">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>‹ 앞</button>
        <button onClick={() => setPage(0)} disabled={page === 0}>목차</button>
        <span className="guide-page">{page === 0 ? '목차' : `${page} / ${UNLOCK_PAGE}`}</span>
        <button disabled={page === UNLOCK_PAGE} onClick={() => setPage(page + 1)}>뒤 ›</button>
      </div>
      <div className="actions"><button data-close ref={button} onClick={close}>닫기</button></div>
    </div>
  )
}
