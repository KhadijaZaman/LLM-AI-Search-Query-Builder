import { REGIONS, LANGUAGES, type RegionCode, type LanguageCode } from "@shared/schema";

const REGION_NAMES = REGIONS;
const LANGUAGE_NAMES = LANGUAGES;

export const SYSTEM_PROMPT = `You are a market intelligence expert specializing in comprehensive domain analysis for LLM visibility optimization.
Your role is to:
1. Extract actionable entities, attributes, and values from brands/products
2. Map relationships between concepts using knowledge graph principles
3. Identify user pain points and jobs-to-be-done
4. Create realistic personas with natural search behaviors
5. Generate queries that optimize for LLM answer engine visibility
Always return valid, parseable JSON. Be specific, realistic, and focused on practical insights that help businesses understand how to appear in AI-generated answers.`;

function getLanguageInstruction(language: string): string {
  const languageName = LANGUAGE_NAMES[language as LanguageCode] || "English";
  if (language === "en") {
    return "";
  }
  return `

CRITICAL - OUTPUT LANGUAGE: ${languageName}
All text content in your response MUST be written in ${languageName}.
- All descriptions, definitions, and explanations must be in ${languageName}
- All entity names and features must be in ${languageName} (or transliterated if appropriate)
- All pain points, goals, and queries must be in ${languageName}
- Keep JSON keys in English, but all string values must be in ${languageName}
`;
}

function formatWebsiteEvidence(crawledData?: any): string {
  const pages = Array.isArray(crawledData?.pages) ? crawledData.pages : [];
  const extracted = crawledData?.extractedData;

  if (pages.length === 0 && !extracted) {
    return "WEBSITE EVIDENCE: No page content was available. Do not invent specific services or pricing.";
  }

  const pageEvidence = pages
    .slice(0, 3)
    .map((page: any) => {
      const label = String(page.kind || "page").toUpperCase();
      const text = String(page.text || "").slice(0, 6000);
      return `--- ${label}: ${page.url || "unknown URL"} ---\n${text || "No readable text extracted."}`;
    })
    .join("\n");

  const structuredEvidence = extracted
    ? `PRODUCT: ${extracted.productName || "Unknown"}
TAGLINE: ${extracted.tagline || "N/A"}
EXTRACTED FEATURES: ${(extracted.features || []).join("; ") || "N/A"}
EXTRACTED SOLUTIONS: ${(extracted.solutions || []).join("; ") || "N/A"}
EXTRACTED USE CASES: ${(extracted.useCases || []).join("; ") || "N/A"}`
    : "";

  return `WEBSITE EVIDENCE (source of truth):
${structuredEvidence}
${pageEvidence}`;
}

export const prompts = {
  domainAnalysis: (domain: string, crawledData?: any, region: string = "us", language: string = "en") => {
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const languageInstruction = getLanguageInstruction(language);
    const crawlContext = formatWebsiteEvidence(crawledData);

    return `You are a market intelligence analyst. Analyze this EXACT domain/brand: "${domain}"
CRITICAL: You MUST analyze ONLY the domain "${domain}" - not any similar domains.
IMPORTANT - TARGET MARKET REGION: ${regionName}${languageInstruction}
This business operates in or targets the ${regionName} market. All analysis MUST be region-specific:
- Competitors MUST be brands that actually compete in ${regionName} (NOT US-only brands)
- Customer types should reflect ${regionName} demographics and preferences
- Business models should be relevant to ${regionName} market conditions
${crawlContext}
Based on the crawled data (if available) or the domain URL itself, provide:
1. Domain definition (2-3 sentences describing what the brand/product does)
2. Product offering summary (what specific value they provide)
3. Key subdomains (3-5 specific areas/verticals they operate in)
4. Typical customer types (3-5 segments who use this product in ${regionName})
5. Market maturity in ${regionName} (early/developing/saturated)
6. Common business models in ${regionName} (3-5 models in this space)
7. Major competitors in ${regionName} (5-7 competing brands that ACTUALLY OPERATE in ${regionName})
Return ONLY valid JSON:
{
  "definition": "...",
  "productOffering": "...",
  "industry": "Primary industry category (e.g., Cosmetic Surgery, SaaS, E-commerce)",
  "industrySubcategory": "Specific subcategory (e.g., Facial Aesthetics, Project Management)",
  "subdomains": ["...", "..."],
  "customerTypes": ["...", "..."],
  "marketMaturity": "...",
  "businessModels": ["...", "..."],
  "competitors": ["...", "..."]
}`;
  },

  entities: (domain: string, domainAnalysis: any, crawledData?: any, region: string = "us", language: string = "en") => {
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const industry = domainAnalysis?.industry || "";
    const languageInstruction = getLanguageInstruction(language);
    const websiteContext = formatWebsiteEvidence(crawledData);

    return `Based on this domain/brand: "${domain}"
TARGET MARKET: ${regionName}${languageInstruction}
INDUSTRY: ${industry}
${websiteContext}
All entities should be relevant to the ${regionName} market and the ${industry} industry.
Domain context: ${domainAnalysis?.definition || "Unknown"}
Product offering: ${domainAnalysis?.productOffering || ""}
Extract entities as ATTRIBUTES and VALUES that this product/service offers:
- What attributes does the product have in the ${industry} industry?
- What values does it provide to users in ${regionName}?
- What problems does it solve for ${regionName} customers in ${industry}?
Categories to extract:
1. Core Features (5-10 specific capabilities in ${industry})
2. Products/Services (5-10 specific ${industry} offerings)
3. Value Propositions (5-8 key benefits relevant to ${regionName})
4. Use Cases (5-10 specific ${industry} applications in ${regionName})
5. Target Industries (5-8 verticals - must include "${industry}")
6. User Types/Roles (5-8 job titles or user types in ${regionName})
7. Technical Attributes (5-8 technical features)
8. Competitor Keywords (5-8 brands that compete in ${regionName} ${industry} market)
EVIDENCE RULES:
- Core Features and Products/Services MUST use concrete offerings supported by the crawled website evidence
- Do not substitute generic industry capabilities for services the website does not claim
- Do not invent integrations, reports, metrics, pricing, plans, or technical functionality
- Prefer exact service and feature terminology from the feature/service page
- Tag each category with industry context
Return ONLY valid JSON array:
[
  {
    "category": "Core Features",
    "items": ["feature1", "feature2"],
    "attributes": {
      "feature1": ["attribute1", "attribute2"]
    }
  }
]`;
  },

  expand: (entities: any[], domain: string, crawledData?: any, kgTriples?: any[]) => {
    const kgContext =
      kgTriples && kgTriples.length > 0
        ? `
KNOWLEDGE GRAPH TRIPLES (from external sources):
${JSON.stringify(kgTriples.slice(0, 15), null, 2)}
Use these to inform your expansion.
`
        : "";

    return `Perform semantic expansion on these entities from ${domain}:
${JSON.stringify((entities || []).slice(0, 5), null, 2)}
${kgContext}
Create TRIPLES that map each entity to industries and topics:
- Entity -> Industry mapping (what industries use this)
- Entity -> Topic mapping (what topics/themes it relates to)
- Entity -> Attribute -> Value (structured facts)
For each key entity (10-15 total), provide:
1. Expanded related terms (synonyms, variations)
2. Industry mappings
3. Topic mappings
4. Triples in format: Entity - Attribute - Value
Return ONLY valid JSON:
{
  "expansions": {
    "Entity Name": ["related term 1", "synonym"]
  },
  "industryMappings": {
    "Entity Name": ["Industry 1", "Industry 2"]
  },
  "topicMappings": {
    "Entity Name": ["Topic 1", "Theme 1"]
  },
  "triples": [
    {"entity": "...", "attribute": "enables", "value": "...", "industry": "...", "topic": "...", "source": "ai", "confidence": 0.85}
  ]
}`;
  },

  graph: (entities: any[], expand: any) => `Create a knowledge graph structure:
Entities:
${JSON.stringify((entities || []).slice(0, 4), null, 2)}
Expansions:
${JSON.stringify(expand || {}, null, 2)}
Build a graph with:
1. Category nodes: One node for each entity category with type "category"
2. Entity nodes: Each specific entity/item as a node with type "entity"
3. Edges: Relationships (contains, enables, solves, targets, competes_with)
4. Clusters: Group related nodes into logical clusters
Return ONLY valid JSON:
{
  "nodes": [
    {"id": "cat-1", "label": "Core Features", "type": "category", "group": "categories"},
    {"id": "node-1", "label": "Feature Name", "type": "entity", "group": "core features"}
  ],
  "edges": [
    {"from": "cat-1", "to": "node-1", "relationship": "contains", "weight": 1}
  ],
  "clusters": [
    {"id": "cluster-1", "label": "Core Product", "nodes": ["cat-1", "node-1"]}
  ]
}`,

  painPoints: (domain: string, entities: any[], crawledData?: any, region: string = "us", domainAnalysis?: any, language: string = "en") => {
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const industry = domainAnalysis?.industry || "";
    const languageInstruction = getLanguageInstruction(language);
    const websiteContext = formatWebsiteEvidence(crawledData);

    return `Identify customer pain points that ${domain} addresses for customers in ${regionName}.
TARGET MARKET: ${regionName}${languageInstruction}
INDUSTRY: ${industry}
${websiteContext}
CRITICAL - INDUSTRY-SPECIFIC PAIN POINTS:
All pain points MUST be directly related to the ${industry} industry.
Every solution mapping MUST reference a concrete capability supported by the website evidence.
Do not introduce generic SaaS concerns or features unless the crawled pages explicitly support them.
All pain points should be relevant to customers in ${regionName}:
- Local ${industry} market conditions and challenges
- Regional preferences and cultural factors
- ${regionName}-specific problems
Categories: Functional, Emotional, Operational, Financial, Strategic
For each pain point (10-15 total), map it to:
- The product features that solve it
- The entities involved (must be ${industry}-specific)
- The user impact in the ${regionName} market
Return ONLY valid JSON array:
[
  {
    "type": "Functional",
    "symptom": "What the user experiences",
    "root": "Underlying cause",
    "impact": "Business/personal consequence",
    "industry": "${industry}",
    "relatedEntities": ["Entity1", "Entity2"],
    "solution": "How ${domain} solves this"
  }
]`;
  },

  jtbd: (domain: string, painPoints: any[], entities: any[], domainAnalysis: any, region: string = "us", language: string = "en") => {
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const industry = domainAnalysis?.industry || "";
    const languageInstruction = getLanguageInstruction(language);

    return `Create Jobs-to-be-Done analysis for ${domain} targeting customers in ${regionName}.
TARGET MARKET: ${regionName}${languageInstruction}
INDUSTRY: ${industry}
CRITICAL - INDUSTRY-SPECIFIC JTBDs:
All JTBDs MUST be directly related to the ${industry} industry.
- JTBDs should be jobs that ${industry} services help accomplish
- Situations should be triggers related to ${industry} needs
- Motivations should align with ${industry} outcomes
For each JTBD (6-10 total), link to specific product offerings:
Return ONLY valid JSON array:
[
  {
    "audience": "Specific user type seeking ${industry} services in ${regionName}",
    "situation": "When [${industry}-related context/trigger]",
    "motivation": "I want to [${industry}-related goal]",
    "barriers": ["Current obstacles in ${regionName} ${industry} market"],
    "success": "So I can [${industry}-related outcome]",
    "emotional": "And feel [emotional outcome]",
    "industry": "${industry}",
    "relatedProduct": "Specific ${domain} feature",
    "relatedEntities": ["Entity1", "Entity2"]
  }
]`;
  },

  goals: (domain: string, jtbd: any[], domainAnalysis: any, region: string = "us", language: string = "en") => {
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const languageInstruction = getLanguageInstruction(language);

    return `Define goals framework for users of ${domain} in ${regionName}.
TARGET MARKET: ${regionName}${languageInstruction}
Goals should reflect what customers in ${regionName} want to achieve.
Product: ${domainAnalysis?.productOffering || domainAnalysis?.definition || "Unknown"}
JTBDs: ${(jtbd || []).slice(0, 4).map((j: any) => j.motivation).join("; ")}
Create a goals hierarchy with specific, measurable objectives:
Return ONLY valid JSON:
{
  "immediate": [
    {"goal": "Specific immediate goal for ${regionName} customers", "metric": "How to measure success"}
  ],
  "shortTerm": [
    {"goal": "30-90 day goal", "metric": "Success metric"}
  ],
  "longTerm": [
    {"goal": "6-12 month goal", "metric": "Success metric"}
  ],
  "antiGoals": ["What users want to AVOID"],
  "brandGoals": ["What ${domain} helps users achieve"]
}`;
  },

  personas: (domain: string, painPoints: any[], entities: any[], jtbd: any[], region: string = "us", language: string = "en") => {
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const brandName = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split(".")[0];
    const languageInstruction = getLanguageInstruction(language);

    return `Create detailed personas for ${domain} users in ${regionName}.
TARGET MARKET: ${regionName}${languageInstruction}
CRITICAL: All personas MUST be based in ${regionName} and reflect:
- ${regionName}-specific demographics (names, locations, cultural backgrounds)
- Local lifestyle, work patterns, and preferences
- Regional shopping/buying behaviors
- ${regionName}-specific pain points and motivations
DO NOT create US-centric personas unless the region is United States.
Create 4-6 distinct personas representing different user segments:
IMPORTANT FOR QUERIES:
- Each persona's queries must be NATURAL user questions
- NEVER include brand names like "${brandName}" in queries
- Queries should be about problems, goals, or jobs-to-be-done
- Examples of GOOD queries: "best shower filter for hard water", "how to fix dry hair naturally"
- Examples of BAD queries: "${brandName} reviews", "is ${brandName} worth it"
Return ONLY valid JSON array:
[
  {
    "name": "Creative, memorable name appropriate for ${regionName}",
    "role": "Job title/background common in ${regionName}",
    "demographics": "Age, city/area in ${regionName}, tech-savviness",
    "psychographics": "Values, attitudes, lifestyle",
    "goal": "Primary objective",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "behaviors": ["Behavior 1", "Behavior 2", "Behavior 3"],
    "decisionStyle": "How they make decisions",
    "channels": ["Channels popular in ${regionName}"],
    "quotes": ["Realistic quote 1", "Realistic quote 2"],
    "queries": ["Natural problem-based query", "Goal-seeking question", "How-to query"],
    "relatedEntities": ["Entity this persona cares most about"]
  }
]`;
  },

  queries: (
    domain: string,
    personas: any[],
    painPoints: any[],
    entities: any[],
    crawledData?: any,
    trending?: any,
    goals?: any,
    domainAnalysis?: any,
    region: string = "us",
    language: string = "en"
  ) => {
    const industry = domainAnalysis?.industry || "";
    const languageInstruction = getLanguageInstruction(language);
    const regionName = REGION_NAMES[region as RegionCode] || "United States";
    const websiteContext = formatWebsiteEvidence(crawledData);

    const industryContext = industry
      ? `
INDUSTRY CONTEXT:
Primary Industry: ${industry}
Target Market: ${regionName}
All queries must be relevant to the ${industry} industry and ${regionName} market.
`
      : "";

    const goalsContext = goals
      ? `
USER GOALS (what users want to achieve):
- Immediate: ${(goals.immediate || []).slice(0, 3).map((g: any) => g.goal).join("; ")}
- Short-term: ${(goals.shortTerm || []).slice(0, 3).map((g: any) => g.goal).join("; ")}
- Anti-goals: ${(goals.antiGoals || []).slice(0, 3).join("; ")}
`
      : "";

    const personaList = (personas || []).slice(0, 6).map((p: any) => ({
      name: p.name,
      role: p.role,
      goal: p.goal,
      painPoints: (p.painPoints || []).slice(0, 3),
    }));

    const jtbdContext = `
PERSONAS AND THEIR JOBS TO BE DONE:
${personaList.map((p: any) => `- "${p.name}" (${p.role})
  JTBD: "${p.goal}"
  Pain Points: ${(p.painPoints || []).join("; ")}`).join("\n")}
`;

    const painContext = `
USER PAIN POINTS:
${(painPoints || []).slice(0, 10).map((p: any) => `- ${p.symptom} [${p.type}]`).join("\n")}
`;

    const entityContext = `
KEY ENTITIES AND FEATURES:
${(entities || []).slice(0, 4).map((e: any) => `- ${e.category}: ${(e.items || []).slice(0, 6).join(", ")}`).join("\n")}
`;

    return `You are generating natural search queries that real users would type after understanding the actual services offered by "${domain}".
${industryContext}${languageInstruction}
${websiteContext}

CRITICAL LANGUAGE REQUIREMENT:
All generated queries MUST be written in the same language as the personas, pain points, and entities provided.
If the input data is in French, all queries must be in French.
If the input data is in German, all queries must be in German.
Match the language of the input data exactly.

BRAND-NAME RULE:
- NEVER include ANY brand names, company names, product names, or domain names
- This includes: competitor names, well-known brands, startup names, ANY proper nouns that are brands
- Describe the website's ACTUAL services, features, use cases, integrations, plan structure, and buyer needs without naming the company
- If you include ANY brand name, the entire output is invalid

WEBSITE-SPECIFICITY REQUIREMENTS:
- Every query must map to a service, feature, use case, audience, or pricing consideration supported by the crawled pages
- Prefer precise service terminology found on the website over broad industry phrases
- At least 70% of queries must reference a concrete capability or service evidenced on the website
- Include commercial questions based on actual pricing/plan evidence when available (cost, plan choice, included limits, billing model)
- If pricing was not found, do not invent prices, plan names, trials, limits, or discounts
- Do not create queries for capabilities that are not supported by the website evidence
- Make queries meaningfully different rather than swapping a few words
${entityContext}
${painContext}
${jtbdContext}
${goalsContext}
QUERY CATEGORIES TO GENERATE:
1. PROBLEM-BASED QUERIES (30+ queries)
   User is experiencing an issue and seeking understanding/solution
2. GOAL-BASED QUERIES (25+ queries)
   User wants to achieve a specific outcome
3. TASK-BASED QUERIES (25+ queries)
   User is trying to complete a specific job
4. FEATURE QUERIES (20+ queries)
   User researching solution capabilities (NO brand names)
5. COMPARISON QUERIES (10+ queries)
   Comparing SOLUTION TYPES or FEATURES, not brands
6. PRICING AND PURCHASE QUERIES (10+ queries)
   Based only on pricing, plans, packages, or buying considerations found in the website evidence
REQUIREMENTS:
- Generate AT LEAST 120 unique queries so filtering cannot reduce the final result below 100
- ZERO DUPLICATES
- Every query MUST be grammatically correct
INTENT DISTRIBUTION:
- Informational (40%): Learning about problem or solution
- Commercial (40%): Researching and comparing options
- Transactional (20%): Ready to find/get a solution
OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {
    "query": "natural question about a specific evidenced service or feature",
    "intent": "Informational",
    "source": "feature",
    "keywordType": "how-to",
    "persona": "Relevant buyer persona",
    "funnelStage": "awareness",
    "painPoint": "Specific problem supported by the evidence",
    "goal": "Specific desired outcome",
    "jtbd": "Specific job this service helps complete",
    "icpMatch": "Relevant audience described by the website",
    "jtbdMatch": "Situation and outcome tied to an evidenced capability"
  }
]`;
  },

  supplementaryQueries: (
    domain: string,
    existingCount: number,
    targetCount: number,
    entities: any[],
    painPoints: any[],
    crawledData?: any,
    domainAnalysis?: any,
    language: string = "en"
  ) => {
    const industry = domainAnalysis?.industry || "";
    const neededCount = targetCount - existingCount;
    const languageInstruction = getLanguageInstruction(language);
    const websiteContext = formatWebsiteEvidence(crawledData);

    return `Generate ${neededCount} additional unique search queries for the ${industry} industry.
${languageInstruction}
${websiteContext}
IMPORTANT: Generate all queries in the same language as the entities and pain points provided below.
These queries should complement existing ${existingCount} queries.
RULES:
- NO brand names or company names
- Every query must relate to a concrete service, feature, use case, audience, or verified pricing detail from the website evidence
- Use the site's specific service terminology; avoid broad, generic industry questions
- Never invent services, prices, plans, limits, trials, or discounts
- Natural language that real users would type
- Mix of informational, commercial, and transactional intent
Key entities: ${(entities || []).slice(0, 3).map((e: any) => (e.items || []).slice(0, 3).join(", ")).join("; ")}
Pain points: ${(painPoints || []).slice(0, 5).map((p: any) => p.symptom).join("; ")}
Return ONLY valid JSON array with ${neededCount} queries:
[
  {
    "query": "...",
    "intent": "Informational|Commercial|Transactional",
    "source": "supplementary",
    "topic": "..."
  }
]`;
  },

  brandedQueries: (domain: string, productCategory: string, count: number, language: string = "en") => {
    const brandName = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split(".")[0];
    const languageInstruction = getLanguageInstruction(language);

    return `Generate exactly ${count} branded search queries for "${brandName}" in the ${productCategory} industry.
${languageInstruction}
These queries SHOULD include the brand name "${brandName}" as users searching specifically for this brand.
Types of branded queries:
- Brand + feature: "${brandName} pricing", "${brandName} features"
- Brand + comparison: "${brandName} vs competitors", "${brandName} alternatives"
- Brand + review: "${brandName} reviews", "is ${brandName} worth it"
- Brand + how-to: "how to use ${brandName}", "${brandName} tutorial"
Return ONLY valid JSON array:
[
  {
    "query": "${brandName} pricing plans",
    "intent": "Commercial",
    "source": "branded",
    "topic": "pricing"
  }
]`;
  },
};
