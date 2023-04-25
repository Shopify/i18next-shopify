import * as utils from "./utils.js";

function getDefaults() {
  return {};
}

class ShopifyFormat {
  constructor(options) {
    this.type = "i18nFormat";

    this.init(null, options);
  }

  init(i18next, options) {
    const i18nextOptions =
      (i18next && i18next.options && i18next.options.i18nFormat) || {};
    this.options = utils.defaults(
      i18nextOptions,
      options,
      this.options || {},
      getDefaults()
    );
    this.i18next = i18next;
  }

  // i18next is roughly a superset of Shopify's format.
  // TODO: Implement this to make sure that we enforce just the subset
  // TODO: Implement this to make ordinal pluralization work

  // Implement custom interpolation logic
  // While i18next and Shopify's format both use the mustache syntax for interpolation,
  // Shopify uses the `ordinal` interpolation for ordinal pluralization, while i18next uses `count`.
  parse(res, options, lng, ns, key, info) {
    const hadSuccessfulLookup = info && info.resolved && info.resolved.res;

    // Interpolations
    const MUSTACHE_FORMAT = /{{\s*(\w+)\s*}}/g;
    const matches = res.match(MUSTACHE_FORMAT);
    if (!matches) return res;
    matches.forEach((match) => {
      const interpolation_key = match.replace(MUSTACHE_FORMAT, "$1");
      const value =
        interpolation_key === "ordinal"
          ? options["count"] || options["ordinal"]
          : options[interpolation_key];
      if (value !== undefined) {
        res = res.replace(match, value);
      }
    });
    return res;
  }

  // Add any other locations that should be searched first for an answer to the lookup
  // Add keys to `finalKeys` in reverse order (e.g., least specific -> most specific)
  // Useful when defining keys for pluralization or other context cases (e.g., grammatical gender)
  addLookupKeys(finalKeys, key, code, ns, options) {
    const needsPluralHandling =
      (options.count !== undefined && typeof options.count !== "string") ||
      typeof options.ordinal == "number";

    if (needsPluralHandling) {
      if (!this.i18next.translator.pluralResolver.shouldUseIntlApi()) {
        throw new Error("We need that to exist"); // TODO
      }

      // Shopify uses the "ordinal" interpolation for ordinal pluralization (i.e., {{ordinal}}), users will expect to
      // do lookups with `i18n.t("key", { ordinal: 1 })`.
      // However, the i18next pluralization system uses the "count" option for both cardinal and ordinal pluralization
      // so users will expect to do lookups with `i18n.t("key", { count: 1, ordinal: true })`.
      // So we support either, using count if provided.
      // There is an edge case: if `ordinal` were set explicitly to 0, and `count` is provided, we behave as i18next
      // does, treating it as cardinal pluralization.
      const needsOrdinalHandling =
        options.ordinal ||
        (options.ordinal == 0 && options.count === undefined);

      const pluralRule = this.i18next.translator.pluralResolver.getRule(code, {
        ...options,
        ordinal: needsOrdinalHandling,
      });

      if (needsOrdinalHandling) {
        const ruleName = pluralRule.select(
          options.count !== undefined ? options.count : options.ordinal
        );
        const pluralSuffix = `${this.i18next.options.keySeparator}ordinal${this.i18next.options.keySeparator}${ruleName}`;
        finalKeys.push(key + pluralSuffix);
      } else {
        const ruleName = pluralRule.select(options.count);

        // Fallback to "other" key
        if (ruleName !== "other") {
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

  getResource(lng, _ns, key, options) {
    // This is a copy of
    // https://github.com/i18next/i18next/blob/ac4b6701c3ce9596e4eb88f5d774ca66f05d71fb/src/ResourceStore.js#L34-L56
    // except we ignore the namespace, since Shopify's format doesn't have namespaces.
    const keySeparator =
      options.keySeparator !== undefined
        ? options.keySeparator
        : this.i18next.translator.resourceStore.options.keySeparator;

    const ignoreJSONStructure =
      options.ignoreJSONStructure !== undefined
        ? options.ignoreJSONStructure
        : this.i18next.translator.resourceStore.options.ignoreJSONStructure;

    let path = [lng];
    if (key && typeof key !== "string") path = path.concat(key);
    if (key && typeof key === "string")
      path = path.concat(keySeparator ? key.split(keySeparator) : key);

    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
    }

    const result = utils.getPath(
      this.i18next.translator.resourceStore.data,
      path
    );
    if (result || !ignoreJSONStructure || typeof key !== "string")
      return result;

    return utils.deepFind(
      this.i18next.translator.resourceStore.data[lng],
      key,
      keySeparator
    );
  }
}

ShopifyFormat.type = "i18nFormat";

export default ShopifyFormat;
