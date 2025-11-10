#!/usr/bin/env node

import { prisma } from "../lib/prisma.js";

async function main() {
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      quarter: true
    }
  });

  console.log("Available classes:");
  classes.forEach(c => {
    console.log(`- ID: ${c.id}`);
    console.log(`  Name: ${c.name}`);
    console.log(`  Quarter: ${c.quarter}`);
    console.log();
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });