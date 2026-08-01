import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, type ThemeId, applyTheme, getStoredTheme } from "@/lib/themes";

interface ThemePickerProps {
  onThemeChange?: (id: ThemeId) => void;
}

export function ThemePicker({ onThemeChange }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeId>(getStoredTheme);

  const handleSelect = (id: ThemeId) => {
    applyTheme(id);
    setCurrent(id);
    onThemeChange?.(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(o => !o)}
        title="Change theme"
      >
        <Palette className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              className="absolute bottom-full left-0 mb-2 z-40 bg-card border border-border rounded-xl shadow-2xl p-2 w-48"
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">Theme</p>
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                    current === theme.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0"
                    style={{ background: theme.primary }}
                  />
                  <span className="flex-1 text-left">{theme.name}</span>
                  {current === theme.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
