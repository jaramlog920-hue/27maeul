// 카드 판 줄 파일 → json (판마다): scripts/journey/ac.txt → src/content/journey.json (사도행전 여정 카드),
// scripts/journey/rev.txt → src/content/churches.json (요한계시록 일곱 교회 카드)
// 사용: node scripts/build-journey.mjs && npm run verify
import { writeFile } from 'node:fs/promises'
import { BOARDS, readBoardTxt } from './journey-parse.mjs'

for (const board of Object.values(BOARDS)) {
  const cards = await readBoardTxt(board)
  await writeFile(board.json, JSON.stringify(cards, null, 2) + '\n')
  console.log(`${board.json.pathname.split('/').pop()}: ${board.label} ${cards.length}장`)
}
