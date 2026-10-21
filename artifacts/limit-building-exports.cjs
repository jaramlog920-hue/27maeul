const fs=require('fs'),cp=require('child_process');
const dirs=['assets/old-testament-generations/growth/','assets/old-testament-generations/motions/','assets/old-testament-generations/interiors/'];
const result=cp.spawnSync('git',['diff','--name-only','--',...dirs],{encoding:'utf8'});if(result.status)throw new Error(result.stderr);
const files=result.stdout.trim().split(/\r?\n/).filter(Boolean);
for(const file of files){if(!dirs.some(dir=>file.startsWith(dir))||!file.endsWith('.png'))throw new Error('Unexpected path');const r=cp.spawnSync('git',['show','HEAD:'+file],{maxBuffer:10*1024*1024});if(r.status)throw new Error(r.stderr.toString());fs.writeFileSync(file,r.stdout)}
console.log('Reverted only incidental re-export of unchanged actor/interior PNGs:',files.length);
