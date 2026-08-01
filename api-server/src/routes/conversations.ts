import { Router } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import {
  ListConversationsQueryParams,
  CreateConversationBody,
  GetConversationParams,
  UpdateConversationParams,
  UpdateConversationBody,
  DeleteConversationParams,
  ListMessagesParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// All conversation routes require auth
router.use(requireAuth);

// GET /conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = ListConversationsQueryParams.safeParse(req.query);
    const mode = parsed.success ? parsed.data.mode : undefined;
    const search = parsed.success ? parsed.data.search : undefined;

    const conditions = [eq(conversationsTable.userId, userId)];
    if (mode) conditions.push(eq(conversationsTable.mode, mode));
    if (search) conditions.push(ilike(conversationsTable.title, `%${search}%`));

    const rows = await db
      .select({
        id: conversationsTable.id,
        title: conversationsTable.title,
        mode: conversationsTable.mode,
        isPinned: conversationsTable.isPinned,
        createdAt: conversationsTable.createdAt,
        updatedAt: conversationsTable.updatedAt,
        messageCount: sql<number>`cast(count(${messagesTable.id}) as int)`,
      })
      .from(conversationsTable)
      .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
      .where(and(...conditions))
      .groupBy(conversationsTable.id)
      .orderBy(desc(conversationsTable.isPinned), desc(conversationsTable.updatedAt));

    res.json(rows.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /conversations
router.post("/conversations", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = CreateConversationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { mode, title } = parsed.data;
    const [conv] = await db.insert(conversationsTable).values({
      userId,
      mode,
      title: title || "New Conversation",
    }).returning();

    res.status(201).json({
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messageCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /conversations/:id
router.get("/conversations/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = GetConversationParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, parsed.data.id), eq(conversationsTable.userId, userId)));
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(messagesTable.createdAt);

    res.json({
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: msgs.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        reaction: m.reaction ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /conversations/:id
router.patch("/conversations/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const params = UpdateConversationParams.safeParse({ id: Number(req.params.id) });
    const body = UpdateConversationBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const [updated] = await db.update(conversationsTable)
      .set({ title: body.data.title, updatedAt: new Date() })
      .where(and(eq(conversationsTable.id, params.data.id), eq(conversationsTable.userId, userId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({
      id: updated.id,
      title: updated.title,
      mode: updated.mode,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      messageCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = DeleteConversationParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(conversationsTable)
      .where(and(eq(conversationsTable.id, parsed.data.id), eq(conversationsTable.userId, userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const parsed = ListMessagesParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    // Verify ownership
    const [conv] = await db.select({ id: conversationsTable.id }).from(conversationsTable)
      .where(and(eq(conversationsTable.id, parsed.data.id), eq(conversationsTable.userId, userId)));
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, parsed.data.id))
      .orderBy(messagesTable.createdAt);

    res.json(msgs.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      reaction: m.reaction ?? null,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats/modes
router.get("/stats/modes", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const rows = await db
      .select({
        mode: conversationsTable.mode,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, userId))
      .groupBy(conversationsTable.mode);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get mode stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /conversations/:id/pin — toggle pinned state
router.post("/conversations/:id/pin", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const id = Number(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
    if (!conv) { res.status(404).json({ error: "Not found" }); return; }

    const [updated] = await db.update(conversationsTable)
      .set({ isPinned: !conv.isPinned })
      .where(eq(conversationsTable.id, id))
      .returning();

    res.json({ id: updated.id, isPinned: updated.isPinned });
  } catch (err) {
    req.log.error({ err }, "Failed to pin conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /conversations/:id/share — create a public share token
router.post("/conversations/:id/share", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const id = Number(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
    if (!conv) { res.status(404).json({ error: "Not found" }); return; }

    // reuse existing token if already shared
    if (conv.isShared && conv.shareToken) {
      res.json({ shareToken: conv.shareToken });
      return;
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    await db.update(conversationsTable)
      .set({ shareToken: token, isShared: true })
      .where(eq(conversationsTable.id, id));

    res.json({ shareToken: token });
  } catch (err) {
    req.log.error({ err }, "Failed to share conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
