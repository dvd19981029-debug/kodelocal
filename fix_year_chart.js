const fs = require('fs');

const visitsPath = 'src/lib/visits.ts';
let visitsCode = fs.readFileSync(visitsPath, 'utf8');

const regexYear = /const currentMonthIdx = now\.getMonth\(\);\s*for \(let m = 0; m <= currentMonthIdx; m\+\+\) \{/;
const newYearLoop = `const currentMonthIdx = now.getMonth();
    for (let m = 0; m < 12; m++) {`;

if (visitsCode.match(regexYear)) {
  visitsCode = visitsCode.replace(regexYear, newYearLoop);
  fs.writeFileSync(visitsPath, visitsCode);
  console.log("Fixed year logic in visits.ts");
} else {
  console.log("Could not find year regex");
}
