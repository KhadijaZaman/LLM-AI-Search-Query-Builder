import assert from "node:assert/strict";
import test from "node:test";
import type { GeneratedQuery } from "@shared/schema";
import { buildFinalQueries } from "./query-pipeline";

const makeQuery = (text: string): GeneratedQuery => ({
  query: text,
  intent: "Commercial",
  source: "feature",
});

test("final output remains above 100 after brand filtering and grounded top-up", async () => {
  const service = "laser compliance mapping";
  const initial = Array.from({ length: 110 }, (_, i) =>
    makeQuery(
      i < 20
        ? `How can Acme improve laser compliance mapping workflow number ${i}?`
        : `How can teams improve laser compliance mapping workflow number ${i}?`,
    ),
  );
  const calls: Array<{ existing: number; target: number }> = [];

  const result = await buildFinalQueries(
    "acme.com",
    { definition: "Laser audits", industry: "Compliance", competitors: ["OtherBrand"] },
    [{ category: "Services", items: [service] }],
    [{ type: "Operational", symptom: "Unmapped risk", root: "No map", impact: "Delay" }],
    {
      url: "https://acme.com",
      pages: [{ url: "https://acme.com/services", kind: "features", text: service }],
    },
    {
      generateQueries: async () => initial,
      generateSupplementaryQueries: async (existing, target) => {
        calls.push({ existing, target });
        return Array.from({ length: target - existing }, (_, i) =>
          makeQuery(`Which laser compliance mapping workflow supports audit case ${existing + i}?`),
        );
      },
      generateBrandedQueries: async () => [],
    },
  );

  assert.ok(calls.some((call) => call.target === 120));
  assert.ok(calls.some((call) => call.target === 115));
  assert.ok(result.length > 100, `expected over 100 queries, received ${result.length}`);
  assert.ok(result.every((item) => item.query.includes(service)));
  assert.ok(result.every((item) => !/\bacme\b|\botherbrand\b/i.test(item.query)));
  assert.ok(result.every((item) => item.query.endsWith("?")));
});