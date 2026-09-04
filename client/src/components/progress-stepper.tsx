import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressEvent } from "@shared/schema";

interface ProgressStepperProps {
  currentStep: number;
  progressEvents: ProgressEvent[];
  selectedStep: number;
  onStepClick: (step: number) => void;
  domain?: string;
  onReset?: () => void;
  completedSteps: number[];
}

const STEP_LABELS = [
  "DOMAIN",
  "ENTITIES", 
  "EXPAND",
  "GRAPH",
  "PAIN",
  "JTBD",
  "GOALS",
  "PERSONAS",
  "QUERIES",
];

export function ProgressStepper({ 
  currentStep, 
  progressEvents, 
  selectedStep,
  onStepClick,
  domain, 
  onReset,
  completedSteps,
}: ProgressStepperProps) {
  const getStepStatus = (uiStepId: number): "completed" | "current" | "error" | "pending" => {
    // Backend step = uiStep + 1 (Web Crawl is backend step 0, not shown in UI)
    const backendStep = uiStepId + 1;
    const stepEvents = progressEvents.filter((e) => e.step === backendStep);
    if (stepEvents.some((e) => e.status === "error")) return "error";
    if (completedSteps.includes(uiStepId)) return "completed";
    if (stepEvents.some((e) => e.status === "completed")) return "completed";
    // Backend currentStep needs to be converted to UI step
    if (backendStep === currentStep) return "current";
    return "pending";
  };

  return (
    <div className="bg-card border rounded-lg p-6" data-tour="progress-stepper">
      <div className="flex items-center justify-between mb-6">
        {domain && (
          <div className="text-sm text-muted-foreground">
            Analyzing: <span className="font-medium text-foreground">{domain}</span>
          </div>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="text-sm font-medium text-primary hover:text-primary/80 border border-primary rounded-md px-3 py-1.5 transition-colors"
            data-testid="button-reset-analysis"
          >
            Reset & Start New
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const status = getStepStatus(idx);
          const isClickable = completedSteps.includes(idx);
          const isSelected = selectedStep === idx;
          const isLast = idx === STEP_LABELS.length - 1;

          return (
            <div key={idx} className="flex items-center flex-1">
              <div 
                className={cn(
                  "flex flex-col items-center",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick(idx)}
                data-testid={`step-${idx}`}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                    status === "completed" && "bg-primary border-primary text-primary-foreground",
                    status === "current" && "border-primary bg-primary/10 text-primary",
                    status === "error" && "border-destructive bg-destructive text-destructive-foreground",
                    status === "pending" && "border-muted-foreground/30 text-muted-foreground/50",
                    isSelected && status === "completed" && "ring-2 ring-offset-2 ring-primary"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="w-5 h-5" />
                  ) : status === "current" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium",
                    status === "completed" && "text-primary",
                    status === "current" && "text-primary",
                    status === "error" && "text-destructive",
                    status === "pending" && "text-muted-foreground/50",
                    isSelected && "font-bold"
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-20px]",
                    status === "completed" ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HorizontalStepperProps {
  currentStep: number;
  isComplete: boolean;
  selectedStep: number;
  onStepClick: (step: number) => void;
  domain?: string;
  onReset?: () => void;
  completedSteps: number[];
}

export function HorizontalStepper({ 
  currentStep, 
  isComplete,
  selectedStep,
  onStepClick,
  domain,
  onReset,
  completedSteps,
}: HorizontalStepperProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        {domain && (
          <div className="text-sm text-muted-foreground">
            Analyzing: <span className="font-medium text-foreground">{domain}</span>
          </div>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="text-sm font-medium text-primary hover:text-primary/80 border border-primary rounded-md px-3 py-1.5 transition-colors"
            data-testid="button-reset-analysis"
          >
            Reset & Start New
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const isCompleted = completedSteps.includes(idx);
          const isLast = idx === STEP_LABELS.length - 1;
          const isClickable = isCompleted;
          const isSelected = selectedStep === idx;

          return (
            <div key={idx} className="flex items-center flex-1">
              <div 
                className={cn(
                  "flex flex-col items-center",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick(idx)}
                data-testid={`step-${idx}`}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    !isCompleted && "border-muted-foreground/30 text-muted-foreground/50",
                    isSelected && isCompleted && "ring-2 ring-offset-2 ring-primary"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium",
                    isCompleted && "text-primary",
                    !isCompleted && "text-muted-foreground/50",
                    isSelected && "font-bold"
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-20px]",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
