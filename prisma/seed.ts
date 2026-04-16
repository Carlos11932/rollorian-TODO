/**
 * Prisma seed — production group setup.
 *
 * Run AFTER both users have signed in with Google (so their User records exist).
 *
 * Required env vars:
 *   USER_1_EMAIL  — e.g. carlos@gmail.com
 *   USER_2_EMAIL  — e.g. partner@gmail.com
 *   GROUP_NAME    — e.g. "Familia" (default: "Familia")
 *
 * Usage:
 *   USER_1_EMAIL=carlos@gmail.com USER_2_EMAIL=other@gmail.com npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email1 = process.env['USER_1_EMAIL'];
  const email2 = process.env['USER_2_EMAIL'];
  const groupName = process.env['GROUP_NAME'] ?? 'Familia';

  if (!email1 || !email2) {
    console.error('Set USER_1_EMAIL and USER_2_EMAIL env vars before running seed.');
    process.exit(1);
  }

  const user1 = await prisma.user.findUnique({ where: { email: email1 } });
  const user2 = await prisma.user.findUnique({ where: { email: email2 } });

  if (!user1) {
    console.error(`User not found: ${email1}. Sign in with Google first.`);
    process.exit(1);
  }
  if (!user2) {
    console.error(`User not found: ${email2}. Sign in with Google first.`);
    process.exit(1);
  }

  const group = await prisma.group.upsert({
    where: { id: `group-${groupName.toLowerCase().replace(/\s+/g, '-')}` },
    create: { id: `group-${groupName.toLowerCase().replace(/\s+/g, '-')}`, name: groupName },
    update: { name: groupName },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user1.id } },
    create: { groupId: group.id, userId: user1.id, role: 'owner', isActive: true },
    update: { isActive: true },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user2.id } },
    create: { groupId: group.id, userId: user2.id, role: 'member', isActive: true },
    update: { isActive: true },
  });

  console.log(`✓ Group "${group.name}" (${group.id}) created.`);
  console.log(`✓ Members: ${user1.name ?? user1.email} (owner), ${user2.name ?? user2.email} (member)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
