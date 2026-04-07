const fs = require('fs');
let lines = fs.readFileSync('src/lib/firestore-service.ts', 'utf8').split('\n');

const correctBlock = [
  '  return onSnapshot(',
  '    doc(db, "villages", VILLAGE_DOC_ID), ',
  '    (snap) => {',
  '      const d = snap.data() ?? {};',
  '      callback({',
  '        name: (d.name as string) ?? "Our Village",',
  '        totalCitizens: toNumber(d.totalCitizens),',
  '        totalFundCollected: toNumber(d.totalFundCollected),',
  '        totalSpent: toNumber(d.totalSpent),',
  '      });',
  '    },',
  '    (error) => { console.warn("Village listener error:", error.message); }',
  '  );',
  '}'
].join('\n');

lines.splice(39, 14, correctBlock); // Replace lines 40-53 (index 39-52)
fs.writeFileSync('src/lib/firestore-service.ts', lines.join('\n'));
console.log('Fixed firestore-service.ts via splice!');
