import { useState } from "react";
import { X, Copy, Check, ExternalLink, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ShareModalProps {
  conversationId: number;
  title: string;
  onClose: () => void;
}

export function ShareModal({ conversationId, title, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createShare = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations/" + conversationId + "/share", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create share link");
      const data = await res.json();
      const origin = window.location.origin;
      setShareUrl(`${origin}/shared/${data.shareToken}`);
    } catch {
      setError("Could not create share link. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        transition={{ type: "spring", bounce: 0.2, duration: 0.25 }}
        className="bg-card border border-border/70 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base">Share Conversation</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border/40">
            <p className="text-sm font-medium line-clamp-1">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Conversation #{conversationId}</p>
          </div>

          {!shareUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create a public link anyone can view. The conversation will be readable without an account.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={createShare} disabled={isCreating}>
                {isCreating ? "Creating link..." : "Generate share link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Share this link — anyone with it can view the conversation.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5 text-sm font-mono text-muted-foreground truncate">
                  {shareUrl}
                </div>
                <Button size="icon" variant="outline" className="shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => window.open(shareUrl, "_blank")}>
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
