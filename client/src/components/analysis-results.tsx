import { useState } from "react";
import {
  Users,
  Target,
  Briefcase,
  Lightbulb,
  Building2,
  ChevronDown,
  ChevronUp,
  Tag,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Analysis, EntityCategory, PainPoint, JTBD, GoalsFramework, Persona } from "@shared/schema";

interface AnalysisResultsProps {
  analysis: Analysis;
  onUpdate?: (updates: Partial<Analysis>) => void;
}

export function AnalysisResults({ analysis, onUpdate }: AnalysisResultsProps) {
  return (
    <div className="space-y-4">
      {analysis.domainAnalysis && (
        <DomainOverviewCard analysis={analysis} />
      )}
      {analysis.entities && (
        <EntitiesCard 
          entities={analysis.entities} 
          onUpdate={(entities) => onUpdate?.({ entities })}
        />
      )}
      {analysis.painPoints && (
        <PainPointsCard 
          painPoints={analysis.painPoints}
          onUpdate={(painPoints) => onUpdate?.({ painPoints })}
        />
      )}
      {analysis.jtbd && (
        <JTBDCard 
          jtbd={analysis.jtbd}
          onUpdate={(jtbd) => onUpdate?.({ jtbd })}
        />
      )}
      {analysis.goals && (
        <GoalsCard 
          goals={analysis.goals}
          onUpdate={(goals) => onUpdate?.({ goals })}
        />
      )}
      {analysis.personas && (
        <PersonasCard 
          personas={analysis.personas}
          onUpdate={(personas) => onUpdate?.({ personas })}
        />
      )}
    </div>
  );
}

function DomainOverviewCard({ analysis }: { analysis: Analysis }) {
  const [isOpen, setIsOpen] = useState(true);
  const da = analysis.domainAnalysis;
  if (!da) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-md">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Domain Overview
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
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
                    <Badge key={i} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function EntitiesCard({ 
  entities, 
  onUpdate 
}: { 
  entities: EntityCategory[]; 
  onUpdate?: (entities: EntityCategory[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEditItem = (catIdx: number, itemIdx: number, newValue: string) => {
    const updated = [...entities];
    updated[catIdx].items[itemIdx] = newValue;
    onUpdate?.(updated);
  };

  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    const updated = [...entities];
    updated[catIdx].items.splice(itemIdx, 1);
    onUpdate?.(updated);
  };

  const handleAddItem = (catIdx: number) => {
    const updated = [...entities];
    updated[catIdx].items.push("New Entity");
    onUpdate?.(updated);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-md">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Entities ({entities.reduce((acc, e) => acc + e.items.length, 0)})
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {entities.map((category, catIdx) => (
                  <div key={catIdx}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{category.category}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItem(catIdx);
                        }}
                        data-testid={`button-add-entity-${catIdx}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {category.items.map((item, itemIdx) => (
                        <EditableBadge
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
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function EditableBadge({
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
      <div className="inline-flex items-center gap-1 bg-muted rounded-md p-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-6 text-xs w-32"
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
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={() => {
            onSave(editValue);
            setIsEditing(false);
          }}
        >
          <Check className="w-3 h-3 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={() => {
            setEditValue(value);
            setIsEditing(false);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="text-xs group cursor-pointer hover-elevate"
      onClick={() => setIsEditing(true)}
      data-testid={testId}
    >
      {value}
      <button
        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}

function PainPointsCard({ 
  painPoints,
  onUpdate,
}: { 
  painPoints: PainPoint[];
  onUpdate?: (painPoints: PainPoint[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const typeColors: Record<string, string> = {
    Functional: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Emotional: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    Operational: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    Financial: "bg-green-500/10 text-green-600 dark:text-green-400",
    Strategic: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const handleUpdate = (idx: number, updates: Partial<PainPoint>) => {
    const updated = [...painPoints];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate?.(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = painPoints.filter((_, i) => i !== idx);
    onUpdate?.(updated);
  };

  const handleAdd = () => {
    onUpdate?.([...painPoints, {
      type: "Functional",
      symptom: "New pain point",
      root: "Root cause",
      impact: "Impact description",
    }]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-md">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Pain Points ({painPoints.length})
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex justify-end mb-2">
              <Button size="sm" variant="outline" onClick={handleAdd} data-testid="button-add-painpoint">
                <Plus className="w-3 h-3 mr-1" />
                Add Pain Point
              </Button>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {painPoints.map((pp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-muted/50 space-y-2 group"
                    data-testid={`painpoint-item-${idx}`}
                  >
                    {editingIdx === idx ? (
                      <div className="space-y-2">
                        <Input
                          value={pp.symptom}
                          onChange={(e) => handleUpdate(idx, { symptom: e.target.value })}
                          placeholder="Symptom"
                          className="text-sm"
                        />
                        <Input
                          value={pp.impact}
                          onChange={(e) => handleUpdate(idx, { impact: e.target.value })}
                          placeholder="Impact"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditingIdx(null)}>
                            <Check className="w-3 h-3 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs ${typeColors[pp.type] || "bg-muted"}`}
                            variant="secondary"
                          >
                            {pp.type}
                          </Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setEditingIdx(idx)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDelete(idx)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{pp.symptom}</p>
                        <p className="text-xs text-muted-foreground">{pp.impact}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function JTBDCard({ 
  jtbd,
  onUpdate,
}: { 
  jtbd: JTBD[];
  onUpdate?: (jtbd: JTBD[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const handleUpdate = (idx: number, updates: Partial<JTBD>) => {
    const updated = [...jtbd];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate?.(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = jtbd.filter((_, i) => i !== idx);
    onUpdate?.(updated);
  };

  const handleAdd = () => {
    onUpdate?.([...jtbd, {
      audience: "Target audience",
      situation: "When situation occurs",
      motivation: "User wants to achieve",
      success: "Success criteria",
    }]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-md">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Jobs-to-be-Done ({jtbd.length})
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex justify-end mb-2">
              <Button size="sm" variant="outline" onClick={handleAdd} data-testid="button-add-jtbd">
                <Plus className="w-3 h-3 mr-1" />
                Add JTBD
              </Button>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {jtbd.map((job, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-muted/50 space-y-2 group"
                    data-testid={`jtbd-item-${idx}`}
                  >
                    {editingIdx === idx ? (
                      <div className="space-y-2">
                        <Input
                          value={job.audience}
                          onChange={(e) => handleUpdate(idx, { audience: e.target.value })}
                          placeholder="Audience"
                          className="text-sm"
                        />
                        <Input
                          value={job.motivation}
                          onChange={(e) => handleUpdate(idx, { motivation: e.target.value })}
                          placeholder="Motivation"
                          className="text-sm"
                        />
                        <Input
                          value={job.success}
                          onChange={(e) => handleUpdate(idx, { success: e.target.value })}
                          placeholder="Success criteria"
                          className="text-sm"
                        />
                        <Button size="sm" onClick={() => setEditingIdx(null)}>
                          <Check className="w-3 h-3 mr-1" />
                          Done
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {job.audience}
                          </Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setEditingIdx(idx)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDelete(idx)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{job.motivation}</p>
                        <p className="text-xs text-muted-foreground">Success: {job.success}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function GoalsCard({ 
  goals,
  onUpdate,
}: { 
  goals: GoalsFramework;
  onUpdate?: (goals: GoalsFramework) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const updateGoalsList = (key: keyof GoalsFramework, newGoals: any[]) => {
    onUpdate?.({ ...goals, [key]: newGoals });
  };

  const renderGoalSection = (title: string, key: "immediate" | "shortTerm" | "longTerm", items: { goal: string; metric: string }[] = []) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium">{title}</h5>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateGoalsList(key, [...items, { goal: "New goal", metric: "Metric" }])}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <EditableGoalItem
            key={idx}
            goal={item}
            onUpdate={(updated) => {
              const newItems = [...items];
              newItems[idx] = updated;
              updateGoalsList(key, newItems);
            }}
            onDelete={() => {
              updateGoalsList(key, items.filter((_, i) => i !== idx));
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-md">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Goals Framework
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {renderGoalSection("Immediate Goals", "immediate", goals.immediate)}
                {renderGoalSection("Short-term Goals", "shortTerm", goals.shortTerm)}
                {renderGoalSection("Long-term Goals", "longTerm", goals.longTerm)}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function EditableGoalItem({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: { goal: string; metric: string };
  onUpdate: (goal: { goal: string; metric: string }) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editGoal, setEditGoal] = useState(goal.goal);
  const [editMetric, setEditMetric] = useState(goal.metric);

  if (isEditing) {
    return (
      <div className="p-2 bg-muted/50 rounded-md space-y-2">
        <Input
          value={editGoal}
          onChange={(e) => setEditGoal(e.target.value)}
          placeholder="Goal"
          className="text-sm"
        />
        <Input
          value={editMetric}
          onChange={(e) => setEditMetric(e.target.value)}
          placeholder="Metric"
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onUpdate({ goal: editGoal, metric: editMetric });
              setIsEditing(false);
            }}
          >
            <Check className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditGoal(goal.goal);
              setEditMetric(goal.metric);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-muted/30 rounded-md flex items-center justify-between group">
      <div>
        <p className="text-sm">{goal.goal}</p>
        <p className="text-xs text-muted-foreground">{goal.metric}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-3 h-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function PersonasCard({ 
  personas,
  onUpdate,
}: { 
  personas: Persona[];
  onUpdate?: (personas: Persona[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const handleUpdate = (idx: number, updates: Partial<Persona>) => {
    const updated = [...personas];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate?.(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = personas.filter((_, i) => i !== idx);
    onUpdate?.(updated);
  };

  const handleAdd = () => {
    onUpdate?.([...personas, {
      name: "New Persona",
      role: "Role/Title",
      goal: "Main goal",
    }]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-md">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Personas ({personas.length})
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex justify-end mb-2">
              <Button size="sm" variant="outline" onClick={handleAdd} data-testid="button-add-persona">
                <Plus className="w-3 h-3 mr-1" />
                Add Persona
              </Button>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {personas.map((persona, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-md bg-muted/50 space-y-3 group"
                    data-testid={`persona-item-${idx}`}
                  >
                    {editingIdx === idx ? (
                      <div className="space-y-2">
                        <Input
                          value={persona.name}
                          onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                          placeholder="Name"
                          className="text-sm"
                        />
                        <Input
                          value={persona.role}
                          onChange={(e) => handleUpdate(idx, { role: e.target.value })}
                          placeholder="Role"
                          className="text-sm"
                        />
                        <Textarea
                          value={persona.goal}
                          onChange={(e) => handleUpdate(idx, { goal: e.target.value })}
                          placeholder="Goal"
                          className="text-sm"
                        />
                        <Button size="sm" onClick={() => setEditingIdx(null)}>
                          <Check className="w-3 h-3 mr-1" />
                          Done
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{persona.name}</h4>
                            <p className="text-sm text-muted-foreground">{persona.role}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setEditingIdx(idx)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDelete(idx)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{persona.goal}</p>
                        {persona.quotes && persona.quotes.length > 0 && (
                          <blockquote className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                            "{persona.quotes[0]}"
                          </blockquote>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
