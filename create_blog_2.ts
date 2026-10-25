import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const content = `
<h2>Crea Fragancias de Lujo desde Cero</h2>
<p>Elaborar tu propio perfume puede parecer magia, pero en realidad es una ciencia exacta que cualquier apasionado o emprendedor puede dominar. Si estás en El Salvador y quieres adentrarte en el mundo de la <strong>perfumería fina</strong>, has llegado al lugar correcto. Con las materias primas, botes y esencias reales de <strong>Aromaniak SV</strong>, tienes todo listo en un solo lugar.</p>

<h3>Lo que necesitas para empezar (Insumos Reales en Aromaniak)</h3>
<p>Para formular una fragancia que rivalice con las grandes marcas de diseñador, la calidad de los ingredientes es innegociable. En Aromaniak trabajamos con los siguientes componentes reales al por mayor y al detalle:</p>
<ol>
  <li><strong>Esencia 100% pura sin diluir (Inspiraciones):</strong> Es el corazón de tu perfume. En Aromaniak ofrecemos más de 80 esencias importadas de calidad AAA+ en presentaciones de <strong>1 Onza ($3.75)</strong> y <strong>½ Onza ($1.90)</strong>.</li>
  <li><strong>Alcohol especial para perfumería con fijador:</strong> A diferencia del alcohol médico o etílico común, en Aromaniak contamos con <strong>Alcohol Perfumero con Fijador DEL CARIBE</strong> en presentaciones de <strong>Medio Litro ($2.30)</strong> y <strong>1 Litro ($3.80)</strong>, de grado cosmético desodorizado y <strong>ya preparado con fijador</strong>.</li>
  <li><strong>Fijador (Aclaración clave):</strong> De fijador son <strong>una o dos gotas solo si el alcohol no va preparado</strong>; <strong>si el alcohol ya va preparado (como el Alcohol Perfumero con Fijador de Aromaniak), no hay que agregar fijador</strong>.</li>
  <li><strong>Bote de vidrio de 100 ml con atomizador de rosca:</strong> Todos los frascos de Aromaniak son de <strong>100 ml con cierre de rosca hermética</strong> (desde <strong>$1.45 a $1.50</strong>), listos para cerrar manualmente sin necesidad de máquina selladora.</li>
</ol>

<h3>La Fórmula del Éxito: Concentraciones Reales para 100 ml de Perfume</h3>
<p>Las concentraciones en las que se trabaja en Aromaniak son de <strong>una onza (1 oz) o una onza y media (1.5 oz) como máximo para 100 ml de perfume</strong>; es decir, <strong>30 ml o 45 ml de esencias y lo demás de alcohol</strong> (aproximadamente 70 ml o 55 ml de alcohol para perfumería). Es importante aclarar que <strong>la onza y media onza suelen equivaler a 30 o 45 ml</strong> (1 onza ≈ 30 ml y 1 onza y media ≈ 45 ml al sumar ½ onza) <strong>dependiendo del peso (densidad) del líquido</strong>.</p>

<p><strong>Ejemplo práctico real para un frasco de 100 ml en Aromaniak:</strong></p>
<ul>
  <li><strong>Fórmula Estándar (1 Onza):</strong> <strong>30 ml aprox. (1 onza</strong>, según el peso del líquido) de tu esencia favorita de Aromaniak + <strong>lo demás de alcohol (aprox. 70 ml)</strong>.</li>
  <li><strong>Fórmula Máxima / Plus (1 Onza y Media como máximo):</strong> <strong>45 ml aprox. (1.5 onzas: 1 onza + ½ onza</strong>, según el peso del líquido) de esencia pura + <strong>lo demás de alcohol (aprox. 55 ml)</strong>.</li>
  <li><strong>Sobre el fijador:</strong> Si utilizas el <strong>Alcohol Perfumero con Fijador de Aromaniak</strong> (que ya va preparado), <strong>no hay que agregar fijador</strong>. Únicamente si trabajas con un alcohol que <strong>no</strong> va preparado, se agregan <strong>solo 1 o 2 gotas de fijador</strong>.</li>
</ul>

<h3>Paso a Paso de la Elaboración</h3>
<p>El proceso de mezcla en tu frasco de 100 ml es sencillo pero requiere paciencia para la maceración:</p>
<ul>
  <li><strong>Paso 1:</strong> En tu <strong>bote de vidrio de 100 ml</strong> (o vaso medidor de vidrio), vierte primero la esencia pura: <strong>1 onza (~30 ml)</strong> o <strong>1 onza y media (~45 ml) como máximo</strong>.</li>
  <li><strong>Paso 2:</strong> Completa el resto de los 100 ml con el <strong>Alcohol especial para perfumería</strong> (aprox. 70 ml o 55 ml).</li>
  <li><strong>Paso 3 (Fijador):</strong> Si tu alcohol <strong>ya va preparado con fijador</strong> (como el de Aromaniak), <strong>no hay que agregar nada más</strong>. Solo si usas un alcohol que no va preparado, añade únicamente <strong>1 o 2 gotas de fijador</strong>.</li>
  <li><strong>Paso 4: Envasado.</strong> Enrosca con la mano el atomizador de tu <strong>bote de vidrio de 100 ml de Aromaniak</strong> y agita suavemente con movimientos circulares para integrar la mezcla.</li>
  <li><strong>Paso 5: La Maceración.</strong> Este es el secreto de los profesionales. Guarda tu frasco cerrado en un lugar oscuro y fresco por al menos 7 a 15 días. Esto permite que las moléculas de la esencia y el alcohol se enlacen perfectamente, logrando que las notas olfativas florezcan con máxima duración.</li>
</ul>

<h3>Potencia tu Negocio con Aromaniak</h3>
<p>Si tu objetivo es comercializar estas fragancias o disfrutarlas en tu día a día, en Aromaniak somos importadores directos de esencias 100% puras, botes de vidrio de 100 ml de rosca ($1.45 a $1.50), alcohol perfumero con fijador y cajas de cartón para 100 ml ($0.50). Además, en nuestra web cuentas con la sección <strong>«Arma tu propio perfume»</strong> por si prefieres recibir tu frasco de 100 ml ya preparado con 1 onza o 1 onza y media de esencia.</p>

<p>Recuerda que todos los insumos están disponibles en nuestra sucursal en <strong>Centro Comercial El Rosal, Calle El Progreso, San Salvador</strong> y con entrega a domicilio a los 14 departamentos por $2.99. ¡Empieza tu viaje olfativo hoy mismo con Aromaniak!</p>
`;

  const slug = "guia-como-preparar-perfume-con-esencias-aromaniak";

  await prisma.blogPost.upsert({
    where: { slug },
    create: {
      slug,
      title: "Guía Definitiva: Cómo Preparar tu Propio Perfume con Insumos de Aromaniak",
      content,
      excerpt: "Aprende las fórmulas, proporciones y secretos profesionales para fabricar perfumes de alta duración con esencias y alcohol de Aromaniak El Salvador.",
      coverImage: "/images/promo/banner_arma_tu_perfume.webp",
      author: "Expertos Aromaniak",
      category: "Guías y Tutoriales",
      tags: "como hacer perfumes, esencias, alcohol perfumista, aromaniak, el salvador, tutorial",
      metaTitle: "Cómo Hacer Perfumes Duraderos | Guía Aromaniak",
      metaDescription: "Aprende paso a paso cómo fabricar tu propio perfume utilizando esencias puras, contratipos y alcohol de perfumería con Aromaniak.",
      canonicalUrl: "https://aromaniaksv.com/blog/" + slug,
      isPublished: true,
      readingTimeMin: 4,
    },
    update: {}
  });

  console.log("Blog post 2 creado con éxito!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
