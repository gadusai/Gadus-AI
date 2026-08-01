import { Router } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /shared/:token — public endpoint, no auth required
router.get("/shared/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.shareToken, token), eq(conversationsTable.isShared, true)));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found or not shared" });
      return;
    }

    const msgs = await db.select({
      id: messagesTable.id,
      role: messagesTable.role,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
    }).from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(messagesTable.createdAt);

    res.json({
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      createdAt: conv.createdAt.toISOString(),
      messages: msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch shared conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
