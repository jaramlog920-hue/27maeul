// 성경 문장이 화면에 나오는 유일한 자리 (exclusion-list §0). 출처와 번역본을 항상 붙인다.
import { versesOf } from '../../content/catalog'
import { T } from '../../content/text'

export function Passage({ refText }: { refText: string }) {
  const verses = versesOf(refText)
  return (
    <section className="passage" aria-label={`성경 본문 ${refText}`}>
      <header className="passage-ref">
        <span>{refText}</span>
        <span className="passage-src">{T.ui.bibleSource}</span>
      </header>
      <div className="passage-body">
        {verses.map((v) => (
          <p key={`${v.chapter}:${v.verse}`}>
            <sup>{v.verse}</sup>
            {v.text}
          </p>
        ))}
      </div>
    </section>
  )
}
