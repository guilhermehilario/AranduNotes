import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: {
        // Versão concreta (não 'detect'): com ESLint 10, a detecção automática
        // chama uma API removida (context.getFilename) e crasha o lint.
        version: '19.2.6',
      },
    },
    rules: {
      // Impede que props declarados mas nunca usados (código morto) entrem no
      // código. Funciona com interfaces TypeScript em React.FC e funções
      // tipadas, e entende o padrão rest/spread (`...props`).
      // Nota: não cobre componentes tipados via forwardRef<El, Props>
      // (ex.: Button, Input, TextArea) — limitação do plugin.
      'react/no-unused-prop-types': 'error',
    },
    // ── Nota: a regra no-restricted-imports foi removida propositalmente.
    // O projeto já usa extensões explícitas em todos os imports,
    // e TypeScript + Vite resolvem corretamente sem ela.
  },
])
