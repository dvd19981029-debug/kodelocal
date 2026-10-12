sed -i '' -e 's/where: { email: normalizedEmail },/where: { email: normalizedEmail },\n        include: { tier: true },/g' src/app/api/customer/auth/route.ts
sed -i '' -e '/authProvider:/a\
          tierId: customer.tierId || null,\
          tier: customer.tier || null,\
' src/app/api/customer/auth/route.ts
sed -i '' -e '/authProvider: updatedCustomer.googleId/a\
          tierId: updatedCustomer.tierId || null,\
          tier: updatedCustomer.tier || null,\
' src/app/api/customer/auth/route.ts
sed -i '' -e '/where: { id: customerId },/c\
        where: { id: customerId },\
        include: { tier: true },\
' src/app/api/customer/auth/route.ts
sed -i '' -e '/authProvider: updated.googleId/a\
          tierId: updated.tierId || null,\
          tier: updated.tier || null,\
' src/app/api/customer/auth/route.ts
