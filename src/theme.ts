export const colors = {
  green: {
    bg: "rgba(34,197,94,0.15)",
    text: "#22C55E",
  },
  orange: {
    bg: "rgba(245,158,11,0.15)",
    text: "#F59E0B",
  },
  red: {
    bg: "rgba(239,68,68,0.15)",
    text: "#EF4444",
  },
};

export const neutrals = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  soft: "#EDF1F6",
  text: "#0F172A",
  muted: "#64748B",
  ink: "#111827",
} as const;

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
