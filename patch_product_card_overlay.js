const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const imgRegex = /<img[\s\S]*?src=\{productImage\}[\s\S]*?alt=\{displayName\}[\s\S]*?className=\{`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108 \$\{[\s\S]*?isOutOfStock \? 'grayscale-\[35%\]' : ''[\s\S]*?\}`\}[\s\S]*?\/>/;

const cssOverlay = `
            <img
              src={productImage}
              alt={displayName}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = product.category === 'Botes' 
                  ? '/images/botes/bote_100ml_degrade_azul_noche.jpg'
                  : '/images/essence_bottle_blank.webp';
              }}
              className={\`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108 \${
                isOutOfStock ? 'grayscale-[35%]' : ''
              }\`}
            />
            {/* Texto superpuesto dinámico mediante HTML/CSS para esencias */}
            {productImage === '/images/essence_bottle_blank.webp' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-108" style={{ top: '8%', left: '0%' }}>
                <div className="flex flex-col items-center justify-center w-[45%] text-center">
                  <span className="text-[#111111] font-[800] tracking-wide leading-none" style={{
                    fontSize: inspiracion.length > 25 ? '0.45rem' : inspiracion.length > 15 ? '0.55rem' : '0.65rem'
                  }}>
                    {inspiracion.toUpperCase().replace(/\\s+[HFU]$/i, '')}
                  </span>
                  <div className="mt-[2px] w-[30%] h-[1px] bg-[#111111]"></div>
                </div>
              </div>
            )}
`;

code = code.replace(imgRegex, cssOverlay);

fs.writeFileSync(path, code);
