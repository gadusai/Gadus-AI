import { useState } from "react";
import { Brain, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Memory {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchMemories(): Promise<Memory[]> {
  const res = await fetch(`${BASE}/api/memories`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch memories");
  return res.json();
}

async function deleteMemory(key: string): Promise<void> {
  const res = await fetch(`${BASE}/api/memories/${encodeURIComponent(key)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete memory");
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MemoryPanel() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: memories = [], isLoading } = useQuery<Memory[]>({
    queryKey: ["user-memories"],
    queryFn: fetchMemories,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-memories"] }),
  });

  return (
    <div className="border-t border-border/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5" />
          <span className="font-medium">Gadus Memory</span>
          {memories.length > 0 && (
            <span className="bg-primary/15 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {memories.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="memory-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5 max-h-52 overflow-y-auto">
              {isLoading ? (
                <p className="text-[11px] text-muted-foreground px-2 py-1">Loading...</p>
              ) : memories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-3 text-center">
                  <Sparkles className="w-5 h-5 text-muted-foreground/40" />
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                    Gadus will remember things about you<br />as you chat — name, goals, style, expertise.
                  </p>
                </div>
              ) : (
                memories.map((mem) => (
                  <motion.div
                    key={mem.id}
                    layout
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="group flex items-start justify-between gap-2 bg-muted/30 hover:bg-muted/50 rounded-lg px-2.5 py-2 transition-colors"
                  >
                    <div className="overflow-hidden min-w-0">
                      <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider truncate">
                        {formatKey(mem.key)}
                      </p>
                      <p className="text-[11px] text-foreground/80 leading-snug mt-0.5 break-words">
                        {mem.value}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive mt-0.5"
                      onClick={() => deleteMutation.mutate(mem.key)}
                      disabled={deleteMutation.isPending}
                      title={`Forget "${formatKey(mem.key)}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
