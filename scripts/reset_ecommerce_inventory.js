const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Parse APAESA order
let sharedStrings = [];
if (fs.existsSync("/tmp/pedido_apaesa/xl/sharedStrings.xml")) {
  const ssXml = fs.readFileSync("/tmp/pedido_apaesa/xl/sharedStrings.xml", "utf8");
  const regex = /<si>(?:(?!<\/si>).)*?<\/si>/gs;
  const matches = ssXml.match(regex) || [];
  sharedStrings = matches.map(si => {
    const tMatches = si.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
    return tMatches.map(t => t.replace(/<t[^>]*>/, "").replace(/<\/t>/, "")).join("");
  });
}

function parseSheet(sheetPath) {
  const sheetXml = fs.readFileSync(sheetPath, "utf8");
  const rowsMatch = sheetXml.match(/<row [^>]*>.*?<\/row>/gs) || [];
  const parsedRows = [];
  for (const r of rowsMatch) {
    const cells = r.match(/<c [^>]*>.*?<\/c>/gs) || [];
    const rowData = {};
    for (const c of cells) {
      const refMatch = c.match(/r="([A-Z]+[0-9]+)"/);
      const typeMatch = c.match(/t="([a-z]+)"/);
      const valMatch = c.match(/<v>(.*?)<\/v>/);
      if (!refMatch) continue;
      const ref = refMatch[1];
      const col = ref.replace(/[0-9]/g, "");
      let val = valMatch ? valMatch[1] : "";
      if (typeMatch && typeMatch[1] === "s" && valMatch) {
        val = sharedStrings[parseInt(valMatch[1], 10)] || "";
      }
      rowData[col] = val;
    }
    parsedRows.push(rowData);
  }
  return parsedRows;
}

const sheet1 = parseSheet("/tmp/pedido_apaesa/xl/worksheets/sheet1.xml");
const sheet2 = parseSheet("/tmp/pedido_apaesa/xl/worksheets/sheet2.xml");

async function main() {
  console.log("=== RESETTING INVENTORY TO REAL THEORETICAL STOCK ONLY ===");

  const catEsencias = await prisma.category.findFirst({
    where: { name: { contains: "Esencia", mode: "insensitive" } }
  });
  const catBotes = await prisma.category.findFirst({
    where: { name: { contains: "Bote", mode: "insensitive" } }
  });

  // 1. Delete test sales
  console.log("Clearing test sales...");
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});

  // 2. Delete all existing essence products
  console.log("Cleaning old essence products...");
  const deleteResult = await prisma.product.deleteMany({
    where: {
      categoryId: catEsencias.id
    }
  });
  console.log(`Deleted ${deleteResult.count} old dummy essence records.`);

  // 3. Build 48 real essences from APAESA order
  const essenceRecords = [];
  for (const r of sheet1.slice(4)) {
    if (r.A && !isNaN(parseInt(r.A, 10))) {
      const itemNum = parseInt(r.A, 10);
      const s2Row = sheet2[itemNum];
      const kg = parseFloat(r.F) || 0;
      const oz = Math.round(kg * 35.274);
      
      let contratipo = (r.K || "").trim();
      if (!contratipo && s2Row) contratipo = s2Row.A;
      contratipo = contratipo.replace(/[¡!]/g, "").trim();

      const originalPerfume = (r.C || "").trim();

      essenceRecords.push({
        id: `esencia-apae-${String(itemNum).padStart(3, "0")}`,
        sku: String(itemNum),
        barcode: `741001${String(itemNum).padStart(6, "0")}`,
        name: contratipo, // Primary title is Contratipo (e.g. Fiera, Marino, David Ocean)
        officialName: contratipo,
        brand: (r.D || "").trim(),
        gender: (r.E || "").trim() === "Dama" ? "Dama" : ((r.E || "").trim() === "Unisex" ? "Unisex" : "Caballero"),
        categoryId: catEsencias.id,
        unit: "Onza",
        description: `Inspirado en ${originalPerfume}`,
        price: 3.25,
        cost: 1.95,
        stock: oz,
        minStock: 15,
        imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80",
        puesto: (s2Row && s2Row.H) ? s2Row.H : "A1",
        supplier: "APAESA GUATEMALA",
        isActive: true,
        isAvailableOnline: true
      });
    }
  }

  console.log(`Inserting ${essenceRecords.length} real essences in DB...`);
  await prisma.product.createMany({
    data: essenceRecords
  });
  console.log("Successfully created all 48 real essences in Supabase!");

  // Verify botes
  const botes = await prisma.product.findMany({
    where: { categoryId: catBotes.id }
  });
  console.log(`Total botes in DB: ${botes.length} (Total units: ${botes.reduce((acc, b) => acc + b.stock, 0)})`);

  // Count total products in DB
  const totalCount = await prisma.product.count();
  console.log(`Total products in DB now: ${totalCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
