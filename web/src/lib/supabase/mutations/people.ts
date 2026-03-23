import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { formatBrazilianPhone } from '@/lib/formatters/phone';

type PersonRow = Pick<Database['public']['Tables']['people']['Row'], 'id' | 'name'>;
type ContactField = 'email' | 'phone';

type ResolveExistingPersonInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

type ResolveExistingPersonResult = {
  personId: string | null;
  error?: string;
  matchedBy?: ContactField;
};

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

function pickMatchingPerson(candidates: PersonRow[], name: string) {
  if (candidates.length === 1) {
    return candidates[0].id;
  }

  const normalizedName = normalizeName(name);
  const exactNameMatches = candidates.filter((candidate) => normalizeName(candidate.name) === normalizedName);

  if (exactNameMatches.length === 1) {
    return exactNameMatches[0].id;
  }

  return null;
}

async function findPeopleByContact(
  supabase: SupabaseClient<Database>,
  field: ContactField,
  value: string,
) {
  const { data, error } = await supabase
    .from('people')
    .select('id, name')
    .eq(field, value)
    .is('deleted_at', null)
    .limit(5);

  return {
    data: (data ?? []) as PersonRow[],
    error,
  };
}

function buildAmbiguousContactError(field: ContactField) {
  return field === 'email'
    ? 'Ja existem varias pessoas com este e-mail. Edite um cadastro existente ou informe outro contato.'
    : 'Ja existem varias pessoas com este telefone. Informe um e-mail para identificar a pessoa ou edite um cadastro existente.';
}

async function resolveByField(
  supabase: SupabaseClient<Database>,
  field: ContactField,
  value: string,
  name: string,
): Promise<ResolveExistingPersonResult> {
  const lookup = await findPeopleByContact(supabase, field, value);

  if (lookup.error) {
    return {
      personId: null,
      error: lookup.error.message,
    };
  }

  if (lookup.data.length === 0) {
    return { personId: null };
  }

  const personId = pickMatchingPerson(lookup.data, name);

  if (personId) {
    return {
      personId,
      matchedBy: field,
    };
  }

  return {
    personId: null,
    error: buildAmbiguousContactError(field),
  };
}

export async function resolveExistingPersonByContact(
  supabase: SupabaseClient<Database>,
  input: ResolveExistingPersonInput,
): Promise<ResolveExistingPersonResult> {
  const trimmedEmail = input.email?.trim() || null;
  const trimmedPhone = formatBrazilianPhone(input.phone) || null;

  if (trimmedEmail) {
    return resolveByField(supabase, 'email', trimmedEmail, input.name);
  }

  if (trimmedPhone) {
    return resolveByField(supabase, 'phone', trimmedPhone, input.name);
  }

  return { personId: null };
}
