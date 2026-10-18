import { writeFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { CONTENT } from '../../src/content/catalog'
import { newGame, copyPay, rankDonation } from '../../src/engine/game'
import { libraryPay } from '../../src/engine/progression'
import { letterPay } from '../../src/engine/requests'
import { WORK_PAY } from '../../src/engine/work-day'
import { finishBlankQuiz } from '../../src/engine/blank-quiz'

describe('후반 구매력 실제 함수 계산', () => {
  it('수입 배율과 제한 없는 퀴즈 구매 횟수를 계산한다', () => {
    const tiers = [0, 10, 27, 40, 65, 66].map(books => ({
      books, multiplier: 1 + books * .03,
      first20VerseChapter: libraryPay(copyPay(20, 1), books),
      first30VerseChapter: libraryPay(copyPay(30, 1), books),
      first36PlusVerseChapter: libraryPay(copyPay(36, 1), books),
      perfectSeniorLetter: libraryPay(letterPay(0, 3), books),
      workDay: libraryPay(WORK_PAY, books),
    }))
    let s = newGame(CONTENT)
    const beforeMinute = s.clock.minute
    for (let i = 0; i < 167; i++) s = finishBlankQuiz(s, 5, 5)
    expect(s.coins).toBe(10020)
    expect(s.clock.minute).toBe(beforeMinute)
    expect(s.flags.blankQuizRounds).toBe(167)
    const targets = [90, 180, 220, 2500, 4000, 6000, 8000, 5000, 10000, 12500].map(price => ({price, perfectQuizRounds: Math.ceil(price / 60)}))
    const report = {tiers, targets, quiz167Rounds: {coins:s.coins, elapsedGameMinutes:s.clock.minute-beforeMinute}, rankFirstPrize:rankDonation(1), notes:['필사 금액은 해당 장 최초 완성만 지급. 66권 수치는 새 장이 남지 않아 이론상 배율만 표시.', '퀴즈 167판은 함수 반복 계산이며 사용자 풀이 시간은 측정하지 않음.', '편지는 최고 직업·무오답 기준. 일 돕기와 편지는 각각 하루 한 번.', '현재 게시판 UI는 닢 납품이 아닌 선물 보상의 부탁 필사를 사용한다.']}
    writeFileSync('artifacts/scenery/late-purchasing-power-20261017.json', JSON.stringify(report,null,2))
    console.log(JSON.stringify(report))
  })
})
