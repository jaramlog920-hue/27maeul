// 계획 20 2부: 주민끼리 호감도·연애·결혼·출생의 숫자 모음 (결정 D28–D34, 2부 계획 P1–P14). 바꿀 일이 생기면 이 파일만 고친다.
// 기간은 게임 날, 한 계절 = 40일. 호감도는 0–100 (10점 = 하트 하나, 플레이어 마음과 같은 눈금).

/** 처음 만들 때 이미 설정상 친한 쌍(양쪽에 함께하는 일과·집안 관계)의 호감도 (P1) */
export const START_CLOSE = 30

/** 단계 문턱 (D30·P6) */
export const FRIEND_AT = 30
export const LOVER_AT = 60
export const CONSULT_AT = 80
/** 연인이 된 뒤 이만큼 지나야 상담을 꺼낸다 */
export const CONSULT_AFTER = 14
/** 연인 사이 호감도가 이 아래로 내려가면 다음 아침 헤어진다 */
export const BREAKUP_BELOW = 40
/** 헤어진 뒤 이만큼은 그 둘의 만남이 담담하다 (하트·화남 없음) */
export const BREAKUP_QUIET = 7
/** 결혼 뒤 호감도는 이 아래로 내려가지 않는다 */
export const SPOUSE_FLOOR = 50

/** 마을 전체 동시 연인 쌍 상한, 결혼 준비 동시 상한 (P6) */
export const MAX_LOVERS = 4
export const MAX_PREPARING = 1

/** 상담 (P8): 하루 한 질문, 이만큼 물어 응원이 CONSULT_CHEER 이상이면 결혼 준비. 아니면 CONSULT_RETRY일 뒤 다시 */
export const CONSULT_QUESTIONS = 3
export const CONSULT_CHEER = 2
export const CONSULT_RETRY = 14
/** 상담에 오지 않을 때 재촉 근황 간격 */
export const CONSULT_NUDGE = 3

/** 결혼 준비 기간 (P9) — 준비가 시작된 날 + 이만큼이 결혼식 날 */
export const WEDDING_DAYS = 7

/** 아기 침대 부탁 (P10): 결혼한 날 호감도보다 이만큼 오르면. 결혼한 날 값이 CRIB_HIGH 이상이면 결혼 뒤 CRIB_WAIT_HIGH일 */
export const CRIB_GAIN = 15
export const CRIB_HIGH = 86
export const CRIB_WAIT_HIGH = 14
/** 침대를 안 건넸을 때 다시 말하는 간격 (한 번만) */
export const CRIB_REASK = 5
/** 건넨 날부터 출생까지 */
export const BIRTH_AFTER_CRIB = 28
/** 둘째: 첫 아이 뒤 이만큼 지나고 오늘 호감도 ≥ 첫 출생 날 값 + SECOND_GAIN */
export const BIRTH_GAP = 56
export const SECOND_GAIN = 10

/** 가족당 자녀 최대, 마을의 생성 주민 최대 — 고정 주민과 플레이어 가족은 세지 않는다 */
export const MAX_CHILDREN = 2
export const MAX_GENERATED = 8

/** 같은 사람의 두 큰 전환 사이 최소 공백(일) */
export const MIN_GAP = 1

/** 성장 단계가 시작되는 나이(태어난 뒤 날수) — 플레이어 아이와 같은 길이 (child.ts) */
// 생성 주민도 성인 이후 네 계절(160일)을 지내면 노년으로 이어진다.
export const STAGE_AT = { baby: 0, child: 14, teen: 42, adult: 84, elder: 244 } as const

/** 밀린 날을 처리하는 최대 일수 (D18) */
export const MAX_CATCHUP = 7
/** 플레이어와 헤어진 사람이 다른 주민과 사귀지 않는 날 수 (game.ts BREAKUP_COOLING과 같다) */
export const PLAYER_COOLING = 14

/** 만남 (P2): 같은 쌍 하루 최대, 두 만남 사이 최소 분 */
export const MEETS_PER_DAY = 3
export const MEET_GAP_MIN = 30

/** 참여 대상 중 부모 세대 (작업 9 표의 참여 가능 2명). 짝은 같은 세대끼리만 — 젊은 후보 13명과는 짝이 되지 않는다 */
export const ELDER_PAIR = ['carpenter', 'smith'] as const

/** 변하지 않는 난수 씨앗을 못 구할 때의 값 (깨진 저장 복구용) */
export const FALLBACK_SEED = 20261007
