import type { CrawledData, GeneratedQuery } from "@shared/schema";

const QUESTION_START = /^(what|what's|which|who|where|when|why|how|can|could|should|would|is|are|do|does|will|isn't|aren't)\b/i;
const KEYWORD_FRAGMENT = /^(what is|what are|how to|guide|tutorial|best|top|review|compare|buy|find)\s+[\w\s-]+$/i;
const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "can", "does", "for", "from", "how",
  "into", "is", "it", "more", "of", "on", "or", "the", "their", "this", "to",
  "what", "which", "who", "why", "with", "would", "your",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceText(crawledData?: CrawledData): string {
  const pageText = (crawledData?.pages || [])
    .map((page) => `${page.title || ""} ${page.text}`)
    .join(" ");
  const extracted = crawledData?.extractedData;
  return normalize([
    extracted?.productName,
    extracted?.tagline,
    ...(extracted?.features || []),
    ...(extracted?.solutions || []),
    ...(extracted?.useCases || []),
    pageText,
  ].filter(Boolean).join(" "));
}

function groundedInEvidence(query: string, crawledData?: CrawledData): boolean {
  const evidence = evidenceText(crawledData);
  if (!evidence) return false;

  const queryWords = normalize(query)
    .split(" ")
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
  const matchingWords = new Set(queryWords.filter((word) => evidence.includes(word)));

  // A question must carry more than a generic interrogative and one broad word.
  return matchingWords.size >= 2;
}

export function isGroundedServiceQuestion(
  query: GeneratedQuery,
  crawledData?: CrawledData
): boolean {
  const text = query.query?.trim() || "";
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < 5 || text.length < 25 || !/\?\s*$/.test(text)) return false;
  if (!QUESTION_START.test(text) || KEYWORD_FRAGMENT.test(text.replace(/\?\s*$/, ""))) return false;
  if (/[|{}[\]<>]/.test(text) || /^(keyword|query|prompt)\s*:/i.test(text)) return false;
  if (/\b(lorem ipsum|something|stuff|etc)\b/i.test(text)) return false;

  return groundedInEvidence(text, crawledData);
}

export function filterGroundedServiceQuestions(
  queries: GeneratedQuery[],
  crawledData?: CrawledData
): GeneratedQuery[] {
  return queries.filter((query) => isGroundedServiceQuestion(query, crawledData));
}