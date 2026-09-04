import OpenAI from "openai";
import { prompts, SYSTEM_PROMPT } from "./ai-prompts";
import type {
  DomainAnalysis,
  EntityCategory,
  SemanticExpansion,
  KnowledgeGraph,
  PainPoint,
  JTBD,
  GoalsFramework,
  Persona,
  GeneratedQuery,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function callAI(prompt: string, maxTokens: number = 4096): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content || "";
}

function parseJSON<T>(content: string, fallback: T): T {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(content) as T;
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    console.error("Content:", content.substring(0, 500));
    return fallback;
  }
}

export const aiService = {
  async generateDomainAnalysis(
    domain: string,
    crawledData?: any,
    region: string = "us",
    language: string = "en"
  ): Promise<DomainAnalysis> {
    const prompt = prompts.domainAnalysis(domain, crawledData, region, language);
    const response = await callAI(prompt);
    const result = parseJSON<DomainAnalysis>(response, {
      definition: `Analysis for ${domain}`,
      productOffering: "",
      industry: "General",
      industrySubcategory: "",
      subdomains: [],
      customerTypes: [],
      marketMaturity: "developing",
      businessModels: [],
      competitors: [],
    });
    return {
      definition: result.definition || `Analysis for ${domain}`,
      productOffering: result.productOffering || "",
      industry: result.industry || "General",
      industrySubcategory: result.industrySubcategory || "",
      subdomains: result.subdomains || [],
      customerTypes: result.customerTypes || [],
      marketMaturity: result.marketMaturity || "developing",
      businessModels: result.businessModels || [],
      competitors: result.competitors || [],
    };
  },

  async generateEntities(
    domain: string,
    domainAnalysis: DomainAnalysis,
    crawledData?: any,
    region: string = "us",
    language: string = "en"
  ): Promise<EntityCategory[]> {
    const prompt = prompts.entities(domain, domainAnalysis, crawledData, region, language);
    const response = await callAI(prompt);
    return parseJSON<EntityCategory[]>(response, []);
  },

  async generateExpansion(
    entities: EntityCategory[],
    domain: string,
    crawledData?: any,
    kgTriples?: any[]
  ): Promise<SemanticExpansion> {
    const prompt = prompts.expand(entities, domain, crawledData, kgTriples);
    const response = await callAI(prompt);
    return parseJSON<SemanticExpansion>(response, {
      expansions: {},
      industryMappings: {},
      topicMappings: {},
      triples: [],
    });
  },

  async generateGraph(
    entities: EntityCategory[],
    expansion: SemanticExpansion
  ): Promise<KnowledgeGraph> {
    const prompt = prompts.graph(entities, expansion);
    const response = await callAI(prompt);
    return parseJSON<KnowledgeGraph>(response, {
      nodes: [],
      edges: [],
      clusters: [],
    });
  },

  async generatePainPoints(
    domain: string,
    entities: EntityCategory[],
    crawledData?: any,
    region: string = "us",
    domainAnalysis?: DomainAnalysis,
    language: string = "en"
  ): Promise<PainPoint[]> {
    const prompt = prompts.painPoints(domain, entities, crawledData, region, domainAnalysis, language);
    const response = await callAI(prompt);
    return parseJSON<PainPoint[]>(response, []);
  },

  async generateJTBD(
    domain: string,
    painPoints: PainPoint[],
    entities: EntityCategory[],
    domainAnalysis: DomainAnalysis,
    region: string = "us",
    language: string = "en"
  ): Promise<JTBD[]> {
    const prompt = prompts.jtbd(domain, painPoints, entities, domainAnalysis, region, language);
    const response = await callAI(prompt);
    return parseJSON<JTBD[]>(response, []);
  },

  async generateGoals(
    domain: string,
    jtbd: JTBD[],
    domainAnalysis: DomainAnalysis,
    region: string = "us",
    language: string = "en"
  ): Promise<GoalsFramework> {
    const prompt = prompts.goals(domain, jtbd, domainAnalysis, region, language);
    const response = await callAI(prompt);
    return parseJSON<GoalsFramework>(response, {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      antiGoals: [],
      brandGoals: [],
    });
  },

  async generatePersonas(
    domain: string,
    painPoints: PainPoint[],
    entities: EntityCategory[],
    jtbd: JTBD[],
    region: string = "us",
    language: string = "en"
  ): Promise<Persona[]> {
    const prompt = prompts.personas(domain, painPoints, entities, jtbd, region, language);
    const response = await callAI(prompt, 6000);
    return parseJSON<Persona[]>(response, []);
  },

  async generateQueries(
    domain: string,
    personas: Persona[],
    painPoints: PainPoint[],
    entities: EntityCategory[],
    crawledData?: any,
    trending?: any,
    goals?: GoalsFramework,
    domainAnalysis?: DomainAnalysis,
    region: string = "us",
    language: string = "en"
  ): Promise<GeneratedQuery[]> {
    const prompt = prompts.queries(
      domain,
      personas,
      painPoints,
      entities,
      crawledData,
      trending,
      goals,
      domainAnalysis,
      region,
      language
    );
    const response = await callAI(prompt, 8192);
    return parseJSON<GeneratedQuery[]>(response, []);
  },

  async generateSupplementaryQueries(
    domain: string,
    existingCount: number,
    targetCount: number,
    entities: EntityCategory[],
    painPoints: PainPoint[],
    crawledData?: any,
    domainAnalysis?: DomainAnalysis,
    language: string = "en"
  ): Promise<GeneratedQuery[]> {
    const prompt = prompts.supplementaryQueries(
      domain,
      existingCount,
      targetCount,
      entities,
      painPoints,
      crawledData,
      domainAnalysis,
      language
    );
    const response = await callAI(prompt, 4096);
    return parseJSON<GeneratedQuery[]>(response, []);
  },

  async generateBrandedQueries(
    domain: string,
    productCategory: string,
    count: number,
    language: string = "en"
  ): Promise<GeneratedQuery[]> {
    const prompt = prompts.brandedQueries(domain, productCategory, count, language);
    const response = await callAI(prompt, 2048);
    return parseJSON<GeneratedQuery[]>(response, []);
  },
};
