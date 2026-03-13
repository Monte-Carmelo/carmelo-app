import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..');
const supabaseDir = resolve(repoRoot, 'supabase');
const defaultConfigPath = resolve(supabaseDir, 'config.toml');
const cliExecutable = process.env.SUPABASE_CLI_PATH ?? 'supabase';
const cliExecutableArgs =
  process.env.SUPABASE_CLI_ARGS?.split(/\s+/).filter(Boolean) ?? [];
const configPath = process.env.SUPABASE_CONFIG_PATH ?? defaultConfigPath;
const args = [...cliExecutableArgs, 'db', 'reset', '--local'];
const projectSlug = basename(repoRoot);
const dbContainer =
  process.env.SUPABASE_DB_CONTAINER ?? `supabase_db_${projectSlug}`;
const storageContainer =
  process.env.SUPABASE_STORAGE_CONTAINER ?? `supabase_storage_${projectSlug}`;
const storageApiUrl =
  process.env.SUPABASE_LOCAL_STORAGE_URL ??
  'http://127.0.0.1:54321/storage/v1/bucket';
const storageCompatErrorMarker = 'UNION types text and uuid cannot be matched';
const storageAdminDatabaseUrl =
  process.env.SUPABASE_STORAGE_ADMIN_DATABASE_URL ??
  'postgresql://supabase_storage_admin:postgres@127.0.0.1:5432/postgres';

if (process.argv.includes('--debug')) {
  args.push('--debug');
}

function runCommand(
  command: string,
  commandArgs: string[],
  context: string,
  options?: { silent?: boolean },
) {
  return new Promise<{ code: number | null; output: string }>(
    (resolvePromise, rejectPromise) => {
      const child = spawn(command, commandArgs, {
        cwd: repoRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let output = '';

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;
        if (!options?.silent) {
          process.stdout.write(text);
        }
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;
        if (!options?.silent) {
          process.stderr.write(text);
        }
      });

      child.on('error', (error) => {
        rejectPromise(new Error(`${context}: ${error.message}`));
      });

      child.on('close', (code) => {
        resolvePromise({ code, output });
      });
    },
  );
}

function execPsql(sql: string) {
  return new Promise<number | null>((resolvePromise, rejectPromise) => {
    const child = spawn(
      'docker',
      [
        'exec',
        '-i',
        dbContainer,
        'psql',
        storageAdminDatabaseUrl,
        '-v',
        'ON_ERROR_STOP=1',
      ],
      {
        cwd: repoRoot,
        env: process.env,
        stdio: ['pipe', 'inherit', 'inherit'],
      },
    );

    child.on('error', rejectPromise);
    child.on('close', resolvePromise);
    child.stdin.write(sql);
    child.stdin.end();
  });
}

async function getStorageServiceKey() {
  const { code, output } = await runCommand(
    'docker',
    ['exec', storageContainer, 'printenv', 'SERVICE_KEY'],
    'Não foi possível ler SERVICE_KEY do container de storage',
    { silent: true },
  );

  if (code !== 0) {
    throw new Error(
      `Falha ao obter SERVICE_KEY do storage local (código ${code ?? 'desconhecido'}).`,
    );
  }

  const serviceKey = output.trim();
  if (!serviceKey) {
    throw new Error('SERVICE_KEY do storage local está vazio.');
  }

  return serviceKey;
}

async function applyStorageCompatibilityPatch() {
  const sql = `
BEGIN;
ALTER TABLE IF EXISTS storage.iceberg_tables
  DROP CONSTRAINT IF EXISTS iceberg_tables_catalog_id_fkey;
ALTER TABLE IF EXISTS storage.iceberg_namespaces
  DROP CONSTRAINT IF EXISTS iceberg_namespaces_catalog_id_fkey;
ALTER TABLE IF EXISTS storage.buckets_analytics
  ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS storage.buckets_analytics
  ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE IF EXISTS storage.iceberg_namespaces
  ALTER COLUMN catalog_id TYPE text USING catalog_id::text;
ALTER TABLE IF EXISTS storage.iceberg_tables
  ALTER COLUMN catalog_id TYPE text USING catalog_id::text;
ALTER TABLE IF EXISTS storage.iceberg_namespaces
  ADD CONSTRAINT iceberg_namespaces_catalog_id_fkey
  FOREIGN KEY (catalog_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS storage.iceberg_tables
  ADD CONSTRAINT iceberg_tables_catalog_id_fkey
  FOREIGN KEY (catalog_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;
COMMIT;
`;

  const code = await execPsql(sql);
  if (code !== 0) {
    throw new Error(
      `Falha ao aplicar patch de compatibilidade do storage local (código ${code ?? 'desconhecido'}).`,
    );
  }
}

async function verifyStorageBucketListing() {
  const serviceKey = await getStorageServiceKey();
  const response = await fetch(storageApiUrl, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Storage local respondeu ${response.status}: ${body}`);
  }
}

if (existsSync(configPath)) {
  args.push('--config', configPath);
} else if (process.env.SUPABASE_CONFIG_PATH) {
  console.warn(
    `⚠️  Arquivo de configuração Supabase não encontrado em ${configPath}. Prosseguindo com defaults do CLI.`,
  );
}

console.log('📦 Resetando banco local do Supabase...');
console.log(`→ CLI: ${[cliExecutable, ...cliExecutableArgs].join(' ')}`);
console.log(`→ Diretório: ${repoRoot}`);
if (existsSync(configPath)) {
  console.log(`→ Config: ${configPath}`);
} else {
  console.log('→ Config: usando descoberta padrão do Supabase CLI');
}

async function main() {
  try {
    const { code, output } = await runCommand(
      cliExecutable,
      args,
      'Erro ao executar Supabase CLI',
    );

    if (code === 0) {
      console.log('✅ Banco resetado com sucesso.');
      return;
    }

    if (
      output.includes(storageCompatErrorMarker) &&
      output.includes('buckets_analytics')
    ) {
      console.warn(
        '⚠️  Detectado bug conhecido do storage local ao listar buckets. Aplicando patch de compatibilidade...',
      );
      await applyStorageCompatibilityPatch();
      await verifyStorageBucketListing();
      console.log(
        '✅ Banco resetado com patch de compatibilidade do storage local.',
      );
      return;
    }

    console.error(
      `❌ Supabase CLI finalizou com código ${code}. Verifique os logs acima.`,
    );
    process.exit(code ?? 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao executar reset do banco:', message);
    console.error(
      'Certifique-se de ter o Supabase CLI instalado (`npm install -g supabase` ou `brew install supabase/tap/supabase`).',
    );
    process.exit(1);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Falha inesperada no reset do banco:', message);
  process.exit(1);
});
