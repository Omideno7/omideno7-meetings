import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with initial data...');

  // create a sample meeting
  const meeting = await prisma.meeting.create({
    data: {
      title: 'Weekly Prayer Meeting',
      ownerId: 'owner-1',
      type: 'public',
    },
  });

  // create a sample access request
  await prisma.accessRequest.create({
    data: {
      fullName: 'Ali Reza',
      email: 'alireza@example.com',
      reason: 'Participate in the prayer meeting',
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
