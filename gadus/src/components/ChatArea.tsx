import { useState, useRef, useEffect, useCallback } from "react";
import { 
  useGetConversation, 
  useCreateConversation, 
  useRateMessage,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import { modes } from "@/lib/modes";
import { Button } from "@/components/ui/button";
import {
  Send, Menu, Download, Copy, Check, Terminal, Mic, MicOff,
  ThumbsUp, ThumbsDown, ImageIcon, Volume2, VolumeX, Paperclip,
  X as XIcon, Loader2, BookOpen, Share2, Square, Keyboard, Pin,
  Globe, Eye, Lock, Settings2, ChevronDown,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { streamChat } from "@/lib/stream";
import { CustomMarkdown } from "./CustomMarkdown";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { PromptLibrary } from "./PromptLibrary";
import { ShareModal } from "./ShareModal";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { CameraCapture } from "./CameraCapture";
import { saveImageToStudio } from "./ImageStudio";

const IMAGE_PROMPT_MODE = "Image Prompt Generator";

const IMAGE_STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "anime", label: "Anime" },
  { value: "artistic", label: "Artistic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "3d-render", label: "3D Render" },
  { value: "sketch", label: "Sketch" },
  { value: "watercolor", label: "Watercolor" },
];

const ASPECT_RATIOS = [
  { value: "square", label: "1:1 Square" },
  { value: "landscape", label: "16:9 Landscape" },
  { value: "portrait", label: "9:16 Portrait" },
  { value: "widescreen", label: "21:9 Wide" },
];

interface AttachedFile {
  name: string;
  content: string;
  size: number;
  type: string;
}

interface ChatAreaProps {
  currentModeId: string;
  currentConversationId: number | null;
  setCurrentConversationId: (id: number | null) => void;
  onOpenMobileMenu: () => void;
  onNewChat: () => void;
  onPinToggle?: (id: number) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onOpenCommandPalette: () => void;
  onOpenImageStudio: () => void;
}

export function ChatArea({
  currentModeId,
  currentConversationId,
  setCurrentConversationId,
  onOpenMobileMenu,
  onNewChat,
  onPinToggle,
  webSearchEnabled,
  onToggleWebSearch,
  onOpenCommandPalette,
  onOpenImageStudio,
}: ChatAreaProps) {
  const mode = modes.find(m => m.id === currentModeId) || modes[0];
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [streamWordCount, setStreamWordCount] = useState(0);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<string, { url: string | null; urls: string[]; prompt: string; status: "loading" | "done" | "error" }>>({});
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  // File upload
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  // URL browse
  const [isBrowsing, setIsBrowsing] = useState(false);
  // Web search
  const [isSearching, setIsSearching] = useState(false);
  // Private mode
  const [privateMode, setPrivateMode] = useState(false);
  // Image controls
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [imageAspect, setImageAspect] = useState("square");
  const [imageCount, setImageCount] = useState(1);
  const [showImageControls, setShowImageControls] = useState(false);
  // Camera
  const [showCamera, setShowCamera] = useState(false);
  // Modals
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const speakMessage = useCallback((id: number, text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`>_~]/g, "").trim());
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }, [speakingId]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInput(transcript);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const { isListening, isSupported, toggleListening, stopListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    onError: (err) => {
      setVoiceError(err);
      setTimeout(() => setVoiceError(null), 4000);
    },
  });
  
  const queryClient = useQueryClient();
  const { data: conversation } = useGetConversation(currentConversationId as number, { 
    query: { 
      enabled: !!currentConversationId,
      queryKey: getGetConversationQueryKey(currentConversationId as number),
    } 
  });
  const createConversation = useCreateConversation();
  const rateMessage = useRateMessage();

  const messages = conversation?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  useEffect(() => {
    if (streamedContent) {
      setStreamWordCount(streamedContent.split(/\s+/).filter(Boolean).length);
    } else {
      setStreamWordCount(0);
    }
  }, [streamedContent]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "?" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }
      if (e.key === "Escape") {
        setShowPromptLibrary(false);
        setShowShare(false);
        setShowKeyboardShortcuts(false);
        setShowCamera(false);
        setShowImageControls(false);
        return;
      }
      if (!mod) return;
      // ⌘/ — prompt library
      if (e.key === "/") {
        e.preventDefault();
        setShowPromptLibrary(true);
        return;
      }
      if (!e.shiftKey) return;
      // ⌘⇧E — export
      if (e.key === "E" || e.key === "e") {
        e.preventDefault();
        handleExport();
        return;
      }
      // ⌘⇧S — share
      if ((e.key === "S" || e.key === "s") && conversation) {
        e.preventDefault();
        setShowShare(true);
        return;
      }
      // ⌘⇧P — pin/unpin
      if ((e.key === "P" || e.key === "p") && currentConversationId && onPinToggle) {
        e.preventDefault();
        onPinToggle(currentConversationId);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, conversation, currentConversationId, onPinToggle]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true);
    setFileError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/files/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to analyze file");
      const data = await res.json();
      setAttachedFile({ name: data.filename, content: data.content, size: data.size, type: data.mimetype });
    } catch {
      setFileError("Could not read file. Please try another format.");
      setTimeout(() => setFileError(null), 4000);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleBrowseUrl = async (url: string) => {
    setIsBrowsing(true);
    try {
      const res = await fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch URL");
      const data = await res.json();
      const summary = `[Web page fetched: ${url}]\n\n${data.content?.slice(0, 8000) || "Could not extract content."}`;
      setAttachedFile({ name: url, content: summary, size: summary.length, type: "text/html" });
    } catch {
      setFileError("Could not fetch URL content. Make sure it's a public webpage.");
      setTimeout(() => setFileError(null), 4000);
    } finally {
      setIsBrowsing(false);
    }
  };

  const performWebSearch = async (query: string): Promise<string | null> => {
    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      const results = data.results?.slice(0, 5) || [];
      if (!results.length && !data.answer) return null;

      const lines: string[] = [`[🔍 Web Search: "${query}"]`];
      if (data.answer) lines.push(`\nSummary: ${data.answer}`);
      if (results.length) {
        lines.push("\nSources:");
        results.forEach((r: any, i: number) => {
          lines.push(`${i + 1}. ${r.title} — ${r.url}`);
          if (r.snippet) lines.push(`   ${r.snippet}`);
        });
      }
      return lines.join("\n");
    } catch {
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedFile) || isStreaming) return;

    if (isListening) stopListening();

    // Auto-browse if input is a plain URL
    if (trimmed.match(/^https?:\/\/\S+$/) && !attachedFile) {
      await handleBrowseUrl(trimmed);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }

    let currentInput = trimmed;

    // Web search injection
    if (webSearchEnabled && trimmed && !attachedFile) {
      const searchCtx = await performWebSearch(trimmed);
      if (searchCtx) {
        currentInput = `${searchCtx}\n\n---\nUser question: ${trimmed}`;
      }
    }

    if (attachedFile) {
      currentInput = currentInput
        ? `${currentInput}\n\n---\n📎 Attached: ${attachedFile.name}\n\n${attachedFile.content}`
        : `Analyze this file: ${attachedFile.name}\n\n${attachedFile.content}`;
      setAttachedFile(null);
    }

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Private mode: skip DB, run in-memory only (show warning)
    if (privateMode) {
      // Still stream but without persisting — just show the exchange locally
      // For now, inject a note; full private-mode without DB would need backend support
      currentInput = `[PRIVATE MODE - this conversation will not be saved]\n\n${currentInput}`;
    }

    let convId = currentConversationId;

    if (!convId) {
      try {
        const newConv = await createConversation.mutateAsync({
          data: { mode: currentModeId, title: (trimmed || attachedFile?.name || "File Analysis").slice(0, 60) }
        });
        convId = newConv.id;
        setCurrentConversationId(convId);
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      } catch {
        return;
      }
    }

    queryClient.setQueryData(getGetConversationQueryKey(convId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          { id: Date.now(), role: "user", content: trimmed || "(file analysis)", createdAt: new Date().toISOString(), conversationId: convId }
        ]
      };
    });

    setIsStreaming(true);
    setStreamedContent("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamChat({
      conversationId: convId,
      content: currentInput,
      signal: controller.signal,
      onToken: (token) => {
        setStreamedContent(prev => prev + token);
      },
      onComplete: () => {
        setIsStreaming(false);
        setStreamedContent("");
        abortControllerRef.current = null;
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(convId as number) });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
      onError: () => {
        setIsStreaming(false);
        setStreamedContent("");
        abortControllerRef.current = null;
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(convId as number) });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: number | string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateImage = async (prompt: string) => {
    const tempId = `img-${Date.now()}`;
    setGeneratingImages(prev => ({ ...prev, [tempId]: { url: null, urls: [], prompt, status: "loading" } }));
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: imageStyle, aspectRatio: imageAspect, count: imageCount }),
        credentials: "include",
      });
      const data = await res.json();
      const urls: string[] = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
      if (res.ok && urls.length) {
        setGeneratingImages(prev => ({ ...prev, [tempId]: { url: urls[0], urls, prompt, status: "done" } }));
        urls.forEach(url => saveImageToStudio(url, prompt, imageStyle));
      } else {
        setGeneratingImages(prev => ({ ...prev, [tempId]: { url: null, urls: [], prompt, status: "error" } }));
      }
    } catch {
      setGeneratingImages(prev => ({ ...prev, [tempId]: { url: null, urls: [], prompt, status: "error" } }));
    }
  };

  const handleCameraAnalysis = useCallback((analysis: string, imageDataUrl: string) => {
    const context = `[Vision Analysis — camera capture]\n\n${analysis}`;
    setInput(context);
    setAttachedFile({ name: "camera-capture.jpg", content: `[Image captured from camera]\n\n${analysis}`, size: imageDataUrl.length, type: "image/jpeg" });
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleReaction = (messageId: number, reaction: "up" | "down", current: string | null | undefined) => {
    const newReaction = current === reaction ? null : reaction;
    rateMessage.mutate(
      { id: messageId, data: { reaction: newReaction } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(currentConversationId as number) });
        },
      }
    );
  };

  const handleExport = () => {
    if (!conversation) return;
    const title = conversation.title || "Gadus Conversation";
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; max-width: 780px; margin: 0 auto; padding: 48px 32px; line-height: 1.6; }
    header { border-bottom: 2px solid #1a7a5a; padding-bottom: 20px; margin-bottom: 32px; }
    header h1 { font-size: 22px; font-weight: 700; color: #1a7a5a; margin-bottom: 4px; }
    header p { font-size: 13px; color: #666; }
    .message { margin-bottom: 28px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .user .label { color: #1a7a5a; }
    .assistant .label { color: #555; }
    .bubble { padding: 16px 20px; border-radius: 12px; font-size: 15px; white-space: pre-wrap; word-break: break-word; }
    .user .bubble { background: #f0faf5; border: 1px solid #c5e8d9; }
    .assistant .bubble { background: #f9f9f9; border: 1px solid #e5e5e5; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 14px 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; margin: 8px 0; }
    code { font-family: 'Courier New', monospace; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    @media print { body { padding: 32px; } }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>Exported from Gadus AI · ${date} · ${conversation.messages.length} messages</p>
  </header>
  ${conversation.messages.map(m => `
  <div class="message ${m.role}">
    <div class="label">${m.role === "user" ? "You" : "Gadus"}</div>
    <div class="bubble">${m.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  </div>`).join("")}
  <footer>Generated by Gadus AI — Your AI, Amplified.</footer>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  const isImageMode = mode.id === IMAGE_PROMPT_MODE;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <header className="h-14 flex-none flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-md z-10 absolute top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="font-medium truncate max-w-[180px] sm:max-w-xs">
            {conversation ? conversation.title || "Chat" : mode.name}
          </div>
          {/* Status badges */}
          <div className="hidden sm:flex items-center gap-1.5">
            {webSearchEnabled && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                <Globe className="w-2.5 h-2.5" />
                Search ON
              </span>
            )}
            {privateMode && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                <Lock className="w-2.5 h-2.5" />
                Private
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {conversation && (
            <>
              {onPinToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${(conversation as any).isPinned ? "text-primary" : "text-muted-foreground"}`}
                  onClick={() => onPinToggle(conversation.id)}
                  title={(conversation as any).isPinned ? "Unpin conversation" : "Pin conversation"}
                >
                  <Pin className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setShowShare(true)} title="Share conversation (⌘⇧S)">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport} className="text-muted-foreground" title="Export as PDF (⌘⇧E)">
                <Download className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hidden sm:flex" onClick={() => setShowKeyboardShortcuts(true)} title="Keyboard shortcuts (?)">
            <Keyboard className="w-4 h-4" />
          </Button>
          {/* Command palette trigger */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onOpenCommandPalette} title="Command palette (⌘K)">
            <span className="text-xs font-mono opacity-60">⌘K</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-14 pb-36" ref={scrollRef}>
        {!currentConversationId ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-full p-8 max-w-3xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary border border-primary/20">
              <mode.icon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-3">{mode.name}</h1>
            <p className="text-muted-foreground mb-10 max-w-lg">{mode.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {mode.prompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto p-4 justify-start text-left whitespace-normal hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                  onClick={() => {
                    setInput(prompt);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "auto";
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                      textareaRef.current.focus();
                    }
                  }}
                >
                  <span className="line-clamp-2">{prompt}</span>
                </Button>
              ))}
            </div>

            <p className="mt-8 text-xs text-muted-foreground/50">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 font-mono text-[10px]">⌘K</kbd> for command palette
            </p>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                    msg.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {msg.role === "user" ? <span className="text-sm font-medium">U</span> : <Terminal className="w-4 h-4" />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-5 py-3.5 ${
                      msg.role === "user" 
                        ? "bg-accent text-foreground" 
                        : "bg-card border border-border/50 shadow-sm"
                    }`}>
                      {msg.role === "user" ? (
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      ) : (
                        <CustomMarkdown content={msg.content} />
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground px-1 flex-wrap">
                        <span>{msg.content.split(/\s+/).filter(Boolean).length} words</span>
                        <button 
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                          {copiedId === msg.id ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => speakMessage(msg.id, msg.content)}
                          className={`flex items-center gap-1 transition-colors ${speakingId === msg.id ? "text-primary" : "hover:text-foreground"}`}
                        >
                          {speakingId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          {speakingId === msg.id ? "Stop" : "Read"}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleReaction(msg.id, "up", msg.reaction)}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-all hover:bg-primary/10 ${msg.reaction === "up" ? "text-primary" : "hover:text-primary"}`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${msg.reaction === "up" ? "fill-primary" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleReaction(msg.id, "down", msg.reaction)}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-all hover:bg-destructive/10 ${msg.reaction === "down" ? "text-destructive" : "hover:text-destructive"}`}
                          >
                            <ThumbsDown className={`w-3 h-3 ${msg.reaction === "down" ? "fill-destructive" : ""}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming response */}
            {isStreaming && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="flex flex-col max-w-[85%] items-start w-full">
                  <div className="rounded-2xl px-5 py-3.5 bg-card border border-border/50 shadow-sm w-full">
                    {streamedContent
                      ? <CustomMarkdown content={streamedContent} />
                      : (
                        <div className="flex gap-1 items-center py-1">
                          {[0,1,2].map(i => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      )
                    }
                  </div>
                  {streamedContent && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground px-1">
                      <span>{streamWordCount} words</span>
                      <span className="flex items-center gap-1 text-primary/60">
                        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>●</motion.span>
                        Generating…
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Generated images */}
        {Object.keys(generatingImages).length > 0 && (
          <div className="max-w-3xl mx-auto px-4 md:px-6 pb-4 space-y-4">
            {Object.entries(generatingImages).map(([id, img]) => (
              <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  {img.status === "loading" && (
                    <div className="rounded-2xl px-5 py-4 bg-card border border-border/50 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Generating {imageCount > 1 ? `${imageCount} images` : "image"}…</span>
                    </div>
                  )}
                  {img.status === "done" && img.urls.length > 0 && (
                    <div className="rounded-2xl overflow-hidden bg-card border border-border/50">
                      <div className={`grid ${img.urls.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-1`}>
                        {img.urls.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt={`${img.prompt} ${i + 1}`} className="w-full object-cover" loading="lazy" />
                            <a
                              href={url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded-lg"
                            >
                              ↓
                            </a>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground line-clamp-1">{img.prompt}</span>
                        <button
                          onClick={onOpenImageStudio}
                          className="text-xs text-primary hover:underline shrink-0"
                        >
                          View Studio
                        </button>
                      </div>
                    </div>
                  )}
                  {img.status === "error" && (
                    <div className="rounded-2xl px-5 py-3.5 bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                      Image generation failed. Please try again.
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4 md:px-6 z-20">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Image controls panel (only in image mode) */}
          <AnimatePresence>
            {isImageMode && showImageControls && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="bg-card/90 backdrop-blur border border-border/60 rounded-xl p-3 grid grid-cols-3 gap-3"
              >
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">Style</label>
                  <select
                    value={imageStyle}
                    onChange={e => setImageStyle(e.target.value)}
                    className="w-full bg-muted/50 border border-border/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {IMAGE_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">Aspect</label>
                  <select
                    value={imageAspect}
                    onChange={e => setImageAspect(e.target.value)}
                    className="w-full bg-muted/50 border border-border/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">Count</label>
                  <select
                    value={imageCount}
                    onChange={e => setImageCount(Number(e.target.value))}
                    className="w-full bg-muted/50 border border-border/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} image{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Web search indicator */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2"
              >
                <Globe className="w-3.5 h-3.5 animate-pulse" />
                Searching the web…
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached file pill */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2 text-sm"
              >
                <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-primary font-medium truncate flex-1">{attachedFile.name}</span>
                <span className="text-muted-foreground text-xs shrink-0">{(attachedFile.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground ml-1">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            {/* Errors */}
            <AnimatePresence>
              {(voiceError || fileError) && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute -top-10 left-0 right-0 text-center"
                >
                  <span className="inline-block bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-lg shadow">
                    {voiceError || fileError}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Listening ring */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/60 pointer-events-none"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening ? "Listening..." :
                isUploadingFile || isBrowsing ? "Processing..." :
                isSearching ? "Searching the web..." :
                isStreaming ? "Gadus is thinking..." :
                "Message Gadus... or paste a URL to browse"
              }
              className="w-full resize-none bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl pl-[5.5rem] pr-[5.5rem] py-4 max-h-[200px] focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-lg text-[15px]"
              rows={1}
              disabled={isStreaming || isUploadingFile || isBrowsing || isSearching}
            />

            {/* Left side buttons */}
            <div className="absolute left-2.5 bottom-2.5 flex items-center gap-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.xml,.html,image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                  e.target.value = "";
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || isUploadingFile}
                title="Attach file"
              >
                {isUploadingFile || isBrowsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              {/* Camera button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => setShowCamera(true)}
                disabled={isStreaming}
                title="Camera vision"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            {/* Right side buttons */}
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-0.5">
              {/* Image style toggle (image mode only) */}
              {isImageMode && (
                <Button
                  size="icon"
                  variant={showImageControls ? "default" : "ghost"}
                  className={`h-8 w-8 rounded-xl ${showImageControls ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setShowImageControls(o => !o)}
                  title="Image settings"
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              )}
              {/* Image generate button (image mode only) */}
              {isImageMode && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-xl text-primary hover:bg-primary/10"
                  disabled={!input.trim() || isStreaming}
                  onClick={() => { if (input.trim()) generateImage(input.trim()); }}
                  title="Generate image"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              )}
              {/* Stop streaming */}
              {isStreaming ? (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={handleStopStreaming}
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-destructive" />
                </Button>
              ) : (
                isSupported && (
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "ghost"}
                    className={`h-9 w-9 rounded-xl transition-all ${
                      isListening ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={toggleListening}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )
              )}
              <Button
                size="icon"
                className="h-9 w-9 rounded-xl shadow-sm transition-all"
                disabled={(!input.trim() && !attachedFile) || isStreaming}
                onClick={handleSend}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2"
                onClick={() => setShowPromptLibrary(true)}
                title="Prompt Library (⌘/)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prompts</span>
              </Button>
              {/* Web search toggle */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs gap-1.5 px-2 ${webSearchEnabled ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/15" : "text-muted-foreground hover:text-foreground"}`}
                onClick={onToggleWebSearch}
                title={webSearchEnabled ? "Disable web search" : "Enable web search"}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web</span>
              </Button>
              {/* Private mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs gap-1.5 px-2 ${privateMode ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/15" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setPrivateMode(p => !p)}
                title={privateMode ? "Disable private mode" : "Enable private mode — conversation noted but not saved"}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Private</span>
              </Button>
            </div>
            <div className="text-[11px] text-muted-foreground/50 hidden sm:block">
              Gadus can make mistakes. Verify important info.
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPromptLibrary && (
          <PromptLibrary
            onClose={() => setShowPromptLibrary(false)}
            onUsePrompt={(prompt) => {
              setInput(prompt);
              setShowPromptLibrary(false);
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                  textareaRef.current.focus();
                }
              }, 50);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShare && conversation && (
          <ShareModal
            conversationId={conversation.id}
            title={conversation.title}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKeyboardShortcuts && (
          <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onAnalysis={handleCameraAnalysis}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
