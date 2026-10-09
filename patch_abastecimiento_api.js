const fs = require('fs');
const path = 'src/app/api/admin/abastecimiento/route.ts';
let code = fs.readFileSync(path, 'utf8');

const inputRegex = /const \{ budget, catalog \} = body;/;
const inputReplacement = `const { budget, catalog, historyDays = 30, targetDos = 60, leadTime = 14 } = body;`;
code = code.replace(inputRegex, inputReplacement);

const timeRegex = /thirtyDaysAgo\.setDate\(thirtyDaysAgo\.getDate\(\) - 30\);/g;
const timeReplacement = `thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - Number(historyDays));`;
code = code.replace(timeRegex, timeReplacement);

const adrRegex = /velocityMap\[sale\.productId\] = \(sale\._sum\.quantity \|\| 0\) \/ 30;/g;
const adrReplacement = `velocityMap[sale.productId] = (sale._sum.quantity || 0) / Number(historyDays);`;
code = code.replace(adrRegex, adrReplacement);

const dosRegex = /const TARGET_DOS = 60;/;
const dosReplacement = `const TARGET_DOS = Number(targetDos);
    const LEAD_TIME = Number(leadTime);`;
code = code.replace(dosRegex, dosReplacement);

const mathRegex = /if \(p\.dos < TARGET_DOS\) \{\s*neededOz = \(TARGET_DOS - p\.dos\) \* p\.adr;\s*\}/;
const mathReplacement = `// Consideramos el Lead Time: el stock real cuando llegue el pedido será:
      // stock_proyectado = stock_actual - (ADR * LEAD_TIME)
      const projectedStock = p.stock - (p.adr * LEAD_TIME);
      
      if (projectedStock < TARGET_DOS * p.adr) {
        neededOz = (TARGET_DOS * p.adr) - projectedStock;
        if (neededOz < 0) neededOz = 0;
      }`;
code = code.replace(mathRegex, mathReplacement);

fs.writeFileSync(path, code);
