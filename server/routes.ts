import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { crawlWebsite } from "./web-crawler";
import {
  extractBrandBlacklist,
  deduplicateQueries,
  filterAndEnrichQueries,
} from "./brand-filter";
import { CreateAnalysisSchema, PIPELINE_STEPS, type ProgressEvent } from "@shared/schema";

const activeStreams = new Map<string, Response[]>();

function sendProgressEvent(analysisId: string, event: ProgressEvent) {
  const streams = activeStreams.get(analysisId) || [];
  const data = `data: ${JSON.stringify(event)}\n\n`;
  streams.forEach((res) => {
    try {
      res.write(data);
    } catch (e) {
      console.error("Failed to write SSE:", e);
    }
  });
}

async function processAnalysis(id: string) {
  const analysis = await storage.getAnalysis(id);
  if (!analysis) return;

  await storage.updateAnalysis(id, { status: "processing", currentStep: 0 });

  try {
    const region = analysis.region || "us";
    const language = analysis.language || "en";
    const domain = analysis.domain;

    sendProgressEvent(id, {
      step: 0,
      stepName: PIPELINE_STEPS[0].name,
      status: "started",
      message: "Crawling website...",
    });
    const crawledData = await crawlWebsite(domain);
    await storage.updateAnalysis(id, { crawledData, currentStep: 1 });
    sendProgressEvent(id, {
      step: 0,
      stepName: PIPELINE_STEPS[0].name,
      status: "completed",
      message: crawledData.error ? `Crawl failed: ${crawledData.error}` : "Website crawled",
    });

    sendProgressEvent(id, {
      step: 1,
      stepName: PIPELINE_STEPS[1].name,
      status: "started",
      message: "Analyzing domain...",
    });
    const domainAnalysis = await aiService.generateDomainAnalysis(domain, crawledData, region, language);
    await storage.updateAnalysis(id, { domainAnalysis, currentStep: 2 });
    sendProgressEvent(id, {
      step: 1,
      stepName: PIPELINE_STEPS[1].name,
      status: "completed",
      message: `Industry: ${domainAnalysis.industry || "General"}`,
    });

    sendProgressEvent(id, {
      step: 2,
      stepName: PIPELINE_STEPS[2].name,
      status: "started",
      message: "Extracting entities...",
    });
    const entities = await aiService.generateEntities(domain, domainAnalysis, crawledData, region, language);
    await storage.updateAnalysis(id, { entities, currentStep: 3 });
    sendProgressEvent(id, {
      step: 2,
      stepName: PIPELINE_STEPS[2].name,
      status: "completed",
      message: `Found ${entities.reduce((a, e) => a + e.items.length, 0)} entities`,
    });

    sendProgressEvent(id, {
      step: 3,
      stepName: PIPELINE_STEPS[3].name,
      status: "started",
      message: "Expanding semantically...",
    });
    const semanticExpansion = await aiService.generateExpansion(entities, domain, crawledData);
    await storage.updateAnalysis(id, { semanticExpansion, currentStep: 4 });
    sendProgressEvent(id, {
      step: 3,
      stepName: PIPELINE_STEPS[3].name,
      status: "completed",
      message: "Semantic expansion complete",
    });

    sendProgressEvent(id, {
      step: 4,
      stepName: PIPELINE_STEPS[4].name,
      status: "started",
      message: "Building knowledge graph...",
    });
    const knowledgeGraph = await aiService.generateGraph(entities, semanticExpansion);
    await storage.updateAnalysis(id, { knowledgeGraph, currentStep: 5 });
    sendProgressEvent(id, {
      step: 4,
      stepName: PIPELINE_STEPS[4].name,
      status: "completed",
      message: `Graph: ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} edges`,
    });

    sendProgressEvent(id, {
      step: 5,
      stepName: PIPELINE_STEPS[5].name,
      status: "started",
      message: "Identifying pain points...",
    });
    const painPoints = await aiService.generatePainPoints(
      domain,
      entities,
      crawledData,
      region,
      domainAnalysis,
      language
    );
    await storage.updateAnalysis(id, { painPoints, currentStep: 6 });
    sendProgressEvent(id, {
      step: 5,
      stepName: PIPELINE_STEPS[5].name,
      status: "completed",
      message: `Found ${painPoints.length} pain points`,
    });

    sendProgressEvent(id, {
      step: 6,
      stepName: PIPELINE_STEPS[6].name,
      status: "started",
      message: "Mapping jobs-to-be-done...",
    });
    const jtbd = await aiService.generateJTBD(domain, painPoints, entities, domainAnalysis, region, language);
    await storage.updateAnalysis(id, { jtbd, currentStep: 7 });
    sendProgressEvent(id, {
      step: 6,
      stepName: PIPELINE_STEPS[6].name,
      status: "completed",
      message: `Found ${jtbd.length} JTBDs`,
    });

    sendProgressEvent(id, {
      step: 7,
      stepName: PIPELINE_STEPS[7].name,
      status: "started",
      message: "Defining goals framework...",
    });
    const goals = await aiService.generateGoals(domain, jtbd, domainAnalysis, region, language);
    await storage.updateAnalysis(id, { goals, currentStep: 8 });
    sendProgressEvent(id, {
      step: 7,
      stepName: PIPELINE_STEPS[7].name,
      status: "completed",
      message: "Goals framework defined",
    });

    sendProgressEvent(id, {
      step: 8,
      stepName: PIPELINE_STEPS[8].name,
      status: "started",
      message: "Creating personas...",
    });
    const personas = await aiService.generatePersonas(domain, painPoints, entities, jtbd, region, language);
    await storage.updateAnalysis(id, { personas, currentStep: 9 });
    sendProgressEvent(id, {
      step: 8,
      stepName: PIPELINE_STEPS[8].name,
      status: "completed",
      message: `Created ${personas.length} personas`,
    });

    sendProgressEvent(id, {
      step: 9,
      stepName: PIPELINE_STEPS[9].name,
      status: "started",
      message: "Generating queries...",
    });

    const aiQueries = await aiService.generateQueries(
      domain,
      personas,
      painPoints,
      entities,
      crawledData,
      undefined,
      goals,
      domainAnalysis,
      region,
      language
    );

    let allQueries = deduplicateQueries([...aiQueries]);

    const queryTarget = 120;
    if (allQueries.length < queryTarget) {
      const supplementary = await aiService.generateSupplementaryQueries(
        domain,
        allQueries.length,
        queryTarget,
        entities,
        painPoints,
        crawledData,
        domainAnalysis,
        language
      );
      allQueries = deduplicateQueries([...allQueries, ...supplementary]);
    }

    const brandBlacklist = extractBrandBlacklist(domain, domainAnalysis.competitors);
    const brandedCount = Math.ceil(allQueries.length * 0.05);
    const brandedQueries = await aiService.generateBrandedQueries(
      domain,
      domainAnalysis.industry || "General",
      brandedCount,
      language
    );

    let finalQueries = filterAndEnrichQueries(allQueries, brandBlacklist, brandedQueries);

    if (finalQueries.length < 100) {
      const groundedTopUp = await aiService.generateSupplementaryQueries(
        domain,
        finalQueries.length,
        115,
        entities,
        painPoints,
        crawledData,
        domainAnalysis,
        language
      );
      finalQueries = filterAndEnrichQueries(
        deduplicateQueries([...finalQueries, ...groundedTopUp]),
        brandBlacklist,
        brandedQueries
      );
    }

    await storage.updateAnalysis(id, {
      queries: finalQueries,
      currentStep: 10,
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    sendProgressEvent(id, {
      step: 9,
      stepName: PIPELINE_STEPS[9].name,
      status: "completed",
      message: `Generated ${finalQueries.length} queries`,
    });
    
    setTimeout(() => {
      const streams = activeStreams.get(id) || [];
      streams.forEach((res) => {
        try {
          res.end();
        } catch (e) {}
      });
      activeStreams.delete(id);
    }, 1000);
  } catch (error: any) {
    console.error("Analysis error:", error);
    await storage.updateAnalysis(id, {
      status: "error",
      error: error.message || "Analysis failed",
    });
    sendProgressEvent(id, {
      step: analysis?.currentStep ?? 0,
      stepName: PIPELINE_STEPS[analysis?.currentStep ?? 0]?.name || "Unknown",
      status: "error",
      message: error.message || "Analysis failed",
    });
    
    setTimeout(() => {
      const streams = activeStreams.get(id) || [];
      streams.forEach((res) => {
        try {
          res.end();
        } catch (e) {}
      });
      activeStreams.delete(id);
    }, 1000);
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.post("/api/analysis", async (req: Request, res: Response) => {
    try {
      const parsed = CreateAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const analysis = await storage.createAnalysis(parsed.data);

      processAnalysis(analysis.id).catch((e) => {
        console.error("Background analysis failed:", e);
      });

      res.status(201).json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create analysis" });
    }
  });

  app.get("/api/analysis/:id", async (req: Request, res: Response) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analysis/:id/progress", async (req: Request, res: Response) => {
    const { id } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const streams = activeStreams.get(id) || [];
    streams.push(res);
    activeStreams.set(id, streams);

    const analysis = await storage.getAnalysis(id);
    if (analysis) {
      res.write(
        `data: ${JSON.stringify({
          step: analysis.currentStep,
          stepName: PIPELINE_STEPS[analysis.currentStep]?.name || "Initializing",
          status: analysis.status === "completed" ? "completed" : "started",
          message: `Current step: ${analysis.currentStep}`,
        })}\n\n`
      );
    }

    req.on("close", () => {
      const currentStreams = activeStreams.get(id) || [];
      const filtered = currentStreams.filter((s) => s !== res);
      if (filtered.length > 0) {
        activeStreams.set(id, filtered);
      } else {
        activeStreams.delete(id);
      }
    });
  });

  app.get("/api/analysis", async (req: Request, res: Response) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/analysis/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteAnalysis(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
