// scripts/journey/ac.txt → src/content/journey.json (사도행전 여정 카드)
// 사용: node scripts/build-journey.mjs && npm run verify
import { writeFile } from 'node:fs/promises'
import { JOURNEY_JSON, readJourneyTxt } from './journey-parse.mjs'

const cards = await readJourneyTxt()
await writeFile(JOURNEY_JSON, JSON.stringify(cards, null, 2) + '\n')
console.log(`journey.json: 카드 ${cards.length}장`)
