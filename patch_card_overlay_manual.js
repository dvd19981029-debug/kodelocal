const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\{productImage === '\/images\/essence_bottle_blank\.webp' && \([\s\S]*?\)\}/;
const replacement = `{productImage === '/images/essence_bottle_blank.webp' && (
              <div className="absolute inset-0 pointer-events-none transition-transform duration-500 group-hover:scale-[1.08] origin-center">
                <div className="absolute flex flex-col items-center justify-center w-full -translate-y-1/2" style={{ top: '65.5%', left: '0%' }}>
                  <div className="flex flex-col items-center justify-center w-[45%] text-center">
                    <span className="text-[#111111] font-[800] tracking-wide leading-none" style={{
                      fontSize: displayName.length > 25 ? '3.5cqw' : displayName.length > 15 ? '4.2cqw' : '5cqw'
                    }}>
                      {displayName.toUpperCase().replace(/\\s+[HFU]$/i, '')}
                    </span>
                    <div className="mt-[1.5cqw] w-[30%] h-[2px] bg-[#111111]"></div>
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
