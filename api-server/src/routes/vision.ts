import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// POST /vision/analyze
// Body: { imageBase64: string; mimeType: string; question?: string }
router.post("/vision/analyze", requireAuth, async (req, res) => {
  const { imageBase64, mimeType, question } = req.body as {
    imageBase64?: string;
    mimeType?: string;
    question?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured" });
    return;
  }

  const mime = mimeType || "image/jpeg";
  const dataUrl = `data:${mime};base64,${imageBase64}`;
  const prompt = question?.trim() || "Describe what you see in this image in detail. Identify objects, text, people, scenes, and anything noteworthy.";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: "You are Gadus, an advanced AI with computer vision capabilities. Analyze images accurately, describe what you see in rich detail, identify text via OCR, recognize objects, and answer questions about visual content with precision.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ status: response.status, err }, "Groq vision error");
      res.status(502).json({ error: "Vision analysis failed. Please try again." });
      return;
    }

    const data = await response.json() as any;
    const analysis = data.choices?.[0]?.message?.content ?? "Could not analyze the image.";
    res.json({ analysis });
  } catch (err) {
    req.log.error({ err }, "Vision analysis error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
