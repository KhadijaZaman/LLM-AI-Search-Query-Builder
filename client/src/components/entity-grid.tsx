import { useState } from "react";
import { Plus, X, Check, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EntityCategory } from "@shared/schema";

interface EntityGridProps {
  entities: EntityCategory[];
  domain: string;
  stepNumber: number;
  onUpdate?: (entities: EntityCategory[]) => void;
}

const categoryMapping: Record<string, string> = {
  "Core Features": "Core Features",
  "Products/Services": "Products/Services",
  "Value Propositions": "Value Propositions",
  "Use Cases": "Use Cases",
  "Target Industries": "Target Industries",
  "User Types/Roles": "User Types/Roles",
  "Technical Attributes": "Technical Attributes",
  "Competitor Keywords": "Competitors",
};

export function EntityGrid({ entities, domain, stepNumber, onUpdate }: EntityGridProps) {
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

  const gridCategories = [
    { title: "Core Features", key: "Core Features" },
    { title: "Products/Services", key: "Products/Services" },
    { title: "Value Propositions", key: "Value Propositions" },
    { title: "Use Cases", key: "Use Cases" },
    { title: "Target Industries", key: "Target Industries" },
    { title: "User Types/Roles", key: "User Types/Roles" },
  ];

  const getCategoryData = (key: string) => {
    return entities.find(e => 
      e.category === key || 
      e.category.toLowerCase().includes(key.toLowerCase().split('/')[0]) ||
      categoryMapping[e.category] === key
    );
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Entity Extraction</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Identified core concepts from {domain}
          </p>
        </div>
        <span className="text-sm text-primary font-medium">Step {stepNumber} of 10</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map((category, catIdx) => (
          <div key={catIdx} className="border rounded-lg p-4 bg-background">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">{category.category}</h3>
              {onUpdate && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => handleAddItem(catIdx)}
                  data-testid={`button-add-entity-${catIdx}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item, itemIdx) => (
                <EditablePill
                  key={itemIdx}
                  value={item}
                  onSave={(newValue) => handleEditItem(catIdx, itemIdx, newValue)}
                  onDelete={() => handleDeleteItem(catIdx, itemIdx)}
                  editable={!!onUpdate}
                  testId={`entity-${catIdx}-${itemIdx}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditablePill({
  value,
  onSave,
  onDelete,
  editable = true,
  testId,
}: {
  value: string;
  onSave: (value: string) => void;
  onDelete: () => void;
  editable?: boolean;
  testId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (isEditing && editable) {
    return (
      <div className="inline-flex items-center gap-1 bg-muted rounded-full px-2 py-1">
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
        <button
          className="p-0.5 hover:bg-muted-foreground/10 rounded"
          onClick={() => {
            onSave(editValue);
            setIsEditing(false);
          }}
        >
          <Check className="w-3 h-3 text-green-600" />
        </button>
        <button
          className="p-0.5 hover:bg-muted-foreground/10 rounded"
          onClick={() => {
            setEditValue(value);
            setIsEditing(false);
          }}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border bg-background text-sm cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={() => editable && setIsEditing(true)}
      data-testid={testId}
    >
      {value}
      {editable && (
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </span>
  );
}
