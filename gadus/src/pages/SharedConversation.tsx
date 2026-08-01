import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { CustomMarkdown } from "@/components/CustomMarkdown";
import { motion } from "framer-motion";
import { MessageSquare, Lock } from "lucide-react";

interface SharedMessage {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface SharedConv {
  id: number;
  title: string;
  mode: string;
  createdAt: string;
  messages: SharedMessage[];
}

export default function SharedConversation() {
  const { token } = useParams<{ token: string }>();
  const [conv, setConv] = useState<SharedConv | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/shared/${token}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found or expired");
        return r.json();
      })
      .then(data => { setConv(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1,1.4,1], opacity: [0.5,1,0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i*0.15 }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  if (error || !conv) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Lock className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-semibold">Conversation not found</h2>
          <p className="text-sm text-muted-foreground">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary/50 flex items-center justify-center">
            <span className="text-primary font-bold tracking-tighter">G</span>
          </div>
          <div>
            <h1 className="font-bold text-base line-clamp-1">{conv.title}</h1>
            <p className="text-xs text-muted-foreground">{conv.mode} · {conv.messages.length} messages · {new Date(conv.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {conv.messages.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mr-3 mt-1 shrink-0">
                <span className="text-primary font-bold text-[11px]">G</span>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border/50 rounded-bl-md"
            }`}>
              {m.role === "assistant"
                ? <div className="prose prose-sm dark:prose-invert max-w-none"><CustomMarkdown content={m.content} /></div>
                : <p className="text-sm">{m.content}</p>
              }
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border/30">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span>Shared via <span className="font-semibold text-primary">Gadus AI</span></span>
        </div>
      </div>
    </div>
  );
}
