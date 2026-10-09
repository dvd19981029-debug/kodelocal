const fs = require('fs');
const pathDashboard = 'src/components/admin/AromaniakDashboardModule.tsx';
let dashboardCode = fs.readFileSync(pathDashboard, 'utf8');

// The block starts exactly at {/* ================= BLOQUE 2: PROYECCIÓN DE AGOTAMIENTO DE STOCK (DÍAS DE INVENTARIO) ================= */}
// And ends exactly at {/* ================= BLOQUE 3: RETENCIÓN LTV & EMBUDO DE CARRITOS ================= */}

const blockStart = '{/* ================= BLOQUE 2: PROYECCIÓN DE AGOTAMIENTO DE STOCK (DÍAS DE INVENTARIO) ================= */}';
const blockEnd = '{/* ================= BLOQUE 3: RETENCIÓN LTV & EMBUDO DE CARRITOS ================= */}';

const startIndex = dashboardCode.indexOf(blockStart);
const endIndex = dashboardCode.indexOf(blockEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

const blockContent = dashboardCode.substring(startIndex, endIndex);

dashboardCode = dashboardCode.substring(0, startIndex) + dashboardCode.substring(endIndex);

fs.writeFileSync(pathDashboard, dashboardCode);
console.log("Removed from Dashboard");

fs.writeFileSync('blockContent.tsx', blockContent);
