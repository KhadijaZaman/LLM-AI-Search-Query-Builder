import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GeneratedQuery, QueryIntent } from "@shared/schema";

interface QueryListProps {
  queries: GeneratedQuery[];
  region: string;
  onExport?: () => void;
}

const intentStyles: Record<QueryIntent, string> = {
  Informational: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Commercial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Transactional: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
};

const funnelStageMapping: Record<string, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  decision: "Decision",
  retention: "Retention",
};

export function QueryList({ queries, region, onExport }: QueryListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => 
      q.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [queries, searchTerm]);

  const stats = useMemo(() => {
    const total = queries.length;
    return { total };
  }, [queries]);

  return (
    <div className="bg-card border rounded-lg" data-tour="query-list">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Generated Queries</span>
          </div>

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 border-b bg-muted/30">
        <div className="text-sm">
          <span className="font-medium">{stats.total}</span>{" "}
          <span className="text-muted-foreground">intent-tagged search queries for SEO/Content</span>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-queries"
          />
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_150px] gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
          <div>QUERY</div>
          <div>INTENT</div>
          <div>FUNNEL</div>
          <div>SOURCE / ICP & JTBD</div>
        </div>

        <ScrollArea className="h-[500px]">
          {filteredQueries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No queries match your search</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredQueries.map((query, idx) => (
                <QueryRow key={idx} query={query} idx={idx} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function QueryRow({ query, idx }: { query: GeneratedQuery; idx: number }) {
  const funnelLabel = query.funnelStage 
    ? funnelStageMapping[query.funnelStage] || query.funnelStage 
    : "Awareness";

  return (
    <div 
      className="grid grid-cols-[1fr_120px_100px_150px] gap-4 px-4 py-4 hover:bg-muted/30 transition-colors items-start"
      data-testid={`query-row-${idx}`}
    >
      <div className="min-w-0">
        <div>
          <p className="text-sm font-medium leading-relaxed">{query.query}</p>
          {query.jtbdMatch && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              JTBD: {query.jtbdMatch}
            </p>
          )}
        </div>
      </div>
      
      <div>
        <Badge 
          variant="outline" 
          className={`text-xs font-medium ${intentStyles[query.intent] || intentStyles.Informational}`}
        >
          {query.intent}
        </Badge>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {funnelLabel}
      </div>
      
      <div className="text-sm text-muted-foreground">
        {query.source === "pain-point" ? "Pain-Point" : 
         query.source === "goal" ? "Goal" : 
         query.source === "branded" ? "Branded" :
         query.source || "Generic"}
      </div>
    </div>
  );
}
