const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Conectando a Supabase para cargar datos iniciales...');

  // 1. Categorías
  const categoriesData = [
    { name: 'Esencias para Perfume', slug: 'esencias-para-perfume', color: '#6366f1', icon: 'droplets' },
    { name: 'Botes', slug: 'botes', color: '#10b981', icon: 'cylinder' },
    { name: 'Empaque', slug: 'empaque', color: '#f59e0b', icon: 'box' },
    { name: 'Insumos y Materia Prima', slug: 'insumos-materia-prima', color: '#8b5cf6', icon: 'flask' }
  ];

  const catMap = {};
  for (const cat of categoriesData) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color, icon: cat.icon },
      create: cat
    });
    catMap[cat.name] = upserted.id;
  }
  console.log('Categorías listas.');

  // 2. Clientes iniciales
  const customers = [
    {
      id: 'cli-001',
      name: 'Consumidor Final',
      documentType: 'DUI',
      documentNum: '00000000-0',
      email: 'ventas@aromaniaksv.com',
      phone: '0000-0000',
      address: 'San Salvador',
      department: 'San Salvador',
      municipality: 'San Salvador'
    },
    {
      id: 'cli-002',
      name: 'María Carmen Santos',
      documentType: 'DUI',
      documentNum: '02849102-3',
      email: 'carmen.santos@gmail.com',
      phone: '7123-4567',
      address: 'Colonia Escalón, Calle El Mirador #42',
      department: 'San Salvador',
      municipality: 'San Salvador'
    },
    {
      id: 'cli-003',
      name: 'Boutique & Perfumería Elegance S.A. de C.V.',
      businessName: 'Elegance Perfumes SV',
      documentType: 'NIT',
      documentNum: '0614-120521-102-4',
      nrc: '289410-5',
      activityDesc: 'Venta al por menor de productos cosméticos y de tocador en comercios especializados',
      email: 'facturacion@eleganceperfumes.sv',
      phone: '2288-4455',
      address: 'Centro Comercial Multiplaza, Nivel 2, Local 45',
      department: 'La Libertad',
      municipality: 'Santa Tecla'
    }
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log(`Clientes iniciales insertados: ${customers.length}`);

  // 3. Preparar esencias
  const esenciasPath = path.join(__dirname, '../src/lib/esencias.json');
  const catId = catMap['Esencias para Perfume'];
  const productsToInsert = [];

  if (fs.existsSync(esenciasPath)) {
    const raw = fs.readFileSync(esenciasPath, 'utf8');
    const esencias = JSON.parse(raw);

    for (const e of esencias) {
      const sku = String(e.kodigo || e.sku).trim();
      const name = e.contratipo || e.name || `Esencia #${sku}`;
      const brand = e.marca || e.brand || '';
      const gender = e.genero || e.gender || 'Unisex';
      const barcode = `741000000${sku.padStart(3, '0')}`;

      productsToInsert.push({
        id: `esencia-${sku}`,
        sku: sku,
        name: name,
        brand: brand,
        gender: gender,
        unit: 'Onza',
        price: 3.25,
        cost: 1.95,
        categoryId: catId,
        barcode: barcode,
        stock: 0,
        minStock: 15,
        imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
        isActive: true,
        isAvailableOnline: true
      });
    }
  }

  // 4. Suministros
  const suministros = [
    { id: 'bote-50ml', sku: 'BOT-50', name: 'Bote de Vidrio 50ml con Spray', categoryName: 'Botes', unit: 'Unidad', price: 1.50, cost: 0.85, barcode: '741999000BOT-50' },
    { id: 'bote-100ml', sku: 'BOT-100', name: 'Bote de Vidrio 100ml Premium', categoryName: 'Botes', unit: 'Unidad', price: 2.25, cost: 1.20, barcode: '741999000BOT-100' },
    { id: 'caja-regalo', sku: 'EMP-CAJ', name: 'Caja de Presentación / Regalo', categoryName: 'Empaque', unit: 'Unidad', price: 0.75, cost: 0.35, barcode: '741999000EMP-CAJ' },
    { id: 'bolsa-lujo', sku: 'EMP-BOL', name: 'Bolsa de Lujo Kraft Aromaniak', categoryName: 'Empaque', unit: 'Unidad', price: 0.50, cost: 0.20, barcode: '741999000EMP-BOL' },
    { id: 'alcohol-perfumeria', sku: 'INS-ALC', name: 'Alcohol de Perfumería Especial 96° (Galón)', categoryName: 'Insumos y Materia Prima', unit: 'Galón', price: 18.00, cost: 11.50, barcode: '741999000INS-ALC' }
  ];

  for (const s of suministros) {
    productsToInsert.push({
      id: s.id,
      sku: s.sku,
      name: s.name,
      unit: s.unit,
      price: s.price,
      cost: s.cost,
      stock: 0,
      minStock: 20,
      barcode: s.barcode,
      categoryId: catMap[s.categoryName],
      isActive: true,
      isAvailableOnline: true
    });
  }

  console.log(`Insertando ${productsToInsert.length} productos en bloque (createMany)...`);
  const result = await prisma.product.createMany({
    data: productsToInsert,
    skipDuplicates: true
  });

  console.log(`¡Insertados exitosamente ${result.count} productos en Supabase!`);
  console.log('--- BASE DE DATOS DE SUPABASE LISTA Y POBLADA ---');
}

main()
  .catch((e) => {
    console.error('Error poblando base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
