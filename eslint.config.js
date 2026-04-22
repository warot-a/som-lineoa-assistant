import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/", "dist/", "bun.lock", ".agents/"],
  },
  {
    rules: {
      "curly": ["error", "all"],
      "@typescript-eslint/no-unused-vars": "error"
    }
  }
);
