import { db, shoutoutTypes } from '@/lib/db';

async function seedShoutoutTypes() {
  const types = [
    {
      name: 'Video Shoutout',
      description: 'Personalized video message for special occasions, birthdays, or greetings',
    },
    {
      name: 'Audio Shoutout',
      description: 'Custom audio message or voice recording',
    },
    {
      name: 'Social Media Post',
      description: 'Dedicated post on social media platforms',
    },
    {
      name: 'Live Stream Mention',
      description: 'Mention or shoutout during live streaming session',
    },
    {
      name: 'Custom Content',
      description: 'Unique content creation based on specific requirements',
    },
    {
      name: 'Brand Endorsement',
      description: 'Product or service endorsement and promotional content',
    },
  ];

  try {
    for (const type of types) {
      await db
        .insert(shoutoutTypes)
        .values(type)
        .onConflictDoNothing();
    }
    console.log('Shoutout types seeded successfully');
  } catch (error) {
    console.error('Failed to seed shoutout types:', error);
  }
}

async function main() {
  console.log('Seeding database...');
  await seedShoutoutTypes();
  console.log('Database seeding completed!');
  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

export { seedShoutoutTypes };