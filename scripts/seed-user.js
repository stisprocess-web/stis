const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync("ChangeMe123!", 10);
  await prisma.user.upsert({
    where: { email: "owner@leairdpi.local" },
    update: {},
    create: {
      name: "Admin",
      email: "owner@leairdpi.local",
      role: "owner",
      passwordHash: hash,
    },
  });
  console.log("Admin user created: owner@leairdpi.local / ChangeMe123!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
