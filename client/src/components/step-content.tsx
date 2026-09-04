import { useState } from "react";
import { Plus, X, Check, Edit2, Trash2, Building2, Tag, Target, Briefcase, Lightbulb, Users, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { 
  Analysis, 
  EntityCategory, 
  PainPoint, 
  JTBD, 
  GoalsFramework, 
  Persona,
  SemanticExpansion,
  KnowledgeGraph,
} from "@shared/schema";

interface StepContentProps {
  step: number;
  analysis: Analysis;
  onUpdate: (updates: Partial<Analysis>) => void;
}

const STEP_TITLES = [
  { title: "Domain Analysis", icon: Building2, description: "Website and business context" },
  { title: "Entity Extraction", icon: Tag, description: "Core concepts and keywords" },
  { title: "Semantic Expansion", icon: GitBranch, description: "Related terms and synonyms" },
  { title: "Knowledge Graph", icon: GitBranch, description: "Entity relationships" },
  { title: "Pain Points", icon: Target, description: "User frustrations and challenges" },
  { title: "Jobs-to-be-Done", icon: Briefcase, description: "User motivations and goals" },
  { title: "Goals Framework", icon: Lightbulb, description: "Short and long-term objectives" },
  { title: "Personas", icon: Users, description: "Target audience profiles" },
  { title: "Generated Queries", icon: Tag, description: "Search queries for LLM visibility" },
];

export function StepContent({ step, analysis, onUpdate }: StepContentProps) {
  const stepInfo = STEP_TITLES[step];
  const Icon = stepInfo.icon;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {stepInfo.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{stepInfo.description}</p>
      </CardHeader>
      <CardContent>
        {step === 0 && <DomainContent analysis={analysis} onUpdate={onUpdate} />}
        {step === 1 && <EntitiesContent entities={analysis.entities || []} onUpdate={(entities) => onUpdate({ entities })} />}
        {step === 2 && <SemanticExpansionContent expansion={analysis.semanticExpansion} />}
        {step === 3 && <KnowledgeGraphContent graph={analysis.knowledgeGraph} />}
        {step === 4 && <PainPointsContent painPoints={analysis.painPoints || []} onUpdate={(painPoints) => onUpdate({ painPoints })} />}
        {step === 5 && <JTBDContent jtbd={analysis.jtbd || []} onUpdate={(jtbd) => onUpdate({ jtbd })} />}
        {step === 6 && <GoalsContent goals={analysis.goals} onUpdate={(goals) => onUpdate({ goals })} />}
        {step === 7 && <PersonasContent personas={analysis.personas || []} onUpdate={(personas) => onUpdate({ personas })} />}
        {step === 8 && <QueriesPreview analysis={analysis} />}
      </CardContent>
    </Card>
  );
}

function DomainContent({ analysis, onUpdate }: { analysis: Analysis; onUpdate: (updates: Partial<Analysis>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(analysis.domainAnalysis);
  const da = analysis.domainAnalysis;

  if (!da) {
    return <p className="text-sm text-muted-foreground">Domain analysis not available yet.</p>;
  }

  const handleSave = () => {
    if (editData) {
      onUpdate({ domainAnalysis: editData });
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Definition</label>
          <Textarea
            value={editData?.definition || ""}
            onChange={(e) => setEditData(prev => prev ? { ...prev, definition: e.target.value } : prev)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Product Offering</label>
          <Textarea
            value={editData?.productOffering || ""}
            onChange={(e) => setEditData(prev => prev ? { ...prev, productOffering: e.target.value } : prev)}
            className="mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => { setEditData(da); setIsEditing(true); }}>
          <Edit2 className="w-3 h-3 mr-1" /> Edit
        </Button>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-1">Definition</h4>
        <p className="text-sm text-muted-foreground">{da.definition}</p>
      </div>
      {da.productOffering && (
        <div>
          <h4 className="text-sm font-medium mb-1">Product Offering</h4>
          <p className="text-sm text-muted-foreground">{da.productOffering}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {da.industry && (
          <div>
            <h4 className="text-sm font-medium mb-1">Industry</h4>
            <Badge variant="secondary">{da.industry}</Badge>
          </div>
        )}
        {da.marketMaturity && (
          <div>
            <h4 className="text-sm font-medium mb-1">Market Maturity</h4>
            <Badge variant="outline">{da.marketMaturity}</Badge>
          </div>
        )}
      </div>
      {da.competitors && da.competitors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Competitors</h4>
          <div className="flex flex-wrap gap-1.5">
            {da.competitors.map((c, i) => (
              <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EntitiesContent({ 
  entities, 
  onUpdate,
}: { 
  entities: EntityCategory[]; 
  onUpdate: (entities: EntityCategory[]) => void;
}) {
  const handleEditItem = (catIdx: number, itemIdx: number, newValue: string) => {
    const updated = [...entities];
    updated[catIdx].items[itemIdx] = newValue;
    onUpdate(updated);
  };

  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    const updated = [...entities];
    updated[catIdx].items.splice(itemIdx, 1);
    onUpdate(updated);
  };

  const handleAddItem = (catIdx: number) => {
    const updated = [...entities];
    updated[catIdx].items.push("New Entity");
    onUpdate(updated);
  };

  if (entities.length === 0) {
    return <p className="text-sm text-muted-foreground">Entities not available yet.</p>;
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map((category, catIdx) => (
          <div key={catIdx} className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">{category.category}</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={() => handleAddItem(catIdx)}
                data-testid={`button-add-entity-${catIdx}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item, itemIdx) => (
                <EditablePill
                  key={itemIdx}
                  value={item}
                  onSave={(newValue) => handleEditItem(catIdx, itemIdx, newValue)}
                  onDelete={() => handleDeleteItem(catIdx, itemIdx)}
                  testId={`entity-${catIdx}-${itemIdx}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function EditablePill({
  value,
  onSave,
  onDelete,
  testId,
}: {
  value: string;
  onSave: (value: string) => void;
  onDelete: () => void;
  testId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1 bg-background border rounded-full px-2 py-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-5 text-xs w-24 px-1 border-0 bg-transparent focus-visible:ring-0"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(editValue);
              setIsEditing(false);
            } else if (e.key === "Escape") {
              setEditValue(value);
              setIsEditing(false);
            }
          }}
        />
        <button className="p-0.5" onClick={() => { onSave(editValue); setIsEditing(false); }}>
          <Check className="w-3 h-3 text-green-600" />
        </button>
        <button className="p-0.5" onClick={() => { setEditValue(value); setIsEditing(false); }}>
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border bg-background text-sm cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={() => setIsEditing(true)}
      data-testid={testId}
    >
      {value}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
      </button>
    </span>
  );
}

function SemanticExpansionContent({ expansion }: { expansion?: SemanticExpansion }) {
  if (!expansion) {
    return <p className="text-sm text-muted-foreground">Semantic expansion not available yet.</p>;
  }

  const expansionEntries = Object.entries(expansion.expansions || {});

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {expansionEntries.map(([key, values], idx) => (
          <div key={idx}>
            <h4 className="text-sm font-medium mb-2">{key}</h4>
            <div className="flex flex-wrap gap-2">
              {values.map((v, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
              ))}
            </div>
          </div>
        ))}
        {expansion.triples && expansion.triples.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Knowledge Triples</h4>
            <div className="space-y-1">
              {expansion.triples.slice(0, 10).map((triple, i) => (
                <div key={i} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{triple.entity}</span>
                  {" → "}
                  <span className="text-primary">{triple.attribute}</span>
                  {" → "}
                  <span className="font-medium text-foreground">{triple.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function KnowledgeGraphContent({ graph }: { graph?: KnowledgeGraph }) {
  if (!graph) {
    return <p className="text-sm text-muted-foreground">Knowledge graph not available yet.</p>;
  }

  const categoryNodes = graph.nodes.filter(n => n.type === "category");
  const entityNodes = graph.nodes.filter(n => n.type === "entity");

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Categories ({categoryNodes.length})</h4>
          <div className="flex flex-wrap gap-2">
            {categoryNodes.map((node, i) => (
              <Badge key={i} variant="secondary">{node.label}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Entities ({entityNodes.length})</h4>
          <div className="flex flex-wrap gap-2">
            {entityNodes.slice(0, 20).map((node, i) => (
              <Badge key={i} variant="outline" className="text-xs">{node.label}</Badge>
            ))}
            {entityNodes.length > 20 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{entityNodes.length - 20} more
              </Badge>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Relationships ({graph.edges.length})</h4>
          <div className="space-y-1">
            {graph.edges.slice(0, 10).map((edge, i) => {
              const fromNode = graph.nodes.find(n => n.id === edge.from);
              const toNode = graph.nodes.find(n => n.id === edge.to);
              return (
                <div key={i} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{fromNode?.label || edge.from}</span>
                  {" → "}
                  <span className="text-primary">{edge.relationship}</span>
                  {" → "}
                  <span className="font-medium text-foreground">{toNode?.label || edge.to}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function PainPointsContent({ 
  painPoints, 
  onUpdate 
}: { 
  painPoints: PainPoint[]; 
  onUpdate: (painPoints: PainPoint[]) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const handleUpdate = (idx: number, updates: Partial<PainPoint>) => {
    const updated = [...painPoints];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate(updated);
  };

  const handleDelete = (idx: number) => {
    onUpdate(painPoints.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    onUpdate([...painPoints, { type: "Functional", symptom: "New pain point", root: "", impact: "" }]);
  };

  if (painPoints.length === 0) {
    return <p className="text-sm text-muted-foreground">Pain points not available yet.</p>;
  }

  const typeColors: Record<string, string> = {
    Functional: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Emotional: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    Operational: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    Financial: "bg-green-500/10 text-green-600 dark:text-green-400",
    Strategic: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-3">
          {painPoints.map((pp, idx) => (
            <div key={idx} className="p-3 rounded-md bg-muted/50 space-y-2 group">
              {editingIdx === idx ? (
                <div className="space-y-2">
                  <Input
                    value={pp.symptom}
                    onChange={(e) => handleUpdate(idx, { symptom: e.target.value })}
                    placeholder="Symptom"
                  />
                  <Input
                    value={pp.impact}
                    onChange={(e) => handleUpdate(idx, { impact: e.target.value })}
                    placeholder="Impact"
                  />
                  <Button size="sm" onClick={() => setEditingIdx(null)}>
                    <Check className="w-3 h-3 mr-1" /> Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${typeColors[pp.type] || ""}`} variant="secondary">
                      {pp.type}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingIdx(idx)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(idx)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{pp.symptom}</p>
                  {pp.impact && <p className="text-xs text-muted-foreground">{pp.impact}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function JTBDContent({ 
  jtbd, 
  onUpdate 
}: { 
  jtbd: JTBD[]; 
  onUpdate: (jtbd: JTBD[]) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const handleUpdate = (idx: number, updates: Partial<JTBD>) => {
    const updated = [...jtbd];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate(updated);
  };

  const handleDelete = (idx: number) => {
    onUpdate(jtbd.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    onUpdate([...jtbd, { audience: "Target audience", situation: "", motivation: "User wants to", success: "" }]);
  };

  if (jtbd.length === 0) {
    return <p className="text-sm text-muted-foreground">JTBD not available yet.</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-3">
          {jtbd.map((job, idx) => (
            <div key={idx} className="p-3 rounded-md bg-muted/50 space-y-2 group">
              {editingIdx === idx ? (
                <div className="space-y-2">
                  <Input
                    value={job.audience}
                    onChange={(e) => handleUpdate(idx, { audience: e.target.value })}
                    placeholder="Audience"
                  />
                  <Input
                    value={job.motivation}
                    onChange={(e) => handleUpdate(idx, { motivation: e.target.value })}
                    placeholder="Motivation"
                  />
                  <Input
                    value={job.success}
                    onChange={(e) => handleUpdate(idx, { success: e.target.value })}
                    placeholder="Success criteria"
                  />
                  <Button size="sm" onClick={() => setEditingIdx(null)}>
                    <Check className="w-3 h-3 mr-1" /> Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{job.audience}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingIdx(idx)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(idx)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{job.motivation}</p>
                  {job.success && <p className="text-xs text-muted-foreground">Success: {job.success}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function GoalsContent({ 
  goals, 
  onUpdate 
}: { 
  goals?: GoalsFramework; 
  onUpdate: (goals: GoalsFramework) => void;
}) {
  if (!goals) {
    return <p className="text-sm text-muted-foreground">Goals framework not available yet.</p>;
  }

  const renderSection = (title: string, items: { goal: string; metric: string }[] = []) => (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="p-2 bg-muted/50 rounded text-sm">
            <p className="font-medium">{item.goal}</p>
            {item.metric && <p className="text-xs text-muted-foreground">Metric: {item.metric}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-4">
        {renderSection("Immediate Goals", goals.immediate)}
        {renderSection("Short-term Goals", goals.shortTerm)}
        {renderSection("Long-term Goals", goals.longTerm)}
      </div>
    </ScrollArea>
  );
}

function PersonasContent({ 
  personas, 
  onUpdate 
}: { 
  personas: Persona[]; 
  onUpdate: (personas: Persona[]) => void;
}) {
  if (personas.length === 0) {
    return <p className="text-sm text-muted-foreground">Personas not available yet.</p>;
  }

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-4">
        {personas.map((persona, idx) => (
          <div key={idx} className="p-4 rounded-md bg-muted/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{persona.name}</h4>
                <p className="text-xs text-muted-foreground">{persona.role}</p>
              </div>
            </div>
            {persona.demographics && (
              <p className="text-sm text-muted-foreground mb-2">{persona.demographics}</p>
            )}
            {persona.goal && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">{persona.goal}</Badge>
              </div>
            )}
            {persona.painPoints && persona.painPoints.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {persona.painPoints.map((pp, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{pp}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function QueriesPreview({ analysis }: { analysis: Analysis }) {
  const queries = analysis.queries || [];
  
  return (
    <div className="text-center py-8">
      <p className="text-2xl font-bold text-primary">{queries.length}</p>
      <p className="text-sm text-muted-foreground">queries generated</p>
      <p className="text-xs text-muted-foreground mt-2">
        View the full query table below
      </p>
    </div>
  );
}
