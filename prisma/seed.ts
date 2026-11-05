import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role } from "../lib/generated/prisma/enums";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      "Seed error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your environment (.env)."
    );
    process.exit(1);
  }

  console.log(`Checking for existing administrator account...`);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(
      `Administrator account for ${adminEmail} already exists (ID: ${existingUser.id}). Preserving existing credentials.`
    );
    return;
  }

  console.log(`Creating initial administrator account for ${adminEmail}...`);
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.create({
    data: {
      name: "EmanCopys Admin",
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Successfully seeded administrator account (ID: ${admin.id}, Role: ${admin.role}).`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
