import { useState, useEffect } from "react";
import { Search, Loader2, Globe2, MapPin, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGIONS, LANGUAGES, type RegionCode, type LanguageCode } from "@shared/schema";

const TLD_TO_REGION: Record<string, RegionCode> = {
  "com": "us",
  "us": "us",
  "co.uk": "uk",
  "uk": "uk",
  "ae": "ae",
  "sa": "sa",
  "co.in": "in",
  "in": "in",
  "com.au": "au",
  "au": "au",
  "de": "de",
  "fr": "fr",
  "ca": "ca",
  "com.sg": "sg",
  "sg": "sg",
  "ch": "ch",
};

const REGION_TO_LANGUAGE: Record<RegionCode, LanguageCode> = {
  us: "en",
  uk: "en",
  ae: "ar",
  sa: "ar",
  in: "hi",
  au: "en",
  de: "de",
  fr: "fr",
  ca: "en",
  sg: "en",
  ch: "de",
};

interface DomainInputProps {
  onSubmit: (domain: string, region: RegionCode, language: LanguageCode) => void;
  isLoading: boolean;
  disabled: boolean;
}

function extractTLD(domain: string): string {
  const cleaned = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  const parts = cleaned.split(".");
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join(".");
    if (TLD_TO_REGION[lastTwo]) return lastTwo;
  }
  return parts[parts.length - 1] || "com";
}

function detectRegionFromDomain(domain: string): RegionCode {
  const tld = extractTLD(domain);
  return TLD_TO_REGION[tld] || "us";
}

export function DomainInput({ onSubmit, isLoading, disabled }: DomainInputProps) {
  const [domain, setDomain] = useState("");
  const [region, setRegion] = useState<RegionCode>("us");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [error, setError] = useState<string | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    if (domain.trim()) {
      const detectedRegion = detectRegionFromDomain(domain);
      if (detectedRegion !== "us" || domain.includes(".com") || domain.includes(".us")) {
        setRegion(detectedRegion);
        setLanguage(REGION_TO_LANGUAGE[detectedRegion]);
        setAutoDetected(true);
      }
    }
  }, [domain]);

  const validateDomain = (value: string): boolean => {
    if (!value.trim()) {
      setError("Please enter a domain or URL");
      return false;
    }
    const domainRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!domainRegex.test(value)) {
      setError("Please enter a valid domain (e.g., example.com)");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDomain(domain)) {
      onSubmit(domain, region, language);
    }
  };

  const handleRegionChange = (value: RegionCode) => {
    setRegion(value);
    setLanguage(REGION_TO_LANGUAGE[value]);
    setAutoDetected(false);
  };

  return (
    <Card className="max-w-2xl mx-auto" data-tour="domain-input">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Globe2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Analyze Your Domain</h2>
          <p className="text-muted-foreground text-sm">
            Enter a domain or URL to generate 100+ LLM-optimized search queries
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter domain (e.g., example.de, example.co.uk)"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                if (error) setError(null);
              }}
              className="pl-10 h-12 text-base font-mono"
              disabled={disabled}
              data-testid="input-domain"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5" data-tour="region-selector">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Target Region
                {autoDetected && domain && (
                  <span className="text-xs text-muted-foreground">(auto-detected)</span>
                )}
              </label>
              <Select value={region} onValueChange={handleRegionChange} disabled={disabled}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([code, name]) => (
                    <SelectItem key={code} value={code} data-testid={`region-option-${code}`}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5" data-tour="language-selector">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                Output Language
              </label>
              <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)} disabled={disabled}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code} data-testid={`language-option-${code}`}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="text-domain-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12"
            disabled={disabled || !domain.trim()}
            data-testid="button-start-analysis"
            data-tour="analyze-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Analysis typically takes 2-3 minutes to complete
        </p>
      </CardContent>
    </Card>
  );
}
