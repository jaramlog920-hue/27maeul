// 대한성서공회 개역한글의 소제목·괄호 안 관련 본문을 원문 그대로 수집한다.
// 본문은 다시 배포하지 않고, 소제목과 시작 절 및 출처 URL만 보관한다.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
const books = { mt: ['mat', 28], mk: ['mrk', 16], lk: ['luk', 24], jn: ['jhn', 21], ac: ['act', 28] }
const cache = new URL('../../output/krv-heading-source/', import.meta.url)
await mkdir(cache, { recursive: true })
const result = []
for (const [book, [code, count]] of Object.entries(books)) {
  for (let chapter = 1; chapter <= count; chapter++) {
    const filename = new URL(`${code}${String(chapter).padStart(3, '0')}.html`, cache)
    const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?linkBible=BHAN${code}${String(chapter).padStart(3, '0')}001`
    let html
    try { html = await readFile(filename, 'utf8') } catch {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${book} ${chapter}: HTTP ${response.status}`)
      html = await response.text()
      await writeFile(filename, html)
    }
    const headings = [...html.matchAll(/<font\s+class=["']smallTitle["']>([\s\S]*?)<\/font>([\s\S]*?)(?=<font\s+class=["']smallTitle["']>|$)/g)].map(m => {
      const plain = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
      const verse = m[2].match(/<span\s+class=["']number["']>(\d+)/)
      const previous = [...html.slice(0, m.index).matchAll(/class=["']number["']>(\d+)/g)].at(-1)
      const beforeNumber = m[2].slice(0, verse?.index ?? m[2].indexOf('</span>')).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim()
      // 일부 소제목은 절 중간에 있다(눅 23:56). 절 전체를 보존하며 그 절부터 구분한다.
      const startVerse = beforeNumber && previous ? previous[1] : verse?.[1]
      if (!startVerse) throw new Error(`${book} ${chapter}: 소제목 시작 절 없음`)
      const related = [...m[1].matchAll(/<a\s+TAR=["']BHAN([a-z]{3})(\d{3})(\d{3})["']>([\s\S]*?)<\/a>/gi)].map(link => ({ book: link[1], chapter: Number(link[2]), verse: Number(link[3]), label: link[4].replace(/<[^>]+>/g, '').trim() }))
      const title = plain.replace(/\s*\([^()]*\)/g, '').trim()
      return { book, chapter, verse: Number(startVerse), title, related, source: url }
    })
    if (!html.includes('개역한글') || !html.includes('class="chapNum"') || !html.includes('class="number"')) throw new Error(`${book} ${chapter}: 성경 페이지 형식 변경`)
    result.push(...headings)
  }
  console.log(`${book}: ${result.filter(r => r.book === book).length} 소제목`)
}
await writeFile(new URL('data/krv-headings.json', import.meta.url), JSON.stringify({ edition: '대한성서공회 개역한글', retrieved: '2026-10-08', headings: result }, null, 2) + '\n')
console.log(`전체 ${result.length} 소제목 저장`)
