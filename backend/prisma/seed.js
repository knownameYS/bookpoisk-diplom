import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const userPass = await bcrypt.hash('Demo123!', 10);

  const admin = await prisma.users.upsert({
    where: { email: 'admin@bookpoisk.local' },
    update: {},
    create: { username: 'admin', email: 'admin@bookpoisk.local', password_hash: adminPass, role: 'admin' }
  });

  const demo = await prisma.users.upsert({
    where: { email: 'demo@bookpoisk.local' },
    update: {},
    create: { username: 'demo', email: 'demo@bookpoisk.local', password_hash: userPass, role: 'user' }
  });

  const [g1, g2] = await Promise.all([
    prisma.genres.upsert({ where: { name: 'Fantasy' }, update: {}, create: { name: 'Fantasy', description: 'Magic and adventure' } }),
    prisma.genres.upsert({ where: { name: 'Sci-Fi' }, update: {}, create: { name: 'Sci-Fi', description: 'Science fiction' } })
  ]);

  const a1 = await prisma.authors.create({ data: { full_name: 'Ursula Le Guin', bio: 'American author' } });
  const b1 = await prisma.books.create({
    data: {
      title: 'A Wizard of Earthsea',
      publication_year: 1968,
      language: 'en',
      description: 'Classic fantasy novel',
      status: 'published',
      added_by_user_id: admin.id,
      book_authors: { create: [{ author_id: a1.id, author_order: 1, role: 'Author' }] },
      book_genres: { create: [{ genre_id: g1.id }] }
    }
  });

  await prisma.ratings.upsert({
    where: { user_id_book_id: { user_id: demo.id, book_id: b1.id } },
    update: {},
    create: {
      user_id: demo.id,
      book_id: b1.id,
      architecture: 8,
      characters: 9,
      lang_style: 9,
      idea: 8,
      vibe: 10,
      final_score: 71
    }
  });

  console.log('Seed complete', { admin: admin.email, demo: demo.email });
}

main().finally(async () => prisma.$disconnect());
