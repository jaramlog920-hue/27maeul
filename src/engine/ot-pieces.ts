// 구약 말씀 조각 (2026-10-07 사용자 요청): 장 하나가 조각 하나 — 39권 929개. 이름은 "창세기 1장"처럼 책 이름+장이다 (제목을 짓지 않는다).
// 조각 목록은 OT_BOOK_TABLE에서 코드로 만든다 — 본문 파일을 부르지 않는다 (성경 본문은 Passage에만).
// 신약 조각(collected·drawFragment)과 섞지 않는다: 모은 구약 조각은 따로 otCollected에 담기고, 신약 무작위 뽑기에는 들어가지 않는다.
// 구약 조각은 구약 필사의 조건도 보상도 아니다 — 모으는 수집품일 뿐이다.
import { mulberry32 } from './offers'
import { OT_BOOK_TABLE } from './ot-books'

export interface OtPiece {
  id: string
  book: string
  chapter: number
  /** "창세기 1장" */
  name: string
}

/** 조각 id: 'ot:gen:1' (신약 조각 id와 겹치지 않는다) */
export const otPieceId = (book: string, chapter: number): string => `ot:${book}:${chapter}`

export const OT_PIECES: readonly OtPiece[] = OT_BOOK_TABLE.flatMap((r) =>
  Array.from({ length: r.chapters }, (_, i) => ({ id: otPieceId(r.id, i + 1), book: r.id, chapter: i + 1, name: `${r.name} ${i + 1}장` })),
)

export const OT_PIECE_COUNT = OT_PIECES.length

const OT_PIECE_BY_ID: ReadonlyMap<string, OtPiece> = new Map(OT_PIECES.map((p) => [p.id, p]))

export const isOtPieceId = (id: unknown): id is string => typeof id === 'string' && OT_PIECE_BY_ID.has(id)
export const otPieceById = (id: string): OtPiece | undefined => OT_PIECE_BY_ID.get(id)

/** 하루에 한 번 받는 날 표식 (flags의 칸 이름) — 값은 받은 날 */
export const OT_PIECE_DAY_FLAG = 'otPieceDay'

/** 날 씨앗: 같은 날·같은 모은 조각이면 늘 같은 조각 (불러와도 같다) */
export const otPieceSeed = (day: number): number => day * 6151 + 29

/** 아직 없는 구약 조각 중 무작위 하나 (날 씨앗). 다 모았으면 null */
export function drawOtPiece(collected: readonly string[], day: number): string | null {
  const got = new Set(collected)
  const left = OT_PIECES.filter((p) => !got.has(p.id))
  if (!left.length) return null
  return left[Math.min(left.length - 1, Math.floor(mulberry32(otPieceSeed(day))() * left.length))].id
}

/** 저장 정리: 모르는 id·중복은 버린다. 배열이 아니면(옛 저장) 빈 배열 */
export function sanitizeOtCollected(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter(isOtPieceId))]
}
