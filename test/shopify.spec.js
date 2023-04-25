import areIntlLocalesSupported from "intl-locales-supported";
if (global.Intl) {
  if (!areIntlLocalesSupported(["en", "ar-AR"])) {
    const polyFill = require("intl");
    Intl.NumberFormat = polyFill.NumberFormat;
    Intl.DateTimeFormat = polyFill.DateTimeFormat;
  }
} else {
  global.Intl = require("intl");
}

import ShopifyFormat from "../src";
import i18next from "i18next";

describe("shopify format", () => {
  describe("addLookupKeys", () => {
    beforeEach(() => {
      i18next.use(ShopifyFormat).init({ lng: "en" });
    });

    it("should not add any keys for a basic key", () => {
      const shopify = new ShopifyFormat();
      const finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {});
      expect(finalKeys).toEqual([]);
    });

    it("should add cardinal pluralization keys relevant to the count", () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, { count: 0 });
      expect(finalKeys).toEqual(["key.other", "key.0"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, { count: 1 });
      expect(finalKeys).toEqual(["key.other", "key.one", "key.1"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, { count: 2 });
      expect(finalKeys).toEqual(["key.other"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "ar-AR", undefined, { count: 0 });
      expect(finalKeys).toEqual(["key.other", "key.zero", "key.0"]);
    });

    it("should add ordinal pluralization keys relevant to the count (ordinal: true)", () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        count: 0,
        ordinal: true,
      });
      expect(finalKeys).toEqual(["key.ordinal.other"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        count: 1,
        ordinal: true,
      });
      expect(finalKeys).toEqual(["key.ordinal.one"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        count: 2,
        ordinal: true,
      });
      expect(finalKeys).toEqual(["key.ordinal.two"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        count: 3,
        ordinal: true,
      });
      expect(finalKeys).toEqual(["key.ordinal.few"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "ar-AR", undefined, {
        count: 0,
        ordinal: true,
      });
      expect(finalKeys).toEqual(["key.ordinal.other"]);
    });

    it("should add ordinal pluralization keys relevant to the count (ordinal: <number>)", () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        ordinal: 0,
      });
      expect(finalKeys).toEqual(["key.ordinal.other"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        ordinal: 1,
      });
      expect(finalKeys).toEqual(["key.ordinal.one"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        ordinal: 2,
      });
      expect(finalKeys).toEqual(["key.ordinal.two"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        ordinal: 3,
      });
      expect(finalKeys).toEqual(["key.ordinal.few"]);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "ar-AR", undefined, {
        ordinal: 0,
      });
      expect(finalKeys).toEqual(["key.ordinal.other"]);
    });

    it("should use `count` in preference to `ordinal`", () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        ordinal: 4,
        count: 1,
      });
      expect(finalKeys).toEqual(["key.ordinal.one"]);
    });

    it("should add cardinal pluralization keys in edge case conflict", () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, "key", "en", undefined, {
        ordinal: 0,
        count: 1,
      });
      expect(finalKeys).toEqual(["key.other", "key.one", "key.1"]);
    });
  });

  describe("with i18next", () => {
    beforeEach(() => {
      i18next.use(ShopifyFormat).init({
        lng: "en",
        resources: {
          en: {
            string: "Hello world!",
            string_with_interpolation:
              "Hello {{casual_name}}! Today is {{date}}.",
            string_with_repeated_interpolation:
              "Hello {{casual_name}}! Hello {{casual_name}}!",
            cardinal_pluralization: {
              0: "I have no cars.",
              one: "I have {{count}} car.",
              other: "I have {{count}} cars.",
            },
            cardinal_pluralization_with_missing_keys: {
              other: "I have {{count}} cars.",
            },
            ordinal_pluralization: {
              ordinal: {
                one: "This is my {{ordinal}}st car",
                two: "This is my {{ordinal}}nd car",
                few: "This is my {{ordinal}}rd car",
                other: "This is my {{ordinal}}th car",
              },
            },
          },
        },
      });
    });

    it("should parse", () => {
      expect(i18next.t("string")).toEqual("Hello world!");
      expect(
        i18next.t("string_with_interpolation", {
          casual_name: "Joe",
          date: "Monday",
        })
      ).toEqual("Hello Joe! Today is Monday.");
      expect(
        i18next.t("string_with_repeated_interpolation", {
          casual_name: "Joe",
        })
      ).toEqual("Hello Joe! Hello Joe!");
      expect(i18next.t("cardinal_pluralization.0", { count: 0 })).toEqual(
        "I have no cars."
      );
      expect(i18next.t("cardinal_pluralization", { count: 0 })).toEqual(
        "I have no cars."
      );
      expect(i18next.t("cardinal_pluralization", { count: 1 })).toEqual(
        "I have 1 car."
      );
      expect(i18next.t("cardinal_pluralization", { count: 2 })).toEqual(
        "I have 2 cars."
      );
      expect(
        i18next.t("cardinal_pluralization_with_missing_keys", { count: 1 })
      ).toEqual("I have 1 cars.");
      expect(
        i18next.t("ordinal_pluralization", { count: 1, ordinal: true })
      ).toEqual("This is my 1st car");
      expect(
        i18next.t("ordinal_pluralization", { count: 2, ordinal: true })
      ).toEqual("This is my 2nd car");
      expect(
        i18next.t("ordinal_pluralization", { count: 3, ordinal: true })
      ).toEqual("This is my 3rd car");
      expect(
        i18next.t("ordinal_pluralization", { count: 4, ordinal: true })
      ).toEqual("This is my 4th car");
      expect(i18next.t("ordinal_pluralization", { ordinal: 1 })).toEqual(
        "This is my 1st car"
      );
      expect(i18next.t("ordinal_pluralization", { ordinal: 2 })).toEqual(
        "This is my 2nd car"
      );
      expect(i18next.t("ordinal_pluralization", { ordinal: 3 })).toEqual(
        "This is my 3rd car"
      );
      expect(i18next.t("ordinal_pluralization", { ordinal: 4 })).toEqual(
        "This is my 4th car"
      );
    });
  });
});
