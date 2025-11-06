// code/tests/utils/reset-db.js
import { prisma } from "../../src/lib/prisma.js";

export async function resetDatabase() {
  // Get all tables in the public schema except Prisma's internal ones
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
    AND tablename NOT LIKE '_prisma%' 
  `;

  // Disable FK checks to avoid dependency issues during cleanup
  await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`
    );
  }

  // Re-enable foreign key enforcement
  await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
}
