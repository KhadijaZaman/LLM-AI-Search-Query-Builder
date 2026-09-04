import { randomUUID } from "crypto";
import type { Analysis, CreateAnalysis } from "@shared/schema";

export interface IStorage {
  createAnalysis(data: CreateAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  updateAnalysis(id: string, data: Partial<Analysis>): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
  deleteAnalysis(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, Analysis>;

  constructor() {
    this.analyses = new Map();
  }

  async createAnalysis(data: CreateAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = {
      id,
      domain: data.domain,
      region: data.region || "us",
      language: data.language || "en",
      status: "pending",
      currentStep: -1,
      createdAt: new Date().toISOString(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async updateAnalysis(id: string, data: Partial<Analysis>): Promise<Analysis | undefined> {
    const existing = this.analyses.get(id);
    if (!existing) return undefined;
    
    const updated: Analysis = { ...existing, ...data };
    this.analyses.set(id, updated);
    return updated;
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    return this.analyses.delete(id);
  }
}

export const storage = new MemStorage();
