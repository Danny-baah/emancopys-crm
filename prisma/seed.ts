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
  } else {
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

  console.log("Seeding predefined additional services catalogue...");
  const defaultServices = [
    {
      name: "Website Maintenance",
      description: "Standard ongoing website upkeep, security patches, backups and minor content edits.",
      price: 50,
      isRecurring: true,
    },
    {
      name: "Care + SEO Start",
      description: "Comprehensive maintenance plus essential search engine optimization and monthly health reports.",
      price: 300,
      isRecurring: true,
    },
    {
      name: "Care + SEO Pro",
      description: "Full-tier continuous performance optimization, proactive technical SEO, and ranking expansion.",
      price: 500,
      isRecurring: true,
    },
  ];

  for (const s of defaultServices) {
    const existingService = await prisma.additionalService.findUnique({
      where: { name: s.name },
    });
    if (!existingService) {
      await prisma.additionalService.create({
        data: s,
      });
      console.log(`Created service: ${s.name} (€${s.price}/mo)`);
    } else {
      console.log(`Service already exists: ${s.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
