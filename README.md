# `@shopify/i18next-shopify`

This package is an `i18nFormat` plugin for the [i18next](https://www.i18next.com/) library. It allows developers to use the same format used by Shopify [apps](https://shopify.dev/docs/apps/checkout/best-practices/localizing-ui-extensions#how-it-works) and [themes](https://shopify.dev/docs/themes/architecture/locales/storefront-locale-files#usage) for localization.

Key features include:
* Variable interpolation with both single `{}` and double `{{}}` curly brace mustache formats
* Pluralization as nested keys
  * E.g. `{ "keyWithCount": { "one": "value" } }` instead of `{ "keyWithCount_one": "value" }`
* Variable interpolation with React components as replacement values
  * E.g. `t("key", { businessName: <strong>Shopify</strong> })`
* Ordinal pluralization using the interpolation variable `ordinal` as number (e.g. `t("key", { ordinal: 1 })`) or using the interpolation variable `ordinal` as boolean and `count` as number (e.g. `t("key", { ordinal: true, count: 1 })`)
  * NOTE: When `ordinal` is explicitly set to `0` and `count` is also explicitly set, the plugin will treat this as cardinal pluralization (e.g. `t("key", { count: 1, ordinal: 0 }`))

## Table of contents
[Getting Started](#getting-started)\
[Example](#example)\
[License](#license)\
[Contributing](#contributing)\
[References](#references)

## Getting started

### Add the package
```
$ npm install @shopify/i18next-shopify
```
or
```
$ yarn add @shopify/i18next-shopify
```

### Configure i18next to use this plugin

> **Warning**
> The [`Intl.PluralRules` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules) is required for this plugin's plural handling.
> If your target environments do not support this API, you may need to [polyfill](https://github.com/eemeli/intl-pluralrules) it.
> This plugin's plural handling is not compatible with i18next's fallback to JSON format v3 plural handling.

```js
import i18next from "i18next";
import ShopifyFormat from "@shopify/i18next-shopify";

i18next.use(ShopifyFormat).init(i18nextOptions);
```

## Example

```js
import i18next from "i18next";
import ShopifyFormat from "@shopify/i18next-shopify";

i18next.use(ShopifyFormat).init({
  lng: "en",
  resources: {
    en: {
      translation: {
        hello: "Hello {{casualName}}!",
        products: {
          "0": "I have no products.",
          "1": "I have a single product.",
          one: "I have {{count}} product.",
          other: "I have {{count}} products.",
        },
      },
    }
  }
});

i18next.t("hello", { casualName: "Shopify" }); // -> Hello Shopify!
i18next.t("products", { count: 2 }); // -> I have 2 products!
```

## License

[MIT](https://github.com/Shopify/i18next-shopify/blob/main/LICENSE)

## Contributing

Want to make i18next-shopify better for everyone? We'd love your help!  Please start off by reading our [Code of Conduct](https://github.com/Shopify/i18next-shopify/blob/main/CODE_OF_CONDUCT.md).

### Report a bug

Bugs are tracked at GitHub issues.  Search open issues to see if someone else has reported a similar bug. If it's something new, open an issue. We'll use the issue to have a conversation about the problem you want to fix.  You may also suggest features using GitHub issues.

When creating a new issue, please ensure the issue is clear and include additional details to help maintainers reproduce it:

Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps. Include links to files, or copy/pasteable snippets. If you're providing snippets in the issue, use Markdown code blocks.
- Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
- Explain which behavior you expected to see instead and why.
- Include screenshots and animated GIFs where possible.

### Contributing Code

Useful commands:
- `yarn install` to install development dependencies
- `yarn test` to run the test suite
- `yarn tdd` to run tests after files are updated
- `yarn lint` to run the linter
- `yarn changeset` to generate a changeset

How to contribute:
- Open a PR with your contribution.  Fill out all applicable sections of the [PR template](https://github.com/Shopify/i18next-shopify/blob/main/.github/pull_request_template.md)
- Include a [changeset](https://github.com/changesets/changesets) in your pull request. This helps us keep the changelog and version accurate.
  - If you believe an empty changeset is warranted and appropriate, one can be generated by running `yarn changeset add --empty`
- Before you can merge your pull request, you must sign Shopify's [Contributor License Agreement (CLA)](https://cla.shopify.com/).

Thank you for your interest in contributing!

## References

* [Shopify theme storefront locale files](https://shopify.dev/docs/themes/architecture/locales/storefront-locale-files#usage)
* [Shopify theme schema locale files](https://shopify.dev/docs/themes/architecture/locales/schema-locale-files)
* [Shopify app locale files](https://shopify.dev/docs/apps/checkout/best-practices/localizing-ui-extensions#how-it-works)
