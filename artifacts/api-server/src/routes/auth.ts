import { Router, type IRouter, type Request } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, signToken, type AuthPayload } from "../middlewares/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SALT_ROUNDS = 10;

function safeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _p, ...safe } = user;
  return safe;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: "user" })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.status(201).json({ token, user: safeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token, user: safeUser(user) });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as Request & { auth: AuthPayload }).auth;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, auth.userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(safeUser(user));
});

export default router;
