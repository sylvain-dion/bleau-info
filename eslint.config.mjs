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
    rules: {
      // ARCH-13 Naming Convention Rules
      "@typescript-eslint/naming-convention": [
        "error",
        // Variables and functions use camelCase
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        // React hooks must start with 'use'
        {
          selector: "function",
          format: ["camelCase"],
          prefix: ["use"],
          filter: {
            regex: "^use[A-Z]",
            match: true,
          },
        },
        // Types, Interfaces, Classes use PascalCase
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        // React Components use PascalCase
        {
          selector: "variable",
          types: ["function"],
          format: ["PascalCase"],
          filter: {
            regex: "^[A-Z]",
            match: true,
          },
        },
      ],
    },
  },
];

export default eslintConfig;
