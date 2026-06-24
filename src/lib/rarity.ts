export type RarityTier = "Legendary" | "Epic" | "Rare" | "Uncommon" | "Common";

export const RARITY_COLORS: Record<RarityTier, string> = {
  Legendary: "#FFB347",
  Epic: "#A855F7",
  Rare: "#3B82F6",
  Uncommon: "#22C55E",
  Common: "#9CA3AF",
};

export function getRarityColor(rarity: string | null | undefined): string {
  const tier = (rarity ?? "Common") as RarityTier;
  return RARITY_COLORS[tier] ?? RARITY_COLORS.Common;
}

export function isValidRarity(rarity: string | null | undefined): rarity is RarityTier {
  if (!rarity) return false;
  return rarity in RARITY_COLORS;
}
