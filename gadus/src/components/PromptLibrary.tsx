import { useState } from "react";
import { X, Search, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Prompt {
  title: string;
  prompt: string;
  mode?: string;
}

interface Category {
  label: string;
  emoji: string;
  prompts: Prompt[];
}

const LIBRARY: Category[] = [
  {
    label: "Marketing & Content",
    emoji: "📣",
    prompts: [
      { title: "Brand voice guide", prompt: "Create a comprehensive brand voice guide for my company. Include tone, vocabulary, writing style, and 10 example phrases that capture our brand personality." },
      { title: "Product launch email", prompt: "Write a product launch email sequence (3 emails) for a new SaaS tool. Make it compelling, benefit-focused, and include a strong call-to-action." },
      { title: "Blog post from keywords", prompt: "Write a 1500-word SEO-optimized blog post around the keyword [INSERT KEYWORD]. Include H2 subheadings, a hook intro, and practical takeaways." },
      { title: "Ad copy 5 variations", prompt: "Write 5 different ad copy variations for [PRODUCT]. Each should target a different emotional trigger: curiosity, FOMO, social proof, authority, and urgency." },
      { title: "Content calendar", prompt: "Create a 30-day content calendar for a B2B SaaS company on LinkedIn. Include post type, topic, hook, and best day/time for each piece.", mode: "Content Creation" },
    ],
  },
  {
    label: "Sales & Outreach",
    emoji: "🤝",
    prompts: [
      { title: "Cold email sequence", prompt: "Write a 5-email cold outreach sequence for [TARGET PERSONA]. Each email should be short (under 100 words), value-first, and end with a low-friction CTA.", mode: "Outreach & Sales" },
      { title: "LinkedIn message", prompt: "Write a LinkedIn connection request and follow-up message to a VP of Sales at a mid-size tech company. I'm selling sales training software.", mode: "Outreach & Sales" },
      { title: "Objection handling script", prompt: "Give me a complete objection handling script for the top 5 sales objections: too expensive, not the right time, already using a competitor, need to check with team, not a priority.", mode: "Outreach & Sales" },
      { title: "Sales deck narrative", prompt: "Write a compelling narrative structure for a 10-slide sales deck. Include the story arc, what each slide should accomplish emotionally, and key talking points.", mode: "Outreach & Sales" },
    ],
  },
  {
    label: "Business Strategy",
    emoji: "📊",
    prompts: [
      { title: "Go-to-market plan", prompt: "Create a detailed go-to-market strategy for a new B2B SaaS product targeting [INDUSTRY]. Include ICP definition, channels, pricing strategy, and 90-day launch plan.", mode: "Business Strategy" },
      { title: "SWOT analysis", prompt: "Conduct a thorough SWOT analysis for a company in [INDUSTRY]. Be specific, actionable, and include strategic recommendations for each quadrant.", mode: "Business Strategy" },
      { title: "Investor memo", prompt: "Write a one-page investor memo for a pre-seed startup in [SPACE]. Include problem, solution, market size, traction, team, and ask.", mode: "Business Strategy" },
      { title: "Pricing strategy", prompt: "Design a pricing strategy for a SaaS product with 3 tiers. Include tier names, features at each level, price anchoring psychology, and upsell triggers.", mode: "Business Strategy" },
      { title: "Competitor analysis", prompt: "Build a competitive analysis matrix for [COMPANY] vs its top 5 competitors. Compare on product features, pricing, GTM, strengths, and weaknesses.", mode: "Business Strategy" },
    ],
  },
  {
    label: "Creative Writing",
    emoji: "✍️",
    prompts: [
      { title: "Short story opener", prompt: "Write the first 500 words of a psychological thriller set in a near-future city where memories can be bought and sold. Make the narrator unreliable.", mode: "Creative Writing" },
      { title: "Character backstory", prompt: "Create a richly detailed backstory for a character who became a vigilante after a traumatic loss. Include formative childhood events, key turning points, and deep contradictions.", mode: "Creative Writing" },
      { title: "Product origin story", prompt: "Write a compelling founder origin story for a fintech startup in first person. It should be raw, honest, and end with the moment they decided to build the product.", mode: "Creative Writing" },
      { title: "Viral essay hook", prompt: "Write 5 different opening hooks for an essay about [TOPIC]. Make each hook stop a reader mid-scroll. Use different techniques: controversy, counter-intuition, vivid scene, bold claim, question.", mode: "Creative Writing" },
    ],
  },
  {
    label: "Code & Tech",
    emoji: "💻",
    prompts: [
      { title: "Code review", prompt: "Review this code for bugs, performance issues, security vulnerabilities, and style improvements. Provide specific line-by-line feedback with fixes:\n\n[PASTE CODE HERE]", mode: "Code Assistant" },
      { title: "System design", prompt: "Design a scalable system architecture for [APP TYPE] that needs to handle 1M daily active users. Include database design, API design, caching strategy, and infrastructure.", mode: "Code Assistant" },
      { title: "Debug this error", prompt: "I'm getting this error in my code. Explain exactly what's causing it, why, and give me the corrected code with an explanation:\n\n[PASTE ERROR AND CODE]", mode: "Code Assistant" },
      { title: "Tech stack recommendation", prompt: "I'm building [TYPE OF APP] for [TARGET USERS]. Recommend the ideal tech stack with reasoning for: frontend, backend, database, hosting, and key third-party services.", mode: "Code Assistant" },
    ],
  },
  {
    label: "Data & Research",
    emoji: "🔬",
    prompts: [
      { title: "Market research report", prompt: "Write an executive-grade market research report on [INDUSTRY]. Include market size, growth rate, key players, trends, opportunities, and risks. Use structured sections.", mode: "Deep Research" },
      { title: "Data analysis framework", prompt: "I have a dataset about [TOPIC]. Walk me through a complete analytical framework: what questions to ask, what patterns to look for, what statistical tests are appropriate, and how to present findings.", mode: "Data Analyst" },
      { title: "Literature review", prompt: "Summarize the current state of research on [TOPIC]. Cover the key findings, main debates, leading researchers, methodologies used, and gaps in the literature.", mode: "Deep Research" },
      { title: "Survey design", prompt: "Design a 15-question survey to measure [OBJECTIVE] for [TARGET AUDIENCE]. Include question types, skip logic recommendations, and how to analyze the results.", mode: "Deep Research" },
    ],
  },
  {
    label: "Social Media",
    emoji: "📱",
    prompts: [
      { title: "Twitter/X thread", prompt: "Write a 10-tweet thread about [TOPIC] that would go viral in the [INDUSTRY] community. Start with a bold hook, teach something valuable, end with a CTA.", mode: "Social Media Manager" },
      { title: "LinkedIn personal brand post", prompt: "Write a high-performing LinkedIn post about a lesson I learned from [EXPERIENCE]. Make it personal, specific, and end with a question that sparks comments.", mode: "Social Media Manager" },
      { title: "Instagram caption pack", prompt: "Write 7 different Instagram captions for a [BRAND TYPE] posting about [TOPIC]. Vary the tone: inspirational, humorous, educational, behind-the-scenes, product-focused, user-focused, and storytelling.", mode: "Social Media Manager" },
      { title: "Viral hook formulas", prompt: "Give me 20 proven viral hook formulas I can use for [NICHE] content on short-form video. For each, explain the psychology and give an example.", mode: "Social Media Manager" },
    ],
  },
  {
    label: "Legal & Finance",
    emoji: "⚖️",
    prompts: [
      { title: "Contract review checklist", prompt: "Create a thorough contract review checklist for a SaaS vendor agreement. Flag the clauses I should pay closest attention to and red flags to watch for.", mode: "Legal & Finance" },
      { title: "Financial model outline", prompt: "Build a financial model outline for a SaaS startup's Series A fundraise. Include revenue assumptions, cost structure, unit economics, and 3-year projections framework.", mode: "Legal & Finance" },
      { title: "Privacy policy sections", prompt: "List all the essential sections a privacy policy for a mobile app must include, with plain-English explanations of what each section should cover and why.", mode: "Legal & Finance" },
      { title: "Term sheet breakdown", prompt: "Explain all the key terms in a standard Series A term sheet. For each: what it means, why it matters, what's negotiable, and what red flags to watch for.", mode: "Legal & Finance" },
    ],
  },
];

interface PromptLibraryProps {
  onUsePrompt: (prompt: string, mode?: string) => void;
  onClose: () => void;
}

export function PromptLibrary({ onUsePrompt, onClose }: PromptLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = LIBRARY.map((cat) => ({
    ...cat,
    prompts: cat.prompts.filter(
      (p) =>
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.prompt.toLowerCase().includes(search.toLowerCase()) ||
        cat.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.prompts.length > 0);

  const displayCats = activeCategory
    ? filtered.filter((c) => c.label === activeCategory)
    : filtered;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Prompt Library</h2>
            <span className="text-xs text-muted-foreground">
              {LIBRARY.reduce((n, c) => n + c.prompts.length, 0)} expert prompts
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + filter */}
        <div className="px-5 py-3 border-b border-border/40 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                !activeCategory
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              All
            </button>
            {LIBRARY.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  activeCategory === cat.label
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt list */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {displayCats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No prompts match your search.</p>
          )}
          {displayCats.map((cat) => (
            <div key={cat.label}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {cat.emoji} {cat.label}
              </h3>
              <div className="space-y-1.5">
                {cat.prompts.map((p) => (
                  <button
                    key={p.title}
                    onClick={() => { onUsePrompt(p.prompt, p.mode); onClose(); }}
                    className="w-full text-left flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.prompt.slice(0, 80)}…</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
