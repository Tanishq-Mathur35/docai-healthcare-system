import { useState } from 'react';
import { PastCondition } from '@/types/consultation.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, History, Sparkles } from 'lucide-react';

interface PreviousConditionsSidebarProps {
  conditions: PastCondition[];
  onSetRelevance: (conditionId: string, relevance: 'RELEVANT' | 'NOT_RELEVANT') => void;
  disabled?: boolean;
}

export function PreviousConditionsSidebar({
  conditions,
  onSetRelevance,
  disabled,
}: PreviousConditionsSidebarProps) {
  const [relevanceMap, setRelevanceMap] = useState<Record<string, 'RELEVANT' | 'NOT_RELEVANT'>>({});

  const handleSelect = (id: string, relevance: 'RELEVANT' | 'NOT_RELEVANT') => {
    setRelevanceMap((prev) => ({ ...prev, [id]: relevance }));
    onSetRelevance(id, relevance);
  };

  if (conditions.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Past Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No previous conditions recorded on your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm">Related Condition Check</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Are any of your past conditions related to today&apos;s symptoms?
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {conditions.map((c) => {
          const selected = relevanceMap[c.id];
          return (
            <div key={c.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{c.conditionName}</p>
                  <p className="text-xs text-muted-foreground">{c.conditionType}</p>
                </div>
              </div>
              {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant={selected === 'RELEVANT' ? 'default' : 'outline'}
                  className="h-7 text-xs flex-1"
                  disabled={disabled}
                  onClick={() => handleSelect(c.id, 'RELEVANT')}
                >
                  <Check className="h-3 w-3 mr-1" /> Related
                </Button>
                <Button
                  size="sm"
                  variant={selected === 'NOT_RELEVANT' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs flex-1"
                  disabled={disabled}
                  onClick={() => handleSelect(c.id, 'NOT_RELEVANT')}
                >
                  <X className="h-3 w-3 mr-1" /> Not Related
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
