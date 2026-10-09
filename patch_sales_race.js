const fs = require('fs');
const path = 'src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix missing items validation
const postValidationRegex = /const \{[\s\S]*?\} = body;/;
const validationFix = `$&

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Venta Fantasma Detectada: La orden no puede ser procesada sin artículos.' }, { status: 400 });
    }
`;
code = code.replace(postValidationRegex, validationFix);

// 2. Fix Kardex math when hitting zero
const kardexRegex = /const newStock = updatedRows && updatedRows\.length > 0 \? updatedRows\[0\]\.stock : 0;\s*const previousStock = newStock \+ totalDeduct;\s*kardexData\.push\(\{[\s\S]*?\}\);/g;
const kardexFix = `const newStock = updatedRows && updatedRows.length > 0 ? updatedRows[0].stock : 0;
            // The ACTUAL previous stock is what was in memory (prod.stock) but just to be safe if race conditions happen, we know actual deduction is (prod.stock - newStock).
            // Actually, if we hit 0 from 3 with deduct 6, actual deduction was 3.
            // Let's use Prisma's atomic $queryRaw to get accurate previous stock:
            // We already did the update, so we don't know the exact previous stock if it was updated by someone else simultaneously.
            // BUT we DO know that previousStock = newStock + actualDeducted.
            // Wait, "stock" = GREATEST(0, "stock" - 6). If it was 3, new is 0. 
            // So actual deducted = previous - 0. But we don't know previous!
            // Let's fix the SQL to return the old stock too!
`;

// Wait, I will just rewrite the SQL block.
