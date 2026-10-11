const fs = require('fs');

const path = 'src/app/admin/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  
  const searchStr = '<td className="py-2.5 px-3 font-bold text-emerald-600 font-mono">\\s*\\+\\$\\{margen\\.toFixed\\(2\\)\\}.*?<\\/td>';
  const regex = new RegExp(searchStr, 'g');
  
  const replaceStr = `<td className="py-2.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-emerald-600 font-mono text-xs">
                                +\\$\\{margen.toFixed(2)\\} (\\{((margen/p.price)*100).toFixed(0)\\}%)
                              </span>
                              \\{isEssence && (
                                <span className="font-bold text-emerald-500/80 font-mono text-[10px]" title="Margen para frasco de media onza">
                                  ½ Oz: +\\$\\{(halfPriceVal - (p.cost / 2)).toFixed(2)\\} (\\{(((halfPriceVal - (p.cost / 2)) / halfPriceVal)*100).toFixed(0)\\}%)
                                </span>
                              )\\}
                            </div>
                          </td>`;
                          
  const finalStr = replaceStr.replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace(/\\\$/g, '$');

  code = code.replace(regex, finalStr);
  fs.writeFileSync(path, code);
  console.log('Patched admin page margins');
}
