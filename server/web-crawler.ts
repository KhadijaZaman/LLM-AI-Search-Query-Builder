import type { CrawledData } from "@shared/schema";

type CrawledPage = NonNullable<CrawledData["pages"]>[number];

const REQUEST_TIMEOUT_MS = 15000;
const MAX_PAGE_TEXT_LENGTH = 12000;
const PAGE_KEYWORDS = {
  pricing: ["pricing", "price", "plans", "packages"],
  features: ["features", "feature", "services", "service", "solutions", "products", "product", "capabilities"],
} as const;

export interface CrawlOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export async function crawlWebsite(domain: string, options: CrawlOptions = {}): Promise<CrawledData> {
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const url = baseUrl.replace(/\/$/, "");
  
  try {
    const homepage = await fetchHtml(url, options);
    if (!homepage.ok) {
      return {
        url,
        error: homepage.error,
      };
    }
    
    const html = homepage.html;
    const extractedData = extractDataFromHTML(html, domain);
    const homepageUrl = homepage.finalUrl;
    const pages: CrawledPage[] = [{
      url: homepageUrl,
      kind: "homepage",
      title: extractTitle(html),
      text: extractPageText(html),
    }];

    const candidates = discoverPageCandidates(html, homepageUrl);
    for (const candidate of candidates) {
      const page = await fetchHtml(candidate.url, options);
      if (!page.ok) continue;

      pages.push({
        url: page.finalUrl,
        kind: candidate.kind,
        title: extractTitle(page.html),
        text: extractPageText(page.html),
      });
    }
    
    return {
      url: homepageUrl,
      title: extractedData.productName || domain,
      pages,
      extractedData,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        url,
        error: "Request timed out after 20 seconds",
      };
    }
    return {
      url,
      error: error.message || "Failed to crawl website",
    };
  }
}

async function fetchHtml(url: string, options: CrawlOptions): Promise<
  | { ok: true; html: string; finalUrl: string }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await (options.fetch ?? fetch)(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return { ok: false, error: `Failed to fetch: ${response.status} ${response.statusText}` };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return { ok: false, error: `Unsupported content type: ${contentType || "unknown"}` };
    }

    return { ok: true, html: await response.text(), finalUrl: response.url || url };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.name === "AbortError"
        ? `Request timed out after ${timeoutMs / 1000} seconds`
        : error?.message || "Failed to crawl website",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function discoverPageCandidates(
  html: string,
  homepageUrl: string
): Array<{ url: string; kind: "features" | "pricing" }> {
  const origin = new URL(homepageUrl).origin;
  const links: Array<{ url: string; text: string }> = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    try {
      const candidate = new URL(match[1], homepageUrl);
      if (candidate.origin !== origin || !["http:", "https:"].includes(candidate.protocol)) continue;
      candidate.hash = "";
      candidate.search = "";
      links.push({ url: candidate.toString().replace(/\/$/, ""), text: cleanText(match[2]) });
    } catch {
      // Ignore malformed links.
    }
  }

  const selectBest = (kind: "features" | "pricing") => {
    const keywords = PAGE_KEYWORDS[kind];
    return links
      .map((link) => {
        const haystack = `${link.url} ${link.text}`.toLowerCase();
        const score = keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
        return { ...link, score };
      })
      .filter((link) => link.score > 0 && link.url !== homepageUrl)
      .sort((a, b) => b.score - a.score || a.url.length - b.url.length)[0];
  };

  const selected: Array<{ url: string; kind: "features" | "pricing" }> = [];
  const seen = new Set<string>([homepageUrl]);
  for (const kind of ["features", "pricing"] as const) {
    const linked = selectBest(kind);
    const fallbackPath = kind === "pricing" ? "/pricing" : "/features";
    const candidateUrl = linked?.url || new URL(fallbackPath, origin).toString().replace(/\/$/, "");
    if (!seen.has(candidateUrl)) {
      seen.add(candidateUrl);
      selected.push({ url: candidateUrl, kind });
    }
  }
  return selected;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? cleanText(match[1]) : undefined;
}

function extractPageText(html: string): string {
  return cleanText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
  ).slice(0, MAX_PAGE_TEXT_LENGTH);
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDataFromHTML(html: string, domain: string): NonNullable<CrawledData["extractedData"]> {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const productName = titleMatch ? titleMatch[1].split("|")[0].split("-")[0].split("–")[0].trim() : domain;
  
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const tagline = metaDescMatch ? metaDescMatch[1] : "";
  
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  
  const features: string[] = [];
  const solutions: string[] = [];
  const industries: string[] = [];
  const useCases: string[] = [];
  
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
  
  const headings = [...h1Matches, ...h2Matches, ...h3Matches]
    .map(cleanText)
    .filter((h) => h.length > 3 && h.length < 150);
  
  if (ogTitle && ogTitle[1]) {
    const title = cleanText(ogTitle[1]);
    if (title.length > 5 && title.length < 100) {
      features.push(title);
    }
  }
  
  if (ogDescMatch && ogDescMatch[1]) {
    const desc = cleanText(ogDescMatch[1]);
    if (desc.length > 10 && desc.length < 200) {
      solutions.push(desc);
    }
  }
  
  const featureKeywords = ["feature", "capability", "benefit", "advantage", "solution", "offer", "provide", "enable", "caractéristique", "avantage", "fonctionnalité"];
  const solutionKeywords = ["solution", "service", "product", "platform", "tool", "software", "système", "produit", "service"];
  const industryKeywords = ["industry", "sector", "vertical", "market", "business", "enterprise", "industrie", "secteur", "marché"];
  const useCaseKeywords = ["use case", "how to", "example", "case study", "application", "utilisation", "exemple", "comment"];
  
  headings.forEach((heading) => {
    const lower = heading.toLowerCase();
    if (featureKeywords.some(k => lower.includes(k))) {
      features.push(heading);
    } else if (solutionKeywords.some(k => lower.includes(k))) {
      solutions.push(heading);
    } else if (industryKeywords.some(k => lower.includes(k))) {
      industries.push(heading);
    } else if (useCaseKeywords.some(k => lower.includes(k))) {
      useCases.push(heading);
    } else if (heading.length > 10 && heading.length < 80) {
      features.push(heading);
    }
  });
  
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  pMatches.slice(0, 30).forEach((p) => {
    const text = cleanText(p);
    if (text.length > 30 && text.length < 250) {
      const lower = text.toLowerCase();
      if (featureKeywords.some(k => lower.includes(k))) {
        solutions.push(text);
      }
    }
  });
  
  const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
  liMatches.slice(0, 40).forEach((li) => {
    const text = cleanText(li);
    if (text.length > 8 && text.length < 120) {
      if (features.length < 15) {
        features.push(text);
      }
    }
  });
  
  const spanMatches = html.match(/<span[^>]*class=["'][^"']*(?:feature|benefit|highlight)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi) || [];
  spanMatches.forEach((span) => {
    const text = cleanText(span);
    if (text.length > 5 && text.length < 100) {
      features.push(text);
    }
  });
  
  const strongMatches = html.match(/<strong[^>]*>([\s\S]*?)<\/strong>/gi) || [];
  const importantTexts = strongMatches
    .map(cleanText)
    .filter((t) => t.length > 10 && t.length < 80);
  importantTexts.slice(0, 10).forEach((text) => {
    if (!features.includes(text)) {
      features.push(text);
    }
  });
  
  return {
    productName: productName || domain,
    tagline: tagline || (ogDescMatch ? ogDescMatch[1] : ""),
    features: [...new Set(features)].slice(0, 15),
    solutions: [...new Set(solutions)].slice(0, 12),
    industries: [...new Set(industries)].slice(0, 10),
    useCases: [...new Set(useCases)].slice(0, 12),
  };
}
