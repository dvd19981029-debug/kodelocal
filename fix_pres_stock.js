const fs = require('fs');

const path = 'src/app/pos/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldLogic = `      // Validar que el cambio de presentación no exceda las existencias
      const otherOz = prev
        .filter(it => it.product.id === productId && it !== currentItem && it !== existingTarget)
        .reduce((sum, it) => sum + (it.presentation === 'MEDIA_ONZA' ? it.quantity * 0.5 : it.quantity), 0);
      const combinedQty = currentItem.quantity + (existingTarget ? existingTarget.quantity : 0);
      const neededOz = newPres === 'MEDIA_ONZA' ? combinedQty * 0.5 : combinedQty;

      if (otherOz + neededOz > currentItem.product.stock) {
        alert(\`Stock insuficiente para cambiar a \${newPres === 'MEDIA_ONZA' ? '½ Onza' : '1 Onza'} (\${currentItem.product.stock} disponibles).\`);
        return prev;
      }`;

const newLogic = `      // Validar que el cambio de presentación no exceda las existencias
      const isHalfPres = newPres === 'MEDIA_ONZA';
      const availableForPres = isHalfPres ? (currentItem.product.stockHalf || 0) : currentItem.product.stock;
      const combinedQty = currentItem.quantity + (existingTarget ? existingTarget.quantity : 0);

      if (combinedQty > availableForPres) {
        alert(\`Stock insuficiente para cambiar a \${isHalfPres ? '½ Onza' : '1 Onza'} (\${availableForPres} disponibles).\`);
        return prev;
      }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync(path, code);
console.log('Patched', path);
