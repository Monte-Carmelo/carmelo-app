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
];

export default eslintConfig;
