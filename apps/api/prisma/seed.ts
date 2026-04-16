import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Chimera@2k24$", 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      id: "1",
      username: "admin",
      passwordHash,
      displayName: "Administrator"
    }
  });

  console.log("Admin seeded/updated");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());