import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchWithJina(query: string): Promise<{ results: SearchResult[]; answer?: string }> {
  // Jina AI Search — free tier, no API key needed for basic use
  const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
    headers: {
      "Accept": "application/json",
      "X-Return-Format": "json",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (res.ok) {
    try {
      const data = await res.json() as any;
      if (data.data && Array.isArray(data.data)) {
        return {
          answer: data.data[0]?.description,
          results: data.data.slice(0, 6).map((r: any) => ({
            title: r.title || "Result",
            url: r.url || "",
            snippet: r.description || r.content?.slice(0, 200) || "",
          })),
        };
      }
    } catch {
      // Fall through to text parsing
    }

    // Text response fallback — parse markdown-style result blocks
    const text = await res.text().catch(() => "");
    const results: SearchResult[] = [];
    const blocks = text.split(/\n\n+/);
    for (const block of blocks.slice(0, 6)) {
      const titleMatch = block.match(/^#+\s+(.+)/m) || block.match(/^\[(.+?)\]/m);
      const urlMatch = block.match(/https?:\/\/[^\s\]]+/);
      const snippet = block.replace(/^#+.+$/m, "").replace(/https?:\/\/\S+/g, "").trim().slice(0, 200);
      if (urlMatch) {
        results.push({
          title: titleMatch?.[1] || "Result",
          url: urlMatch[0],
          snippet,
        });
      }
    }
    if (results.length) return { results };
  }

  // Final fallback: use DuckDuckGo Instant Answer API
  const ddgRes = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (ddgRes.ok) {
    const ddg = await ddgRes.json() as any;
    const results: SearchResult[] = [];
    if (ddg.AbstractURL) {
      results.push({ title: ddg.Heading || query, url: ddg.AbstractURL, snippet: ddg.AbstractText || "" });
    }
    for (const topic of (ddg.RelatedTopics || []).slice(0, 5)) {
      if (topic.FirstURL && topic.Text) {
        results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
      }
    }
    return { answer: ddg.AbstractText || undefined, results };
  }

  throw new Error("All search providers failed");
}

// POST /search
router.post("/search", requireAuth, async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query?.trim()) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  try {
    const { results, answer } = await searchWithJina(query.trim());
    res.json({ query: query.trim(), answer, results });
  } catch (err) {
    req.log.error({ err }, "Search failed");
    res.status(502).json({ error: "Web search temporarily unavailable. Try again in a moment." });
  }
});

export default router;
