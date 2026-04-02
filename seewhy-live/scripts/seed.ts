// scripts/seed.ts
// Development seed data for SeeWhy LIVE

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SeeWhy LIVE database...');

  // ─── Admin user ─────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@seewhylive.com' },
    create: {
      displayName:   'SeeWhy Admin',
      username:      'admin',
      email:         'admin@seewhylive.com',
      passwordHash:  adminHash,
      role:          'ADMIN',
      emailVerified: true,
      isVerified:    true,
    },
    update: {},
  });
  console.log('✅ Admin user:', admin.email);

  // ─── Creator users ───────────────────────────────────────────────
  const creatorHash = await bcrypt.hash('Creator1234!', 12);

  const creators = await Promise.all(
    [
      { displayName: 'Maya Johnson',   username: 'mayasmith',    email: 'maya@example.com' },
      { displayName: 'Alex Rivera',    username: 'alexlive',     email: 'alex@example.com' },
      { displayName: 'Jordan Lee',     username: 'jordanstreams', email: 'jordan@example.com' },
    ].map(data =>
      prisma.user.upsert({
        where:  { email: data.email },
        create: {
          ...data,
          passwordHash:  creatorHash,
          role:          'CREATOR',
          emailVerified: true,
          isVerified:    true,
          bio:           `Hi! I'm ${data.displayName} and I stream live on SeeWhy LIVE 🎥`,
        },
        update: {},
      }),
    ),
  );
  console.log('✅ Creator users:', creators.map(c => c.username).join(', '));

  // ─── Sample stages ───────────────────────────────────────────────
  const stageData = [
    {
      title:       'Tech Talk Live — AI & Web3 Discussion',
      description: 'Join us for a deep dive into the latest AI trends and web3 developments.',
      creatorId:   creators[0].id,
      status:      'ENDED' as const,
      tags:        ['tech', 'ai', 'web3'],
      category:    'Technology',
    },
    {
      title:       'Friday Night Gaming Session 🎮',
      description: 'Live gaming session with viewer challenges and giveaways!',
      creatorId:   creators[1].id,
      status:      'LIVE' as const,
      tags:        ['gaming', 'entertainment'],
      category:    'Gaming',
    },
    {
      title:       'Music Production Masterclass',
      description: 'Learn how to produce beats from scratch with professional tools.',
      creatorId:   creators[2].id,
      status:      'UPCOMING' as const,
      tags:        ['music', 'production', 'tutorial'],
      category:    'Music',
    },
  ];

  const stages = await Promise.all(
    stageData.map(data =>
      prisma.stage.upsert({
        where:  { id: `seed-stage-${stageData.indexOf(data)}` },
        create: {
          id:        `seed-stage-${stageData.indexOf(data)}`,
          ...data,
          isPublic: true,
          guestLimit: 20,
        },
        update: {},
      }),
    ),
  );
  console.log('✅ Stages:', stages.map(s => s.title).join(', '));

  // ─── Sample viewer user ──────────────────────────────────────────
  const viewerHash = await bcrypt.hash('Viewer1234!', 12);
  const viewer = await prisma.user.upsert({
    where:  { email: 'viewer@example.com' },
    create: {
      displayName:   'Sample Viewer',
      username:      'sampleviewer',
      email:         'viewer@example.com',
      passwordHash:  viewerHash,
      role:          'USER',
      emailVerified: true,
    },
    update: {},
  });
  console.log('✅ Viewer user:', viewer.email);

  // ─── Sample follows ──────────────────────────────────────────────
  await Promise.all(
    creators.map(creator =>
      prisma.follow.upsert({
        where:  { followerId_followedId: { followerId: viewer.id, followedId: creator.id } },
        create: { followerId: viewer.id, followedId: creator.id },
        update: {},
      }),
    ),
  );
  console.log('✅ Follow relationships created');

  // ─── Sample products ─────────────────────────────────────────────
  await Promise.all([
    prisma.product.upsert({
      where: { id: 'seed-product-0' },
      create: {
        id:          'seed-product-0',
        creatorId:   creators[0].id,
        title:       'AI Prompt Engineering Guide (PDF)',
        description: 'A comprehensive guide with 100+ proven prompts for productivity and creativity.',
        price:       9.99,
        type:        'DIGITAL',
        isActive:    true,
      },
      update: {},
    }),
    prisma.product.upsert({
      where: { id: 'seed-product-1' },
      create: {
        id:          'seed-product-1',
        creatorId:   creators[1].id,
        title:       'Custom Gaming Setup Blueprint',
        description: 'Get my exact gaming setup config files and equipment list.',
        price:       4.99,
        type:        'DIGITAL',
        isActive:    true,
      },
      update: {},
    }),
  ]);
  console.log('✅ Products seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('Test accounts:');
  console.log('  Admin:   admin@seewhylive.com / Admin1234!');
  console.log('  Creator: maya@example.com / Creator1234!');
  console.log('  Viewer:  viewer@example.com / Viewer1234!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
