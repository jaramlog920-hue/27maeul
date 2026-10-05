import { pixels } from './home-space-art'
import type { FurnitureArt } from './furniture-art'
type R=readonly [string,number,number,number,number]
const p=(r:R[],w=1,h=1)=>pixels(w,h,r)
export const EVENT_PROPS:Record<string,FurnitureArt>={
 birthdayBread:p([['k',2,10,12,4],['w',3,9,10,4],['l',4,8,8,3],['C',5,9,2,1],['C',9,9,2,1],['c',7,4,2,4],['y',7,2,2,2]]),
 birthdayBanner:p([['W',1,3,30,1],['p',3,4,5,5],['b',11,4,5,5],['y',19,4,5,5],['g',27,4,3,5]],2),
 welcomeBasket:p([['W',3,3,10,2],['W',2,5,2,9],['W',12,5,2,9],['g',4,6,4,5],['l',9,7,3,4],['w',3,11,10,3],['l',4,12,8,1]]),
 housewarmingSign:p([['W',7,8,2,7],['k',2,2,12,9],['c',3,3,10,7],['w',5,5,6,4],['r',4,4,8,2],['b',7,7,2,2]]),
 exhibitStand:p([['W',3,3,2,12],['W',11,3,2,12],['k',2,2,12,9],['c',3,3,10,7],['g',5,6,6,3],['p',6,4,3,3],['y',7,5,1,1]]),
 artworkUnfinished:p([['k',2,2,12,12],['C',3,3,10,10],['g',5,8,4,3],['s',10,3,1,7]]),
 artworkComplete:p([['k',2,2,12,12],['c',3,3,10,10],['g',5,8,6,3],['p',4,5,3,3],['y',8,4,3,3],['b',3,11,10,1]]),
 openingRibbon:p([['W',1,3,2,12],['W',29,3,2,12],['p',2,7,28,2],['p',13,5,3,5],['p',17,5,3,5],['c',16,7,1,1]],2),
 ribbonAfter:p([['W',1,3,2,12],['W',29,3,2,12],['p',2,7,11,2],['p',19,7,11,2],['p',12,9,2,3],['p',18,9,2,3]],2),
 errandParcel:p([['k',3,4,10,10],['C',4,5,8,8],['w',7,4,2,10],['w',3,8,10,1],['g',10,10,2,2]]),
 firstToy:p([['W',2,11,12,3],['w',4,9,8,2],['C',4,6,3,3],['b',10,5,2,6],['y',8,3,4,3]]),
 travelBundle:p([['k',3,6,10,8],['b',4,7,8,6],['w',7,6,2,8],['c',5,4,6,3],['p',7,5,2,2]]),
 reunionLetter:p([['k',2,4,12,9],['c',3,5,10,7],['C',4,6,8,1],['w',4,7,2,1],['w',10,7,2,1],['p',7,9,2,2]]),
 picnicCloth:p([['k',1,3,30,12],['c',2,4,28,10],['b',3,5,26,2],['b',3,11,26,2],['B',6,4,2,10],['B',22,4,2,10]],2),
 springGarland:p([['W',1,3,30,1],['g',2,4,28,2],['p',3,4,4,4],['c',12,4,4,4],['p',22,4,4,4],['y',4,5,1,1]],2),
 summerShadeDecor:p([['W',1,3,30,1],['b',4,4,5,6],['c',12,4,5,6],['b',22,4,5,6],['C',5,5,3,1],['C',23,5,3,1]],2),
 autumnHarvest:p([['W',2,9,12,5],['l',3,10,10,1],['v',3,6,4,4],['y',9,5,4,5],['g',9,4,2,2]]),
 winterLantern:p([['W',7,1,2,3],['k',4,4,8,9],['y',5,5,6,7],['c',6,6,4,4],['W',4,8,8,1],['W',7,4,1,9]]),
 feastBoard:p([['W',2,3,2,12],['W',28,3,2,12],['k',1,2,30,11],['c',2,3,28,9],['p',5,5,4,3],['b',13,5,4,3],['g',21,5,4,3]],2),
 familyMemoryFrame:p([['k',1,2,14,12],['l',2,3,12,10],['c',3,4,10,8],['g',4,10,8,1],['p',5,6,2,3],['b',9,6,2,3]]),
}
export const EVENT_LABELS:Record<string,string>={birthdayBread:'생일 빵',birthdayBanner:'생일 장식',welcomeBasket:'집들이 바구니',housewarmingSign:'집들이 표지',exhibitStand:'작품 발표 받침',artworkUnfinished:'만드는 중인 그림',artworkComplete:'완성 작품',openingRibbon:'완공 기념 리본',ribbonAfter:'마무리한 리본',errandParcel:'첫 심부름 꾸러미',firstToy:'첫 공동 장난감',travelBundle:'가족 나들이 짐',reunionLetter:'재회 편지',picnicCloth:'나들이 천',springGarland:'봄 꽃 장식',summerShadeDecor:'여름 천 장식',autumnHarvest:'가을 수확 바구니',winterLantern:'겨울 잔치 등',feastBoard:'행사 안내판',familyMemoryFrame:'가족 기억 액자'}
