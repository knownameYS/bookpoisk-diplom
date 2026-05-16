import { PrismaClient, ContentStatus, UserRole } from '@prisma/client';
import { hashPassword } from '../src/common/auth.js';
import { calculateRating84 } from '../src/common/rating84.js';

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.reviewReaction.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.profileFeaturedBook.deleteMany();
  await prisma.collectionBook.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.articleComment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.article.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.bookAuthor.deleteMany();
  await prisma.bookGenre.deleteMany();
  await prisma.bookTag.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function createUsers() {
  const [adminPassword, readerPassword, memberPassword] = await Promise.all([
    hashPassword('Admin123!'),
    hashPassword('Reader123!'),
    hashPassword('Member123!')
  ]);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@bookpoisk.local',
      passwordHash: adminPassword,
      fullName: 'Анна Воронцова',
      birthDate: new Date('1990-04-12T00:00:00.000Z'),
      city: 'Москва',
      favoriteGenres: 'нон-фикшн, классика',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Собираю архитектуру каталога и слежу за тем, чтобы книги не терялись.',
      role: UserRole.ADMIN
    }
  });

  const reader = await prisma.user.create({
    data: {
      username: 'reader',
      email: 'reader@bookpoisk.local',
      passwordHash: readerPassword,
      fullName: 'Вера Ковалева',
      birthDate: new Date('1998-09-03T00:00:00.000Z'),
      city: 'Санкт-Петербург',
      favoriteGenres: 'атмосферная проза, философская фантастика',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'Люблю атмосферные романы, философскую фантастику и длинные книжные маршруты.',
      role: UserRole.USER
    }
  });

  const member = await prisma.user.create({
    data: {
      username: 'member',
      email: 'member@bookpoisk.local',
      passwordHash: memberPassword,
      fullName: 'Лев Демидов',
      birthDate: new Date('1988-11-21T00:00:00.000Z'),
      city: 'Казань',
      favoriteGenres: 'детективы, современная проза',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Пишу рецензии, спорю с книгами и собираю полки для будущих разборов.',
      role: UserRole.USER
    }
  });

  return { admin, reader, member };
}

async function createTaxonomy() {
  const authors = await prisma.author.createManyAndReturn({
    data: [
      {
        fullName: 'Урсула Ле Гуин',
        bio: 'Американская писательница, известная философской фантастикой и тонким миростроением.'
      },
      {
        fullName: 'Кормак Маккарти',
        bio: 'Американский писатель, чья проза отличается суровой атмосферой и высокой эмоциональной плотностью.'
      },
      {
        fullName: 'Михаил Булгаков',
        bio: 'Русский писатель и драматург, автор мистической, сатирической и философской прозы.'
      }
    ]
  });

  const genres = await prisma.genre.createManyAndReturn({
    data: [
      { name: 'Фэнтези', description: 'Магия, миф, другие миры и путь героя.' },
      { name: 'Философия', description: 'Книги, в которых центральны идеи, этика и метафизические вопросы.' },
      { name: 'Антиутопия', description: 'Мрачные общества, катастрофы, распад мира и выживание.' },
      { name: 'Классика', description: 'Канонические произведения, сохраняющие художественную и культурную значимость.' }
    ]
  });

  const tags = await prisma.tag.createManyAndReturn({
    data: [
      { name: 'мрачная' },
      { name: 'философская' },
      { name: 'миростроение' },
      { name: 'медленное развитие' },
      { name: 'экзистенциальная' },
      { name: 'сатирическая' }
    ]
  });

  return { authors, genres, tags };
}

function mapByName(items, key = 'name') {
  return Object.fromEntries(items.map((item) => [item[key], item]));
}

async function createBooks(admin, taxonomy) {
  const authors = mapByName(taxonomy.authors, 'fullName');
  const genres = mapByName(taxonomy.genres);
  const tags = mapByName(taxonomy.tags);

  const books = [];

  books.push(
    await prisma.book.create({
      data: {
        title: 'Волшебник Земноморья',
        originalTitle: 'A Wizard of Earthsea',
        description:
          'Роман взросления с точной архитектурой, тихим внутренним напряжением и тщательно выстроенным мифологическим миром.',
        publicationYear: 1968,
        language: 'ru',
        status: ContentStatus.PUBLISHED,
        addedByUserId: admin.id,
        bookAuthors: {
          create: [{ authorId: authors['Урсула Ле Гуин'].id, authorOrder: 1, role: 'Автор' }]
        },
        bookGenres: {
          create: [{ genreId: genres['Фэнтези'].id }, { genreId: genres['Философия'].id }]
        },
        bookTags: {
          create: [
            { tagId: tags['миростроение'].id },
            { tagId: tags['медленное развитие'].id },
            { tagId: tags['философская'].id }
          ]
        }
      }
    })
  );

  books.push(
    await prisma.book.create({
      data: {
        title: 'Дорога',
        originalTitle: 'The Road',
        description:
          'Постапокалиптический роман о выживании, отцовстве и человеческом достоинстве в разрушенном мире.',
        publicationYear: 2006,
        language: 'ru',
        status: ContentStatus.PUBLISHED,
        addedByUserId: admin.id,
        bookAuthors: {
          create: [{ authorId: authors['Кормак Маккарти'].id, authorOrder: 1, role: 'Автор' }]
        },
        bookGenres: {
          create: [{ genreId: genres['Антиутопия'].id }, { genreId: genres['Классика'].id }]
        },
        bookTags: {
          create: [{ tagId: tags['мрачная'].id }, { tagId: tags['экзистенциальная'].id }]
        }
      }
    })
  );

  books.push(
    await prisma.book.create({
      data: {
        title: 'Мастер и Маргарита',
        originalTitle: 'Мастер и Маргарита',
        description:
          'Мистический и сатирический роман, где фантастика, богословие и литературная ирония сталкиваются в Москве.',
        publicationYear: 1967,
        language: 'ru',
        status: ContentStatus.PUBLISHED,
        addedByUserId: admin.id,
        bookAuthors: {
          create: [{ authorId: authors['Михаил Булгаков'].id, authorOrder: 1, role: 'Автор' }]
        },
        bookGenres: {
          create: [
            { genreId: genres['Фэнтези'].id },
            { genreId: genres['Классика'].id },
            { genreId: genres['Философия'].id }
          ]
        },
        bookTags: {
          create: [
            { tagId: tags['сатирическая'].id },
            { tagId: tags['философская'].id },
            { tagId: tags['мрачная'].id }
          ]
        }
      }
    })
  );

  books.push(
    await prisma.book.create({
      data: {
        title: 'Обделённые',
        originalTitle: 'The Dispossessed',
        description:
          'Философский роман о свободе, устройстве общества и цене утопии, поданный через строгую научно-фантастическую оптику.',
        publicationYear: 1974,
        language: 'ru',
        status: ContentStatus.PUBLISHED,
        addedByUserId: admin.id,
        bookAuthors: {
          create: [{ authorId: authors['Урсула Ле Гуин'].id, authorOrder: 1, role: 'Автор' }]
        },
        bookGenres: {
          create: [{ genreId: genres['Философия'].id }, { genreId: genres['Классика'].id }]
        },
        bookTags: {
          create: [
            { tagId: tags['философская'].id },
            { tagId: tags['миростроение'].id },
            { tagId: tags['экзистенциальная'].id }
          ]
        }
      }
    })
  );

  return books;
}

async function createRatings(users, books) {
  const earthsea = books.find((book) => book.title === 'Волшебник Земноморья');
  const road = books.find((book) => book.title === 'Дорога');
  const master = books.find((book) => book.title === 'Мастер и Маргарита');
  const dispossessed = books.find((book) => book.title === 'Обделённые');

  const ratingInputs = [
    {
      userId: users.reader.id,
      bookId: earthsea.id,
      values: { architecture: 8, characters: 8, language: 9, idea: 8, vibe: 9 }
    },
    {
      userId: users.member.id,
      bookId: earthsea.id,
      values: { architecture: 9, characters: 8, language: 9, idea: 9, vibe: 8 }
    },
    {
      userId: users.reader.id,
      bookId: road.id,
      values: { architecture: 8, characters: 9, language: 10, idea: 8, vibe: 10 }
    },
    {
      userId: users.member.id,
      bookId: master.id,
      values: { architecture: 9, characters: 9, language: 10, idea: 9, vibe: 10 }
    },
    {
      userId: users.reader.id,
      bookId: dispossessed.id,
      values: { architecture: 8, characters: 7, language: 8, idea: 10, vibe: 8 }
    }
  ];

  for (const input of ratingInputs) {
    const result = calculateRating84(input.values);

    await prisma.rating.create({
      data: {
        userId: input.userId,
        bookId: input.bookId,
        ...input.values,
        finalScore: result.finalScore
      }
    });
  }
}

async function createContent(users, books) {
  const road = books.find((book) => book.title === 'Дорога');
  const master = books.find((book) => book.title === 'Мастер и Маргарита');
  const dispossessed = books.find((book) => book.title === 'Обделённые');

  const review = await prisma.review.create({
    data: {
      userId: users.reader.id,
      bookId: road.id,
      title: 'Беспощадная книга о надежде',
      body:
        'Роман кажется сухим и почти лишённым декора, но именно в этой аскезе работает вся архитектура. Это очень мрачная книга, где каждая сцена усиливает основную идею о сохранении человечности.',
      isSpoiler: false,
      status: ContentStatus.PUBLISHED
    }
  });

  const hiddenReview = await prisma.review.create({
    data: {
      userId: users.member.id,
      bookId: master.id,
      title: 'Черновик разбора сатирических слоёв',
      body:
        'Черновой материал с разбором сатирического устройства романа, языковых регистров и философской подкладки. Оставлен скрытым для проверки модерации.',
      isSpoiler: true,
      status: ContentStatus.HIDDEN
    }
  });

  const article = await prisma.article.create({
    data: {
      userId: users.member.id,
      bookId: dispossessed.id,
      title: 'Почему философская фантастика Ле Гуин до сих пор работает',
      body:
        'В центре текста не только противопоставление миров, но и дисциплина мысли: Ле Гуин держит композицию жёстко, а конфликт выносит в плоскость идеологии, языка и повседневной этики. Поэтому роман одновременно остаётся интеллектуальным и эмоционально цепляющим.',
      status: ContentStatus.PUBLISHED
    }
  });

  const draftArticle = await prisma.article.create({
    data: {
      userId: users.reader.id,
      bookId: master.id,
      title: 'Наброски статьи о двойной реальности',
      body:
        'Черновой материал о том, как роман работает на пересечении бытовой Москвы, мистики и авторской сатиры. Сохранён в драфте для очереди модерации.',
      status: ContentStatus.DRAFT
    }
  });

  await prisma.reviewComment.create({
    data: {
      reviewId: review.id,
      userId: users.member.id,
      body: 'Согласен с выводом про аскезу: именно сухость языка делает эмоциональные вспышки сильнее.',
      status: ContentStatus.PUBLISHED
    }
  });

  await prisma.reviewComment.create({
    data: {
      reviewId: hiddenReview.id,
      userId: users.admin.id,
      body: 'Скрываю до доработки: мысль сильная, но текст пока сырой.',
      status: ContentStatus.HIDDEN
    }
  });

  await prisma.articleComment.create({
    data: {
      articleId: article.id,
      userId: users.reader.id,
      body: 'Хорошо видно, как идея и мир работают вместе, а не спорят между собой.',
      status: ContentStatus.PUBLISHED
    }
  });

  await prisma.articleComment.create({
    data: {
      articleId: draftArticle.id,
      userId: users.admin.id,
      body: 'Оставил комментарий к черновику для внутренней проверки.',
      status: ContentStatus.DRAFT
    }
  });

  await prisma.reviewReaction.createMany({
    data: [
      { reviewId: review.id, userId: users.member.id, type: 'LIKE' },
      { reviewId: review.id, userId: users.admin.id, type: 'LIKE' },
      { reviewId: hiddenReview.id, userId: users.reader.id, type: 'DISLIKE' }
    ]
  });
}

async function createPersonalization(users, books) {
  const earthsea = books.find((book) => book.title === 'Волшебник Земноморья');
  const road = books.find((book) => book.title === 'Дорога');
  const master = books.find((book) => book.title === 'Мастер и Маргарита');
  const dispossessed = books.find((book) => book.title === 'Обделённые');

  await prisma.favorite.createMany({
    data: [
      { userId: users.reader.id, bookId: earthsea.id },
      { userId: users.reader.id, bookId: master.id },
      { userId: users.member.id, bookId: dispossessed.id }
    ]
  });

  const collection = await prisma.collection.create({
    data: {
      userId: users.reader.id,
      title: 'Мрачные и философские книги',
      description: 'Небольшая подборка книг, где сильная идея соединяется с тёмной атмосферой.',
      isPublic: true
    }
  });

  const privateCollection = await prisma.collection.create({
    data: {
      userId: users.member.id,
      title: 'Материалы для будущих рецензий',
      description: 'Рабочая закрытая подборка.',
      isPublic: false
    }
  });

  await prisma.collectionBook.createMany({
    data: [
      {
        collectionId: collection.id,
        bookId: road.id,
        note: 'Эталон тёмной атмосферы и предельно сухого языка.'
      },
      {
        collectionId: collection.id,
        bookId: dispossessed.id,
        note: 'Философская книга с сильной идеей и хорошим итоговым рейтингом.'
      },
      {
        collectionId: privateCollection.id,
        bookId: master.id,
        note: 'Планирую большой разбор сатиры и мистики.'
      }
    ]
  });

  await prisma.profileFeaturedBook.createMany({
    data: [
      { userId: users.reader.id, bookId: earthsea.id, sortOrder: 0 },
      { userId: users.reader.id, bookId: master.id, sortOrder: 1 },
      { userId: users.reader.id, bookId: dispossessed.id, sortOrder: 2 },
      { userId: users.member.id, bookId: road.id, sortOrder: 0 },
      { userId: users.member.id, bookId: master.id, sortOrder: 1 }
    ]
  });

  await prisma.userFollow.createMany({
    data: [
      { followerId: users.reader.id, followingId: users.member.id },
      { followerId: users.member.id, followingId: users.reader.id },
      { followerId: users.admin.id, followingId: users.reader.id }
    ]
  });
}

async function main() {
  await resetDatabase();

  const users = await createUsers();
  const taxonomy = await createTaxonomy();
  const books = await createBooks(users.admin, taxonomy);

  await createRatings(users, books);
  await createContent(users, books);
  await createPersonalization(users, books);

  console.log('Seed complete');
  console.log({
    admin: 'admin@bookpoisk.local / Admin123!',
    reader: 'reader@bookpoisk.local / Reader123!',
    member: 'member@bookpoisk.local / Member123!',
    books: books.length
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
