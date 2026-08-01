import { Router } from "express";

const router = Router();

const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: "photorealistic, ultra detailed, 8K resolution, DSLR photography, natural lighting",
  anime: "anime style, vibrant colors, Studio Ghibli aesthetic, detailed line art, manga influence",
  cinematic: "cinematic, movie still, dramatic lighting, anamorphic lens, film grain, 35mm photography",
  artistic: "digital art, concept art, artstation quality, trending, vibrant illustration",
  "3d-render": "3D render, octane render, volumetric lighting, subsurface scattering, hyper realistic CGI",
  sketch: "pencil sketch, graphite drawing, fine line art, monochrome, detailed hatching",
  watercolor: "watercolor painting, soft washes, artistic, loose brushwork, paper texture visible",
  "oil-painting": "oil painting, impasto technique, rich textures, classical art style, museum quality",
};

const ASPECT_RATIOS: Record<string, string> = {
  "1:1": "1:1",
  "16:9": "16:9",
  "9:16": "9:16",
  "4:3": "4:3",
  "3:2": "3:2",
};

// POST /images/generate
router.post("/images/generate", async (req, res) => {
  const {
    prompt,
    style = "photorealistic",
    aspectRatio = "1:1",
    count = 1,
    quality = "standard",
  } = req.body as {
    prompt?: string;
    style?: string;
    aspectRatio?: string;
    count?: number;
    quality?: string;
  };

  if (!prompt?.trim()) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    res.status(500).json({ error: "REPLICATE_API_TOKEN not configured" });
    return;
  }

  // Build enhanced prompt with style
  const styleModifier = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.photorealistic;
  const enhancedPrompt = style && style !== "none"
    ? `${prompt.trim()}, ${styleModifier}`
    : prompt.trim();

  const numOutputs = Math.min(Math.max(Number(count) || 1, 1), 4);
  const ar = ASPECT_RATIOS[aspectRatio] ?? "1:1";

  try {
    const createRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "wait=60",
      },
      body: JSON.stringify({
        input: {
          prompt: enhancedPrompt,
          num_outputs: numOutputs,
          aspect_ratio: ar,
          output_format: "webp",
          output_quality: quality === "hq" ? 100 : 80,
          go_fast: quality !== "hq",
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      req.log.error({ status: createRes.status, errText }, "Replicate API error");
      res.status(502).json({ error: "Image generation failed. Please try again." });
      return;
    }

    const prediction = await createRes.json() as any;

    if (prediction.status === "succeeded" && prediction.output?.length) {
      res.json({ imageUrls: prediction.output, imageUrl: prediction.output[0] });
      return;
    }

    const pollUrl = prediction.urls?.get;
    if (!pollUrl) {
      res.status(502).json({ error: "No polling URL returned from Replicate" });
      return;
    }

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(pollUrl, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!pollRes.ok) continue;
      const poll = await pollRes.json() as any;
      if (poll.status === "succeeded" && poll.output?.length) {
        res.json({ imageUrls: poll.output, imageUrl: poll.output[0] });
        return;
      }
      if (poll.status === "failed" || poll.status === "canceled") {
        res.status(502).json({ error: "Image generation failed" });
        return;
      }
    }

    res.status(504).json({ error: "Image generation timed out. Please try again." });
  } catch (err) {
    req.log.error({ err }, "Image generation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
