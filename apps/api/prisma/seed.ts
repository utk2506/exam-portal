import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.admin.findUnique({
    where: { username: "admin" },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash("Chimera@2k24$", 10);

    await prisma.admin.create({
      data: {
        id: "1",
        username: "admin",
        passwordHash,
        displayName: "Administrator",
      },
    });

    console.log("✅ Admin user created");
  } else {
    console.log("Admin already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());