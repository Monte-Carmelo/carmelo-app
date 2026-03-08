import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    [
      'Build cancelado: variaveis obrigatorias do Supabase nao foram definidas.',
      `Faltando: ${missingEnv.join(', ')}.`,
      'Defina essas chaves em .env.local, .env.production ou no ambiente do CI antes de executar `npm run build`.',
    ].join(' '),
  );
  process.exit(1);
}
