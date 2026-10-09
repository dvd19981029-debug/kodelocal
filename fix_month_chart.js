const fs = require('fs');

const visitsPath = 'src/lib/visits.ts';
let visitsCode = fs.readFileSync(visitsPath, 'utf8');

const regexMonth = /const currentDay = parseInt\(today\.split\('-\'\)\[2\], 10\);\s*for \(let d = 1; d <= currentDay; d\+\+\) \{/;

// Instead of stopping at currentDay, we get the total days in the current month
const newMonthLoop = `const currentDay = parseInt(today.split('-')[2], 10);
    const yearNum = parseInt(yStr, 10);
    const monthNum = parseInt(mStr, 10);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {`;

if (visitsCode.match(regexMonth)) {
  visitsCode = visitsCode.replace(regexMonth, newMonthLoop);
  fs.writeFileSync(visitsPath, visitsCode);
  console.log("Fixed month logic in visits.ts");
} else {
  console.log("Could not find regex in visits.ts");
}
