# `@shopify/i18next-shopify`

An `i18nFormat` plugin for [i18next](https://www.i18next.com/), which allows you to use the format used by Shopify [apps](https://shopify.dev/docs/apps/checkout/best-practices/localizing-ui-extensions#how-it-works) and [themes](https://shopify.dev/docs/themes/architecture/locales/storefront-locale-files#usage).

## WIP Status

Pre-alpha; not ready for use. We also won't be accepting external contributions at this point.

## Getting started

```
$ npm install @shopify/i18next-shopify
```

Wiring up:

```js
import i18next from "i18next";
import ShopifyFormat from "@shopify/i18next-shopify";

i18next.use(ShopifyFormat).init(i18nextOptions);
```

## More complete sample

```js
import i18next from "i18next";
import ShopifyFormat from "@shopify/i18next-shopify";

i18next.use(ShopifyFormat).init({
  lng: "en",
  resources: {
    en: {
      translation: {
        hello: "Hello {{casual_name}}!",
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

i18next.t("hello", { casual_name: "Shopify" }); // -> Hello Shopify!
i18next.t("products", { count: 2 }); // -> I have 2 products!
```

## References

* [Shopify theme storefront locale files](https://shopify.dev/docs/themes/architecture/locales/storefront-locale-files#usage)
* [Shopify theme schema locale files](https://shopify.dev/docs/themes/architecture/locales/schema-locale-files)
* [Shopify app locale files](https://shopify.dev/docs/apps/checkout/best-practices/localizing-ui-extensions#how-it-works)
