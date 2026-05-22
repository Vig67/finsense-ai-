export const formatZAR = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Savings",
  "Subscriptions",
  "Income",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#14B8A6",
  Transport: "#3B82F6",
  Shopping: "#F59E0B",
  Entertainment: "#a78bfa",
  Bills: "#EF4444",
  Savings: "#22C55E",
  Subscriptions: "#06b6d4",
  Income: "#22C55E",
  Other: "#94a3b8",
};