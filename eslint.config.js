import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
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
  },
  {
    // Componentes do shadcn exportam o `cva` ao lado do componente por
    // convencao da propria biblioteca. Liberar o nome explicitamente mantem a
    // regra ativa no resto do projeto, onde ela de fato protege o HMR.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['buttonVariants', 'badgeVariants', 'toggleVariants'] },
      ],
    },
  },
  {
    // `src/domain` e o motor de calculo: TypeScript puro, sem framework.
    // Essa barreira e o que mantem a pasta portavel — e ela que sera movida
    // para o Tripflow-Frontend, ou promovida a pacote, sem arrastar UI.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'src/domain precisa ficar livre de React.' },
            { name: 'react-dom', message: 'src/domain precisa ficar livre de React.' },
            {
              name: 'react-router-dom',
              message: 'src/domain nao conhece rota nem navegacao.',
            },
            {
              name: 'axios',
              message: 'src/domain nao faz I/O: receba os dados por parametro.',
            },
            {
              name: 'zustand',
              message: 'src/domain nao guarda estado de UI.',
            },
          ],
          patterns: [
            {
              group: ['@/features/*', '@/app/*', '@/components/*', '@/shared/*'],
              message:
                'src/domain nao pode depender das camadas externas; a dependencia e sempre no sentido oposto.',
            },
            {
              group: ['*.css', '*.svg', '*.png', '*.webp'],
              message: 'src/domain nao importa asset.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['cli/**/*.ts', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
