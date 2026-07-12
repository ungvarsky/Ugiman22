import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const trainer = await prisma.user.upsert({
    where: { email: "ungvarsky@gmail.com" },
    update: {},
    create: {
      name: "Tréner",
      email: "ungvarsky@gmail.com",
      passwordHash,
      role: "TRAINER",
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: "klient1@example.com" },
    update: {},
    create: {
      name: "Peter Novák",
      email: "klient1@example.com",
      phone: "+421 900 111 222",
      passwordHash,
      role: "CLIENT",
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: "klient2@example.com" },
    update: {},
    create: {
      name: "Jana Kováčová",
      email: "klient2@example.com",
      phone: "+421 900 333 444",
      passwordHash,
      role: "CLIENT",
    },
  });

  const pkg1 = await prisma.trainingPackage.create({
    data: {
      clientId: client1.id,
      name: "10 tréningov",
      totalCredits: 10,
      remainingCredits: 7,
      price: 250,
    },
  });

  const pkg2 = await prisma.trainingPackage.create({
    data: {
      clientId: client2.id,
      name: "5 tréningov",
      totalCredits: 5,
      remainingCredits: 2,
      price: 140,
    },
  });

  await prisma.payment.createMany({
    data: [
      { clientId: client1.id, packageId: pkg1.id, amount: 250, method: "TRANSFER" },
      { clientId: client2.id, packageId: pkg2.id, amount: 140, method: "CASH" },
    ],
  });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 3);
  nextWeek.setHours(9, 0, 0, 0);

  await prisma.trainingSession.createMany({
    data: [
      {
        clientId: client1.id,
        packageId: pkg1.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        status: "SCHEDULED",
      },
      {
        clientId: client2.id,
        packageId: pkg2.id,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 45 * 60 * 1000),
        status: "SCHEDULED",
      },
    ],
  });

  console.log("Seed hotový. Prihlásenie:");
  console.log(`  Tréner: ${trainer.email} / Password123!`);
  console.log(`  Klient: ${client1.email} / Password123!`);
  console.log(`  Klient: ${client2.email} / Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
