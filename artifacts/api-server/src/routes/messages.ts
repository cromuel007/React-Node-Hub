import { Router, type IRouter, type Request } from "express";
import { eq, or, and, lt, desc, sql } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { requireAuth, type AuthPayload } from "../middlewares/auth";
import { SendMessageBody, ListMessagesQueryParams } from "@workspace/api-zod";
import { broadcastToUser } from "../lib/ws-server";

const router: IRouter = Router();

// GET /messages/conversations — must be before /messages to avoid :id conflict
router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as Request & { auth: AuthPayload }).auth;
  const me = auth.userId;

  // Get distinct conversation partners with latest message and unread count
  const rows = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.bio,
      u.avatar_url as "avatarUrl",
      u.role,
      u.created_at as "createdAt",
      lm.id as msg_id,
      lm.sender_id as msg_sender_id,
      lm.recipient_id as msg_recipient_id,
      lm.content as msg_content,
      lm.read as msg_read,
      lm.created_at as msg_created_at,
      (
        SELECT COUNT(*)::int FROM messages
        WHERE recipient_id = ${me} AND sender_id = u.id AND read = false
      ) as unread_count
    FROM users u
    JOIN LATERAL (
      SELECT * FROM messages m
      WHERE (m.sender_id = ${me} AND m.recipient_id = u.id)
         OR (m.sender_id = u.id AND m.recipient_id = ${me})
      ORDER BY m.created_at DESC
      LIMIT 1
    ) lm ON true
    WHERE u.id != ${me}
    ORDER BY lm.created_at DESC
  `);

  const conversations = ((rows as unknown as { rows: unknown[] }).rows ?? []).map((r: unknown) => {
    const row = r as Record<string, unknown>;
    return {
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        bio: row.bio,
        avatarUrl: row.avatarUrl,
        role: row.role,
        createdAt: row.createdAt,
      },
      lastMessage: {
        id: row.msg_id,
        senderId: row.msg_sender_id,
        recipientId: row.msg_recipient_id,
        content: row.msg_content,
        read: row.msg_read,
        createdAt: row.msg_created_at,
      },
      unreadCount: Number(row.unread_count ?? 0),
    };
  });

  res.json(conversations);
});

// GET /messages?withUserId=X
router.get("/messages", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as Request & { auth: AuthPayload }).auth;
  const me = auth.userId;

  const parsed = ListMessagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { withUserId, before, limit: limitParam } = parsed.data;
  const limit = Math.min(100, limitParam ?? 50);
  const other = withUserId;

  // Mark incoming messages as read
  await db
    .update(messagesTable)
    .set({ read: true })
    .where(and(eq(messagesTable.senderId, other), eq(messagesTable.recipientId, me)));

  const conditions = [
    or(
      and(eq(messagesTable.senderId, me), eq(messagesTable.recipientId, other)),
      and(eq(messagesTable.senderId, other), eq(messagesTable.recipientId, me)),
    ),
  ];

  if (before) {
    conditions.push(lt(messagesTable.id, before));
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(and(...conditions))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  res.json(messages.reverse());
});

// POST /messages
router.post("/messages", requireAuth, async (req, res): Promise<void> => {
  const auth = (req as Request & { auth: AuthPayload }).auth;
  const me = auth.userId;

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { recipientId, content } = parsed.data;

  if (recipientId === me) {
    res.status(400).json({ error: "Cannot send a message to yourself" });
    return;
  }

  // Verify recipient exists
  const [recipient] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, recipientId));

  if (!recipient) {
    res.status(404).json({ error: "Recipient not found" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({ senderId: me, recipientId, content })
    .returning();

  // Broadcast to recipient and sender via WebSocket
  const wsPayload = { type: "message" as const, payload: message };
  broadcastToUser(recipientId, wsPayload);
  broadcastToUser(me, wsPayload);

  res.status(201).json(message);
});

export default router;
