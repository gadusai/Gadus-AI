import { useQuery } from "@tanstack/react-query";
import { modes } from "@/lib/modes";
import { useUser } from "@clerk/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Brain, MessageSquare, Sparkles, ThumbsUp, ThumbsDown, Layers, Activity } from "lucide-react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface InsightsData {
  totalConversations: number;
  userMessages: number;
  aiMessages: number;
  memoryCount: number;
  thumbsUp: number;
  thumbsDown: number;
  modeBreakdown: { mode: string; conversations: number; messages: number }[];
  activity: { day: string; n: number }[];
}

async function fetchInsights(): Promise<InsightsData> {
  const res = await fetch(`${BASE}/api/stats/insights`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ActivityBar({ data }: { data: { day: string; n: number }[] }) {
  const max = Math.max(...data.map((d) => d.n), 1);
  const fmt = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Activity — Last 14 Days</h3>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tickFormatter={(d) => {
              const date = new Date(d + "T12:00:00");
              return date.getDate() % 3 === 0
                ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "";
            }}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="bg-popover border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
                  <p className="text-muted-foreground mb-0.5">{fmt(label as string)}</p>
                  <p className="font-semibold text-foreground">
                    {payload[0].value} conversation{payload[0].value !== 1 ? "s" : ""}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="n" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.n > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                opacity={entry.n > 0 ? 0.15 + (entry.n / max) * 0.85 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModeBreakdown({ data }: { data: InsightsData["modeBreakdown"] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.conversations), 1);

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Modes Used</h3>
      </div>
      <div className="space-y-3">
        {data.map((row) => {
          const mode = modes.find((m) => m.id === row.mode);
          const Icon = mode?.icon ?? MessageSquare;
          const pct = Math.round((row.conversations / max) * 100);
          return (
            <div key={row.mode} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-foreground/80">
                  <Icon className="w-3.5 h-3.5 text-primary/70" />
                  <span>{row.mode}</span>
                </div>
                <span className="text-muted-foreground">
                  {row.conversations} conv · {row.messages} msg
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  className="h-full rounded-full bg-primary/70"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackRing({ up, down }: { up: number; down: number }) {
  const total = up + down;
  const upPct = total === 0 ? 50 : Math.round((up / total) * 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const upArc = (upPct / 100) * circ;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ThumbsUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Response Quality</h3>
      </div>
      {total === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          Rate responses with 👍/👎 and Gadus will track quality here.
        </p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 88 88" className="w-20 h-20 -rotate-90">
              <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <motion.circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - upArc }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{upPct}%</span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-foreground/80">{up} helpful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">{down} not helpful</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryProfile({ count }: { count: number }) {
  const milestones = [
    { at: 1, label: "First memory saved" },
    { at: 5, label: "Gadus knows you" },
    { at: 10, label: "Deeply personalized" },
    { at: 20, label: "True AI companion" },
  ];
  const next = milestones.find((m) => m.at > count);
  const pct = next ? Math.round((count / next.at) * 100) : 100;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Memory Profile</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold">{count}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">
            {count === 0
              ? "Start chatting — Gadus will learn about you automatically."
              : next
              ? `${next.at - count} more to reach "${next.label}"`
              : milestones[milestones.length - 1].label}
          </p>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </div>
      {count > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {milestones.filter((m) => m.at <= count).map((m) => (
            <span key={m.at} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
              ✓ {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Insights() {
  const { user } = useUser();
  const { data, isLoading, error } = useQuery<InsightsData>({
    queryKey: ["insights"],
    queryFn: fetchInsights,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="w-5 h-5 animate-pulse text-primary" />
          <span className="text-sm">Loading your insights…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Could not load insights. Try again later.</p>
      </div>
    );
  }

  const totalMessages = data.userMessages + data.aiMessages;

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Your Gadus Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.firstName ? `Here's how you've been using Gadus, ${user.firstName}.` : "A snapshot of your AI journey."}
          </p>
        </motion.div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Conversations" value={data.totalConversations} icon={MessageSquare} sub="across all modes" delay={0.05} />
          <StatCard label="Messages Sent" value={data.userMessages} icon={Activity} sub={`${totalMessages} total`} delay={0.1} />
          <StatCard label="AI Responses" value={data.aiMessages} icon={Sparkles} sub="from Gadus" delay={0.15} />
          <StatCard label="Modes Used" value={data.modeBreakdown.length} icon={Layers} sub="out of 12" delay={0.2} />
        </div>

        {/* Activity chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ActivityBar data={data.activity} />
        </motion.div>

        {/* Mode breakdown + Feedback ring side-by-side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ModeBreakdown data={data.modeBreakdown} />
          </motion.div>
          <div className="space-y-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <FeedbackRing up={data.thumbsUp} down={data.thumbsDown} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <MemoryProfile count={data.memoryCount} />
            </motion.div>
          </div>
        </div>

        {/* Empty state nudge */}
        {data.totalConversations === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8 text-muted-foreground/60 text-sm"
          >
            Start a conversation and your journey will appear here.
          </motion.div>
        )}
      </div>
    </div>
  );
}
