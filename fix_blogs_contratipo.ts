import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.blogPost.findMany();
  for (const post of posts) {
    let updated = false;
    let newTitle = post.title;
    let newExcerpt = post.excerpt;
    let newContent = post.content;
    let newSeoTitle = post.seoTitle;
    let newSeoDesc = post.seoDesc;

    if (newTitle.includes('Contratipo') || newTitle.includes('contratipo')) {
      newTitle = newTitle.replace(/Contratipos/g, 'Inspiraciones').replace(/contratipos/g, 'inspiraciones').replace(/Contratipo/g, 'Inspiración').replace(/contratipo/g, 'inspiración');
      updated = true;
    }
    if (newExcerpt.includes('Contratipo') || newExcerpt.includes('contratipo')) {
      newExcerpt = newExcerpt.replace(/Contratipos/g, 'Inspiraciones').replace(/contratipos/g, 'inspiraciones').replace(/Contratipo/g, 'Inspiración').replace(/contratipo/g, 'inspiración');
      updated = true;
    }
    if (newContent.includes('Contratipo') || newContent.includes('contratipo')) {
      newContent = newContent.replace(/Contratipos/g, 'Inspiraciones').replace(/contratipos/g, 'inspiraciones').replace(/Contratipo/g, 'Inspiración').replace(/contratipo/g, 'inspiración');
      updated = true;
    }
    if (newSeoTitle && (newSeoTitle.includes('Contratipo') || newSeoTitle.includes('contratipo'))) {
      newSeoTitle = newSeoTitle.replace(/Contratipos/g, 'Inspiraciones').replace(/contratipos/g, 'inspiraciones').replace(/Contratipo/g, 'Inspiración').replace(/contratipo/g, 'inspiración');
      updated = true;
    }
    if (newSeoDesc && (newSeoDesc.includes('Contratipo') || newSeoDesc.includes('contratipo'))) {
      newSeoDesc = newSeoDesc.replace(/Contratipos/g, 'Inspiraciones').replace(/contratipos/g, 'inspiraciones').replace(/Contratipo/g, 'Inspiración').replace(/contratipo/g, 'inspiración');
      updated = true;
    }

    if (updated) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          title: newTitle,
          excerpt: newExcerpt,
          content: newContent,
          seoTitle: newSeoTitle,
          seoDesc: newSeoDesc
        }
      });
      console.log(`Updated post: ${post.slug}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
