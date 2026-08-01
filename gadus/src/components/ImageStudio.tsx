import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Download, Trash2, Sparkles, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: number;
}

const STORAGE_KEY = "gadus-image-studio";

export function saveImageToStudio(url: string, prompt: string, style: string) {
  try {
    const existing: GeneratedImage[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = [
      { id: `img-${Date.now()}`, url, prompt, style, createdAt: Date.now() },
      ...existing,
    ].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

interface ImageStudioProps {
  onClose: () => void;
}

export function ImageStudio({ onClose }: ImageStudioProps) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selected, setSelected] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    try {
      setImages(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {}
  }, []);

  const deleteImage = (id: string) => {
    const updated = images.filter(i => i.id !== id);
    setImages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const clearAll = () => {
    if (!confirm("Clear all generated images from your studio?")) return;
    setImages([]);
    setSelected(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) { setSelected(null); onClose(); } }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 flex-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Image Studio</h2>
              <p className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? "s" : ""} generated</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {images.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-8">
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto p-4">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="font-medium text-sm mb-1">No images yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs">Switch to Image Prompt Generator mode and ask Gadus to generate an image. They'll all appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map(img => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer border border-border/50 hover:border-primary/40 transition-colors"
                  onClick={() => setSelected(img)}
                >
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-[10px] text-white/90 line-clamp-2">{img.prompt}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                      onClick={e => { e.stopPropagation(); setSelected(img); }}
                    >
                      <ZoomIn className="w-3 h-3 text-white" />
                    </button>
                    <button
                      className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-destructive/80"
                      onClick={e => { e.stopPropagation(); deleteImage(img.id); }}
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={selected.url} alt={selected.prompt} className="w-full rounded-xl shadow-2xl" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-white/70 flex-1 truncate">{selected.prompt}</p>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={selected.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
