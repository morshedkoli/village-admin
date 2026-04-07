const fs = require('fs');
let content = fs.readFileSync('src/lib/firestore-service.ts', 'utf8');

content = content.replace(
  /callback\(\{([\s\S]*?totalSpent: toNumber\(d\.totalSpent\),\n\s*)\},/m,
  'callback({$1});\n    },'
);

content = content.replace(
  /\(error\) => \{ console\.warn\(\"Village listener error:\", error\.message\); \}\n  \);\n  \}\);/m,
  '(error) => { console.warn(\"Village listener error:\", error.message); }\n  );'
);

fs.writeFileSync('src/lib/firestore-service.ts', content);
console.log('Fixed syntax error!');
