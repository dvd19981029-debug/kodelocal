const fs = require('fs');
const file = 'src/app/api/suppliers/route.ts';
let code = fs.readFileSync(file, 'utf8');

const newPost = `
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, contactPerson, nit, nrc, phone, email, address, category, creditDays, notes } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'El nombre del proveedor es obligatorio' }, { status: 400 });
    }

    let supplier;
    if (id && !id.startsWith('SUP-')) {
      supplier = await prisma.supplier.update({
        where: { id },
        data: { name, contactPerson, nit, nrc, phone, email, address, category: category || 'Esencias & Fragancias', creditDays: Number(creditDays || 0), notes },
      });
    } else {
      supplier = await prisma.supplier.create({
        data: { name, contactPerson, nit, nrc, phone, email, address, category: category || 'Esencias & Fragancias', creditDays: Number(creditDays || 0), notes },
      });
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`;

code = code.replace(/export async function POST\(request: Request\) \{[\s\S]*$/, newPost);
fs.writeFileSync(file, code);
console.log('Patched Suppliers API');
