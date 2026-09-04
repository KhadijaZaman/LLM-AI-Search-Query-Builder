import { REGION_MAP, LANGUAGE_HL_CODES, type RegionCode, type LanguageCode, type GeneratedQuery } from "@shared/schema";

interface NewsArticle {
  title: string;
  link?: string;
  source?: string;
  date?: string;
}

interface TrendingInsights {
  newsArticles: NewsArticle[];
  newsBasedQueries: GeneratedQuery[];
  twitterTrends?: string[];
}

export async function fetchTrendingInsights(
  entities: any[],
  painPoints: any[],
  jtbd: any[],
  domain: string,
  region: string = "us",
  language: string = "en"
): Promise<TrendingInsights> {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    console.log("SERP API key not configured, skipping news fetch");
    return {
      newsArticles: [],
      newsBasedQueries: [],
    };
  }
  
  const regionConfig = REGION_MAP[region as RegionCode] || REGION_MAP.us;
  const languageHl = LANGUAGE_HL_CODES[language as LanguageCode] || "en";
  const searchTerms = buildSearchTerms(entities, domain);
  
  const newsArticles: NewsArticle[] = [];
  const newsBasedQueries: GeneratedQuery[] = [];
  
  for (const term of searchTerms.slice(0, 3)) {
    try {
      const articles = await fetchGoogleNews(term, regionConfig, serpApiKey, languageHl);
      newsArticles.push(...articles);
      
      articles.forEach((article) => {
        const query = generateQueryFromArticle(article, region);
        if (query) {
          newsBasedQueries.push(query);
        }
      });
    } catch (error) {
      console.error(`Failed to fetch news for "${term}":`, error);
    }
  }
  
  return {
    newsArticles: newsArticles.slice(0, 20),
    newsBasedQueries: newsBasedQueries.slice(0, 15),
  };
}

function buildSearchTerms(entities: any[], domain: string): string[] {
  const terms: string[] = [];
  const brandName = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split(".")[0];
  
  entities.forEach((category) => {
    if (category.category === "Core Features" || category.category === "Products/Services") {
      (category.items || []).slice(0, 3).forEach((item: string) => {
        terms.push(item);
      });
    }
  });
  
  if (terms.length === 0) {
    terms.push(brandName);
  }
  
  return [...new Set(terms)];
}

async function fetchGoogleNews(
  query: string,
  regionConfig: { gl: string; hl: string; google_domain: string },
  apiKey: string,
  languageHl: string
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    engine: "google_news",
    q: query,
    gl: regionConfig.gl,
    hl: languageHl,
  });
  
  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`SERP API error: ${response.status}`);
  }
  
  const data = await response.json();
  const articles: NewsArticle[] = [];
  
  if (data.news_results) {
    data.news_results.slice(0, 10).forEach((result: any) => {
      articles.push({
        title: result.title,
        link: result.link,
        source: result.source?.name,
        date: result.date,
      });
    });
  }
  
  if (data.organic_results) {
    data.organic_results.slice(0, 5).forEach((result: any) => {
      articles.push({
        title: result.title,
        link: result.link,
        source: result.source,
        date: result.date,
      });
    });
  }
  
  return articles;
}

function generateQueryFromArticle(article: NewsArticle, region: string): GeneratedQuery | null {
  if (!article.title || article.title.length < 10) return null;
  
  let query = article.title
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  
  if (query.length > 80) {
    query = query.substring(0, 77) + "...";
  }
  
  const questionPrefixes = ["what is", "how to", "why does", "best way to"];
  const hasQuestion = questionPrefixes.some((p) => query.startsWith(p));
  
  if (!hasQuestion && query.length > 20) {
    const words = query.split(" ").slice(0, 6);
    query = `latest ${words.join(" ")} trends`;
  }
  
  return {
    query,
    intent: "Informational",
    source: "trending",
    isTrending: true,
    trendEntity: article.source || "",
    topic: "news",
  };
}
