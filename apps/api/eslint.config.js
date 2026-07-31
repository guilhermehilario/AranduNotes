import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'prisma/migrations', 'prisma/seed.ts']),
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Equivalente backend do react/no-unused-prop-types do frontend: o apps/api
      // não tem componentes React (.tsx), então a regra de props do plugin react
      // não se aplica aqui. Este guard impede código morto (imports, variáveis,
      // parâmetros e catchs não usados), seguindo a convenção `_` para itens
      // intencionalmente ignorados. Nota: cobre bindings não usados — não cobre
      // membros de interface/classe (DTOs usam class-validator em runtime).
      // 'error' + `--max-warnings 0` no script de lint.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      'preserve-caught-error': 'off',
      'no-console': 'off',
    },
  },
]);
