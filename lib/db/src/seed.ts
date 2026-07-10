import bcrypt from "bcryptjs";
import { db } from "./index";
import { usersTable } from "./schema";

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await db.insert(usersTable).values([
    {
      name: "Alice",
      email: "alice@example.com",
      passwordHash,
      role: "admin",
    },
    {
      name: "Bob",
      email: "bob@example.com",
      passwordHash,
      role: "user",
    },
    {
      name: "Carol",
      email: "carol@example.com",
      passwordHash,
      role: "user",
    },
    {
      name: "David",
      email: "david@example.com",
      passwordHash,
      role: "user",
    },
    {
      name: "Eva",
      email: "eva@example.com",
      passwordHash,
      role: "user",
    },
  ]);

  console.log("✅ Users seeded");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });