const fs = require('fs');
const path = 'src/app/producto/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const imgRegex = /<img[\s\S]*?src=\{productImage\}[\s\S]*?className=\{`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 \$\{[\s\S]*?\}`\}\s*\/>/;

const cssOverlay = `
              <img
                src={productImage}
                alt={displayName}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = isBottle 
                    ? '/images/botes/bote_100ml_degrade_azul_noche.jpg'
                    : '/images/essence_bottle_blank.webp';
                }}
                className={\`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 \${
                  isOutOfStock ? 'grayscale-[35%]' : ''
                }\`}
              />
              
              {/* Overlay CSS para el nombre dinámico del bote de esencia */}
              {productImage === '/images/essence_bottle_blank.webp' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105" style={{ top: '8%', left: '0%' }}>
                  <div className="flex flex-col items-center justify-center w-[45%] text-center">
                    <span className="text-[#111111] font-[800] tracking-wide leading-none" style={{
                      fontSize: displayName.length > 25 ? '0.75rem' : displayName.length > 15 ? '0.9rem' : '1.1rem'
                    }}>
                      {displayName.toUpperCase().replace(/\\s+[HFU]$/i, '')}
                    </span>
                    <div className="mt-[3px] w-[30%] h-[2px] bg-[#111111]"></div>
                  </div>
                </div>
              )}
`;

code = code.replace(imgRegex, cssOverlay);

fs.writeFileSync(path, code);
