module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true,
  },
  extends: [
    'plugin:@shopify/jest',
    'plugin:@shopify/esnext',
    'plugin:@shopify/prettier',
    'plugin:testing-library/react',
    'plugin:jest-dom/recommended',
    'plugin:react/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      impliedStrict: true,
    },
  },
  rules: {
    '@babel/object-curly-spacing': 'off',
  },
};
