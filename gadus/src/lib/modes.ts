import {
  MessageSquare,
  Search,
  PenTool,
  Share2,
  Mail,
  Image as ImageIcon,
  Smartphone,
  Briefcase,
  Code2,
  BarChart,
  Calendar,
  Scale
} from "lucide-react";

export const modes = [
  {
    id: "general",
    name: "General Assistant",
    description: "Answers anything, explains complex topics, brainstorms ideas.",
    icon: MessageSquare,
    prompts: [
      "Explain quantum computing simply",
      "Brainstorm ideas for a tech startup",
      "Help me plan a weekend trip to Kyoto",
      "How do I improve my public speaking?"
    ]
  },
  {
    id: "research",
    name: "Deep Research",
    description: "Market analysis, academic research, competitor analysis, structured reports.",
    icon: Search,
    prompts: [
      "Analyze the EV market for 2024",
      "What are the latest AI advancements?",
      "Compare top CRM platforms",
      "Research history of Roman architecture"
    ]
  },
  {
    id: "creative",
    name: "Creative Writing",
    description: "Stories, scripts, poems, ad copy, blog posts.",
    icon: PenTool,
    prompts: [
      "Write a sci-fi short story",
      "Draft a blog post about productivity",
      "Create a script for a 30s ad",
      "Write a poem about the ocean"
    ]
  },
  {
    id: "content",
    name: "Content Creation",
    description: "Social media captions, content calendars, YouTube scripts.",
    icon: Share2,
    prompts: [
      "1-month Twitter content calendar",
      "Write a hook for a YouTube video",
      "Generate 5 Instagram captions",
      "Ideas for a tech newsletter"
    ]
  },
  {
    id: "outreach",
    name: "Outreach & Sales",
    description: "Cold emails, LinkedIn messages, PR pitches, sales scripts.",
    icon: Mail,
    prompts: [
      "Cold email for a SaaS product",
      "LinkedIn message for networking",
      "Sales script for objections",
      "Draft a PR pitch for a startup"
    ]
  },
  {
    id: "image",
    name: "Image Prompt Generator",
    description: "Generates detailed prompts for DALL-E, Midjourney, Stable Diffusion.",
    icon: ImageIcon,
    prompts: [
      "Prompt for a cyberpunk city",
      "Photorealistic portrait prompt",
      "Watercolor style landscape",
      "Abstract geometric background"
    ]
  },
  {
    id: "social",
    name: "Social Media Manager",
    description: "Instagram, Twitter, LinkedIn, TikTok, Facebook content.",
    icon: Smartphone,
    prompts: [
      "TikTok script for a viral trend",
      "LinkedIn post about leadership",
      "Twitter thread on coding tips",
      "Facebook ad copy for e-commerce"
    ]
  },
  {
    id: "business",
    name: "Business Strategy",
    description: "Business plans, SWOT analysis, pitch decks, investor memos.",
    icon: Briefcase,
    prompts: [
      "SWOT analysis for a coffee shop",
      "Draft an investor pitch deck outline",
      "Create a 1-year business plan",
      "How to reduce operational costs"
    ]
  },
  {
    id: "code",
    name: "Code Assistant",
    description: "Write, debug, explain code in any language.",
    icon: Code2,
    prompts: [
      "Explain React useEffect hook",
      "Debug this Python script",
      "Write a SQL query for user retention",
      "Set up a basic Express server"
    ]
  },
  {
    id: "data",
    name: "Data Analyst",
    description: "Interpret data, suggest visualizations, analysis reports.",
    icon: BarChart,
    prompts: [
      "How to visualize customer churn?",
      "Explain standard deviation",
      "Analyze this sales trend data",
      "KPIs for a subscription business"
    ]
  },
  {
    id: "productivity",
    name: "Personal Productivity",
    description: "Task planning, goal setting, habit tracking, time management.",
    icon: Calendar,
    prompts: [
      "Plan my daily schedule",
      "How to build a morning routine",
      "Set SMART goals for Q3",
      "Time-blocking techniques"
    ]
  },
  {
    id: "legal",
    name: "Legal & Finance",
    description: "Contract summaries, financial planning, investment research.",
    icon: Scale,
    prompts: [
      "Explain an NDA simply",
      "Basic personal budgeting tips",
      "What are index funds?",
      "Summarize typical employment terms"
    ]
  }
];
