import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = bcrypt.hashSync("Chimera@2k24$",10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: "1",
      username: "admin",
      passwordHash: password,
      displayName: "Administrator"
    }
  });
}

main();