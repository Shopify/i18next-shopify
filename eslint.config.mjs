import globals from 'globals';
import shopifyPlugin from '@shopify/eslint-plugin';

const config = [
  {
    ignores: [
      '.dev/*',
      '.github/*',
      '.shadowenv.d/*',
      'coverage/*',
      '**/*.min.*',
      '**/dist/*',
      '**/node_modules/*',
      'i18nextShopify.js',
      'i18nextShopify.min.js',
      'index.js',
      'index.d.ts',
    ],
  },
  ...shopifyPlugin.configs.core,
  ...shopifyPlugin.configs.esnext,
  ...shopifyPlugin.configs.jest,
  ...shopifyPlugin.configs.prettier,
  ...shopifyPlugin.configs.react,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          impliedStrict: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      '@babel/object-curly-spacing': 'off',
    },
  },
];

export default config;
