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
        // Types, Interfaces, Classes use PascalCase
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        // React Components use PascalCase (uppercase then lowercase = PascalCase)
        {
          selector: "variable",
          format: ["PascalCase"],
          filter: {
            regex: "^[A-Z][a-z]",
            match: true,
          },
        },
      ],
    },
  },
];

export default eslintConfig;
