import { Router, type IRouter, type Request } from "express";
import { eq, ilike, or, count } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, type AuthPayload } from "../middlewares/auth";
import { UpdateMeBody } from "@workspace/api-zod";
import fs from "node:fs/promises";
import path from "node:path";

const router: IRouter = Router();

function safeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _p, ...safe } = user;
  return safe;
}

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const { search, page, limit } = req.query as {
    search?: string;
    page?: string;
    limit?: string;
  };

  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? "20", 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const baseQuery = db.select().from(usersTable);
  const countQuery = db.select({ count: count() }).from(usersTable);

  let users;
  let totalRows;

  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    users = await baseQuery
      .where(or(ilike(usersTable.name, pattern), ilike(usersTable.email, pattern)))
      .orderBy(usersTable.createdAt)
      .limit(limitNum)
      .offset(offset);
    totalRows = await countQuery.where(
      or(ilike(usersTable.name, pattern), ilike(usersTable.email, pattern)),
    );
  } else {
    users = await baseQuery
      .orderBy(usersTable.createdAt)
      .limit(limitNum)
      .offset(offset);
    totalRows = await countQuery;
  }

  res.json({
    users: users.map(safeUser),
    total: Number(totalRows[0]?.count ?? 0),
    page: pageNum,
    limit: limitNum,
  });
});

router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as Request & { auth: AuthPayload }).auth;

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Get existing user
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, auth.userId));

  if (!existingUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.bio != null) updates.bio = parsed.data.bio;
  if (parsed.data.avatarUrl != null) updates.avatarUrl = parsed.data.avatarUrl;

  const oldAvatarUrl = existingUser.avatarUrl;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, auth.userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Delete previous avatar if it was replaced
  if (
    oldAvatarUrl &&
    user.avatarUrl &&
    oldAvatarUrl !== user.avatarUrl
  ) {
    try {
      const uploadsBase = `${req.protocol}://${req.get("host")}/uploads/`;

      if (oldAvatarUrl.startsWith(uploadsBase)) {
        const filename = path.basename(oldAvatarUrl);

        await fs.unlink(
          path.join(process.cwd(), "uploads", filename)
        );
      }
    } catch (err) {
      console.error("Failed to delete old avatar:", err);
    }
  }

  res.json(safeUser(user));
});

router.delete("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as Request & { auth: AuthPayload }).auth;

  if (auth.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (id === auth.userId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id });

  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(safeUser(user));
});

export default router;
