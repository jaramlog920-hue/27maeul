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
      '퀴즈 없이 바로 꽂을 수도 있어요. 그러면 책등은 맨 책으로 남아요.',
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
]
/**
 * 열리는 기능마다 한 장 (2026-10-14 사용자: 열리는 때의 기능 전부 목차에 하나씩). 코드로 확인한 것만:
 * 꾸미기 placeFurniture·canBuildWall, 우편함 receivePost, 손님 pickVisitor·VISIT_*, 작은 부탁 bonds REQUESTS·applyEarlyGrowth,
 * 게시판 copy-requests.ts, 요리 cooking.ts, 소모임 clubs.ts·plans.ts, 좌판 stall.ts, 공동 시설 projects.ts, 여행 travel.ts·trip-board.ts,
 * 연애 romance.ts·relationshipHeartCap, 살림 easier.ts·TRADES grants, 서고지기 LIBRARIAN_*, 방명록 guestMorning, 순위 rankMorning,
 * 행사 fest.ts, 결혼 canGiveCord, 집 HOME_STAGES, 배우자 family.ts, 아이 siblings.ts·family-memory.ts, 배움터 canSchool, 세대 gen-settle·gen-growth
 */
const FEATURE_TIPS: Record<FeatureId, string[]> = {
  decorate: ['1장을 마치면 작은 의자 하나로 체험해요. 5장부터는 가진 가구를 모두 집 안에 놓을 수 있어요.', '벽을 세우거나 허무는 일은 집을 한 번 넓힌 뒤에 할 수 있어요.'],
  mailbox: ['2장을 마치면 첫 편지 한 통을 받아요. 8장부터는 아침마다 편지가 문 앞 편지 바구니에 들어와요.', '편지는 편지 나르는 이웃이 나오지 않는 날에도 바구니에 들어와요. 신약 어느 책의 조각이든 와요.'],
  visitor: ['마음이 5하트 이상인 이웃이 아침 7시부터 9시 반 사이에 집 앞에 들러 선물을 건네요.', '같은 이웃은 나흘에 한 번까지 와요. 운이 높을수록 찾아올 확률이 올라요.'],
  smallRequest: ['5장을 마치면 보리 세 개를 받고, 빵 굽는 이웃의 첫 부탁을 들을 수 있어요.', '이웃마다 마음이 쌓이면 필요한 물건을 부탁해요. 들어주면 보답을 받고, 앞 부탁을 마쳐야 다음 부탁이 나와요.'],
  board: ['사랑방 게시판에 날마다 이웃 부탁이 둘씩 붙고, 3일에서 7일 동안 남아 있어요.', '부탁을 고르면 그 부탁에 어울리는 구절 몇 개가 나와요. 하나를 골라 끝까지 직접 따라 적으면 전해져요.', '보답은 닢이 아니라 마음과 그 이웃이 좋아하는 물건이에요. 가끔 희귀 재료도 함께 받아요.'],
  cooking: ['화덕에서 요리해요. 재료는 요리를 시작할 때 한 번만 쓰고, 시작한 요리는 끝까지 이어 만들 수 있어요.', '요리에 실패해도 재료를 잃지 않아요. 모양이 조금 삐뚤어질 뿐 맛과 분량은 같아요.', '식탁에 차려 이웃과 함께 먹을 수 있어요. 함께 먹은 기억은 그 자리에 있던 사람에게만 남아요.'],
  clubs: ['20장에 차 모임 하나를 체험하고, 25장부터는 소모임을 셋까지 만들 수 있어요.', '모임마다 이웃을 셋까지 부르고, 요일과 때(오전 10–12시, 오후 2–4시, 저녁 6–8시)를 정하면 그 요일마다 모여요.', '차 모임, 바느질, 텃밭, 관찰, 독서·말씀 나눔, 함께 요리하기, 함께 그림 그리기, 함께 음악하기 중에서 골라요. 모임이 열리면 함께 나온 회원끼리도 가까워져요.'],
  stall: ['장날 아침 9시부터 오후 5시까지 광장에 내 좌판을 열 수 있어요. 차리는 데 20분이 걸려요.', '하루에 손님 여섯, 판매 여섯 개, 60닢까지예요.'],
  community: ['사랑방 게시판에 공동 시설 안이 셋까지 올라와요. 관심 있는 이웃이 둘 이상 이사 와 있어야 안이 돼요.', '하나를 고르면 이웃이 하루에 하나씩 보태고, 나도 거들 수 있어요.'],
  travel: ['바닷가 항구 마을(배삯 25닢, 숙박 10닢)과 언덕 너머 마을(걸어서, 빵 둘, 숙박 8닢)로 갈 수 있어요.', '낮 12시 전에, 너무 지치지 않았을 때 떠날 수 있어요. 주사위 판을 다섯 번 굴리고, 하룻밤 묵은 뒤 다음 날 아침 집에서 깨요.', '처음 간 곳이면 그 마을과 이어진 이웃의 마음이 5점 올라요. 그 마을 가게에서 귀한 물건을 살 수 있어요.'],
  deepRelation: ['연애 후보와의 마음이 5하트를 넘어 오를 수 있어요(연애가 열리기 전까지는 7하트까지).', '다른 이웃과의 사이도 더 깊은 단계로 오를 수 있어요.'],
  suitors: ['주인공과 다른 모습의 이웃 가운데 연애할 수 있는 사람이 연애 후보가 돼요. 같은 모습이면 친구로 지내요.'],
  convenience: ['목수에게 재료 궤짝(50닢), 그을음 받이(60닢), 갈대 말리는 틀(80닢), 서늘한 찬장(70닢)을 부탁할 수 있어요. 다음 날 아침에 지어져요.', '장날에 빗물 항아리(40닢)를 사면 아침마다 물이 고여요. 비 온 다음 날은 더 많이 고여요.'],
  dating: ['마음이 8하트에 닿으면 들꽃 다발(장날 30닢)로 마음을 전할 수 있어요.', '연인과는 찻집, 호숫가 정자, 언덕 쉼터에서 하루 한 번 함께 시간을 보내요. 곳마다 처음 간 날은 사진이 남아요.', '헤어진 뒤 14일이 지나야 다시 마음을 전할 수 있어요.', '10하트는 연애 14일, 데이트 3회, 연인 이야기를 마친 뒤에 열려요.'],
  library: ['배우자나 연인, 또는 마음이 4하트 이상인 이웃(가까운 순으로 넷까지) 가운데 한 사람을 서고지기로 정할 수 있어요.', '서고지기가 있으면 방명록 손님을 대신 안내하고, 안내한 날 서고지기의 마음이 1점 올라요.'],
  guestbook: ['3일째부터 사흘에 하루꼴로 서고에 손님이 들러 방명록에 한 줄을 남겨요. 순위 업데이트 날에는 다른 마을 서기가 와요.', '오늘 온 손님에게 모아 둔 말씀 조각 하나를 함께 읽어 줄 수 있어요.'],
  autonomy: ['주민들이 스스로 만나고 사귀고 결혼하고 아이를 낳아요. 설정 › 게임에서 끌 수 있어요.', '나와 헤어진 이웃은 14일 동안 다른 주민과 사귀지 않아요.'],
  spouseRoom: ['목수에게 집 넓히기 1단계(2,500닢, 올리브 10)를 부탁하면 다음 날 아침 배우자방이 생겨요. 결혼하려면 이 방이 있어야 해요.'],
  events: ['차 모임, 집들이, 함께 만든 것 보여 주기 같은 작은 행사를 직접 준비해 이웃을 초대해요.'],
  marriage: ['연인이 된 지 7일이 지나고, 마음이 10하트이고, 배우자방이 있으면 약속의 끈(장날 150닢)을 건넬 수 있어요.', '약속의 끈을 건네면 약혼하고, 다음 장날 저녁 광장에서 마을 잔치로 결혼해요.'],
  rank: ['계절마다 1일과 21일 아침에 스무 마을의 서고 순위가 바뀌어요.', '1위는 장식과 조각 둘, 2·3위는 조각 하나를 받아요.'],
  spouseLife: ['배우자는 아침에 처음 말을 걸면 작은 선물을 챙겨 줘요.', '저녁 7시부터 9시 반 사이, 날에 따라 배우자와 저녁을 함께 먹어요. 배고픔이 가시고 마음이 3점 올라요.'],
  childRoom: ['집 넓히기 2단계(4,000닢, 파피루스 10)로 아이방이 생겨요. 아이는 아이방이 있어야 와요.', '3단계(6,000닢, 올리브 15, 파피루스 10)로 생활방까지 넓힐 수 있어요.'],
  childBirth: ['결혼하고 아이방이 있으면 잠자리에서 아이를 갖자고 얘기할 수 있어요. 자고 나면 다음 날 아침 아기가 와요.', '아이는 셋까지예요. 막내가 어린이로 자라면 다음 아이를 가질 수 있어요.'],
  childActivities: ['아이가 자라면 책상에 앉을 때 가끔 옆에 앉고 싶어 해요. 함께 있으면 곁에서 그림을 그리다 잠들어요.', '배우자와 함께하는 가족 활동이 열려요.'],
  school: ['오후 6시 전에 15닢을 내고 아이를 배움터에 맡길 수 있어요. 하루 한 번이에요.', '맡길 때 고른 능력치로 아이가 배우고, 오후 6시에 돌아와요.'],
  generations: ['주민의 아이들이 자라 어른이 되고, 부모 곁에서 일을 배워요.'],
  retirement: ['나이 든 주민이 은퇴하면 자녀가 그 자리를 이어받아요.', "설정 › 게임의 '주민 나이'를 '그대로'로 두면 아무도 은퇴하지 않아요. 아이는 어른까지 자라요."],
  ending: ['신약 스물일곱 권을 모두 서고에 꽂으면 마을에서 스물일곱 권 잔치가 열리고 새 터가 열려요.'],
}
const FEATURE_CHAPTERS = (Object.keys(FEATURE_RULES) as FeatureId[]).map((id) => ({ id, title: FEATURE_NAME[id], when: UNLOCKS.find((u) => u.name === FEATURE_NAME[id])?.when ?? '', tips: FEATURE_TIPS[id] }))
const ALL_CHAPTERS: { title: string; when?: string; tips: string[] }[] = [...CHAPTERS, ...FEATURE_CHAPTERS]
const UNLOCK_PAGE = ALL_CHAPTERS.length + 1

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
  const chapter = page >= 1 && page <= ALL_CHAPTERS.length ? ALL_CHAPTERS[page - 1] : null
  return (
    <div className="dialog game-guide guide-book" role="dialog" aria-modal="true" aria-label="도움말"
      onKeyDown={event => { if (event.key === 'Escape') close() }}>
      <h2>도움말</h2>
      {page === 0 && (
        <nav aria-label="목차">
          <p className="hint">게임 내용은 계속 업데이트 중이에요. 가끔 설정 › 기록에서 현재 버전과 최신 버전을 비교해 보고, 다르면 업데이트 받기를 눌러 주세요. 새 내용이 들어오면 이 도움말도 함께 바뀌어요.</p>
          <h3>목차</h3>
          <h4 className="guide-toc-part">기본</h4>
          <ol className="guide-toc">
            {CHAPTERS.map((c, i) => (
              <li key={c.title}><button className="row" onClick={() => setPage(i + 1)}><span className="row-main"><b>{c.title}</b></span></button></li>
            ))}
          </ol>
          <h4 className="guide-toc-part">열리는 기능</h4>
          <ol className="guide-toc">
            {FEATURE_CHAPTERS.map((c, i) => (
              <li key={c.id}><button className="row" onClick={() => setPage(CHAPTERS.length + i + 1)}><span className="row-main"><b>{c.title}</b><small>{c.when}</small></span></button></li>
            ))}
            <li><button className="row" onClick={() => setPage(UNLOCK_PAGE)}><span className="row-main"><b>열리는 때</b><small>한눈에 보기</small></span></button></li>
          </ol>
        </nav>
      )}
      {chapter && (
        <section aria-label={chapter.title}>
          <h3>{chapter.title}</h3>
          {chapter.when && <p className="hint">{chapter.when}에 열려요</p>}
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
