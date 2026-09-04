import type { GeneratedQuery } from "@shared/schema";

export function extractBrandBlacklist(domain: string, competitors: string[] = []): string[] {
  const brandName = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split(".")[0].toLowerCase();
  
  const blacklist = new Set<string>([brandName]);
  
  competitors.forEach((comp) => {
    const normalizedComp = comp.toLowerCase().trim();
    if (normalizedComp.length > 2) {
      blacklist.add(normalizedComp);
      const words = normalizedComp.split(/\s+/);
      if (words.length > 1) {
        words.forEach((word) => {
          if (word.length > 3) blacklist.add(word);
        });
      }
    }
  });
  
  return Array.from(blacklist);
}

export function containsBrand(query: string, brandBlacklist: string[]): boolean {
  const normalizedQuery = query.toLowerCase();
  
  return brandBlacklist.some((brand) => {
    const brandLower = brand.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegex(brandLower)}\\b`, "i");
    return regex.test(normalizedQuery);
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function deduplicateQueries(queries: GeneratedQuery[]): GeneratedQuery[] {
  const seen = new Set<string>();
  const unique: GeneratedQuery[] = [];
  
  queries.forEach((q) => {
    const normalized = q.query.toLowerCase().trim().replace(/\s+/g, " ");
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(q);
    }
  });
  
  return unique;
}

export function filterAndEnrichQueries(
  queries: GeneratedQuery[],
  brandBlacklist: string[],
  brandedQueries: GeneratedQuery[],
  targetGenericRatio: number = 0.95
): GeneratedQuery[] {
  const genericQueries = queries.filter((q) => !containsBrand(q.query, brandBlacklist));
  const dedupedGeneric = deduplicateQueries(genericQueries);
  const dedupedBranded = deduplicateQueries(brandedQueries);
  
  const genericCount = dedupedGeneric.length;
  
  const maxBrandedForRatio = Math.floor((genericCount * (1 - targetGenericRatio)) / targetGenericRatio);
  const actualBrandedCount = Math.min(dedupedBranded.length, Math.max(0, maxBrandedForRatio));
  
  const finalGeneric = dedupedGeneric;
  const finalBranded = dedupedBranded.slice(0, actualBrandedCount);
  
  return [...finalGeneric, ...finalBranded];
}
