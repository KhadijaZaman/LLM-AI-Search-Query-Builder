import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='domain-input']",
    title: "Enter Your Domain",
    content: "Start by entering the website URL you want to analyze. The tool will automatically detect the region and language from the domain extension.",
    position: "bottom",
  },
  {
    target: "[data-tour='region-selector']",
    title: "Select Target Region",
    content: "Choose the geographic region for your analysis. This affects the market context and search behavior patterns.",
    position: "bottom",
  },
  {
    target: "[data-tour='language-selector']",
    title: "Choose Output Language",
    content: "Select the language for your generated queries. All analysis outputs will be in this language.",
    position: "bottom",
  },
  {
    target: "[data-tour='analyze-button']",
    title: "Start Analysis",
    content: "Click this button to begin the 9-step AI-powered analysis. The process takes about 1-2 minutes.",
    position: "bottom",
  },
  {
    target: "[data-tour='progress-stepper']",
    title: "Track Progress",
    content: "Watch the analysis progress through 9 steps: from domain analysis to query generation. Each step builds on the previous one.",
    position: "bottom",
  },
  {
    target: "[data-tour='analysis-results']",
    title: "Review & Edit Results",
    content: "After analysis, review the extracted entities, pain points, personas, and more. All outputs are fully editable - just click to modify.",
    position: "top",
  },
  {
    target: "[data-tour='query-list']",
    title: "Generated Queries",
    content: "Browse 100+ AI-generated search queries optimized for LLM visibility. Filter by intent type and export to CSV.",
    position: "top",
  },
  {
    target: "[data-tour='export-button']",
    title: "Export Results",
    content: "Download your queries as a CSV file with columns for query, topic, intent, and country code.",
    position: "bottom",
  },
];

const TOUR_STORAGE_KEY = "llm-query-builder-tour-completed";

interface GuidedTourProps {
  onComplete?: () => void;
}

export function GuidedTour({ onComplete }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const checkAndStartTour = useCallback(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      setTimeout(() => setIsActive(true), 1000);
    }
  }, []);

  useEffect(() => {
    checkAndStartTour();
  }, [checkAndStartTour]);

  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);

      const tooltipWidth = 320;
      const tooltipHeight = 180;
      const padding = 16;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case "bottom":
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "top":
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          break;
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          break;
      }

      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setTooltipPosition({ top, left });

      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsActive(false);
    setCurrentStep(0);
    onComplete?.();
  };

  const skipTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsActive(false);
    setCurrentStep(0);
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      <div 
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          clipPath: highlightRect
            ? `polygon(
                0% 0%, 0% 100%, 
                ${highlightRect.left - 4}px 100%, 
                ${highlightRect.left - 4}px ${highlightRect.top - 4}px, 
                ${highlightRect.right + 4}px ${highlightRect.top - 4}px, 
                ${highlightRect.right + 4}px ${highlightRect.bottom + 4}px, 
                ${highlightRect.left - 4}px ${highlightRect.bottom + 4}px, 
                ${highlightRect.left - 4}px 100%, 
                100% 100%, 100% 0%
              )`
            : "none",
        }}
      />

      {highlightRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-md ring-2 ring-primary ring-offset-2"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}

      <Card
        className="fixed z-[10000] w-80 shadow-xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
        data-testid="tour-tooltip"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-base">{step.title}</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={skipTour}
              data-testid="button-tour-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrev}
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                data-testid="button-tour-next"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  "Finish"
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function TourTriggerButton() {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
    window.location.reload();
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={startTour}
      title="Start guided tour"
      data-testid="button-start-tour"
    >
      <HelpCircle className="w-4 h-4" />
    </Button>
  );
}
