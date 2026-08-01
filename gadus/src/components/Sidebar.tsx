import { useEffect, useState, useCallback } from "react";
import { useListConversations, useDeleteConversation, getListConversationsQueryKey, getGetModeStatsQueryKey } from "@workspace/api-client-react";
import { modes } from "@/lib/modes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, MessageSquare, Trash2, X, Moon, Sun, LogOut, BarChart2, Puzzle, Pin, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser } from "@clerk/react";
import { MemoryPanel } from "./MemoryPanel";
import { PluginsPanel } from "./PluginsPanel";
import { ThemePicker } from "./ThemePicker";
import { applyTheme, getStoredTheme } from "@/lib/themes";

interface SidebarProps {
  currentModeId: string;
  setCurrentModeId: (id: string) => void;
  currentConversationId: number | null;
  setCurrentConversationId: (id: number | null) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeView: "chat" | "insights";
  setActiveView: (v: "chat" | "insights") => void;
  onPinToggle: (id: number) => void;
  onOpenImageStudio: () => void;
}

export function Sidebar({
  currentModeId,
  setCurrentModeId,
  currentConversationId,
  setCurrentConversationId,
  isMobileOpen,
  setIsMobileOpen,
  activeView,
  setActiveView,
  onPinToggle,
  onOpenImageStudio,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [showPlugins, setShowPlugins] = useState(false);
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const { user } = useUser();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Restore theme from localStorage on mount
  useEffect(() => {
    applyTheme(getStoredTheme());
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  const { data: conversations = [], isLoading } = useListConversations({ search });
  const deleteConversation = useDeleteConversation();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      deleteConversation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetModeStatsQueryKey() });
          if (currentConversationId === id) {
            setCurrentConversationId(null);
          }
        }
      });
    }
  };

  const handlePin = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    onPinToggle(id);
  }, [onPinToggle]);

  const handleNewChat = () => {
    setCurrentConversationId(null);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const pinnedConversations = conversations.filter((c: any) => c.isPinned);
  const unpinnedConversations = conversations.filter((c: any) => !c.isPinned);

  const renderConversation = (conv: any) => {
    const isActive = currentConversationId === conv.id;
    const mode = modes.find(m => m.id === conv.mode);
    const Icon = mode?.icon || MessageSquare;

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
          isActive ? "bg-accent/50 text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        data-testid={`button-conversation-${conv.id}`}
        onClick={() => {
          setCurrentConversationId(conv.id);
          setCurrentModeId(conv.mode);
          if (window.innerWidth < 768) setIsMobileOpen(false);
        }}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-70" />
        <span className="truncate flex-1 text-left">{conv.title || "New Chat"}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${conv.isPinned ? "text-primary opacity-100" : "text-muted-foreground hover:text-primary"}`}
            onClick={(e) => handlePin(e, conv.id)}
            title={conv.isPinned ? "Unpin" : "Pin"}
          >
            <Pin className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => handleDelete(e, conv.id)}
            data-testid={`button-delete-conv-${conv.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        {conv.isPinned && (
          <Pin className="w-3 h-3 text-primary/60 shrink-0 group-hover:hidden" />
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border w-72">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
            <span className="text-primary font-bold tracking-tighter">G</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Gadus</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme picker */}
          <ThemePicker />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleTheme} data-testid="button-toggle-theme" title={isDark ? "Light mode" : "Dark mode"}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setIsMobileOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* View toggle + New Chat */}
      <div className="p-4 flex-none border-b border-border/50 space-y-2">
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          <button
            onClick={() => setActiveView("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === "chat" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => setActiveView("insights")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === "insights" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Insights
          </button>
        </div>

        <Button onClick={handleNewChat} className="w-full justify-start shadow-sm" variant="default" data-testid="button-new-chat">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
          <span className="ml-auto text-[10px] opacity-50 font-mono">⌘K</span>
        </Button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Modes */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">Modes</h3>
            {modes.map(mode => {
              const Icon = mode.icon;
              const isActive = currentModeId === mode.id && !currentConversationId;
              return (
                <button
                  key={mode.id}
                  data-testid={`button-mode-${mode.id}`}
                  onClick={() => {
                    setCurrentModeId(mode.id);
                    setCurrentConversationId(null);
                    if (window.innerWidth < 768) setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {mode.name}
                </button>
              );
            })}
          </div>

          {/* Pinned Conversations */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <Pin className="w-3 h-3 text-primary/60" />
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pinned</h3>
              </div>
              {pinnedConversations.map(renderConversation)}
            </div>
          )}

          {/* History */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">History</h3>
            </div>
            <div className="px-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
                  data-testid="input-search-history"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
              ) : unpinnedConversations.length === 0 && pinnedConversations.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</div>
              ) : unpinnedConversations.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">All chats are pinned above.</div>
              ) : (
                unpinnedConversations.map(renderConversation)
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Memory Panel */}
      <MemoryPanel />

      {/* User footer */}
      <div className="p-3 border-t border-border/50">
        {user && (
          <div className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 overflow-hidden">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                  {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || "U").toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate text-foreground">{user.firstName || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              title="Sign out"
              data-testid="button-sign-out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        <div className="flex gap-1 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-xs text-muted-foreground hover:text-foreground gap-2 px-2 py-1.5 h-auto"
            onClick={() => setShowPlugins(true)}
          >
            <Puzzle className="w-3.5 h-3.5 shrink-0" />
            Plugins
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-xs text-muted-foreground hover:text-primary gap-2 px-2 py-1.5 h-auto"
            onClick={onOpenImageStudio}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Studio
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1">Your AI. Amplified.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block h-full">
        {sidebarContent}
      </div>

      {/* Plugins panel */}
      <AnimatePresence>
        {showPlugins && <PluginsPanel onClose={() => setShowPlugins(false)} />}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
