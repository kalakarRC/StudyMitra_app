// src/app/themeEngine.ts
export type SurfaceTheme =
  | "pastel"
  | "charcoal"
  | "oled"
  | "jjk"
  | "hinokami";

export type CardDensity = "comfortable" | "compact";

export type ThemeSettings = {
  theme: SurfaceTheme;
  accentColor: string;
  fontScale: number;
  cardDensity: CardDensity;
  borderRadiusScale: number;
};

type ThemeTokens = {
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textMuted: string;
  accentSecondary: string;
  cardTonals: [string, string, string, string];
};

const THEMES: Record<SurfaceTheme, ThemeTokens> = {
  pastel: {
    bgSurface: "#f8f5f2",
    bgElevated: "#fffdfa",
    textPrimary: "#29232b",
    textMuted: "#706a73",
    accentSecondary: "#805b78",
    cardTonals: ["#f2e3ed", "#e2eee6", "#f4ead5", "#e9e4f4"],
  },
  charcoal: {
    bgSurface: "#202126",
    bgElevated: "#2a2b32",
    textPrimary: "#f3f0f5",
    textMuted: "#c0bbc5",
    accentSecondary: "#c2a6d4",
    cardTonals: ["#423442", "#2d4039", "#443d2e", "#38344a"],
  },
  oled: {
    bgSurface: "#000000",
    bgElevated: "#111114",
    textPrimary: "#f7f5fa",
    textMuted: "#b8b4bf",
    accentSecondary: "#9d8cff",
    cardTonals: ["#211820", "#14211b", "#231d13", "#1b1727"],
  },
  jjk: {
    bgSurface: "#17131d",
    bgElevated: "#241d2b",
    textPrimary: "#f4eff9",
    textMuted: "#c2b8ce",
    accentSecondary: "#a58be0",
    cardTonals: ["#382439", "#22352e", "#443323", "#302543"],
  },
  hinokami: {
    bgSurface: "#1d1513",
    bgElevated: "#2a1d19",
    textPrimary: "#fbf1eb",
    textMuted: "#d0bdb2",
    accentSecondary: "#ee8a5c",
    cardTonals: ["#482925", "#29382d", "#4a3523", "#352543"],
  },
};

export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;
  const theme = THEMES[settings.theme];

  root.style.setProperty("--bg-surface", theme.bgSurface);
  root.style.setProperty("--bg-elevated", theme.bgElevated);
  root.style.setProperty("--text-primary", theme.textPrimary);
  root.style.setProperty("--text-muted", theme.textMuted);
  root.style.setProperty("--accent-primary", settings.accentColor);
  root.style.setProperty("--accent-secondary", theme.accentSecondary);

  theme.cardTonals.forEach((value, index) => {
    root.style.setProperty(`--card-tonal-${index + 1}`, value);
  });

  root.style.setProperty(
    "--card-radius",
    `${Math.max(12, Math.min(36, 28 * settings.borderRadiusScale))}px`,
  );
  root.style.setProperty(
    "--font-scale",
    String(Math.max(0.85, Math.min(1.2, settings.fontScale))),
  );
  root.style.setProperty(
    "--card-density",
    settings.cardDensity === "compact" ? "0.82" : "1",
  );
}
