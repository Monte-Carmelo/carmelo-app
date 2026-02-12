'use client';

import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type Visitor = {
  id: string;
  name: string;
};

interface VisitorAttendanceListProps {
  visitors: Visitor[];
  selectedVisitorIds: string[];
  onToggle: (visitorId: string, checked: boolean) => void;
}

export function VisitorAttendanceList({
  visitors,
  selectedVisitorIds,
  onToggle,
}: VisitorAttendanceListProps) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4" />
        Visitantes
      </h3>
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
