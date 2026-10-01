import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'preview/**'] },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        GM_getValue: 'readonly',
        GM_setValue: 'readonly',
        GM_registerMenuCommand: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-constant-condition': 'error',
      'valid-typeof': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
];
