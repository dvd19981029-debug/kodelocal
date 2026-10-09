import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const content = `
<h2>Crea Fragancias de Lujo desde Cero</h2>
<p>Elaborar tu propio perfume puede parecer magia, pero en realidad es una ciencia exacta que cualquier apasionado puede dominar. Si estás en El Salvador y quieres adentrarte en el mundo de la <strong>perfumería fina</strong>, has llegado al lugar correcto. Con las materias primas y esencias de Aromaniak, el límite es tu imaginación.</p>

<h3>Lo que necesitas para empezar</h3>
<p>Para formular una fragancia que rivalice con las grandes marcas de diseñador, la calidad de los ingredientes es innegociable. Necesitarás tres componentes básicos que puedes encontrar al por mayor y detalle en Aromaniak:</p>
<ol>
  <li><strong>Esencia pura (Contratipos):</strong> Es el corazón de tu perfume. En Aromaniak ofrecemos esencias importadas de calidad AAA+ inspiradas en las tendencias olfativas más buscadas del mundo.</li>
  <li><strong>Alcohol Perfumista:</strong> A diferencia del alcohol médico o etílico común, el alcohol de perfumería tiene grado cosmético y está desodorizado, lo que permite que las notas de la esencia brillen sin olor a farmacia.</li>
  <li><strong>Fijador (Opcional pero recomendado):</strong> Un buen fijador molecular ayuda a estabilizar la mezcla y prolonga la duración (longevidad) del aroma en la piel.</li>
</ol>

<h3>La Fórmula del Éxito: Proporciones de un <em>Eau de Parfum</em></h3>
<p>La concentración de la esencia es lo que define si tu creación es un agua de colonia, un <em>eau de toilette</em> (EDT), un <em>eau de parfum</em> (EDP) o un extracto puro. Para lograr una excelente fijación y proyección, en Aromaniak recomendamos trabajar en una concentración del <strong>30% al 33%</strong> de esencia pura.</p>

<p><strong>Ejemplo práctico para un frasco de 100ml:</strong></p>
<ul>
  <li>30 ml (aprox. 1 onza) de tu esencia favorita de Aromaniak.</li>
  <li>70 ml de Alcohol para perfumería.</li>
  <li>1 o 2 ml de fijador para sellar las notas.</li>
</ul>

<h3>Paso a Paso de la Elaboración</h3>
<p>El proceso de mezcla es sencillo pero requiere paciencia para el proceso de maceración:</p>
<ul>
  <li><strong>Paso 1:</strong> En un vaso medidor de vidrio, vierte primero la esencia pura.</li>
  <li><strong>Paso 2:</strong> Agrega lentamente el alcohol de perfumería mientras mezclas suavemente con una varilla de vidrio.</li>
  <li><strong>Paso 3:</strong> Si utilizas fijador, añádelo en este momento y revuelve hasta que la mezcla sea homogénea.</li>
  <li><strong>Paso 4:</strong> Envasado. Utiliza los <strong>envases de lujo con atomizador</strong> de Aromaniak para darle una presentación espectacular.</li>
  <li><strong>Paso 5: La Maceración.</strong> Este es el secreto de los profesionales. Guarda tu frasco cerrado en un lugar oscuro y fresco por al menos 7 a 15 días. Esto permite que las moléculas de la esencia y el alcohol se enlacen perfectamente, eliminando el olor fuerte a alcohol y permitiendo que las notas olfativas florezcan.</li>
</ul>

<h3>Potencia tu Negocio con Aromaniak</h3>
<p>Si tu objetivo es comercializar estas fragancias, la presentación lo es todo. En Aromaniak no solo somos mayoristas de esencias y aromas químicos; también somos el principal distribuidor de frasquería y botes de vidrio en El Salvador. Desde diseños clásicos y minimalistas hasta frascos vanguardistas y coloridos, tenemos todo lo necesario para que tu marca destaque.</p>

<p>Recuerda que todos los insumos están disponibles con entrega a domicilio a los 14 departamentos. ¡Empieza tu viaje olfativo hoy mismo con Aromaniak!</p>
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
