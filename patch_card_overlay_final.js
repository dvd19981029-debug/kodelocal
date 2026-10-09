const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="flex flex-col items-center justify-center w-\[45%\] text-center">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const replacement = `<div className="flex flex-col items-center justify-center w-[31%] text-center">
                    <span className="text-[#111111] font-[800] tracking-wide leading-none" style={{
                      fontSize: displayName.length > 25 ? '2.5cqw' : displayName.length > 15 ? '2.9cqw' : '3.4cqw'
                    }}>
                      {displayName.toUpperCase().replace(/\\s+[HFU]$/i, '')}
                    </span>
                    <div className="mt-[1.5cqw] w-[30%] h-[2px] bg-[#111111]"></div>
                  </div>
                </div>
              </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
