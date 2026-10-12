import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exportStaticPreview } from './all-assets-preview-static.mjs'

const root = fileURLToPath(new URL('../assets/', import.meta.url))
const packs = [
  ['paired-events', '함께하는 이벤트·27권 완필'],
  ['events', '결혼식·이벤트 소품'],
  ['events/additional', '추가 이벤트·아이 손잡기'],
  ['life-additions', '유아·아이·노인·손님 입주'],
  ['village-followup', '요람·만남 표정·서고 방문객'],
  ['archive-followup', '서고·길 이음·기억 정원'],
  ['craft-followup', '종이·실·잉크·도예·악기·창가'],
  ['work-details', '정원·작업·문·주변 움직임'],
  ['cooking', '요리·생활·보호자·동물'],
  ['kitchen-pets', '포도즙·보리죽·올리브빵·펫 용품'],
  ['lodging', '2층 공동 주택·대장간·독립 자녀 방'],
  ['eating', '음식 먹기·한입·씹기'],
  ['furniture/use-motion', '가구 사용 모션'],
  ['furniture/expansion', '생활 확장·동물 모션'],
  ['quiet-life', '소소한 일상 모션'],
  ['settlement-guests', '넬리·모리스·아이비·손님집'],
  ['elder-residents', '기존 주민의 노년'],
  ['generated-elders', '태어난 주민의 노년'],
  ['old-testament-generations', '구약 마을·주민 성장·가족'],
  ['newland-building-upgrades', '건물·공사·울타리 문'],
  ['side-hair', '머리 모양·주민 옆모습'],
  ['library', '서고·제본·책 표지·책등'],
  ['book-reopen', '꾸민 성경 꺼내기·표지 펼치기·다시 읽기'],
  ['spouse-rooms', '배우자 방·소품'],
  ['furniture/directional', '가구 4방향'],
  ['furniture/remaining', '추가 가구·꾸미기'],
  ['furniture/remaining/fixtures', '집 안 시설 4방향'],
].map(([id, label]) => ({ id, label }))
const groups = {
  toddler:'유아', child:'아이', elder:'노인', arrival:'손님 입주', memories:'기억 정원', books:'책 장식', 'book-work':'책 꾸미기',
  growth:'성장 단계', motions:'인물 동작', pairs:'둘이 함께', pets:'동물', props:'소품', items:'소품', assets:'가구·소품',
  buildings:'건물', construction:'공사 단계', terrain:'지형·자연', interiors:'실내 배치', 'job-signs':'직업 표식',
  gifts:'선물', memorials:'함께 기념물 놓기', completion:'27권 완필 축하', materials:'재료 작업', windows:'창가',
  garden:'정원', doors:'문', ambient:'주변 움직임', styles:'머리 모양', residents:'주민', visitors:'방문객', guests:'입주 손님',
  shelves:'책장', paths:'길 이음', cooking:'요리 소품', life:'생활 소품', structure:'시설', emotes:'만남 표정',
}
const words = {
  adult:'성인', toddler:'유아', child:'아이', teen:'청소년', elder:'노인', baby:'아기',
  stand:'서 있기', walk:'걷기', work:'일하기', greet:'인사', carry:'물건 들기', sit:'앉기', read:'독서', sleep:'잠자기',
  cream:'크림', sky:'하늘', sage:'풀빛', lavender:'연보라', sand:'모래', slate:'회청',
  plain:'무늬 없음', dots:'도트 무늬', stripes:'줄무늬', cross:'십자', gold:'금빛', ribbon:'리본',
  cat:'고양이', dog:'강아지', down:'앞', up:'뒤', left:'왼쪽', right:'오른쪽',
  wash:'씻기', chop:'썰기', knead:'반죽', stir:'젓기', sort:'재료 정리', shy:'수줍음', bold:'활발함',
  follow:'따라오기', sniff:'냄새 맡기', play:'놀기', fetch:'물어오기', wag:'꼬리 흔들기', wait:'기다리기',
  table:'탁자', chair:'의자', stool:'스툴', bed:'침대', rug:'러그', mat:'돗자리', lantern:'등잔',
  teapot:'찻주전자', cupboard:'찬장', fruitBowl:'과일 바구니', supplyChest:'재료 상자', basket:'바구니',
  chest:'상자', longBench:'긴 의자', daybed:'낮잠 침대', cushion:'방석', pillows:'베개', woodToy:'나무 장난감',
  clothDoll:'헝겊 인형', bookcase:'책장', lectern:'독서대', nightstand:'협탁',
}
const translate = value => words[value] || value
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes:true }).flatMap(e => path.join(dir,e.name)===path.join(root,'all-preview') ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
}
const allFiles = walk(root)
// Discover future packs too, without needing another hardcoded adapter.
for (const file of allFiles.filter(f => path.basename(f) === 'manifest.json')) {
  const id = path.relative(root, path.dirname(file)).replaceAll('\\', '/')
  if (!packs.some(p => p.id === id)) packs.push({ id, label:id })
}
const sizeCache = new Map(), used = new Set(), entries = [], entryMap = new Map()
function dimensions(file) {
  if (!sizeCache.has(file)) {
    const full = path.join(root, file)
    if (!fs.existsSync(full)) throw new Error(`미리보기 자산 없음: ${file}`)
    const fd = fs.openSync(full, 'r'), header = Buffer.alloc(24)
    try { fs.readSync(fd, header, 0, 24, 0) } finally { fs.closeSync(fd) }
    if (header.readUInt32BE(0) !== 0x89504e47) throw new Error(`PNG 형식 오류: ${file}`)
    sizeCache.set(file, { width:header.readUInt32BE(16), height:header.readUInt32BE(20) })
  }
  return sizeCache.get(file)
}
function resolve(pack, file) {
  const resolved = path.posix.normalize(`${pack.id}/${file.replaceAll('\\', '/')}`)
  if (resolved.startsWith('../') || path.isAbsolute(file)) throw new Error(`자산 폴더 외부 경로: ${file}`)
  dimensions(resolved)
  used.add(resolved)
  return resolved
}
function makeFrame(pack, input, defaults = {}) {
  const f = typeof input === 'string' ? { file:input } : input
  const file = resolve(pack, f.file || defaults.file), actual = dimensions(file)
  const width = f.width || defaults.width || actual.width, height = f.height || defaults.height || actual.height
  const layers = Object.fromEntries(Object.entries(f.layers || defaults.layers || {}).map(([k, v]) => [k, resolve(pack, v)]))
  return { file, width, height, x:defaults.x ?? 0, y:defaults.y ?? 0, duration:f.duration || defaults.duration || 300, ...(Object.keys(layers).length ? { layers } : {}) }
}
function add(pack, key, label, group, views, loop = true) {
  const mapKey = `${pack.id}/${key}`
  if (!entryMap.has(mapKey)) {
    const entry = { id:mapKey, pack:pack.id, label, group:groups[group] || group || '도트', kind:'still', loop, views:{} }
    entryMap.set(mapKey, entry); entries.push(entry)
  }
  const entry = entryMap.get(mapKey)
  for (const [d, frames] of Object.entries(views)) {
    if (entry.views[d]) {
      if (JSON.stringify(entry.views[d]) === JSON.stringify(frames)) continue
      throw new Error(`중복 방향: ${mapKey} ${d}`)
    }
    entry.views[d] = frames
    if (frames.length > 1) entry.kind = 'motion'
  }
  return entry
}
function normalizeSequence(pack, seq, group, key, label) {
  const defaults = { duration:seq.frameMs || 300, width:seq.width, height:seq.height }
  let views = {}, loop = seq.loop
  if (seq.views) {
    for (const [d, input] of Object.entries(seq.views)) {
      const frames = Array.isArray(input) ? input : [input]
      views[d] = frames.map(f => makeFrame(pack, f, defaults))
      loop ??= frames[0]?.loop
    }
  } else if (seq.file || seq.sheet) {
    const file = seq.file || seq.sheet, actual = dimensions(resolve(pack, file))
    const timings = seq.frames || seq.durations?.map(duration => ({ duration })) || []
    const width = seq.width || (timings.length ? actual.width / timings.length : actual.width)
    const height = seq.height || actual.height
    views[seq.facing || 'default'] = timings.length ? timings.map((f, i) => makeFrame(pack, { ...f, file, layers:seq.layers, width, height }, { ...defaults, x:f.x ?? i * width, y:f.y ?? 0 })) : [makeFrame(pack, { ...seq, file }, defaults)]
    // A sheet and its exported single-frame PNGs describe the same motion.
    if (file.endsWith('-sheet.png')) for (let i = 0; i < timings.length; i++) {
      const single = `${pack.id}/${file.replace(/-sheet\.png$/, `-${i}.png`)}`
      if (fs.existsSync(path.join(root, single))) used.add(single)
    }
    loop ??= timings[0]?.loop
  } else {
    const input = seq.frames || seq.files
    if (!input?.length) return
    views[seq.facing || 'default'] = input.map(f => makeFrame(pack, f, defaults))
    loop ??= input[0]?.loop
  }
  // Sprite walking sources store neutral / left step / right step; restore their intended rhythm.
  if (pack.id === 'side-hair') for (const [d, frames] of Object.entries(views)) if (frames.length === 3) views[d] = [frames[0], frames[1], frames[0], frames[2]]
  return add(pack, key, label, group, views, loop ?? true)
}
function itemLabel(item) {
  const extra = [item.stage, item.child === undefined ? '' : item.child ? 'child' : 'adult', item.kind, item.baby === undefined ? '' : item.baby ? 'baby' : 'adult'].filter(Boolean).map(translate)
  return [...extra, item.label || translate(item.action || item.id || '')].filter(Boolean).join(' · ')
}
function processItem(pack, item, i, group = 'items') {
  // The construction pack supplies the same houses and their full build sequence.
  // Keep legacy PNGs in the originals tab instead of duplicating them as current art.
  if (pack.id === 'old-testament-generations' && ['buildings', 'construction'].includes(item.group) && packs.some(p => p.id === 'newland-building-upgrades')) {
    makeFrame(pack, item)
    return
  }
  const id = item.id || item.action || `item-${i}`, category = item.group || group
  const label = itemLabel(item)
  const key = `${group}/${category}/${id}/${item.stage || ''}/${item.child ?? ''}/${item.kind || ''}/${item.baby ?? ''}`
  if (item.views || item.frames || item.files || item.sheet || item.durations) {
    normalizeSequence(pack, item, category, key, label)
  } else if (item.file) {
    let facing = item.facing || 'default', normalizedId = id
    if (/-(down|up|left|right)$/.test(id)) { facing = id.split('-').at(-1); normalizedId = id.replace(/-(down|up|left|right)$/, '') }
    const normalKey = `${group}/${category}/${normalizedId}/${item.stage || ''}/${item.child ?? ''}/${item.kind || ''}/${item.baby ?? ''}`
    add(pack, normalKey, item.label || translate(normalizedId), category, { [facing]:[makeFrame(pack, item)] })
  }
  for (const type of ['cover', 'spine', 'icon', 'prop']) if (item[type]) {
    const parts = [item.label || id, item.color, item.pattern, item.deco].filter(Boolean).map(translate)
    const suffix = { cover:'표지', spine:'책등', icon:'아이콘', prop:'개인 소품' }[type]
    add(pack, `${key}/${type}`, `${parts.join(' · ')} · ${suffix}`, category, { [item.facing || 'default']:[makeFrame(pack, item[type])] })
  }
}
for (const pack of packs) {
  const full = path.join(root, pack.id, 'manifest.json')
  const data = JSON.parse(fs.readFileSync(full, 'utf8'))
  const html = ['preview.html', '미리보기.html'].find(name => fs.existsSync(path.join(root, pack.id, name)))
  if (html) pack.preview = `${pack.id}/${html}`
  if (Array.isArray(data)) { data.forEach((s, i) => normalizeSequence(pack, s, '일상', `sequence/${s.id || i}`, s.label || s.id)); continue }
  for (const type of ['sequences', 'motions', 'pairs', 'pets', 'visitors', 'memories', 'gates']) {
    for (const [i, s] of (data[type] || []).entries()) {
      const group = s.group || type, key = `${type}/${group}/${s.id || s.action || i}/${s.stage || ''}/${s.child ?? ''}/${s.kind || ''}/${s.baby ?? ''}`
      normalizeSequence(pack, s, group, key, itemLabel(s))
    }
  }
  for (const type of ['items', 'assets', 'staticAssets', 'paths', 'emotes', 'buildings', 'gifts']) (data[type] || []).forEach((s, i) => {
    processItem(pack, s, i, type)
    if (s.sizes) for (const [size, file] of Object.entries(s.sizes)) add(pack, `${type}/${s.id}/${size}`, `${s.label} · ${size}px`, type, { default:[makeFrame(pack, file)] })
  })
  for (const s of data.shelves || []) for (const fill of s.fills) add(pack, `shelves/${s.id}/${fill.fill}`, `${s.label} · ${fill.fill}/${s.capacity}권`, 'shelves', { default:[makeFrame(pack, fill)] })
  for (const g of data.guests || []) {
    for (const [action, input] of Object.entries(g.actions)) {
      const views = {}
      for (const [d, files] of Object.entries(input)) views[d] = files.map((file, f) => {
        const timing = g.sequences.find(s => s.action === action && s.facing === d && s.frame === f)
        return makeFrame(pack, { file, ...timing })
      })
      const timing = g.sequences.find(s => s.action === action)
      add(pack, `guest/${g.id}/${action}`, `${g.label} · ${translate(action)}`, 'guests', views, timing?.loop ?? true)
    }
    if (g.prop) add(pack, `guest/${g.id}/prop`, `${g.label} · 개인 소품`, 'props', { default:[makeFrame(pack, g.prop)] })
  }
  for (const [i, g] of [...(data.residents || []), ...(data.samples || [])].entries()) {
    const id = g.id || `sample-${i}`, views = {}
    for (const [d, files] of Object.entries(g.directions || {})) views[d] = [0, 1, 0, 2].map(f => makeFrame(pack, files[f], { duration:220 }))
    if (Object.keys(views).length) add(pack, `resident/${id}/walk`, `${g.label} · 노년 걷기`, 'residents', views)
    for (const [action, files] of Object.entries(g.motions || {})) normalizeSequence(pack, { files, frameMs:350 }, 'residents', `resident/${id}/${action}`, `${g.label} · ${translate(action)}`)
  }
  for (const c of data.construction || []) {
    const views = Object.fromEntries(Object.entries(c.views).map(([d, input]) => [d, [...input, { ...c.completed[d], duration:1400 }]]))
    normalizeSequence(pack, { views, loop:false }, 'construction', `construction/${c.id}`, `${c.label} · 공사부터 완공까지`)
  }
  for (const room of data.rooms || []) add(pack, `room/${room.id}`, `${room.name} · ${room.title}`, '배우자 방', { default:[makeFrame(pack, room.files.room)] })
}

// Include every remaining named dot. Individual frames and layers stay available in the exhaustive PNG tab.
const unlisted = allFiles.filter(f => f.endsWith('.png')).map(f => path.relative(root, f).replaceAll('\\', '/')).filter(f => !used.has(f))
const sourcePattern = /(?:^|\/)before\/|(?:-(?:actor|back|front|first|second|sheet|background|furnishing|foreground|before)\.png|(?:contact-sheet|preview|before-after|review|hands|comparison))/
const packFor = file => packs.filter(p => file.startsWith(`${p.id}/`)).sort((a, b) => b.id.length - a.id.length)[0]
const orphanSequences = new Map()
for (const file of unlisted) {
  if (sourcePattern.test(file)) continue
  const match = file.match(/^(.*)-(\d+)\.png$/), pack = packFor(file)
  if (match && pack) {
    const key = match[1], list = orphanSequences.get(key) || []
    list.push({ file, index:+match[2], pack }); orphanSequences.set(key, list)
  }
}
for (const [key, list] of orphanSequences) {
  list.sort((a, b) => a.index - b.index)
  if (list.length < 2 || list.some((f, i) => f.index !== i)) continue
  const pack = list[0].pack, localKey = key.slice(pack.id.length + 1)
  const input = list.map(f => f.file.slice(pack.id.length + 1))
  const facing = localKey.match(/-(down|up|left|right)$/)?.[1]
  const unifiedKey = localKey.replace(/-(down|up|left|right)$/, '')
  normalizeSequence(pack, { files:input, facing }, '기타 모션', `unlisted/${unifiedKey}`, unifiedKey.replaceAll('/', ' · '))
}
for (const file of unlisted) {
  if (used.has(file) || sourcePattern.test(file)) continue
  const pack = packFor(file)
  if (!pack) continue
  const local = file.slice(pack.id.length + 1)
  add(pack, `unlisted/${local}`, local.replace(/\.png$/, '').replaceAll('/', ' · '), '기타 도트', { default:[makeFrame(pack, local)] })
}
const raw = allFiles.filter(f => f.endsWith('.png')).map(full => {
  const file = path.relative(root, full).replaceAll('\\', '/'), size = dimensions(file)
  return [file, size.width, size.height, packFor(file)?.id || 'other']
})
for (const pack of packs) {
  const own = entries.filter(e => e.pack === pack.id)
  pack.motions = own.filter(e => e.kind === 'motion').length
  pack.stills = own.filter(e => e.kind === 'still').length
  pack.files = raw.filter(r => r[3] === pack.id).length
}
// Verify crop bounds too: strip previews must use a single frame, never the whole sprite sheet.
for (const e of entries) for (const frames of Object.values(e.views)) for (const f of frames) {
  const size = dimensions(f.file)
  if (!Number.isInteger(f.width) || f.x < 0 || f.y < 0 || f.x + f.width > size.width || f.y + f.height > size.height) throw new Error(`프레임 범위 오류: ${e.id} ${f.file}`)
}
const inventory = { packs, entries, raw, totals:{ motions:entries.filter(e => e.kind === 'motion').length, stills:entries.filter(e => e.kind === 'still').length, pngs:raw.length, directions:entries.reduce((n, e) => n + Object.keys(e.views).length, 0) } }
const json = JSON.stringify(inventory).replaceAll('<', '\\u003c')
const template = fs.readFileSync(new URL('./all-assets-preview.template.html', import.meta.url), 'utf8')
const fallback = exportStaticPreview(root, inventory)
let html = template
for (const [key,value] of Object.entries({__STATIC_NAV__:fallback.nav,__STATIC_CARDS__:fallback.cards,__STATIC_STATS__:fallback.stats,__STATIC_RESULT__:fallback.result,__STATIC_PAGE_LABEL__:fallback.pageLabel})) html=html.replace(key,()=>value)
fs.writeFileSync(path.join(root, 'preview-data.js'), `window.PIXEL_ASSET_DATA=${json};\n`)
fs.writeFileSync(path.join(root, 'preview.html'), html)
fs.writeFileSync(path.join(root, 'preview-index.json'), JSON.stringify(inventory))
console.log(JSON.stringify({ ...inventory.totals, packs:packs.length, staticPages:fallback.pageCount, animatedPreviews:fallback.animations, output:'assets/preview.html' }))
