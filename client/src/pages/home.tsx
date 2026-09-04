import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { DomainInput } from "@/components/domain-input";
import { ProgressStepper, HorizontalStepper } from "@/components/progress-stepper";
import { StepContent } from "@/components/step-content";
import { QueryList } from "@/components/query-list";
import { EmptyState } from "@/components/empty-state";
import { GuidedTour } from "@/components/guided-tour";
import { useToast } from "@/hooks/use-toast";
import type { Analysis, RegionCode, LanguageCode, ProgressEvent } from "@shared/schema";

function getCompletedSteps(analysis: Analysis | undefined): number[] {
  if (!analysis) return [];
  const completed: number[] = [];
  if (analysis.domainAnalysis) completed.push(0);
  if (analysis.entities && analysis.entities.length > 0) completed.push(1);
  if (analysis.semanticExpansion) completed.push(2);
  if (analysis.knowledgeGraph) completed.push(3);
  if (analysis.painPoints && analysis.painPoints.length > 0) completed.push(4);
  if (analysis.jtbd && analysis.jtbd.length > 0) completed.push(5);
  if (analysis.goals) completed.push(6);
  if (analysis.personas && analysis.personas.length > 0) completed.push(7);
  if (analysis.queries && analysis.queries.length > 0) completed.push(8);
  return completed;
}

function getDisplayStep(stepIndex: number): number {
  return stepIndex + 1;
}

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>("us");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const { toast } = useToast();

  const { data: analysis } = useQuery<Analysis>({
    queryKey: ["/api/analysis", currentAnalysisId],
    enabled: !!currentAnalysisId,
    refetchInterval: (query) => {
      const data = query.state.data as Analysis | undefined;
      if (data?.status === "processing") return 2000;
      return false;
    },
  });

  const completedSteps = getCompletedSteps(analysis);
  const highestCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : -1;

  useEffect(() => {
    if (analysis?.status === "completed" && completedSteps.length > 0) {
      setSelectedStep(highestCompletedStep);
    }
  }, [analysis?.status, completedSteps.length, highestCompletedStep]);

  const startAnalysisMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest("POST", "/api/analysis", { domain, region: selectedRegion, language: selectedLanguage });
      return res.json();
    },
    onSuccess: (data: Analysis) => {
      setCurrentAnalysisId(data.id);
      setProgressEvents([]);
      setSelectedStep(0);
      queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
      
      const eventSource = new EventSource(`/api/analysis/${data.id}/progress`);
      
      const cleanup = () => {
        eventSource.close();
      };
      
      eventSource.onmessage = (event) => {
        try {
          const progressEvent: ProgressEvent = JSON.parse(event.data);
          setProgressEvents((prev) => [...prev, progressEvent]);
          
          if (progressEvent.status === "completed") {
            // Backend step 1-9 maps to UI step 0-8 (Web Crawl step 0 is not shown in UI)
            const uiStep = Math.max(0, progressEvent.step - 1);
            setSelectedStep(uiStep);
            queryClient.invalidateQueries({ queryKey: ["/api/analysis", data.id] });
          }
          
          // Backend step 9 = Query Generation (final step)
          if (progressEvent.status === "completed" && progressEvent.step === 9) {
            cleanup();
          }
          
          if (progressEvent.status === "error") {
            cleanup();
            toast({
              title: "Analysis Error",
              description: progressEvent.message || "An error occurred during analysis",
              variant: "destructive",
            });
          }
        } catch (e) {
          console.error("Failed to parse progress event:", e);
        }
      };
      
      eventSource.onerror = () => {
        cleanup();
      };
      
      window.addEventListener("beforeunload", cleanup);
      
      return () => {
        cleanup();
        window.removeEventListener("beforeunload", cleanup);
      };
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start analysis",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartAnalysis = (domain: string, region: RegionCode, language: LanguageCode) => {
    setSelectedRegion(region);
    setSelectedLanguage(language);
    startAnalysisMutation.mutate(domain);
  };

  const handleReset = () => {
    setCurrentAnalysisId(null);
    setProgressEvents([]);
    setSelectedStep(0);
  };

  const handleExport = () => {
    if (!analysis?.queries?.length) {
      toast({
        title: "No queries to export",
        description: "Run an analysis first to generate queries",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ["query", "topic", "intent", "funnel_stage", "source", "country_iso_code"].join(","),
      ...analysis.queries.map((q) =>
        [
          `"${q.query.replace(/"/g, '""')}"`,
          `"${(q.topic || "").replace(/"/g, '""')}"`,
          q.intent,
          q.funnelStage || "awareness",
          q.source || "generic",
          analysis.region.toUpperCase(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `queries_${analysis.domain.replace(/[^a-z0-9]/gi, "_")}_${analysis.region}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${analysis.queries.length} queries to CSV`,
    });
  };

  const handleUpdate = async (updates: Partial<Analysis>) => {
    if (currentAnalysisId) {
      await apiRequest("PATCH", `/api/analysis/${currentAnalysisId}`, updates);
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", currentAnalysisId] });
    }
  };

  const handleStepClick = (step: number) => {
    if (completedSteps.includes(step)) {
      setSelectedStep(step);
    }
  };

  const currentStep = progressEvents.length > 0
    ? Math.max(...progressEvents.filter((e) => e.status === "completed").map((e) => e.step), -1) + 1
    : highestCompletedStep + 1;

  const isProcessing = startAnalysisMutation.isPending || analysis?.status === "processing";
  const hasResults = !!(analysis?.status === "completed" && analysis.queries && analysis.queries.length > 0);
  const showStepper = isProcessing || hasResults;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onExport={handleExport}
        canExport={hasResults}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {!showStepper && (
          <div className="mb-8">
            <DomainInput
              onSubmit={handleStartAnalysis}
              isLoading={isProcessing}
              disabled={isProcessing}
            />
          </div>
        )}

        {showStepper && (
          <div className="mb-8">
            {isProcessing ? (
              <ProgressStepper 
                currentStep={currentStep} 
                progressEvents={progressEvents}
                selectedStep={selectedStep}
                onStepClick={handleStepClick}
                domain={analysis?.domain}
                onReset={handleReset}
                completedSteps={completedSteps}
              />
            ) : (
              <HorizontalStepper
                currentStep={10}
                isComplete={true}
                selectedStep={selectedStep}
                onStepClick={handleStepClick}
                domain={analysis?.domain}
                onReset={handleReset}
                completedSteps={completedSteps}
              />
            )}
          </div>
        )}

        {showStepper && analysis && selectedStep < 8 && (
          <div className="mb-8">
            <StepContent
              step={selectedStep}
              analysis={analysis}
              onUpdate={handleUpdate}
            />
          </div>
        )}

        {showStepper && analysis && selectedStep >= 8 && (
          <div className="mb-8">
            <QueryList 
              queries={analysis.queries || []} 
              region={analysis.region}
              onExport={handleExport}
            />
          </div>
        )}

        {!showStepper && <EmptyState />}

        <GuidedTour />
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>LLM Query Builder</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                API Connected
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
