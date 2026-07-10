import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function upsertUser(name: string, email: string, role: Role) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role, passwordHash },
  });
}

async function main() {
  await upsertUser("Admin", "admin@hana-trans.sk", Role.ADMIN);
  await upsertUser("Marek Manager", "manager@hana-trans.sk", Role.MANAGER);
  await upsertUser("Fiona Finance", "finance@hana-trans.sk", Role.FINANCE);
  await upsertUser("Dana Director", "director@hana-trans.sk", Role.DIRECTOR);
  await upsertUser("Erik Employee", "employee@hana-trans.sk", Role.EMPLOYEE);

  const existingThresholds = await prisma.approvalThreshold.count();
  if (existingThresholds === 0) {
    await prisma.approvalThreshold.create({
      data: {
        name: "Small (< 500 EUR)",
        minAmount: 0,
        maxAmount: 499.99,
        currency: "EUR",
        levels: {
          create: [{ order: 1, role: Role.MANAGER }],
        },
      },
    });

    await prisma.approvalThreshold.create({
      data: {
        name: "Medium (500 - 5000 EUR)",
        minAmount: 500,
        maxAmount: 4999.99,
        currency: "EUR",
        levels: {
          create: [
            { order: 1, role: Role.MANAGER },
            { order: 2, role: Role.FINANCE },
          ],
        },
      },
    });

    await prisma.approvalThreshold.create({
      data: {
        name: "Large (>= 5000 EUR)",
        minAmount: 5000,
        maxAmount: null,
        currency: "EUR",
        levels: {
          create: [
            { order: 1, role: Role.MANAGER },
            { order: 2, role: Role.FINANCE },
            { order: 3, role: Role.DIRECTOR },
          ],
        },
      },
    });
  }

  console.log("Seed complete. Demo users (password for all: %s):", DEMO_PASSWORD);
  console.log("  admin@hana-trans.sk    (ADMIN)");
  console.log("  manager@hana-trans.sk  (MANAGER)");
  console.log("  finance@hana-trans.sk  (FINANCE)");
  console.log("  director@hana-trans.sk (DIRECTOR)");
  console.log("  employee@hana-trans.sk (EMPLOYEE)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
