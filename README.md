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
[Using plain i18next instead](#using-plain-i18next-instead)\
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

## Using plain i18next instead

Most of what this plugin does can be reproduced with `i18next` configuration alone, and the rest with a small `postProcessor` that you can copy into your app. You may prefer that over this plugin because this plugin replaces i18next's interpolator entirely, so i18next features such as `$t()` nesting and `{{- raw}}` are unavailable while it is installed.

### Configuration only

If you never pass React elements to `t()`, this is the complete setup:

```js
import i18next from "i18next";

i18next.init({
  // Nested plural keys: `{ "products": { "one": "...", "other": "..." } }`.
  // Also gives `{ "ordinal": { "one": "..." } }` for `t("key", { count: 1, ordinal: true })`.
  pluralSeparator: ".",
  interpolation: {
    // Safe only because React escapes the output. Keep escaping on when rendering raw HTML.
    escapeValue: false,
    // Accept both `{{name}}` and `{name}`. The empty `prefix` and `suffix` are required,
    // otherwise i18next's defaults (`{{` and `}}`) take precedence over the escaped variants.
    prefix: "",
    suffix: "",
    prefixEscaped: "{{?",
    suffixEscaped: "}}?",
    // Route every variable through `format` so `count` and `ordinal` can be handled below.
    alwaysFormat: true,
    format(value, _format, lng, { interpolationkey, count }) {
      // `{{count}}` and `{{ordinal}}` both render the locale formatted count, e.g. "1,234,567".
      const number = interpolationkey === "ordinal" ? count : value;
      if (
        (interpolationkey === "count" || interpolationkey === "ordinal") &&
        typeof number === "number"
      ) {
        return new Intl.NumberFormat(lng).format(number);
      }
      return value;
    },
  },
});
```

With this configuration, `t()` behaves like this plugin for `{{name}}` and `{name}` interpolation, nested cardinal and ordinal plural keys, locale formatted counts, `returnObjects: true` and the `Trans` component.

The following plugin behaviours have no equivalent and need to change in your app:

* `t("key", { ordinal: 3 })` must become `t("key", { count: 3, ordinal: true })`.
* Explicit `"0"` plural keys must be renamed to `"zero"`, the CLDR category i18next looks up when `count` is `0`. Explicit `"1"` keys have no equivalent.
* When a translation is missing the plural form for the current count, i18next does not fall back to `other`. Make sure every plural form is present.
* Supplying `interpolation.format` replaces i18next's built-in formatters, so `{{value, currency}}` style formats are unavailable with this setup, as they are with this plugin.
* `escapeValue: false` is only safe when the output is rendered through React or otherwise escaped. Keep escaping on for strings that end up in raw HTML, emails or `dangerouslySetInnerHTML`.

### React elements as replacement values

i18next's interpolator always produces a string, so with configuration alone a React element passed to `t()` renders as `[object Object]`. The module below restores this plugin's behaviour, where `t()` returns an array of strings and elements when a replacement value is an element or an array. `format` swaps such values for a marker and the `reactValues` postProcessor swaps them back after interpolation.

This is the same code that [`test/plain_i18next_config.spec.js`](test/plain_i18next_config.spec.js) runs against the same scenarios as this plugin:

```jsx
import React from "react";

// NUL cannot survive the usual translation pipelines and never appears in rendered
// text, so it marks where `format` stashed a non-string value. String values that
// contain it are stripped so they cannot forge a marker.
const TOKEN = '\u0000';

const numberFormats = new Map();

function formatNumber(value, lng) {
  if (!numberFormats.has(lng)) {
    numberFormats.set(lng, new Intl.NumberFormat(lng));
  }
  return numberFormats.get(lng).format(value);
}

function isElementValue(value) {
  return React.isValidElement(value) || Array.isArray(value);
}

function interpolationValues(options) {
  return options.replace ?? options;
}

function restoreElements(str, options) {
  if (typeof str !== 'string' || !str.includes(TOKEN)) return str;

  const values = interpolationValues(options);
  const occurrences = new Map();

  return str.split(TOKEN).flatMap((part, index) => {
    if (index % 2 === 0) return part === '' ? [] : [part];

    const isTokenisedValue =
      Object.prototype.hasOwnProperty.call(values, part) &&
      isElementValue(values[part]);
    if (!isTokenisedValue) return [`${TOKEN}${part}${TOKEN}`];

    const occurrence = occurrences.get(part) ?? 0;
    occurrences.set(part, occurrence + 1);

    let position = 0;
    return [values[part]].flat().map((item) => {
      const key = `${part}-${occurrence}-${position}`;
      position += 1;
      return React.isValidElement(item) && !item.key
        ? React.cloneElement(item, {key})
        : item;
    });
  });
}

function restoreElementsDeep(value, options) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        restoreElementsDeep(entry, options),
      ]),
    );
  }
  return restoreElements(value, options);
}

const reactValues = {
  type: 'postProcessor',
  name: 'reactValues',
  process(value, _key, options) {
    return restoreElementsDeep(value, options);
  },
};

function format(value, _format, lng, {interpolationkey, count}) {
  // `{{count}}` and `{{ordinal}}` both render the locale formatted count, e.g. "1,234,567".
  const number = interpolationkey === 'ordinal' ? count : value;
  if (
    (interpolationkey === 'count' || interpolationkey === 'ordinal') &&
    typeof number === 'number'
  ) {
    return formatNumber(number, lng);
  }
  if (isElementValue(value)) return `${TOKEN}${interpolationkey}${TOKEN}`;
  if (typeof value === 'string') return value.split(TOKEN).join('');
  return value;
}

const options = {
  // Nested plural keys: `{"products": {"one": "...", "other": "..."}}` and
  // `{"ordinal": {"one": "..."}}` for `t("key", {count: 1, ordinal: true})`.
  pluralSeparator: '.',
  postProcess: ['reactValues'],
  interpolation: {
    // Safe only because React escapes the output. Keep escaping on when rendering raw HTML.
    escapeValue: false,
    // Accept both `{{name}}` and `{name}`. The empty `prefix` and `suffix` are required,
    // otherwise i18next's defaults (`{{` and `}}`) take precedence over the escaped variants.
    prefix: '',
    suffix: '',
    prefixEscaped: '{{?',
    suffixEscaped: '}}?',
    // Route every variable through `format`, including React elements.
    alwaysFormat: true,
    format,
  },
};
```

Register it alongside your other options:

```jsx
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

i18next
  .use(initReactI18next)
  .use(reactValues)
  .init({ ...options, lng: "en", resources });

i18next.t("hello", { casualName: <strong>Shopify</strong> });
// -> ["Hello ", <strong key="casualName-0-0">Shopify</strong>, "!"]
```

Known limitations, shared with this plugin unless noted:

* Only top level variables are restored. `{{user.name}}` style keys render the marker text literally.
* `Trans` calls `t()` too, so an array in its `values` now reaches it as an array instead of the joined string plain i18next would produce. Join such values before passing them to `Trans`.

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
