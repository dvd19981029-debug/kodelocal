const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add @container to the Link wrapper
code = code.replace(
  /className=\{`block relative w-full aspect-square clay-card/g,
  'className={`block relative w-full aspect-square @container clay-card'
);

// 2. Replace the old overlay
const overlayRegex = /\{\/\* Overlay CSS para el nombre dinámico del bote de esencia \*\/\}[\s\S]*?\)\}/;
const newOverlay = `
              {/* Overlay CSS para el nombre dinámico del bote de esencia */}
              {productImage === '/images/essence_bottle_blank.webp' && (
                <div className="absolute inset-0 pointer-events-none transition-transform duration-500 group-hover:scale-[1.08] origin-center">
                  <div className="absolute flex flex-col items-center justify-center w-full" style={{ top: '65.5%', left: '0%' }}>
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
              )}
`;

code = code.replace(overlayRegex, newOverlay.trim());
fs.writeFileSync(path, code);
