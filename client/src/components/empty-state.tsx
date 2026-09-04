import { Search, Sparkles, BarChart2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  const features = [
    {
      icon: Search,
      title: "Domain Analysis",
      description: "Deep-dive into any brand or product website to extract key insights",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Queries",
      description: "Generate 100+ natural search queries optimized for LLM visibility",
    },
    {
      icon: BarChart2,
      title: "Intent Classification",
      description: "Categorize queries by intent: Informational, Commercial, Transactional",
    },
    {
      icon: FileText,
      title: "CSV Export",
      description: "Export results with query, topic, intent, and region data",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Ready to Analyze</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Enter a domain above to start generating LLM-optimized search queries.
          Our 9-step AI pipeline will analyze the brand and create targeted queries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="hover-elevate transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Powered by OpenAI GPT-5 and SERP API for comprehensive market intelligence
        </p>
      </div>
    </div>
  );
}
