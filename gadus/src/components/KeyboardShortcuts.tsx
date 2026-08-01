import { motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShortcutRowProps {
  keys: string[];
  label: string;
}

function ShortcutRow({ keys, label }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="inline-flex items-center">
            {i > 0 && <span className="text-muted-foreground/50 mx-1 text-xs">+</span>}
            <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded bg-muted border border-border/60 text-xs font-mono font-medium text-foreground shadow-sm">
              {k}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const isMac = navigator.platform.includes("Mac");
  const mod = isMac ? "⌘" : "Ctrl";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-base">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Navigation</h3>
            <div className="divide-y divide-border/30">
              <ShortcutRow keys={[mod, "K"]} label="New chat" />
              <ShortcutRow keys={[mod, "/"]} label="Open Prompt Library" />
              <ShortcutRow keys={["Esc"]} label="Close modal / Cancel" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conversation</h3>
            <div className="divide-y divide-border/30">
              <ShortcutRow keys={[mod, "Shift", "E"]} label="Export conversation" />
              <ShortcutRow keys={[mod, "Shift", "S"]} label="Share conversation" />
              <ShortcutRow keys={[mod, "Shift", "P"]} label="Pin / unpin conversation" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Input</h3>
            <div className="divide-y divide-border/30">
              <ShortcutRow keys={["Enter"]} label="Send message" />
              <ShortcutRow keys={["Shift", "Enter"]} label="New line in message" />
              <ShortcutRow keys={[mod, "Stop"]} label="Stop response" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Help</h3>
            <div className="divide-y divide-border/30">
              <ShortcutRow keys={["?"]} label="Show keyboard shortcuts" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
