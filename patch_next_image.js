const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Agregar import Image
const importRegex = /import Link from 'next\/link';/;
const importReplacement = `import Link from 'next/link';\nimport Image from 'next/image';`;
if (!code.includes("import Image from 'next/image'")) {
  code = code.replace(importRegex, importReplacement);
}

// Reemplazar <img> con <Image>
// Necesitamos usar un truco con useState para onError si queremos
// Pero como productImage siempre viene del API o de una ruta segura,
// podemos obviar el onError por ahora o manejarlo de otra forma.

// Buscamos el tag img y lo reemplazamos
const imgRegex = /<img[\s\S]*?src=\{productImage\}[\s\S]*?alt=\{displayName\}[\s\S]*?className=\{`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108 \$\{[\s\S]*?isOutOfStock \? 'grayscale-\[35%\]' : ''[\s\S]*?\}`\}[\s\S]*?\/>/;

const imgReplacement = `<Image
              src={productImage}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={\`object-cover object-center transition-transform duration-500 group-hover:scale-108 \${
                isOutOfStock ? 'grayscale-[35%]' : ''
              }\`}
              onError={(e: any) => {
                e.currentTarget.src = product.category === 'Botes' 
                  ? '/images/botes/bote_100ml_degrade_azul_noche.jpg'
                  : '/images/essence_bottle_blank.png';
              }}
            />`;

code = code.replace(imgRegex, imgReplacement);

fs.writeFileSync(path, code);
