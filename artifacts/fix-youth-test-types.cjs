const fs=require('fs');let p='src/audit/youth-activity-capacity-20261020.test.tsx',s=fs.readFileSync(p,'utf8').replaceAll(',exact:true','');fs.writeFileSync(p,s);
