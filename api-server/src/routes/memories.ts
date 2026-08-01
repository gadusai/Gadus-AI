import { Router } from "express";
import { db, userMemoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/memories", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const memories = await db.select().from(userMemoriesTable).where(eq(userMemoriesTable.userId, userId));
  res.json(memories);
});

router.delete("/memories/:key", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { key } = req.params;
  await db.delete(userMemoriesTable).where(
    and(eq(userMemoriesTable.userId, userId), eq(userMemoriesTable.key, key))
  );
  res.json({ ok: true });
});

export default router;
