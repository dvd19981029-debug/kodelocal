const fs = require('fs');
const path = 'src/app/producto/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const schemaInjection = `
  const productSchemaUrl = \`https://aromaniaksv.com/producto/\${product.id}\`;
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": displayName,
    "image": [
      \`https://aromaniaksv.com\${productImage}\`
    ],
    "description": product.description || \`Insumo de perfumería fina Aromaniak: \${displayName}.\`,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "Aromaniak"
    },
    "offers": {
      "@type": "Offer",
      "url": productSchemaUrl,
      "priceCurrency": "USD",
      "price": activeOption.price.toFixed(2),
      "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Aromaniak SV"
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 pt-1">
      {/* SEO Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
`;

code = code.replace(/return \(\n\s*<div className="space-y-6 sm:space-y-8 pb-20 pt-1">/, schemaInjection);
fs.writeFileSync(path, code);
