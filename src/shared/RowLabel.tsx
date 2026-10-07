// 목록 줄 글: "이름 (재료·설명)"을 굵은 이름과 아래 작은 줄로 나눈다 (서고 목록 모양, 2026-10-07)
export function RowLabel({ text }: { text: string }) {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(text)
  if (!m) return <>{text}</>
  return (
    <span className="row-main">
      <b>{m[1]}</b>
      <small>{m[2]}</small>
    </span>
  )
}
