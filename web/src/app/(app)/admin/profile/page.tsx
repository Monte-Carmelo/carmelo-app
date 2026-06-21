import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Crown, Settings, UserCircle, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionRow } from '@/components/ui/section-row';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ListItem, ListGroup } from '@/components/ui/list-item';
import { LogoutRow } from '@/components/auth/LogoutRow';
import { Logo } from '@/components/layout/Logo';

function Tile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-paper-deep text-forest">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export default async function AdminProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('users').select('people(name, phone)').eq('id', user.id).maybeSingle(),
    supabase
      .from('user_gc_roles')
      .select('is_admin, is_coordinator, is_supervisor, gcs_supervised')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const person = (profile as { people?: { name?: string | null; phone?: string | null } | null } | null)
    ?.people;
  const name = person?.name ?? user.email ?? 'Você';
  const phone = person?.phone ?? null;
  const gcsSupervised = roles?.gcs_supervised ?? 0;

  const primaryRole = roles?.is_admin
    ? 'Admin'
    : roles?.is_coordinator
      ? 'Coordenador'
      : roles?.is_supervisor
        ? 'Supervisor'
        : 'Gestão';

  const subtitle = roles?.is_admin
    ? 'Administração do sistema'
    : gcsSupervised > 0
      ? `Coordenação · ${gcsSupervised} ${gcsSupervised === 1 ? 'GC' : 'GCs'} sob acompanhamento`
      : 'Acesso de gestão';

  const contact = [user.email, phone].filter(Boolean).join(' · ') || 'Sem contato cadastrado';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2">
      <ScreenHeader eyebrow="Área do pastor" title="Você" />

      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-hero bg-white p-5 shadow-md">
        <Avatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold leading-tight text-foreground">{name}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>
          <Badge variant="sage" className="mt-2">
            <Crown className="h-3 w-3" />
            {primaryRole}
          </Badge>
        </div>
      </div>

      {/* Management */}
      <SectionRow title="Conta" />
      <ListGroup>
        <ListItem
          grouped
          leading={<Tile icon={UserCircle} />}
          title="Meus dados"
          subtitle={contact}
        />
        <Link
          href="/admin/users"
          className="block transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
        >
          <ListItem
            grouped
            leading={<Tile icon={UsersRound} />}
            title="Coordenadores e acessos"
            subtitle="Quem tem acesso de gestão"
            trailing={<ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
          />
        </Link>
        <Link
          href="/admin/settings"
          className="block transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
        >
          <ListItem
            grouped
            leading={<Tile icon={Settings} />}
            title="Configurações"
            subtitle="Valores globais do sistema"
            trailing={<ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
          />
        </Link>
      </ListGroup>

      <div className="pt-1">
        <LogoutRow />
      </div>

      {/* Footer */}
      <div className="pb-2 pt-8 text-center">
        <Logo variant="compact" className="mx-auto opacity-60" />
        <span className="tipograma mt-2 block text-[10px]">Igreja Monte Carmelo</span>
        <p className="mt-1 text-[11px] text-muted-foreground">
          v1.0 · uma comunidade, muitos GCs.
        </p>
      </div>
    </div>
  );
}
