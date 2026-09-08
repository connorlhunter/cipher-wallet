import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: [
      ".codeql/**",
      ".git/**",
      ".mypy_cache/**",
      ".pytest_cache/**",
      ".ruff_cache/**",
      ".venv/**",
      "apps/web/dist/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
    ],
    rules: {
      complexity: "off",
      "typescript/explicit-function-return-type": ["error", { allowExpressions: true }],
    },
    overrides: [
      {
        files: [
          "apps/web/src/**/*.{js,jsx,ts,tsx}",
          "packages/typescript/**/src/**/*.{js,jsx,ts,tsx}",
        ],
        rules: {
          complexity: ["error", { max: 15, variant: "classic" }],
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    endOfLine: "lf",
    ignorePatterns: [
      ".codeql/**",
      ".git/**",
      ".venv/**",
      "apps/web/dist/**",
      "bun.lock",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "uv.lock",
    ],
    proseWrap: "preserve",
    semi: true,
    singleQuote: false,
    sortPackageJson: false,
    tabWidth: 2,
    trailingComma: "all",
  },
});
