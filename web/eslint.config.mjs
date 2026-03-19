import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "storybook-static/**",
      "test-results/**",
      "tests/**",
      "playwright.config.ts",
      "vitest.config.ts",
      "vitest.contract.config.ts",
      "vitest.setup.ts",
      "tailwind.config.ts",
      "next.config.ts",
      "postcss.config.mjs",
      "prettier.config.mjs",
      "lint-staged.config.mjs",
    ],
  },
  {
    files: [
      "src/components/auth/LoginForm.tsx",
      "src/components/admin/AdminEventForm.tsx",
      "src/components/admin/AdminGrowthGroupForm.tsx",
      "src/components/admin/AdminLessonForm.tsx",
      "src/components/admin/AdminSeriesForm.tsx",
      "src/components/admin/AdminUserAssignments.tsx",
      "src/components/admin/AdminUserCreateForm.tsx",
      "src/components/admin/AdminUserProfileForm.tsx",
      "src/components/gc/add-visitor-form.tsx",
      "src/components/gc/schedule-meeting-form.tsx",
      "src/components/participants/ParticipantForm.tsx",
      "src/components/participants/ParticipantEditForm.tsx",
      "src/components/participants/ParticipantList.tsx",
      "src/components/meetings/MeetingForm.tsx",
      "src/components/meetings/EditMeetingForm.tsx",
      "src/components/gc/GCEditForm.tsx",
      "src/components/admin/AdminSettingsForm.tsx",
      "src/components/visitors/VisitorForm.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/hooks/use-client-ready",
              message: "Use ClientFormShell para padronizar hidratacao e bloqueio de campos.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/components/admin/AdminSettingsForm.tsx",
      "src/components/participants/ParticipantForm.tsx",
      "src/components/participants/ParticipantEditForm.tsx",
      "src/components/participants/ParticipantList.tsx",
      "src/components/visitors/VisitorForm.tsx",
      "src/components/visitors/VisitorsList.tsx",
      "src/components/meetings/MeetingForm.tsx",
      "src/components/meetings/EditMeetingForm.tsx",
      "src/components/gc/GCEditForm.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/browser-client",
              message: "Fluxos criticos de escrita devem usar rotas internas autenticadas ou server actions.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
