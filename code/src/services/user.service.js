/**
 * User Service
 *
 * Service functions for User-related database operations
 */

import { env } from "../config/env.js";

let csvService = null;
let prismaClient = null;

async function getCSVService() {
  if (!csvService) {
    const module = await import("./user.service.csv.js");
    csvService = module;
  }
  return csvService;
}

async function getPrismaClient() {
  if (!prismaClient) {
    const { prisma } = await import("../lib/prisma.js");
    prismaClient = prisma;
  }
  return prismaClient;
}

export async function createUser(data) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.createUser(data);
  }
  const prisma = await getPrismaClient();
  return prisma.user.create({ data });
}

export async function getUserById(id) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.getUserById(id);
  }
  const prisma = await getPrismaClient();
  return prisma.user.findUnique({
    where: { id },
    include: {
      classRoles: { include: { class: true } },
      groupRoles: { include: { group: true } },
      groupSupervises: { include: { group: true } }
    }
  });
}

export async function getUserByEmail(email) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.getUserByEmail(email);
  }
  const prisma = await getPrismaClient();
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserByGoogleId(googleId) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.getUserByGoogleId(googleId);
  }
  const prisma = await getPrismaClient();
  return prisma.user.findUnique({ where: { googleId } });
}

export async function updateUser(id, data) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.updateUser(id, data);
  }
  const prisma = await getPrismaClient();
  return prisma.user.update({
    where: { id },
    data
  });
}

export async function deleteUser(id) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.deleteUser(id);
  }
  const prisma = await getPrismaClient();
  await prisma.classRole.deleteMany({ where: { userId: id } });
  await prisma.groupRole.deleteMany({ where: { userId: id } });
  await prisma.groupSupervisor.deleteMany({ where: { userId: id } });

  return prisma.user.delete({
    where: { id }
  });
}


