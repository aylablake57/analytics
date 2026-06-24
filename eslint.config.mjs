import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off Node build scripts are CommonJS tooling, not app code.
    "scripts/**",
  ]),
  {
    // These opt-in strict rules (TS `any` + the React-Compiler react-hooks
    // checks) were introduced after most of this codebase was written and flag
    // many intentional, working patterns. Kept as warnings so they stay visible
    // without failing the build; tighten incrementally.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
