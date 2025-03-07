import * as utils from './utils';

function getDefaults() {
  return {};
}

const MUSTACHE_FORMAT = /{{?\s*(\w+)\s*}}?/g;

class ShopifyFormat {
  constructor(options) {
    this.type = 'i18nFormat';

    this.init(null, options);
  }

  init(i18next, options) {
    const i18nextOptions =
      (i18next && i18next.options && i18next.options.i18nFormat) || {};
    this.options = utils.defaults(
      i18nextOptions,
      options,
      this.options || {},
      getDefaults(),
    );
    this.i18next = i18next;
  }

  // Implement custom interpolation logic
  // While i18next and Shopify's format both use the mustache syntax for interpolation,
  // Shopify uses the `ordinal` interpolation for ordinal pluralization, while i18next uses `count`.
  // parse(res, options, lng, ns, key, info)
  parse(res, options) {
    // const hadSuccessfulLookup = info && info.resolved && info.resolved.res;

    if (res === null) {
      return res;
    }

    // returnObjects parameter can cause objects to be resolved, rather than a single string
    // Perform parsing/interpolation on each of it's values
    if (typeof res === 'object') {
      const newRes = {};
      for (const [key, value] of Object.entries(res)) {
        newRes[key] = this.parse(value, options);
      }
      return newRes;
    }

    // Interpolations
    const matches = res.match(MUSTACHE_FORMAT);
    if (!matches) {
      return res;
    }

    let interpolated = res;
    matches.forEach((match) => {
      const interpolationKey = match.replace(MUSTACHE_FORMAT, '$1');

      let value =
        interpolationKey === 'ordinal'
          ? options.count || options.ordinal
          : options[interpolationKey];

      // Cardinal and Ordinal pluralizations should be formatted according to their locale
      // eg. "1,234,567th" instead of "1234567th"
      // However `count` and `ordinal` can also be used as a non-plural variable
      if (
        (interpolationKey === 'ordinal' || interpolationKey === 'count') &&
        typeof value === 'number'
      ) {
        value = new Intl.NumberFormat(this.i18next.resolvedLanguage).format(
          value,
        );
      }

      interpolated = utils.replaceValue(interpolated, match, value ?? '');
    });
    return interpolated;
  }

  // Add any other locations that should be searched first for an answer to the lookup
  // Add keys to `finalKeys` in reverse order (e.g., least specific -> most specific)
  // Useful when defining keys for pluralization or other context cases (e.g., grammatical gender)
  addLookupKeys(finalKeys, key, code, ns, options) {
    const needsPluralHandling = Boolean(
      (options.count !== undefined && typeof options.count !== 'string') ||
        typeof options.ordinal === 'number',
    );

    if (needsPluralHandling) {
      if (!Intl) {
        throw new Error(
          'Error: The application was unable to use the Intl API. This may be due to a missing or incomplete polyfill.',
        );
      }

      // Shopify uses the "ordinal" interpolation for ordinal pluralization (i.e., {{ordinal}}), users will expect to
      // do lookups with `i18n.t("key", { ordinal: 1 })`.
      // However, the i18next pluralization system uses the "count" option for both cardinal and ordinal pluralization
      // so users will expect to do lookups with `i18n.t("key", { count: 1, ordinal: true })`.
      // So we support either, using count if provided.
      // There is an edge case: if `ordinal` were set explicitly to 0, and `count` is provided, we behave as i18next
      // does, treating it as cardinal pluralization.
      const needsOrdinalHandling = Boolean(
        options.ordinal ||
          (options.ordinal === 0 && options.count === undefined),
      );

      const pluralRule = this.i18next.translator.pluralResolver.getRule(code, {
        ...options,
        ordinal: needsOrdinalHandling,
      });

      if (needsOrdinalHandling) {
        const ruleName = pluralRule.select(
          options.count === undefined ? options.ordinal : options.count,
        );
        const pluralSuffix = `${this.i18next.options.keySeparator}ordinal${this.i18next.options.keySeparator}${ruleName}`;
        finalKeys.push(key + pluralSuffix);
      } else {
        const ruleName = pluralRule.select(options.count);

        // Fallback to "other" key
        if (ruleName !== 'other') {
          const otherSubkey = `${this.i18next.options.keySeparator}other`;
          finalKeys.push(key + otherSubkey);
        }

        // Pluralization rule key
        const pluralSuffix = `${this.i18next.options.keySeparator}${ruleName}`;
        finalKeys.push(key + pluralSuffix);

        // Explicit "0" and "1" keys
        if (options.count === 0) {
          const explicit0Subkey = `${this.i18next.options.keySeparator}0`;
          finalKeys.push(key + explicit0Subkey);
        } else if (options.count === 1) {
          const explicit1Subkey = `${this.i18next.options.keySeparator}1`;
          finalKeys.push(key + explicit1Subkey);
        }
      }
    }

    return finalKeys;
  }
}

ShopifyFormat.type = 'i18nFormat';

export default ShopifyFormat;
