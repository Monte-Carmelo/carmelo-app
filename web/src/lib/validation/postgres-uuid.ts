import { z } from 'zod';

// PostgreSQL accepts UUID values that do not satisfy the stricter RFC/version
// checks enforced by Zod's built-in `.uuid()`. The project seed data uses this
// broader format, so validations must match what the database actually stores.
const POSTGRES_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function postgresUuid(message = 'Identificador inválido.') {
  return z.string().regex(POSTGRES_UUID_REGEX, message);
}
