module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  settings: {
    react: { version: '19.2' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};