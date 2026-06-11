'use client';

import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

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
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          <Users className="h-4 w-4 text-brand-soft-fg" />
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
      {visitors.length === 0 ? (
        <div className="rounded-xl bg-paper-deep px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Nenhum visitante ativo encontrado; visitantes podem ser cadastrados na área de pessoas.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-inset-border [&>*+*]:border-t [&>*+*]:border-divider">
          {visitors.map((visitor) => {
            const isChecked = selectedVisitorIds.includes(visitor.id);
            return (
              <div
                key={visitor.id}
                className="flex items-center gap-3 px-4 py-3 transition-all duration-fast ease-out-soft hover:bg-paper/60"
              >
                <label
                  htmlFor={`visitor-${visitor.id}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                >
                  <Avatar soft="sage" name={visitor.name} size="sm" />
                  <span className="block min-w-0 flex-1 truncate text-[14.5px] font-bold leading-tight text-foreground">
                    {visitor.name}
                  </span>
                </label>
                <Checkbox
                  id={`visitor-${visitor.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(visitor.id, Boolean(checked))}
                  className="h-[26px] w-[26px] rounded-[7px] border-[1.5px] border-slate-300 bg-white shadow-none transition-all duration-fast data-[state=checked]:border-brand data-[state=checked]:bg-brand"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
