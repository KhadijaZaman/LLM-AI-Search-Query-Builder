import { Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TourTriggerButton } from "@/components/guided-tour";

interface HeaderProps {
  onExport: () => void;
  canExport: boolean;
}

export function Header({ onExport, canExport }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">LLM Query Builder</h1>
              <p className="text-xs text-muted-foreground mt-0.5">AI-Powered Search Query Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onExport}
              disabled={!canExport}
              data-testid="button-export"
              data-tour="export-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            <TourTriggerButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
