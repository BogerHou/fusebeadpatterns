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
    // Generated downloads/prototypes and private operational records are not
    // application sources. Their vendored bundles must not enter app linting.
    "artifacts/**",
    "docs/网站运营数据分析/**",
    "next-env.d.ts",
    "fix_monofont.js",
    "scripts/**/*.js",
    "test-convert.js",
  ]),
]);

export default eslintConfig;
