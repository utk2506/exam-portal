import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/http.js";

export async function loginAdmin(username: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: {
      username
    }
  });

  if (!admin) {
    throw new AppError("Invalid credentials", 401);
  }

  const matches = await bcrypt.compare(password, admin.passwordHash);
  if (!matches) {
    throw new AppError("Invalid credentials", 401);
  }

  const updatedAdmin = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      lastLoginAt: new Date()
    }
  });

  return {
    token: jwt.sign(
      {
        adminId: updatedAdmin.id,
        username: updatedAdmin.username
      },
      env.JWT_SECRET,
      { expiresIn: "8h" }
    ),
    admin: {
      id: updatedAdmin.id,
      username: updatedAdmin.username,
      displayName: updatedAdmin.displayName,
      lastLoginAt: updatedAdmin.lastLoginAt?.toISOString() ?? null
    }
  };
}

export async function getAdminProfile(adminId: string) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId }
  });

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  return {
    id: admin.id,
    username: admin.username,
    displayName: admin.displayName,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null
  };
}
