'use client';

import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

type Visitor = {
  id: string;
  name: string;
};

interface VisitorAttendanceListProps {
  visitors: Visitor[];
  selectedVisitorIds: string[];
  onToggle: (visitorId: string, checked: boolean) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export function VisitorAttendanceList({
  visitors,
  selectedVisitorIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: VisitorAttendanceListProps) {
  const selectedCount = selectedVisitorIds.length;
  const totalCount = visitors.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" />
          Visitantes
          {totalCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">
              {selectedCount} de {totalCount}
            </span>
          )}
        </h3>
        {totalCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={allSelected ? onDeselectAll : onSelectAll}
          >
            {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {visitors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum visitante ativo encontrado; visitantes podem ser cadastrados na área de pessoas.
          </p>
        ) : (
          visitors.map((visitor) => {
            const isChecked = selectedVisitorIds.includes(visitor.id);
            return (
              <div key={visitor.id} className="flex items-center space-x-2 rounded-lg border p-3">
                <Checkbox
                  id={`visitor-${visitor.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(visitor.id, Boolean(checked))}
                />
                <label htmlFor={`visitor-${visitor.id}`} className="flex-1 cursor-pointer text-sm font-medium leading-none">
                  {visitor.name}
                </label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
