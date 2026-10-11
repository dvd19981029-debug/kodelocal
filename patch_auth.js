const fs = require('fs');

const path = 'src/app/api/customer/auth/route.ts';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Find the register existing check
  const existingCheckOld = `      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.' },
          { status: 409 }
        );
      }`;
  
  const existingCheckNew = `      const passwordHash = hashPassword(password);
      const avatarUrl = \`https://api.dicebear.com/7.x/initials/svg?seed=\${encodeURIComponent(cleanName)}\`;

      if (existing) {
        if (existing.passwordHash || existing.googleId) {
          return NextResponse.json(
            { success: false, error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.' },
            { status: 409 }
          );
        } else {
          // El cliente fue creado desde el POS (sin contraseña). Le asignamos la contraseña para que reclame su cuenta.
          const updatedCustomer = await prisma.customer.update({
            where: { id: existing.id },
            data: {
              passwordHash,
              avatarUrl: existing.avatarUrl || avatarUrl,
              phone: existing.phone || sanitizePhone(phone) || '',
              department: existing.department || sanitizeText(department, 50) || 'San Salvador',
              municipality: existing.municipality || sanitizeText(municipality, 60) || 'San Salvador Centro',
              address: existing.address || sanitizeText(address, 255) || '',
            }
          });
          
          const sessionToken = createCustomerToken(updatedCustomer.id, updatedCustomer.email || '');
          
          return NextResponse.json({
            success: true,
            sessionToken,
            customer: {
              id: updatedCustomer.id,
              name: updatedCustomer.name,
              email: updatedCustomer.email,
              phone: updatedCustomer.phone || '',
              documentType: updatedCustomer.documentType || 'DUI',
              documentNum: updatedCustomer.documentNum || '',
              department: updatedCustomer.department || 'San Salvador',
              municipality: updatedCustomer.municipality || 'San Salvador',
              address: updatedCustomer.address || '',
              nrc: updatedCustomer.nrc || '',
              businessName: updatedCustomer.businessName || '',
              activityDesc: updatedCustomer.activityDesc || '',
              avatarUrl: updatedCustomer.avatarUrl,
              authProvider: 'credentials',
              sessionToken,
            },
          });
        }
      }`;

  // We have to remove the old const passwordHash = hashPassword(password); because we moved it up.
  const oldHash = `      const passwordHash = hashPassword(password);
      const avatarUrl = \`https://api.dicebear.com/7.x/initials/svg?seed=\${encodeURIComponent(cleanName)}\`;`;
  
  code = code.replace(oldHash, '');
  code = code.replace(existingCheckOld, existingCheckNew);

  fs.writeFileSync(path, code);
  console.log('Patched customer auth route to allow claiming POS accounts');
}
