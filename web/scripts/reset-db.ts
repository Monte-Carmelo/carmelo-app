import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..');
const supabaseDir = resolve(repoRoot, 'supabase');
const defaultConfigPath = resolve(supabaseDir, 'config.toml');
const cliExecutable = process.env.SUPABASE_CLI_PATH ?? 'supabase';
const configPath = process.env.SUPABASE_CONFIG_PATH ?? defaultConfigPath;
const args = ['db', 'reset', '--local'];

if (process.argv.includes('--debug')) {
  args.push('--debug');
}

if (existsSync(configPath)) {
  args.push('--config', configPath);
} else if (process.env.SUPABASE_CONFIG_PATH) {
  console.warn(`⚠️  Arquivo de configuração Supabase não encontrado em ${configPath}. Prosseguindo com defaults do CLI.`);
}

console.log('📦 Resetando banco local do Supabase...');
console.log(`→ CLI: ${cliExecutable}`);
console.log(`→ Diretório: ${repoRoot}`);
if (existsSync(configPath)) {
  console.log(`→ Config: ${configPath}`);
} else {
  console.log('→ Config: usando descoberta padrão do Supabase CLI');
}

const child = spawn(cliExecutable, args, {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (error) => {
  console.error('❌ Erro ao executar Supabase CLI:', error.message);
  console.error('Certifique-se de ter o Supabase CLI instalado (`npm install -g supabase` ou `brew install supabase/tap/supabase`).');
  process.exit(1);
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Banco resetado com sucesso.');
  } else {
    console.error(`❌ Supabase CLI finalizou com código ${code}. Verifique os logs acima.`);
    process.exit(code ?? 1);
  }
});
