import { prisma } from "../src/prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "admin@multivendor.com";
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists.");
    return;
  }

  // Hash password
  const defaultPassword = "AdminPassword123!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("-----------------------------------------");
  console.log("Admin user seeded successfully!");
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${defaultPassword}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
