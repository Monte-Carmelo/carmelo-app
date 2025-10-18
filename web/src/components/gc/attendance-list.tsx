'use client';

import { useState } from 'react';
import { Users, UserCheck, AlertCircle } from 'lucide-react';
import type { GCMember, GCVisitor } from '@/lib/supabase/queries/gc-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/spinner';

export interface AttendanceListProps {
  members: GCMember[];
  visitors: GCVisitor[];
  initialMemberAttendance?: string[]; // participant_ids
  initialVisitorAttendance?: string[]; // visitor_ids
  onToggleMemberAttendance: (participantId: string, isPresent: boolean) => Promise<{ success: boolean; error?: string }>;
  onToggleVisitorAttendance: (visitorId: string, isPresent: boolean) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export function AttendanceList({
  members,
  visitors,
  initialMemberAttendance = [],
  initialVisitorAttendance = [],
  onToggleMemberAttendance,
  onToggleVisitorAttendance,
  isLoading,
}: AttendanceListProps) {
  const [memberAttendance, setMemberAttendance] = useState<Set<string>>(new Set(initialMemberAttendance));
  const [visitorAttendance, setVisitorAttendance] = useState<Set<string>>(new Set(initialVisitorAttendance));
  const [savingStates, setSavingStates] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const handleToggleMember = async (participantId: string) => {
    const isCurrentlyPresent = memberAttendance.has(participantId);
    const newPresenceState = !isCurrentlyPresent;

    // Atualização otimista da UI
    setMemberAttendance((prev) => {
      const next = new Set(prev);
      if (newPresenceState) {
        next.add(participantId);
      } else {
        next.delete(participantId);
      }
      return next;
    });

    setSavingStates((prev) => new Set(prev).add(participantId));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(participantId);
      return next;
    });

    const result = await onToggleMemberAttendance(participantId, newPresenceState);

    setSavingStates((prev) => {
      const next = new Set(prev);
      next.delete(participantId);
      return next;
    });

    if (!result.success) {
      // Reverter a atualização otimista em caso de erro
      setMemberAttendance((prev) => {
        const next = new Set(prev);
        if (isCurrentlyPresent) {
          next.add(participantId);
        } else {
          next.delete(participantId);
        }
        return next;
      });

      setErrors((prev) => {
        const next = new Map(prev);
        next.set(participantId, result.error ?? 'Erro ao salvar presença');
        return next;
      });
    }
  };

  const handleToggleVisitor = async (visitorId: string) => {
    const isCurrentlyPresent = visitorAttendance.has(visitorId);
    const newPresenceState = !isCurrentlyPresent;

    // Atualização otimista da UI
    setVisitorAttendance((prev) => {
      const next = new Set(prev);
      if (newPresenceState) {
        next.add(visitorId);
      } else {
        next.delete(visitorId);
      }
      return next;
    });

    setSavingStates((prev) => new Set(prev).add(visitorId));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(visitorId);
      return next;
    });

    const result = await onToggleVisitorAttendance(visitorId, newPresenceState);

    setSavingStates((prev) => {
      const next = new Set(prev);
      next.delete(visitorId);
      return next;
    });

    if (!result.success) {
      // Reverter a atualização otimista em caso de erro
      setVisitorAttendance((prev) => {
        const next = new Set(prev);
        if (isCurrentlyPresent) {
          next.add(visitorId);
        } else {
          next.delete(visitorId);
        }
        return next;
      });

      setErrors((prev) => {
        const next = new Map(prev);
        next.set(visitorId, result.error ?? 'Erro ao salvar presença');
        return next;
      });
    }
  };

  const totalPresent = memberAttendance.size + visitorAttendance.size;
  const totalPeople = members.length + visitors.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <Loading message="Carregando lista de presença..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatística de presença */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Presença total</span>
            </div>
            <span className="text-2xl font-bold">
              {totalPresent}/{totalPeople}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${totalPeople > 0 ? (totalPresent / totalPeople) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de membros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros
              </CardTitle>
              <CardDescription>
                {memberAttendance.size} de {members.length} presentes
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum membro ativo no GC</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isPresent = memberAttendance.has(member.id);
                const isSaving = savingStates.has(member.id);
                const error = errors.get(member.id);

                return (
                  <div key={member.id} className="space-y-1">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                        isPresent
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <Checkbox
                        checked={isPresent}
                        disabled={isSaving}
                        onCheckedChange={() => handleToggleMember(member.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{member.role}</p>
                      </div>
                      {isSaving && (
                        <span className="text-xs text-muted-foreground">Salvando...</span>
                      )}
                    </label>
                    {error && (
                      <div className="flex items-center gap-2 px-4 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de visitantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Visitantes
              </CardTitle>
              <CardDescription>
                {visitorAttendance.size} de {visitors.length} presentes
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {visitors.length} {visitors.length === 1 ? 'visitante' : 'visitantes'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum visitante ativo no GC</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visitors.map((visitor) => {
                const isPresent = visitorAttendance.has(visitor.id);
                const isSaving = savingStates.has(visitor.id);
                const error = errors.get(visitor.id);

                return (
                  <div key={visitor.id} className="space-y-1">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                        isPresent
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <Checkbox
                        checked={isPresent}
                        disabled={isSaving}
                        onCheckedChange={() => handleToggleVisitor(visitor.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{visitor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.visit_count} {visitor.visit_count === 1 ? 'visita' : 'visitas'}
                        </p>
                      </div>
                      {isSaving && (
                        <span className="text-xs text-muted-foreground">Salvando...</span>
                      )}
                    </label>
                    {error && (
                      <div className="flex items-center gap-2 px-4 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
