import assert from "node:assert/strict";
import test from "node:test";
import { prompts } from "./ai-prompts";

const crawledData = {
  url: "https://example.com",
  pages: [
    { url: "https://example.com", kind: "homepage", text: "Homepage: precision laser audits." },
    { url: "https://example.com/services", kind: "features", text: "Service: laser compliance mapping." },
    { url: "https://example.com/pricing", kind: "pricing", text: "Pricing: fixed audit package costs $900." },
  ],
  extractedData: {
    productName: "Acme",
    tagline: "Audit specialists",
    features: ["Laser compliance mapping"],
    solutions: ["Precision laser audits"],
    industries: ["Manufacturing"],
    useCases: ["Factory certification"],
  },
};
const analysis = { definition: "Audit service", productOffering: "Laser audits", industry: "Compliance" };
const entities = [{ category: "Services", items: ["Laser compliance mapping"] }];
const painPoints = [{
  type: "Operational", symptom: "Unmapped laser risks", root: "No audit",
  impact: "Failed certification",
}];

test("all grounding-sensitive prompts include homepage, service, and pricing evidence", () => {
  const generated = {
    domain: prompts.domainAnalysis("example.com", crawledData),
    entity: prompts.entities("example.com", analysis, crawledData),
    painPoint: prompts.painPoints("example.com", entities, crawledData, "us", analysis),
    mainQuery: prompts.queries("example.com", [], painPoints, entities, crawledData, undefined, {}, analysis),
    supplementaryQuery: prompts.supplementaryQueries(
      "example.com", 80, 120, entities, painPoints, crawledData, analysis,
    ),
  };

  for (const [name, prompt] of Object.entries(generated)) {
    assert.match(prompt, /precision laser audits/i, `${name} omitted homepage evidence`);
    assert.match(prompt, /laser compliance mapping/i, `${name} omitted service evidence`);
    assert.match(prompt, /\$900/, `${name} omitted pricing evidence`);
    assert.match(prompt, /do not invent|never invent/i, `${name} omitted anti-invention guidance`);
  }
});