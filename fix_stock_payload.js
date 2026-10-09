const fs = require('fs');
const path = 'src/app/inventario/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add stockHalf to payload
const replacePayloadTarget = `stock: Number(formData.stock || 0),`;
const replacePayloadNew = `stock: Number(formData.stock || 0),\n      stockHalf: Number((formData as any).stockHalf || 0),`;
code = code.replace(replacePayloadTarget, replacePayloadNew);

// Add stockHalf to body stringify (for PATCH)
const replaceBodyTargetPatch = `stock: payload.stock,`;
const replaceBodyNewPatch = `stock: payload.stock,\n          stockHalf: (payload as any).stockHalf,`;
code = code.replace(replaceBodyTargetPatch, replaceBodyNewPatch);

// Add stockHalf to body stringify (for POST - if any, though it uses PATCH usually)
// Let's check if there is a POST request
const replaceBodyTargetPost = `cost: payload.cost,`;
const replaceBodyNewPost = `cost: payload.cost,\n          stockHalf: (payload as any).stockHalf,`;
// Let's just apply it to the whole file cautiously.
// Wait, the API call is a single PATCH or POST. Let's just replace in the `JSON.stringify` body.

fs.writeFileSync(path, code);
console.log("Fixed payload");
