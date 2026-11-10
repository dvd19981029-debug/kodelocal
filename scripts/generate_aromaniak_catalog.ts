import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { jsPDF } from 'jspdf';
import {
  buildAromaniakCatalogJsPdfDocument,
  CatalogImageAsset,
} from '../src/lib/aromaniakCatalogPdf';
import { ProductItem } from '../src/lib/store';

const prisma = new PrismaClient();

async function generateAromaniakCatalog() {
  const allFragrances = await prisma.product.findMany({
    where: {
      category: { name: 'Esencias para Perfume' },
    },
    include: {
      category: true,
    },
  });

  const products: ProductItem[] = allFragrances.map((p) => ({
    id: p.id,
    sku: p.sku || '',
    barcode: p.barcode || '',
    name: p.name,
    officialName: p.officialName || undefined,
    brand: p.brand || undefined,
    gender: (p.gender as any) || 'Unisex',
    category: 'Esencias para Perfume',
    price: Number(p.price || 0),
    priceHalf: Number((p as any).priceHalf || 0),
    cost: Number(p.cost || 0),
    stock: Number(p.stock || 0),
    stockHalf: Number((p as any).stockHalf || 0),
    minStock: Number(p.minStock || 0),
    unit: p.unit || 'Onza',
    imageUrl: p.imageUrl || '',
    isAvailableOnline: p.isAvailableOnline !== false,
  }));

  // 1. Cargar y recortar logo oficial de Aromaniak en alta resolución (/logo.png 1024x409 -> 994x176)
  const rawLogoPath = path.join(__dirname, '../public/logo.png');
  const croppedLogoPath = '/tmp/aromaniak_logo_cropped.png';
  execSync(
    `python3 -c '
from PIL import Image
im = Image.open("${rawLogoPath}").convert("RGBA")
w, h = im.size
sx, sy, sw, sh = round(w * 0.0117), round(h * 0.264), round(w * 0.9707), round(h * 0.4303)
crop = im.crop((sx, sy, sx + sw, sy + sh))
crop.save("${croppedLogoPath}", "PNG")
'`
  );
  const logoB64 = fs.readFileSync(croppedLogoPath).toString('base64');
  const logoImg: CatalogImageAsset = {
    dataUrl: `data:image/png;base64,${logoB64}`,
    width: 994,
    height: 176,
  };

  // 2. Generar recorte limpio de la botella manteniendo píxeles 1:1 exactos (sin deformar 768x1024) sobre fondo blanco puro (#ffffff)
  const bottleWebpPath = path.join(__dirname, '../public/images/essence_bottle_blank.webp');
  const croppedBottlePath = '/tmp/aromaniak_bottle_cropped.jpg';
  execSync(
    `python3 -c '
from PIL import Image
im = Image.open("${bottleWebpPath}").convert("RGBA")
w, h = im.size
bg = Image.new("RGBA", (w, h), (255, 255, 255, 255))
comp = Image.alpha_composite(bg, im).convert("RGB")
crop = comp.crop((180, 148, 588, 908))
crop.save("${croppedBottlePath}", "JPEG", quality=92)
'`
  );

  const bottleB64 = fs.readFileSync(croppedBottlePath).toString('base64');
  const bottleImg: CatalogImageAsset = {
    dataUrl: `data:image/jpeg;base64,${bottleB64}`,
    width: 408,
    height: 760,
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const { totalPages } = buildAromaniakCatalogJsPdfDocument(
    doc,
    products,
    logoImg,
    bottleImg,
    new Date()
  );

  const pdfPath = path.join(__dirname, '../public/catalogo-aromaniak.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(pdfPath, pdfBuffer);

  const stats = fs.statSync(pdfPath);
  const sizeKb = stats.size / 1024;
  console.log(`PDF successfully created at: ${pdfPath} (${totalPages} pages, ${sizeKb.toFixed(1)} KB)`);

  // Copiar a Downloads y artifact
  const downloadsPath = '/Users/luis/Downloads/catalogo-aromaniak.pdf';
  try {
    fs.copyFileSync(pdfPath, downloadsPath);
  } catch {
    // ignore
  }

  const artifactPath =
    '/Users/luis/.gemini/antigravity/brain/83c36dfc-5c6a-4bfc-b06a-3fd7c5fac554/catalogo-aromaniak.pdf';
  if (fs.existsSync(path.dirname(artifactPath))) {
    fs.copyFileSync(pdfPath, artifactPath);
  }

  await prisma.$disconnect();
}

generateAromaniakCatalog().catch(console.error);
