const fs=require('node:fs'),crypto=require('node:crypto');
const dir='qa/comprehensive-audit-20261019-round2/social';
const rows=JSON.parse(fs.readFileSync(`${dir}/COVERAGE.json`,'utf8').replace(/^\uFEFF/,''));
const fullEngine=new Set('autonomy avatar baker-baby bonds calendar child clock club-extras club-life club-round clubs companion event-scene events family-days family-furniture family-memory family-scenes family-tree family gen-age gen-birth gen-config gen-growth gen-homes gen-kin gen-looks gen-marriage gen-relations gen-settle gen hearts inn-guests living-moments meet movement neighbor-moments neighbors news night-doors npc-affinity npc-life npc-spots pet-life places romance scenic-kinds siblings social-scene space-life spaces stories talk-popups tip-letters wedding-attire work-day yard'.split(' ').map(x=>`src/engine/${x}.ts`));
const fullFeatures=new Set(['child/ChildName.tsx','child/SchoolView.tsx','family/Family.tsx','clubs/club-store.ts','clubs/ClubForm.tsx','clubs/ClubList.tsx','clubs/ClubRound.tsx','clubs/ClubSession.tsx','talk/GenTalk.tsx','scene/SceneView.tsx','scene/scene-state-text.ts','scene/WeddingAttirePicker.tsx'].map(x=>`src/features/${x}`));
const focused={
 'src/engine/people.ts':['32-77','311-340','411-736'],
 'src/engine/world.ts':['70-137','642-699','718-838','923-1000'],
 'src/engine/game.ts':['687-788','1271-1285','1350-1384','1880-2045','2250-2410','3275-3325','3808-3910','4670-4910','5172-5194'],
 'src/store/game-store.ts':['1861-1879'],
 'src/engine/fest.ts':['1-350'],
 'src/engine/newland-build.ts':['395-468'],
 'src/render/renderer.ts':['2679-2680','2720','2736-2747','2794-2817'],
};
const extra=['src/engine/lodging.ts','src/engine/plans.ts','src/engine/fest.ts','src/engine/group-task.ts','src/engine/newland-build.ts','src/render/neighbor-look.ts','src/render/renderer.ts','src/features/fest/FestSession.tsx'];
for(const path of extra)if(!rows.some(x=>x.path===path))rows.push({path,group:'supporting',priorDepth:'supporting/integration; see earlier report where applicable'});
for(const path of ['src/engine/lodging.ts','src/engine/plans.ts','src/engine/group-task.ts','src/render/neighbor-look.ts','src/features/fest/FestSession.tsx'])fullEngine.add(path);
const dynamic=new Set(['src/engine/avatar.ts','src/engine/child.ts','src/engine/siblings.ts','src/engine/family-days.ts','src/engine/gen.ts','src/engine/gen-growth.ts','src/engine/gen-looks.ts','src/engine/gen-marriage.ts','src/engine/gen-birth.ts','src/engine/gen-settle.ts','src/engine/gen-homes.ts','src/engine/newland-build.ts','src/engine/club-round.ts','src/engine/fest.ts','src/engine/events.ts','src/engine/lodging.ts','src/engine/plans.ts','src/engine/game.ts','src/store/game-store.ts']);
const changes=[],index=[];
for(const r of rows){
 const source=fs.readFileSync(r.path,'utf8'),sha=crypto.createHash('sha256').update(source).digest('hex').toUpperCase();
 if(r.sha256&&r.sha256!==sha)changes.push({path:r.path,before:r.sha256,after:sha});
 r.sha256=sha;r.lines=source.split(/\r?\n/).length;r.mtimeUtc=fs.statSync(r.path).mtime.toISOString();
 const complete=fullEngine.has(r.path)||fullFeatures.has(r.path);
 r.round2Depth=complete?'complete production body reread and contract/integration check':focused[r.path]?'focused current source body reread; prior full source review retained':'current SHA/function inventory refreshed; prior complete source read retained; UI/render execution delegated';
 r.round2Ranges=focused[r.path]??(complete?['full file']:[]);r.round2Status='reviewed; depth explicitly recorded';r.dynamic=dynamic.has(r.path)?'targeted production function/store path in boundaries.audit.ts; not exhaustive':'not directly executed by this subagent in round2';
 r.syntaxDiagnostics='not independently parsed: installed TypeScript package lacks compiler API; root tsc/build owns syntax verification';
 index.push(r.path);
 for(const [i,line] of source.split(/\r?\n/).entries())if(/^(?:export (?:async )?)?(?:function|class|interface|type)\s|^export const\s/.test(line))index.push(`${i+1}: ${line.trim()}`);
}
fs.writeFileSync(`${dir}/COVERAGE.json`,JSON.stringify(rows,null,2));fs.writeFileSync(`${dir}/FUNCTION_INDEX.txt`,index.join('\n'));
const summary={atUtc:new Date().toISOString(),files:rows.length,groups:Object.fromEntries([...new Set(rows.map(r=>r.group))].map(g=>[g,rows.filter(r=>r.group===g).length])),completeBodyReread:rows.filter(r=>r.round2Depth.startsWith('complete')).length,focusedBodyReread:rows.filter(r=>r.round2Depth.startsWith('focused')).length,priorCompleteWithRefreshedIndex:rows.filter(r=>r.round2Depth.startsWith('current SHA')).length,syntaxVerification:'root tsc/build; no separate compiler API available',sourceChangesSinceRound2Inventory:changes,limits:['Full body reread is not claimed for index-only carried entries.','Root owns whole-suite/type/build/save/security.','No native browser UI was executed by this subagent.']};
fs.writeFileSync(`${dir}/COVERAGE_SUMMARY.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
