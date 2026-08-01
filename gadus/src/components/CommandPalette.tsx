import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListConversations } from "@workspace/api-client-react";
import { modes } from "@/lib/modes";
import { Search, MessageSquare, Plus, BarChart2, Keyboard, Download, Share2, Pin, Puzzle, BookOpen, Globe, Eye, Image as ImageIcon } from "lucide-react";

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  onNewChat: () => void;
  onSetMode: (modeId: string) => void;
  onSelectConversation: (id: number, modeId: string) => void;
  onShowInsights: () => void;
  onShowPromptLibrary: () => void;
  onShowKeyboardShortcuts: () => void;
  onToggleWebSearch: () => void;
  onOpenCamera: () => void;
  onOpenImageStudio: () => void;
  webSearchEnabled: boolean;
}

export function CommandPalette({
  onClose,
  onNewChat,
  onSetMode,
  onSelectConversation,
  onShowInsights,
  onShowPromptLibrary,
  onShowKeyboardShortcuts,
  onToggleWebSearch,
  onOpenCamera,
  onOpenImageStudio,
  webSearchEnabled,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: conversations = [] } = useListConversations({ search: query });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildActions = useCallback((): Action[] => {
    const staticActions: Action[] = [
      { id: "new-chat", label: "New Chat", description: "Start a fresh conversation", icon: <Plus className="w-4 h-4" />, shortcut: "⌘K", onSelect: () => { onNewChat(); onClose(); }, group: "Actions" },
      { id: "insights", label: "Open Insights", description: "View usage analytics", icon: <BarChart2 className="w-4 h-4" />, onSelect: () => { onShowInsights(); onClose(); }, group: "Actions" },
      { id: "prompts", label: "Prompt Library", description: "Browse expert prompts", icon: <BookOpen className="w-4 h-4" />, shortcut: "⌘/", onSelect: () => { onShowPromptLibrary(); onClose(); }, group: "Actions" },
      { id: "web-search", label: webSearchEnabled ? "Disable Web Search" : "Enable Web Search", description: webSearchEnabled ? "Turn off live internet search" : "Search the live internet for answers", icon: <Globe className="w-4 h-4" />, onSelect: () => { onToggleWebSearch(); onClose(); }, group: "Actions" },
      { id: "camera", label: "Camera Vision", description: "Show Gadus your camera feed", icon: <Eye className="w-4 h-4" />, onSelect: () => { onOpenCamera(); onClose(); }, group: "Actions" },
      { id: "image-studio", label: "Image Studio", description: "Browse generated images", icon: <ImageIcon className="w-4 h-4" />, onSelect: () => { onOpenImageStudio(); onClose(); }, group: "Actions" },
      { id: "shortcuts", label: "Keyboard Shortcuts", description: "View all keyboard shortcuts", icon: <Keyboard className="w-4 h-4" />, shortcut: "?", onSelect: () => { onShowKeyboardShortcuts(); onClose(); }, group: "Actions" },
    ];

    const modeActions: Action[] = modes.map(m => ({
      id: `mode-${m.id}`,
      label: m.name,
      description: m.description,
      icon: <m.icon className="w-4 h-4" />,
      onSelect: () => { onSetMode(m.id); onClose(); },
      group: "Modes",
    }));

    const convActions: Action[] = (conversations as any[]).slice(0, 5).map((c: any) => {
      const mode = modes.find(m => m.id === c.mode);
      return {
        id: `conv-${c.id}`,
        label: c.title || "Untitled",
        description: mode?.name,
        icon: mode ? <mode.icon className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />,
        onSelect: () => { onSelectConversation(c.id, c.mode); onClose(); },
        group: "Recent Chats",
      };
    });

    return [...staticActions, ...modeActions, ...convActions];
  }, [conversations, webSearchEnabled, onClose, onNewChat, onSetMode, onSelectConversation, onShowInsights, onShowPromptLibrary, onShowKeyboardShortcuts, onToggleWebSearch, onOpenCamera, onOpenImageStudio]);

  const allActions = buildActions();

  const filtered = query.trim()
    ? allActions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        (a.description?.toLowerCase().includes(query.toLowerCase()))
      )
    : allActions;

  // Group filtered actions
  const groups: Record<string, Action[]> = {};
  for (const action of filtered) {
    if (!groups[action.group]) groups[action.group] = [];
    groups[action.group].push(action);
  }
  const flatFiltered = Object.values(groups).flat();

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatFiltered[selectedIndex]) {
      e.preventDefault();
      flatFiltered[selectedIndex].onSelect();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let flatIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -10 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions, modes, conversations…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
          />
          <kbd className="text-[10px] text-muted-foreground/50 border border-border/60 rounded px-1.5 py-0.5 font-mono shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          )}
          {Object.entries(groups).map(([group, actions]) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{group}</div>
              {actions.map(action => {
                const itemIdx = flatIdx++;
                const isSelected = itemIdx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"}`}
                    onClick={action.onSelect}
                    onMouseEnter={() => setSelectedIndex(itemIdx)}
                  >
                    <span className={`shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{action.icon}</span>
                    <span className="flex-1 text-left truncate">{action.label}</span>
                    {action.description && (
                      <span className="text-xs text-muted-foreground/60 truncate max-w-[140px]">{action.description}</span>
                    )}
                    {action.shortcut && (
                      <kbd className="text-[10px] text-muted-foreground/50 border border-border/60 rounded px-1.5 py-0.5 font-mono shrink-0">{action.shortcut}</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/30 flex items-center gap-3 text-[10px] text-muted-foreground/50">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">ESC</kbd> close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
