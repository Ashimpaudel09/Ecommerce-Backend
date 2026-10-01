import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { DATABASE_URL } from '../src/config/env';

const adapter = new PrismaPg({ connectionString: DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Clothing', slug: 'clothing' },
  { name: 'Books', slug: 'books' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Sports', slug: 'sports' },
];

const productsByCategorySlug: Record<
  string,
  { name: string; description: string; priceCents: number; stock: number }[]
> = {
  electronics: [
    { name: 'Wireless Noise-Cancelling Headphones', description: 'Over-ear headphones with 30hr battery life.', priceCents: 14999, stock: 50 },
    { name: 'Mechanical Keyboard 60%', description: 'Compact mechanical keyboard with RGB backlighting.', priceCents: 8999, stock: 30 },
    { name: 'USB-C Hub 7-in-1', description: 'Expand your laptop ports with HDMI, USB 3.0, SD card.', priceCents: 4999, stock: 75 },
    { name: '27" 4K IPS Monitor', description: '4K UHD monitor with 99% sRGB and 60Hz refresh rate.', priceCents: 39999, stock: 20 },
  ],
  clothing: [
    { name: 'Classic Cotton T-Shirt', description: '100% organic cotton, unisex fit.', priceCents: 1499, stock: 200 },
    { name: 'Slim Fit Chino Pants', description: 'Stretch fabric for all-day comfort.', priceCents: 4999, stock: 80 },
    { name: 'Waterproof Hiking Jacket', description: 'Windproof and waterproof for outdoor adventures.', priceCents: 12999, stock: 40 },
    { name: 'Merino Wool Crew Socks (3-Pack)', description: 'Ultra-soft merino wool, keeps feet dry.', priceCents: 2499, stock: 150 },
  ],
  books: [
    { name: 'Clean Code by Robert C. Martin', description: 'A handbook of agile software craftsmanship.', priceCents: 3499, stock: 60 },
    { name: 'The Pragmatic Programmer', description: 'Journey to mastery of software craftsmanship.', priceCents: 3999, stock: 55 },
    { name: 'Designing Data-Intensive Applications', description: 'The big ideas behind reliable, scalable systems.', priceCents: 4999, stock: 45 },
    { name: 'You Don\'t Know JS Yet (Book 1)', description: 'Deep dive into the JavaScript language.', priceCents: 2999, stock: 70 },
  ],
  'home-kitchen': [
    { name: 'Bamboo Cutting Board Set', description: 'Set of 3 eco-friendly bamboo cutting boards.', priceCents: 2999, stock: 90 },
    { name: 'Stainless Steel French Press', description: '34oz French press with double-wall insulation.', priceCents: 3999, stock: 60 },
    { name: 'Cast Iron Skillet 10"', description: 'Pre-seasoned cast iron for stovetop or oven use.', priceCents: 5999, stock: 35 },
    { name: 'Air Purifier HEPA H13', description: 'Covers 500 sq ft, removes 99.97% of particles.', priceCents: 11999, stock: 25 },
  ],
  sports: [
    { name: 'Resistance Band Set (5 Levels)', description: 'Full-body workout bands for home gym training.', priceCents: 2499, stock: 120 },
    { name: 'Adjustable Dumbbell 5–52.5 lbs', description: 'Replaces 15 sets of weights with a click-dial system.', priceCents: 29999, stock: 15 },
    { name: 'Yoga Mat Non-Slip 6mm', description: 'Eco-friendly TPE mat with alignment lines.', priceCents: 3999, stock: 85 },
    { name: 'Running Water Bottle 32oz', description: 'BPA-free Tritan with leak-proof lid.', priceCents: 1999, stock: 100 },
  ],
};

async function seed() {
  console.log('🌱 Seeding database...');

  // Upsert categories
  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );
  console.log(`✅ ${createdCategories.length} categories created/updated`);

  // Map slug → id
  const categoryMap = createdCategories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {});

  // Upsert products
  let productCount = 0;
  for (const [slug, products] of Object.entries(productsByCategorySlug)) {
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: `seed-${slug}-${p.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}` },
        update: {},
        create: {
          id: `seed-${slug}-${p.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`,
          ...p,
          categoryId: categoryMap[slug],
        },
      });
      productCount++;
    }
  }
  console.log(`✅ ${productCount} products created/updated`);
  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
