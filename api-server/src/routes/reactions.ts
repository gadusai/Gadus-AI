import { Router } from "express";
import { db, messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// PATCH /messages/:id/reaction
router.patch("/messages/:id/reaction", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { reaction } = req.body as { reaction?: string | null };
  // Allow "up", "down", or null to clear
  const value = reaction === "up" || reaction === "down" ? reaction : null;

  try {
    const [updated] = await db
      .update(messagesTable)
      .set({ reaction: value })
      .where(eq(messagesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json({
      id: updated.id,
      conversationId: updated.conversationId,
      role: updated.role,
      content: updated.content,
      reaction: updated.reaction ?? null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to rate message");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
