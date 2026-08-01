export type ThemeId = "emerald" | "ocean" | "purple" | "sunset" | "forest";

export interface Theme {
  id: ThemeId;
  name: string;
  class: string;
  primary: string; // for swatch preview (hex)
  description: string;
}

export const THEMES: Theme[] = [
  { id: "emerald", name: "Emerald", class: "", primary: "#10b981", description: "Classic emerald green" },
  { id: "ocean",   name: "Ocean",   class: "theme-ocean",  primary: "#3b82f6", description: "Deep ocean blue" },
  { id: "purple",  name: "Royal",   class: "theme-purple", primary: "#8b5cf6", description: "Royal purple" },
  { id: "sunset",  name: "Sunset",  class: "theme-sunset", primary: "#f97316", description: "Warm sunset orange" },
  { id: "forest",  name: "Forest",  class: "theme-forest", primary: "#15803d", description: "Deep forest green" },
];

const STORAGE_KEY = "gadus-theme";

export function getStoredTheme(): ThemeId {
  try {
    return (localStorage.getItem(STORAGE_KEY) as ThemeId) || "emerald";
  } catch {
    return "emerald";
  }
}

export function applyTheme(id: ThemeId) {
  const theme = THEMES.find(t => t.id === id);
  const root = document.documentElement;
  // Remove all theme classes
  THEMES.forEach(t => { if (t.class) root.classList.remove(t.class); });
  // Apply new theme class
  if (theme?.class) root.classList.add(theme.class);
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}
