import { createRequire } from 'node:module'
import Module from 'node:module'

const require = createRequire(import.meta.url)
try {
  const ts6 = require('@typescript/typescript6')
  const originalLoad = Module._load
  Module._load = function (request, parent, isMain) {
    if (request === 'typescript') {
      return ts6
    }
    return originalLoad.apply(this, arguments)
  }
} catch {
  // fallback
}

const typescriptParser = require('@typescript-eslint/parser')
const nextPlugin = require('@next/eslint-plugin-next')
const reactPlugin = require('eslint-plugin-react')
const hooksPlugin = require('eslint-plugin-react-hooks')
const simpleImportSort = require('eslint-plugin-simple-import-sort')
const unusedImports = require('eslint-plugin-unused-imports')

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      'next-env.d.ts',
      'config/**',
      '*.config.*',
      '.*rc.*',
      '.*.cjs',
      '.*.js',
      '.*.mjs',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@next/next/no-img-element': 'off',
      'no-empty': 'off',
      'no-use-before-define': 'off',
      camelcase: 'off',
      'prefer-const': 'off',
      'preserve-caught-error': 'off',
      complexity: ['warn', 10],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
