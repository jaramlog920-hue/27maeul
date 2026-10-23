// 필사 본문 묶음의 모양 (catalog·ot-catalog가 만든다). 예전 편지 옮겨 적기의 빈칸 계산은 없앴다 — 장은 필사로만 마친다 (계획 14)
import type { QuizSource } from './quiz'

/** 필사가 읽는 본문: 한 책 안 (quizSourceFor([book]) + 장 조각의 참조들) */
export interface CopySource extends QuizSource {
  /** 본문에 든 모든 책(그 책만이 아니라)에서 이 문장을 가진 절의 수 — 틀린 보기로 채운 절이 어디에도 없어야 한다 */
  countAnywhere: (text: string) => number
  /** 그 책의 장 참조 (장 조각의 ref, 장 번호 순서) */
  chapters: readonly { chapter: number; ref: string }[]
}
