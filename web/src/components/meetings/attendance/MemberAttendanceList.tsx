'use client';

import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
}

export function MemberAttendanceList({
  members,
  selectedMemberIds,
  onToggle,
}: MemberAttendanceListProps) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4" />
        Membros
      </h3>
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Selecione um GC para carregar a lista de membros e líderes.
          </p>
        ) : (
          members.map((member) => {
            const isChecked = selectedMemberIds.includes(member.id);
            return (
              <div key={member.id} className="flex items-center space-x-2 rounded-lg border p-3">
                <Checkbox
                  id={`member-${member.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(member.id, Boolean(checked))}
                />
                <label
                  htmlFor={`member-${member.id}`}
                  className="flex-1 cursor-pointer text-sm font-medium leading-none"
                >
                  {member.name}
                  <span className="ml-2 text-xs tracking-wide text-muted-foreground">
                    {translateRole(member.role)}
                  </span>
                </label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
