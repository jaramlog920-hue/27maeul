// 이웃 이야기 장면의 동작 (행사 동작 이름: render/event-life-motion EVENT_ACTIONS)
// 덧붙인 사건은 직접 정하고, 원래 사건은 장면 글을 보고 고른다
export const ACTIONS = new Set(['clap', 'blowCandle', 'shareFood', 'carryParcel', 'hangDecor', 'dance', 'smile', 'nod', 'taste', 'holdBaby', 'walkHand', 'spreadCloth', 'placePlate', 'clearDecor', 'unwrapGift', 'unveil', 'useGift', 'pourTea', 'sipTea', 'stitch', 'showWork', 'point', 'takeNote', 'plant', 'waterPlants', 'greet', 'offerGift', 'receiveGift', 'inspectWork', 'wipeTable'])

const m = (npc, player) => ({ npc, player })
// 덧붙인 사건 (romance-more.mjs의 love1·love2·home1·home2 순서)
export const NEW_MOTIONS = {
  wendell: [m('shareFood', 'taste'), m('nod', 'smile'), m('offerGift', 'receiveGift'), m('smile', 'nod')],
  cosmo: [m('offerGift', 'receiveGift'), m('takeNote', 'nod'), m('hangDecor', 'smile'), m('smile', 'nod')],
  rudy: [m('showWork', 'inspectWork'), m('inspectWork', 'smile'), m('hangDecor', 'nod'), m('offerGift', 'receiveGift')],
  dexter: [m('point', 'point'), m('showWork', 'inspectWork'), m('smile', 'clap'), m('spreadCloth', 'smile')],
  basil: [m('showWork', 'inspectWork'), m('nod', 'nod'), m('placePlate', 'inspectWork'), m('nod', 'smile')],
  marigold: [m('offerGift', 'takeNote'), m('nod', 'smile'), m('plant', 'waterPlants'), m('showWork', 'nod')],
  penelope: [m('showWork', 'inspectWork'), m('shareFood', 'taste'), m('spreadCloth', 'nod'), m('inspectWork', 'nod')],
  tilly: [m('smile', 'smile'), m('nod', 'greet'), m('hangDecor', 'clap'), m('smile', 'nod')],
  juniper: [m('showWork', 'inspectWork'), m('dance', 'dance'), m('point', 'nod'), m('taste', 'taste')],
  poppy: [m('pourTea', 'sipTea'), m('nod', 'smile'), m('pourTea', 'sipTea'), m('smile', 'nod')],
  merchant: [m('showWork', 'inspectWork'), m('greet', 'greet'), m('point', 'nod'), m('placePlate', 'smile')],
  presser: [m('point', 'nod'), m('pourTea', 'sipTea'), m('inspectWork', 'nod'), m('smile', 'nod')],
  postman: [m('point', 'nod'), m('stitch', 'inspectWork'), m('hangDecor', 'nod'), m('offerGift', 'receiveGift')],
}

// 원래 사건: 장면 글(제목·줄·고르는 말·대답)에서 먼저 걸리는 것
const RULES = [
  [/아기를|아기가/, m('holdBaby', 'smile')],
  [/춤/, m('dance', 'dance')],
  [/촛불|생일/, m('clap', 'clap')],
  [/(?<![가-힣])별(을|이|자리| 하나| 세|빛)|구름|하늘을 보|하늘로|가리키|가리켜/, m('point', 'point')],
  [/찻잔|차를|차 한|우려|따르|차 마시|차부터|꽃차|보리차/, m('pourTea', 'sipTea')],
  [/선물|건넨|건네|가져왔|드릴게|받아요|줄게요|주는 거|가져가요/, m('offerGift', 'receiveGift')],
  [/빵|과자|포도즙|무화과|꿀|맛보|맛있|먹어|먹을|간식|도시락|수프/, m('shareFood', 'taste')],
  [/깔개|발판|나들이|담요|천을 펴|천을 깔|펼쳐|펼친|펴 놓/, m('spreadCloth', 'nod')],
  [/(?<![가-힣])실(을|이|한| 한)|색실|바느|베틀|베를|천을 짜|천 짜|짠 천|목도리|기워|깁/, m('stitch', 'inspectWork')],
  [/닦/, m('wipeTable', 'nod')],
  [/편지|쪽지|공책|수첩|목록|지도|(?<![산])책(?!임)|글자|읽|적어|기록|도안|표지/, m('showWork', 'inspectWork')],
  [/그림|그렸|그려/, m('showWork', 'inspectWork')],
  [/고리|장식|걸어|걸이|매달/, m('hangDecor', 'nod')],
  [/심었|심을|심어|씨앗|화분|넝쿨|흙|약초/, m('plant', 'waterPlants')],
  [/물을 주|물 주/, m('waterPlants', 'nod')],
  [/망치|대패|깎|기름틀|그물|고쳐|고치|다듬|의자|자루/, m('inspectWork', 'nod')],
  [/박수|축하|해냈|갱신|다 됐|완성/, m('clap', 'clap')],
  [/안녕|어서 와|반가/, m('greet', 'greet')],
]

// 글만으로 잘못 고르는 사건
const OVERRIDES = {
  'tilly:birdNew': m('nod', 'nod'),
  'merchant:short:spouseHabit': m('hangDecor', 'nod'),
  'penelope:lunch': m('shareFood', 'taste'),
}

export function guessMotion(e) {
  if (OVERRIDES[e.id]) return OVERRIDES[e.id]
  // 서먹해지는 사건은 고개만 끄덕인다
  if (e.cool) return m('nod', 'nod')
  const text = textOf(e)
  for (const [re, mo] of RULES) if (re.test(text)) return mo
  return m('smile', 'nod')
}

function textOf(e) {
  return [e.title, ...e.lines.map((l) => l.text), ...(e.choices ?? []).flatMap((c) => [c.label, ...c.reply.map((r) => r.text)])].join(' ')
}
