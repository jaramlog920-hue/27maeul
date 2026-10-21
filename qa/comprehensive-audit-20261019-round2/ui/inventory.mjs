import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { parse } from '@babel/parser'
const root = process.cwd()
const dirs = ['src/render','src/content','src/audio','src/shared','src/features/play','src/features/map','src/features/menus','src/features/bag','src/features/journal','src/features/scene']
const engine = ['home-layout','home-walls','room','room-pin.helper','shelf-rooms','spouse-room','furniture-additions','furniture-autonomy','furniture-defs','fixtures','copy-furniture-defs','copy-furniture-views']
const excluded = ['src/shared/save-file-download.ts','src/shared/storage-notice-state.ts','src/features/play/Settings.tsx']
const supporting=['src/engine/newland-rooms.ts','src/features/talk/LoveVerseView.tsx','src/features/talk/TradeBoard.tsx','src/features/ModalLayer.tsx']
const deep = new Set([
 'src/render/renderer.ts','src/render/authored-story-art.ts','src/render/furniture-facing.ts','src/render/scenic-moments-art.ts','src/render/milestone-moments-art.ts','src/render/story-layout-art.ts','src/render/story-location-context.ts','src/render/first-chapter-layout.ts','src/render/first-chapter-view.ts','src/render/story-room-furniture.ts','src/render/player-child-look.ts',
 'src/content/nt-loader.ts','src/content/catalog.ts','src/content/ot-catalog.ts','src/content/text.ts','src/audio/sound.ts',
 'src/shared/ghost.ts','src/shared/i18n.ts','src/shared/IconGrid.tsx',
 'src/features/play/GameCanvas.tsx','src/features/play/useKeyboardMovement.ts','src/features/play/Joystick.tsx','src/features/play/Play.tsx','src/features/play/DecorateBar.tsx','src/features/play/DecorPick.tsx','src/features/play/FurnitureFacingPreview.tsx','src/features/play/EventSchedule.tsx',
 'src/features/map/VillageMap.tsx','src/features/map/TravelMenu.tsx','src/features/menus/PlaceMenu.tsx','src/features/menus/CopiedReadPick.tsx','src/features/menus/ReadPick.tsx','src/features/menus/CareMenu.tsx','src/features/bag/Bag.tsx','src/features/journal/Journal.tsx',
 'src/features/scene/EventGallery.tsx','src/features/scene/EventPlayer.tsx','src/features/scene/EventThumbnail.tsx','src/features/scene/event-registry.ts','src/features/scene/SceneReplay.tsx','src/features/scene/AuthoredStoryScene.tsx','src/features/scene/StarsScene.tsx',
 'src/content/ref.ts','src/content/people-all.ts','src/content/pet-text.ts','src/content/gen-text.ts','src/content/piece-moods.ts','src/content/verse-hash.ts','src/content/forbidden.ts',
 'src/render/story-props.ts','src/render/shared-background-draft-art.ts','src/render/shared-background-scene.ts','src/render/shared-background-cast.ts','src/render/shared-background-family.ts','src/render/story-avatar-snapshot.ts','src/render/shared-story-background.ts','src/render/story-terrain-art.ts','src/render/neighbor-look.ts','src/render/event-life-motion.ts','src/render/social-motion-art.ts','src/render/home-yard-event-context.ts',
 'src/features/play/GameGuide.tsx','src/features/play/Hud.tsx','src/features/play/ControlDeck.tsx','src/features/play/TalkButton.tsx','src/features/play/StatusPanel.tsx','src/features/play/BuildButton.tsx','src/features/play/DecorateButton.tsx','src/features/bag/collection.ts','src/features/bag/collection-art.ts','src/features/bag/CollectionDex.tsx','src/features/journal/FamilyTree.tsx','src/features/journal/VillagePage.tsx','src/features/menus/SpaceMenu.tsx','src/features/menus/YardMenu.tsx','src/shared/ItemIcon.tsx','src/shared/RowLabel.tsx',
 'src/features/scene/SharedBackgroundStoryScene.tsx','src/features/scene/FeastView.tsx','src/features/scene/EndingMemories.tsx','src/features/scene/scene-state-text.ts','src/features/scene/event-preview-art.ts','src/features/scene/stars-preview.tsx','src/features/scene/WeddingAttirePicker.tsx',
 ...supporting,...engine.map(n=>`src/engine/${n}.ts`)
])
const walk = dir => fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=> e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`])
const files = [...new Set([...dirs.flatMap(walk),...engine.map(n=>`src/engine/${n}.ts`),...supporting])].filter(f=>!excluded.includes(f)&&!f.includes('.test.')&&/\.(tsx?|json|css)$/.test(f))
const inventory = files.map(file=>{
 const text = fs.readFileSync(path.join(root,file),'utf8')
 let syntaxErrors=[],imports=[],symbols=[]
 if(/\.tsx?$/.test(file)) {
  const tree=parse(text,{sourceType:'module',plugins:['typescript',...(file.endsWith('tsx')?['jsx']:[])],errorRecovery:true})
  syntaxErrors=(tree.errors??[]).map(d=>d.message)
  for(const outer of tree.program.body){
   const n=outer.declaration??outer
   if(n.type==='ImportDeclaration')imports.push(n.source.value)
   if(n.type==='FunctionDeclaration')symbols.push(n.id?.name??'<anonymous>')
   if(n.type==='VariableDeclaration')for(const d of n.declarations)symbols.push(text.slice(d.id.start,d.id.end))
  }
 }else if(file.endsWith('.json'))JSON.parse(text)
 return {file,lines:text.split(/\r?\n/).length,bytes:Buffer.byteLength(text),sha256:createHash('sha256').update(text).digest('hex'),lastWrite:fs.statSync(path.join(root,file)).mtime.toISOString(),ownership:supporting.includes(file)?'cross-scope-supporting-call-site':'assigned',coverage:deep.has(file)?'focused-human-source-review-plus-structural':file.endsWith('.json')?'complete-json-syntax-parse-only':file.endsWith('.css')?'complete-byte-read-inventory-only':'complete-structural-parse-inventory-only',syntaxErrors,imports,symbols}
})
const out=path.join(root,'qa/comprehensive-audit-20261019-round2/ui')
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({generatedAt:new Date().toISOString(),scope:dirs,notes:['Focused source review does not mean every line in a large module was manually reviewed.','Renderer smoke probes exercise registered authored stories, not every possible helper/export/state.','JSON parsing validates syntax, not every prose item or verse semantically.','Root runs pre-existing src/scripts tests and eleven content verification scripts separately.'],summary:{files:inventory.length,code:inventory.filter(f=>/\.tsx?$/.test(f.file)).length,json:inventory.filter(f=>f.file.endsWith('.json')).length,css:inventory.filter(f=>f.file.endsWith('.css')).length,focused:inventory.filter(f=>deep.has(f.file)).length,sourceLines:inventory.reduce((n,f)=>n+f.lines,0)},files:inventory},null,2))
console.log(JSON.stringify({files:inventory.length,focused:inventory.filter(f=>deep.has(f.file)).length,syntaxErrors:inventory.filter(f=>f.syntaxErrors.length)}))

