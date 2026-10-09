const fs = require('fs');
const path = 'src/components/ecommerce/CartDrawer.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<p className="text-\[10px\] text-slate-500 font-medium truncate" title=\{item\.product\.category === 'Esencias para Perfume' \? \`Inspirado en \$\{getInspiracionPerfumeName\(item\.product\)\}\` : ''\}>\s*\{item\.product\.category === 'Esencias para Perfume' \s*\? \`Inspirado en \$\{getInspiracionPerfumeName\(item\.product\)\}\` \s*: \(item\.product\.unit \|\| 'Unidad'\)\}\s*<\/p>/;

const replacement = `<div className="text-[10px] truncate" title={item.product.category === 'Esencias para Perfume' ? \`Inspirado en \${getInspiracionPerfumeName(item.product)}\` : ''}>
                              {item.product.category === 'Esencias para Perfume' ? (
                                <>
                                  <span className="text-slate-500 font-medium">Inspirado en </span>
                                  <span className="text-slate-700 font-bold text-[11px]">{getInspiracionPerfumeName(item.product)}</span>
                                </>
                              ) : (
                                <span className="text-slate-500 font-medium">{item.product.unit || 'Unidad'}</span>
                              )}
                            </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
