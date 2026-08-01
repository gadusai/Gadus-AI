import { Router } from "express";
import { db, conversationsTable, messagesTable, userMemoriesTable } from "@workspace/db";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/stats/insights", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalConvRows,
      totalMsgRows,
      modeRows,
      reactionRows,
      activityRows,
      memoryRows,
      thumbsUpRows,
      thumbsDownRows,
    ] = await Promise.all([
      // Total conversations
      db.select({ n: count() }).from(conversationsTable)
        .where(eq(conversationsTable.userId, userId)),

      // Total messages by role
      db.select({ role: messagesTable.role, n: count() })
        .from(messagesTable)
        .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(eq(conversationsTable.userId, userId))
        .groupBy(messagesTable.role),

      // Conversations + messages per mode
      db.select({
        mode: conversationsTable.mode,
        conversations: sql<number>`cast(count(distinct ${conversationsTable.id}) as int)`,
        messages: sql<number>`cast(count(${messagesTable.id}) as int)`,
      })
        .from(conversationsTable)
        .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(eq(conversationsTable.userId, userId))
        .groupBy(conversationsTable.mode)
        .orderBy(sql`count(distinct ${conversationsTable.id}) desc`),

      // Reactions breakdown
      db.select({ reaction: messagesTable.reaction, n: count() })
        .from(messagesTable)
        .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(and(eq(conversationsTable.userId, userId), sql`${messagesTable.reaction} is not null`))
        .groupBy(messagesTable.reaction),

      // Activity last 14 days (conversations created per day)
      db.select({
        day: sql<string>`to_char(${conversationsTable.createdAt}, 'YYYY-MM-DD')`,
        n: sql<number>`cast(count(*) as int)`,
      })
        .from(conversationsTable)
        .where(and(eq(conversationsTable.userId, userId), gte(conversationsTable.createdAt, fourteenDaysAgo)))
        .groupBy(sql`to_char(${conversationsTable.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${conversationsTable.createdAt}, 'YYYY-MM-DD') asc`),

      // Memory count
      db.select({ n: count() }).from(userMemoriesTable)
        .where(eq(userMemoriesTable.userId, userId)),

      // Thumbs up
      db.select({ n: count() }).from(messagesTable)
        .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(and(eq(conversationsTable.userId, userId), eq(messagesTable.reaction, "up"))),

      // Thumbs down
      db.select({ n: count() }).from(messagesTable)
        .innerJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
        .where(and(eq(conversationsTable.userId, userId), eq(messagesTable.reaction, "down"))),
    ]);

    const userMessages = totalMsgRows.find((r) => r.role === "user")?.n ?? 0;
    const aiMessages = totalMsgRows.find((r) => r.role === "assistant")?.n ?? 0;

    // Fill in missing days for last 14 days
    const activityMap: Record<string, number> = {};
    activityRows.forEach((r) => { activityMap[r.day] = r.n; });
    const activityFull: { day: string; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      activityFull.push({ day: key, n: activityMap[key] ?? 0 });
    }

    res.json({
      totalConversations: Number(totalConvRows[0]?.n ?? 0),
      userMessages: Number(userMessages),
      aiMessages: Number(aiMessages),
      memoryCount: Number(memoryRows[0]?.n ?? 0),
      thumbsUp: Number(thumbsUpRows[0]?.n ?? 0),
      thumbsDown: Number(thumbsDownRows[0]?.n ?? 0),
      modeBreakdown: modeRows.map((r) => ({
        mode: r.mode,
        conversations: r.conversations,
        messages: r.messages,
      })),
      activity: activityFull,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get insights");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
