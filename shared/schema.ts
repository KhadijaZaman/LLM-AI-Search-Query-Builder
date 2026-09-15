import { z } from "zod";

export const REGIONS = {
  us: "United States",
  uk: "United Kingdom",
  ae: "United Arab Emirates (UAE)",
  sa: "Saudi Arabia",
  in: "India",
  au: "Australia",
  de: "Germany",
  fr: "France",
  ca: "Canada",
  sg: "Singapore",
  ch: "Switzerland",
} as const;

export type RegionCode = keyof typeof REGIONS;

export const LANGUAGES = {
  en: "English",
  de: "German",
  fr: "French",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Chinese",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const REGION_MAP: Record<RegionCode, { gl: string; hl: string; google_domain: string }> = {
  us: { gl: "us", hl: "en", google_domain: "google.com" },
  uk: { gl: "uk", hl: "en", google_domain: "google.co.uk" },
  ae: { gl: "ae", hl: "ar", google_domain: "google.ae" },
  sa: { gl: "sa", hl: "ar", google_domain: "google.com.sa" },
  in: { gl: "in", hl: "hi", google_domain: "google.co.in" },
  au: { gl: "au", hl: "en", google_domain: "google.com.au" },
  de: { gl: "de", hl: "de", google_domain: "google.de" },
  fr: { gl: "fr", hl: "fr", google_domain: "google.fr" },
  ca: { gl: "ca", hl: "en", google_domain: "google.ca" },
  sg: { gl: "sg", hl: "en", google_domain: "google.com.sg" },
  ch: { gl: "ch", hl: "de", google_domain: "google.ch" },
};

export const LANGUAGE_HL_CODES: Record<LanguageCode, string> = {
  en: "en",
  de: "de",
  fr: "fr",
  ar: "ar",
  hi: "hi",
  zh: "zh-CN",
  es: "es",
  pt: "pt",
  it: "it",
  ja: "ja",
  ko: "ko",
};

export const PIPELINE_STEPS = [
  { id: 0, name: "Web Crawl", description: "Extracting website content" },
  { id: 1, name: "Domain Analysis", description: "Analyzing brand and market position" },
  { id: 2, name: "Entity Extraction", description: "Identifying key entities and features" },
  { id: 3, name: "Semantic Expansion", description: "Expanding entity relationships" },
  { id: 4, name: "Knowledge Graph", description: "Building concept relationships" },
  { id: 5, name: "Pain Points", description: "Identifying customer pain points" },
  { id: 6, name: "Jobs-to-be-Done", description: "Mapping user jobs and goals" },
  { id: 7, name: "Goals Framework", description: "Defining user objectives" },
  { id: 8, name: "Personas", description: "Creating user personas" },
  { id: 9, name: "Query Generation", description: "Generating search queries" },
] as const;

export const QueryIntentSchema = z.enum(["Informational", "Commercial", "Transactional"]);
export type QueryIntent = z.infer<typeof QueryIntentSchema>;

export const QuerySourceSchema = z.enum([
  "pain-point",
  "goal",
  "jtbd",
  "persona",
  "feature",
  "comparison",
  "supplementary",
  "branded",
]);
export type QuerySource = z.infer<typeof QuerySourceSchema>;

export const FunnelStageSchema = z.enum(["awareness", "consideration", "decision"]);
export type FunnelStage = z.infer<typeof FunnelStageSchema>;

export const GeneratedQuerySchema = z.object({
  query: z.string(),
  intent: QueryIntentSchema,
  source: QuerySourceSchema,
  keywordType: z.string().optional(),
  persona: z.string().optional(),
  funnelStage: FunnelStageSchema.optional(),
  painPoint: z.string().optional(),
  goal: z.string().optional(),
  jtbd: z.string().optional(),
  icpMatch: z.string().optional(),
  jtbdMatch: z.string().optional(),
  topic: z.string().optional(),
});
export type GeneratedQuery = z.infer<typeof GeneratedQuerySchema>;

export const EntityCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
  attributes: z.record(z.array(z.string())).optional(),
});
export type EntityCategory = z.infer<typeof EntityCategorySchema>;

export const PainPointSchema = z.object({
  type: z.string(),
  symptom: z.string(),
  root: z.string(),
  impact: z.string(),
  industry: z.string().optional(),
  relatedEntities: z.array(z.string()).optional(),
  solution: z.string().optional(),
});
export type PainPoint = z.infer<typeof PainPointSchema>;

export const JTBDSchema = z.object({
  audience: z.string(),
  situation: z.string(),
  motivation: z.string(),
  barriers: z.array(z.string()).optional(),
  success: z.string(),
  emotional: z.string().optional(),
  industry: z.string().optional(),
  relatedProduct: z.string().optional(),
  relatedEntities: z.array(z.string()).optional(),
});
export type JTBD = z.infer<typeof JTBDSchema>;

export const PersonaSchema = z.object({
  name: z.string(),
  role: z.string(),
  demographics: z.string().optional(),
  psychographics: z.string().optional(),
  goal: z.string(),
  painPoints: z.array(z.string()).optional(),
  behaviors: z.array(z.string()).optional(),
  decisionStyle: z.string().optional(),
  channels: z.array(z.string()).optional(),
  quotes: z.array(z.string()).optional(),
  queries: z.array(z.string()).optional(),
  relatedEntities: z.array(z.string()).optional(),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const GoalsFrameworkSchema = z.object({
  immediate: z.array(z.object({ goal: z.string(), metric: z.string() })).optional(),
  shortTerm: z.array(z.object({ goal: z.string(), metric: z.string() })).optional(),
  longTerm: z.array(z.object({ goal: z.string(), metric: z.string() })).optional(),
  antiGoals: z.array(z.string()).optional(),
  brandGoals: z.array(z.string()).optional(),
});
export type GoalsFramework = z.infer<typeof GoalsFrameworkSchema>;

export const DomainAnalysisSchema = z.object({
  definition: z.string(),
  productOffering: z.string().optional(),
  industry: z.string().optional(),
  industrySubcategory: z.string().optional(),
  subdomains: z.array(z.string()).optional(),
  customerTypes: z.array(z.string()).optional(),
  marketMaturity: z.string().optional(),
  businessModels: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
});
export type DomainAnalysis = z.infer<typeof DomainAnalysisSchema>;

export const CrawledDataSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  pages: z.array(z.object({
    url: z.string(),
    kind: z.enum(["homepage", "features", "pricing"]),
    title: z.string().optional(),
    text: z.string(),
  })).optional(),
  extractedData: z.object({
    productName: z.string().optional(),
    tagline: z.string().optional(),
    features: z.array(z.string()),
    solutions: z.array(z.string()),
    industries: z.array(z.string()),
    useCases: z.array(z.string()),
  }).optional(),
  error: z.string().optional(),
});
export type CrawledData = z.infer<typeof CrawledDataSchema>;

export const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["category", "entity"]),
  group: z.string().optional(),
});
export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>;

export const KnowledgeGraphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relationship: z.string(),
  weight: z.number().optional(),
});
export type KnowledgeGraphEdge = z.infer<typeof KnowledgeGraphEdgeSchema>;

export const KnowledgeGraphSchema = z.object({
  nodes: z.array(KnowledgeGraphNodeSchema),
  edges: z.array(KnowledgeGraphEdgeSchema),
  clusters: z.array(z.object({
    id: z.string(),
    label: z.string(),
    nodes: z.array(z.string()),
  })).optional(),
});
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;

export const SemanticExpansionSchema = z.object({
  expansions: z.record(z.array(z.string())),
  industryMappings: z.record(z.array(z.string())).optional(),
  topicMappings: z.record(z.array(z.string())).optional(),
  triples: z.array(z.object({
    entity: z.string(),
    attribute: z.string(),
    value: z.string(),
    industry: z.string().optional(),
    topic: z.string().optional(),
    source: z.string().optional(),
    confidence: z.number().optional(),
  })).optional(),
});
export type SemanticExpansion = z.infer<typeof SemanticExpansionSchema>;

export const AnalysisStatusSchema = z.enum(["pending", "processing", "completed", "error"]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const AnalysisSchema = z.object({
  id: z.string(),
  domain: z.string(),
  region: z.string(),
  language: z.string().default("en"),
  status: AnalysisStatusSchema,
  currentStep: z.number(),
  error: z.string().optional(),
  crawledData: CrawledDataSchema.optional(),
  domainAnalysis: DomainAnalysisSchema.optional(),
  entities: z.array(EntityCategorySchema).optional(),
  semanticExpansion: SemanticExpansionSchema.optional(),
  knowledgeGraph: KnowledgeGraphSchema.optional(),
  painPoints: z.array(PainPointSchema).optional(),
  jtbd: z.array(JTBDSchema).optional(),
  goals: GoalsFrameworkSchema.optional(),
  personas: z.array(PersonaSchema).optional(),
  queries: z.array(GeneratedQuerySchema).optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const CreateAnalysisSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  region: z.string().default("us"),
  language: z.string().default("en"),
});
export type CreateAnalysis = z.infer<typeof CreateAnalysisSchema>;

export const ProgressEventSchema = z.object({
  step: z.number(),
  stepName: z.string(),
  status: z.enum(["started", "completed", "error"]),
  message: z.string().optional(),
  data: z.any().optional(),
});
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
