import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

router.post("/browse", requireAuth, async (req, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "url is required" });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      res.status(400).json({ error: "Only http/https URLs are supported" });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Gadus-AI/1.0 (web-reader)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") ?? "";
    let text: string;

    if (contentType.includes("text/html")) {
      const html = await response.text();
      text = extractTextFromHtml(html);
    } else if (contentType.includes("text/")) {
      text = await response.text();
    } else {
      res.status(422).json({ error: "URL does not return readable text content" });
      return;
    }

    const truncated = text.length > 30000 ? text.slice(0, 30000) + "\n\n[Content truncated]" : text;

    res.json({
      url,
      title: parsed.hostname,
      content: truncated,
      charCount: text.length,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      res.status(504).json({ error: "Request timed out" });
      return;
    }
    req.log.error({ err }, "Browse failed");
    res.status(500).json({ error: "Failed to fetch URL" });
  }
});

export default router;
