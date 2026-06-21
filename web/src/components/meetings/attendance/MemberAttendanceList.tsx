'use client';

import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { translateRole } from '@/lib/role-translations';
import type { Database } from '@/lib/supabase/types';

type Member = {
  id: string;
  name: string;
  role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
};

interface MemberAttendanceListProps {
  members: Member[];
  selectedMemberIds: string[];
  onToggle: (memberId: string, checked: boolean) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export function MemberAttendanceList({
  members,
  selectedMemberIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: MemberAttendanceListProps) {
  const selectedCount = selectedMemberIds.length;
  const totalCount = members.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          <Users className="h-4 w-4 text-brand-soft-fg" />
          Membros
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
      {members.length === 0 ? (
        <div className="rounded-xl bg-paper-deep px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Selecione um GC para carregar a lista de membros e líderes.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-inset-border [&>*+*]:border-t [&>*+*]:border-divider">
          {members.map((member) => {
            const isChecked = selectedMemberIds.includes(member.id);
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 transition-all duration-fast ease-out-soft hover:bg-paper/60"
              >
                <label
                  htmlFor={`member-${member.id}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                >
                  <Avatar name={member.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold leading-tight text-foreground">
                      {member.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {translateRole(member.role)}
                    </span>
                  </span>
                </label>
                <Checkbox
                  id={`member-${member.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(member.id, Boolean(checked))}
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
