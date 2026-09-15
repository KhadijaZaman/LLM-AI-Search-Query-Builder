import type {
  CrawledData,
  DomainAnalysis,
  EntityCategory,
  GeneratedQuery,
  PainPoint,
} from "@shared/schema";
import {
  deduplicateQueries,
  extractBrandBlacklist,
  filterAndEnrichQueries,
} from "./brand-filter";
import { filterGroundedServiceQuestions } from "./query-quality";

export interface QueryGenerators {
  generateQueries(): Promise<GeneratedQuery[]>;
  generateSupplementaryQueries(
    existingCount: number,
    targetCount: number,
    entities: EntityCategory[],
    painPoints: PainPoint[],
    crawledData: CrawledData,
    domainAnalysis: DomainAnalysis,
  ): Promise<GeneratedQuery[]>;
  generateBrandedQueries(count: number): Promise<GeneratedQuery[]>;
}

export async function buildFinalQueries(
  domain: string,
  domainAnalysis: DomainAnalysis,
  entities: EntityCategory[],
  painPoints: PainPoint[],
  crawledData: CrawledData,
  generators: QueryGenerators,
): Promise<GeneratedQuery[]> {
  let allQueries = deduplicateQueries(
    filterGroundedServiceQuestions(await generators.generateQueries(), crawledData),
  );
  const queryTarget = 120;

  if (allQueries.length < queryTarget) {
    const supplementary = await generators.generateSupplementaryQueries(
      allQueries.length, queryTarget, entities, painPoints, crawledData, domainAnalysis,
    );
    allQueries = deduplicateQueries([
      ...allQueries,
      ...filterGroundedServiceQuestions(supplementary, crawledData),
    ]);
  }

  const brandBlacklist = extractBrandBlacklist(domain, domainAnalysis.competitors);
  const brandedQueries = await generators.generateBrandedQueries(Math.ceil(allQueries.length * 0.05));
  let finalQueries = filterGroundedServiceQuestions(
    filterAndEnrichQueries(allQueries, brandBlacklist, brandedQueries),
    crawledData,
  );

  if (finalQueries.length <= 100) {
    const groundedTopUp = await generators.generateSupplementaryQueries(
      finalQueries.length, 115, entities, painPoints, crawledData, domainAnalysis,
    );
    finalQueries = filterGroundedServiceQuestions(
      filterAndEnrichQueries(
        deduplicateQueries([
          ...finalQueries,
          ...filterGroundedServiceQuestions(groundedTopUp, crawledData),
        ]),
        brandBlacklist,
        brandedQueries,
      ),
      crawledData,
    );
  }

  return finalQueries;
}