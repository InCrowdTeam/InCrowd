import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
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
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Il layer api/services interagisce con un backend a tipizzazione lasca:
      // `any` è usato volutamente nei tipi di confine (port verbatim dal frontend Vue).
      '@typescript-eslint/no-explicit-any': 'off',
      // I service ri-lanciano gli errori senza `cause`: comportamento del port originale.
      'preserve-caught-error': 'off',
    },
  },
  {
    // File che esportano sia componenti che valori non-componente (router, helper):
    // il vincolo di fast-refresh non si applica al loro scopo.
    files: ['src/router.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
