import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/lib/stream";
import { useCreateConversation } from "@workspace/api-client-react";
import { CustomMarkdown } from "./CustomMarkdown";

interface WidgetMessage {
  role: "user" | "assistant";
  content: string;
}

export function FloatingWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [convId, setConvId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const createConversation = useCreateConversation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsStreaming(true);
    setStreamedContent("");

    let cid = convId;
    if (!cid) {
      try {
        const conv = await createConversation.mutateAsync({
          data: { mode: "General Assistant", title: text.slice(0, 30) }
        });
        cid = conv.id;
        setConvId(cid);
      } catch {
        setIsStreaming(false);
        return;
      }
    }

    let full = "";
    await streamChat({
      conversationId: cid,
      content: text,
      onToken: (token) => {
        full += token;
        setStreamedContent(full);
      },
      onComplete: () => {
        setMessages(prev => [...prev, { role: "assistant", content: full }]);
        setStreamedContent("");
        setIsStreaming(false);
      },
      onError: () => {
        setIsStreaming(false);
        setStreamedContent("");
      },
    });
  }, [input, isStreaming, convId, createConversation]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
            className="w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: 440 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/20 border border-primary/50 flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">G</span>
                </div>
                <span className="font-semibold text-sm">Gadus</span>
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">Quick Chat</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setMinimized(true)}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => { setOpen(false); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary/60" />
                  </div>
                  <p className="text-sm text-muted-foreground">Ask Gadus anything</p>
                  <p className="text-xs text-muted-foreground/60">Your AI. Always available.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 border border-border/40"
                    }`}
                  >
                    {m.role === "assistant"
                      ? <div className="prose prose-sm dark:prose-invert max-w-none text-xs"><CustomMarkdown content={m.content} /></div>
                      : <span>{m.content}</span>
                    }
                  </div>
                </div>
              ))}
              {isStreaming && streamedContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl px-3 py-2 bg-muted/60 border border-border/40">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs"><CustomMarkdown content={streamedContent} /></div>
                  </div>
                </div>
              )}
              {isStreaming && !streamedContent && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2 bg-muted/60 border border-border/40 flex gap-1 items-center">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 bg-card/80">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message Gadus..."
                  rows={1}
                  className="flex-1 resize-none bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 max-h-24"
                  disabled={isStreaming}
                />
                <Button size="icon" className="h-9 w-9 rounded-xl shrink-0 shadow-sm" disabled={!input.trim() || isStreaming} onClick={handleSend}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {open && minimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card border border-border/70 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3 cursor-pointer"
            onClick={() => setMinimized(false)}
          >
            <div className="w-5 h-5 rounded bg-primary/20 border border-primary/50 flex items-center justify-center">
              <span className="text-primary font-bold text-[10px]">G</span>
            </div>
            <span className="text-sm font-medium">Gadus — Quick Chat</span>
            <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle bubble */}
      <motion.button
        onClick={() => { setOpen(o => !o); setMinimized(false); }}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
          open ? "bg-muted border border-border text-foreground" : "bg-primary text-primary-foreground shadow-primary/30"
        }`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageSquare className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
