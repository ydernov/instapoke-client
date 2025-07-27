// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  // 1. ESLint's recommended base rules for general JavaScript
  eslint.configs.recommended,

  // 2. TypeScript ESLint recommended rules (type-aware)
  //    This includes the TypeScript parser configuration and essential TS rules.
  //    Using spread operator as it returns an array of configs.
  ...tseslint.configs.recommendedTypeChecked,

  // 3. Main configuration block for React, TypeScript, and JSX files
  {
    files: ["**/*.{js,jsx,ts,tsx}"], // Apply these rules to relevant files
    plugins: {
      react: pluginReact, // Register the React plugin
      // 'react-hooks' and 'jsx-a11y' plugins are registered here,
      // but their recommended rule sets are applied in separate config objects below.
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
    },
    languageOptions: {
      parser: tseslint.parser, // Use TypeScript parser for all applicable files
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
        // Crucial for type-aware linting
        project: ["./tsconfig.json", "./tsconfig.node.json"], // Paths to your tsconfig.json
        tsconfigRootDir: import.meta.dirname, // Root for tsconfig resolution
      },
      globals: {
        // Define global variables (e.g., for browser and Node.js environments)
        browser: true,
        node: true,
      },
    },
    settings: {
      react: {
        version: "detect", // Auto-detect React version for plugin-react
      },
    },
    rules: {
      // --- General ESLint Rules ---
      // Formatting rules like 'indent', 'linebreak-style', 'quotes', 'semi' are REMOVED.
      // Prettier handles these, and `eslint-plugin-prettier` will report differences.
      // `eslint-config-prettier` (included in `eslintPluginPrettierRecommended`) disables ESLint's versions.
      "no-console": ["warn", { allow: ["warn", "error"] }], // Allow console.warn/error, warn on others

      // --- TypeScript ESLint Rule Overrides ---
      // Disable core ESLint rules that are better handled by TypeScript ESLint
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }, // Ignore variables starting with '_'
      ],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error", // Use TS-aware shadow rule
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["arrowFunctions"] }, // Allow empty arrow functions
      ],
      "@typescript-eslint/no-explicit-any": "warn", // Consider changing to 'error' for stricter code
      "@typescript-eslint/explicit-module-boundary-types": "off", // Often too strict for React components
      "@typescript-eslint/no-non-null-assertion": "off", // Allow non-null assertions

      // --- React ESLint Rules ---
      // These are specific React rules, not primarily about formatting
      "react/react-in-jsx-scope": "off", // Not needed for React 17+ with new JSX transform
      "react/jsx-uses-react": "off", // Not needed for React 17+ with new JSX transform
      "react/prop-types": "off", // Disable prop-types in TypeScript projects
      "react/self-closing-comp": ["error", { component: true, html: true }], // Enforce self-closing for empty elements
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" }, // Enforce no unnecessary curly braces in JSX
      ],
    },
  },

  // 6. Prettier integration (MUST be the LAST configuration in the array)
  //    This configuration disables all ESLint rules that might conflict with Prettier's formatting.
  eslintPluginPrettierRecommended,

  // 7. Ignore files and directories from linting
  {
    ignores: [
      "node_modules/",
      "build/",
      "dist/",
      "coverage/",
      "*.d.ts", // Ignore TypeScript declaration files
      "vite.config.ts", // Example: specific configuration files
      // Add any other files or directories you want ESLint to skip
    ],
  }
);
