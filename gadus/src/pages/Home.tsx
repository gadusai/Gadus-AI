import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import Insights from "@/pages/Insights";
import { CommandPalette } from "@/components/CommandPalette";
import { ImageStudio } from "@/components/ImageStudio";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListConversationsQueryKey, getGetConversationQueryKey } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Home() {
  const [currentModeId, setCurrentModeId] = useState("General Assistant");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [view, setView] = useState<"chat" | "insights">("chat");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const queryClient = useQueryClient();

  // Global ⌘K / Ctrl+K → command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowCommandPalette(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setView("chat");
  }, []);

  const handlePinToggle = useCallback(async (id: number) => {
    try {
      await fetch(`${basePath}/api/conversations/${id}/pin`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(id) });
    } catch {
      // silently ignore
    }
  }, [queryClient]);

  const handleSetMode = useCallback((id: string) => {
    setCurrentModeId(id);
    setCurrentConversationId(null);
    setView("chat");
  }, []);

  const handleSelectConversation = useCallback((id: number, modeId: string) => {
    setCurrentConversationId(id);
    setCurrentModeId(modeId);
    setView("chat");
  }, []);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background selection:bg-primary/20">
      <Sidebar
        currentModeId={currentModeId}
        setCurrentModeId={handleSetMode}
        currentConversationId={currentConversationId}
        setCurrentConversationId={(id) => { setCurrentConversationId(id); setView("chat"); }}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeView={view}
        setActiveView={setView}
        onPinToggle={handlePinToggle}
        onOpenImageStudio={() => setShowImageStudio(true)}
      />
      {view === "insights" ? (
        <Insights />
      ) : (
        <ChatArea
          currentModeId={currentModeId}
          currentConversationId={currentConversationId}
          setCurrentConversationId={setCurrentConversationId}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNewChat={handleNewChat}
          onPinToggle={handlePinToggle}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(e => !e)}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenImageStudio={() => setShowImageStudio(true)}
        />
      )}

      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onNewChat={() => { handleNewChat(); setShowCommandPalette(false); }}
            onSetMode={(id) => { handleSetMode(id); setShowCommandPalette(false); }}
            onSelectConversation={(id, modeId) => { handleSelectConversation(id, modeId); setShowCommandPalette(false); }}
            onShowInsights={() => { setView("insights"); setShowCommandPalette(false); }}
            onShowPromptLibrary={() => setShowCommandPalette(false)}
            onShowKeyboardShortcuts={() => setShowCommandPalette(false)}
            onToggleWebSearch={() => { setWebSearchEnabled(e => !e); setShowCommandPalette(false); }}
            onOpenCamera={() => setShowCommandPalette(false)}
            onOpenImageStudio={() => { setShowImageStudio(true); setShowCommandPalette(false); }}
            webSearchEnabled={webSearchEnabled}
          />
        )}
      </AnimatePresence>

      {/* Image Studio */}
      <AnimatePresence>
        {showImageStudio && <ImageStudio onClose={() => setShowImageStudio(false)} />}
      </AnimatePresence>
    </div>
  );
}
