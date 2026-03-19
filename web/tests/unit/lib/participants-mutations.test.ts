import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import {
  addParticipant,
  updateParticipant,
  updateParticipantStatus,
} from '@/lib/supabase/mutations/participants';

type TableName = keyof Database['public']['Tables'];

function createSupabaseMock() {
  const peopleByEmailLimit = vi.fn().mockResolvedValue({ data: [], error: null });
  const peopleByPhoneLimit = vi.fn().mockResolvedValue({ data: [], error: null });
  const peopleInsertSingle = vi.fn().mockResolvedValue({ data: { id: 'person-1' }, error: null });
  const participantUpsertSingle = vi.fn().mockResolvedValue({ data: { id: 'participant-1' }, error: null });
  const peopleUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const participantUpdateEq = vi.fn().mockResolvedValue({ error: null });

  const peopleSelect = vi.fn(() => ({
    eq: vi.fn((column: string) => ({
      is: vi.fn((deletedAtColumn: string, deletedAtValue: null) => {
        expect(deletedAtColumn).toBe('deleted_at');
        expect(deletedAtValue).toBeNull();

        return {
          limit: vi.fn(() => {
            if (column === 'email') {
              return peopleByEmailLimit();
            }

            if (column === 'phone') {
              return peopleByPhoneLimit();
            }

            throw new Error(`Unexpected people lookup column: ${column}`);
          }),
        };
      }),
    })),
  }));

  const peopleInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: peopleInsertSingle,
    })),
  }));

  const peopleUpdate = vi.fn(() => ({
    eq: peopleUpdateEq,
  }));

  const participantUpsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: participantUpsertSingle,
    })),
  }));

  const participantUpdate = vi.fn(() => ({
    eq: participantUpdateEq,
  }));

  const from = vi.fn((table: TableName) => {
    if (table === 'people') {
      return {
        select: peopleSelect,
        insert: peopleInsert,
        update: peopleUpdate,
      };
    }

    if (table === 'growth_group_participants') {
      return {
        upsert: participantUpsert,
        update: participantUpdate,
      };
    }

    throw new Error(`Table not mocked: ${String(table)}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    peopleByEmailLimit,
    peopleByPhoneLimit,
    peopleInsert,
    peopleUpdateEq,
    participantUpsert,
    participantUpdateEq,
  };
}

describe('participants mutations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('addParticipant cria pessoa e vínculo quando não encontra pessoa existente', async () => {
    const mock = createSupabaseMock();

    const result = await addParticipant(mock.supabase, {
      gcId: 'gc-1',
      name: 'Maria',
      email: 'maria@example.com',
      phone: '(11) 99999-9999',
      role: 'member',
      addedByUserId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.personId).toBe('person-1');
    expect(result.participantId).toBe('participant-1');
    expect(mock.peopleInsert).toHaveBeenCalledTimes(1);
    expect(mock.participantUpsert).toHaveBeenCalledTimes(1);
  });

  it('addParticipant reutiliza pessoa encontrada por email e nao faz fallback por telefone', async () => {
    const mock = createSupabaseMock();
    mock.peopleByEmailLimit.mockResolvedValueOnce({
      data: [{ id: 'person-existing', name: 'Maria' }],
      error: null,
    });

    const result = await addParticipant(mock.supabase, {
      gcId: 'gc-1',
      name: 'Maria',
      email: 'maria@example.com',
      phone: '(11) 90000-0000',
      role: 'leader',
      addedByUserId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.personId).toBe('person-existing');
    expect(mock.peopleByPhoneLimit).not.toHaveBeenCalled();
    expect(mock.peopleInsert).not.toHaveBeenCalled();
  });

  it('addParticipant retorna erro amigavel quando o telefone encontra multiplas pessoas', async () => {
    const mock = createSupabaseMock();
    mock.peopleByPhoneLimit.mockResolvedValueOnce({
      data: [
        { id: 'person-1', name: 'Pessoa A' },
        { id: 'person-2', name: 'Pessoa B' },
      ],
      error: null,
    });

    const result = await addParticipant(mock.supabase, {
      gcId: 'gc-1',
      name: 'Nova Pessoa',
      email: null,
      phone: '(11) 98888-7777',
      role: 'member',
      addedByUserId: 'user-1',
    });

    expect(result).toEqual({
      success: false,
      error: 'Ja existem varias pessoas com este telefone. Informe um e-mail para identificar a pessoa ou edite um cadastro existente.',
    });
    expect(mock.peopleInsert).not.toHaveBeenCalled();
    expect(mock.participantUpsert).not.toHaveBeenCalled();
  });

  it('updateParticipant atualiza pessoa e vínculo', async () => {
    const mock = createSupabaseMock();

    const result = await updateParticipant(mock.supabase, {
      participantId: 'participant-1',
      personId: 'person-1',
      gcId: 'gc-2',
      name: 'Maria Atualizada',
      email: 'maria@example.com',
      phone: '(11) 98888-7777',
      role: 'supervisor',
      status: 'inactive',
    });

    expect(result.success).toBe(true);
    expect(mock.peopleUpdateEq).toHaveBeenCalledWith('id', 'person-1');
    expect(mock.participantUpdateEq).toHaveBeenCalledWith('id', 'participant-1');
  });

  it('updateParticipantStatus atualiza apenas o status do vínculo', async () => {
    const mock = createSupabaseMock();

    const result = await updateParticipantStatus(mock.supabase, {
      participantId: 'participant-1',
      status: 'inactive',
    });

    expect(result.success).toBe(true);
    expect(mock.participantUpdateEq).toHaveBeenCalledWith('id', 'participant-1');
  });
});
