import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: string;
}

const DEFAULT_PLUGINS: Plugin[] = [
  { id: "file_analysis", name: "File Analysis", description: "Upload and analyze PDFs, Word docs, Excel sheets, CSVs, and images", icon: "📎", enabled: true, category: "Core" },
  { id: "web_browse", name: "Web Browse", description: "Fetch and summarize content from any URL you share", icon: "🌐", enabled: true, category: "Core" },
  { id: "image_gen", name: "Image Generation", description: "Generate images from text prompts using AI", icon: "🎨", enabled: true, category: "Core" },
  { id: "voice", name: "Voice Interface", description: "Voice-to-text input and text-to-speech response reading", icon: "🎙️", enabled: true, category: "Core" },
  { id: "memory", name: "Persistent Memory", description: "Gadus remembers facts about you across all conversations", icon: "🧠", enabled: true, category: "Intelligence" },
  { id: "feedback", name: "Response Rating", description: "Rate responses to help Gadus learn and improve", icon: "⭐", enabled: true, category: "Intelligence" },
  { id: "code_exec", name: "Code Execution", description: "Write, format and explain code across 30+ languages", icon: "💻", enabled: true, category: "Dev Tools" },
  { id: "export", name: "Export & Download", description: "Export conversations and responses as text files", icon: "📥", enabled: true, category: "Productivity" },
  { id: "sharing", name: "Conversation Sharing", description: "Generate shareable links for your conversations", icon: "🔗", enabled: true, category: "Productivity" },
  { id: "prompt_lib", name: "Prompt Library", description: "Access 50+ expert prompts across 10 industries", icon: "📚", enabled: true, category: "Productivity" },
  { id: "insights", name: "Usage Insights", description: "Analytics dashboard showing your AI usage patterns", icon: "📊", enabled: true, category: "Analytics" },
  { id: "floating_widget", name: "Floating Widget", description: "Persistent quick-chat bubble accessible from anywhere", icon: "💬", enabled: true, category: "Interface" },
];

const CATEGORIES = ["Core", "Intelligence", "Dev Tools", "Productivity", "Analytics", "Interface"];

interface PluginsPanelProps {
  onClose: () => void;
}

export function PluginsPanel({ onClose }: PluginsPanelProps) {
  const [plugins, setPlugins] = useState<Plugin[]>(() => {
    try {
      const saved = localStorage.getItem("gadus_plugins");
      if (saved) {
        const savedMap = JSON.parse(saved) as Record<string, boolean>;
        return DEFAULT_PLUGINS.map(p => ({ ...p, enabled: savedMap[p.id] ?? p.enabled }));
      }
    } catch {}
    return DEFAULT_PLUGINS;
  });

  const toggle = (id: string) => {
    setPlugins(prev => {
      const next = prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
      const map: Record<string, boolean> = {};
      next.forEach(p => { map[p.id] = p.enabled; });
      localStorage.setItem("gadus_plugins", JSON.stringify(map));
      return next;
    });
  };

  const enabledCount = plugins.filter(p => p.enabled).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
        className="bg-card border border-border/70 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="font-bold text-lg">Plugins & Capabilities</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{enabledCount} of {plugins.length} enabled</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {CATEGORIES.map(cat => {
            const catPlugins = plugins.filter(p => p.category === cat);
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{cat}</h3>
                <div className="space-y-2">
                  {catPlugins.map(plugin => (
                    <motion.div
                      key={plugin.id}
                      layout
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                        plugin.enabled
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-border/40"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{plugin.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${plugin.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {plugin.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plugin.description}</p>
                      </div>
                      <Switch
                        checked={plugin.enabled}
                        onCheckedChange={() => toggle(plugin.id)}
                        className="shrink-0"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
