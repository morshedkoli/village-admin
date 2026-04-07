const fs = require('fs');

let content = fs.readFileSync('src/lib/firestore-service.ts', 'utf8');

const regex = /return onSnapshot\((q|doc\(db, "villages", VILLAGE_DOC_ID\)), \(snap\) => \{([\s\S]*?)\}\);/g;

content = content.replace(regex, (match, p1, p2) => {
  return `return onSnapshot(${p1}, (snap) => {${p2}}, (error) => { console.warn("Snapshot listener error:", error.message); });`;
});

fs.writeFileSync('src/lib/firestore-service.ts', content);
console.log('Fixed onSnapshot calls!');
