import i18next from 'i18next';

import ShopifyFormat from '../src';

describe('shopify format', () => {
  describe('addLookupKeys', () => {
    beforeEach(() => {
      i18next.use(ShopifyFormat).init({lng: 'en'});
    });

    it('does not add any keys for a basic key', () => {
      const shopify = new ShopifyFormat();
      const finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {});
      expect(finalKeys).toStrictEqual([]);
    });

    it('adds cardinal pluralization keys relevant to the count', () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {count: 0});
      expect(finalKeys).toStrictEqual(['key.other', 'key.0']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {count: 1});
      expect(finalKeys).toStrictEqual(['key.other', 'key.one', 'key.1']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {count: 2});
      expect(finalKeys).toStrictEqual(['key.other']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'ar-AR', undefined, {count: 0});
      expect(finalKeys).toStrictEqual(['key.other', 'key.zero', 'key.0']);
    });

    it('adds ordinal pluralization keys relevant to the count (ordinal: true)', () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        count: 0,
        ordinal: true,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.other']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        count: 1,
        ordinal: true,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.one']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        count: 2,
        ordinal: true,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.two']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        count: 3,
        ordinal: true,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.few']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'ar-AR', undefined, {
        count: 0,
        ordinal: true,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.other']);
    });

    it('adds ordinal pluralization keys relevant to the count (ordinal: <number>)', () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      let finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        ordinal: 0,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.other']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        ordinal: 1,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.one']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        ordinal: 2,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.two']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        ordinal: 3,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.few']);

      finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'ar-AR', undefined, {
        ordinal: 0,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.other']);
    });

    it('uses `count` in preference to `ordinal`', () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      const finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        ordinal: 4,
        count: 1,
      });
      expect(finalKeys).toStrictEqual(['key.ordinal.one']);
    });

    it('adds cardinal pluralization keys in edge case conflict', () => {
      const shopify = new ShopifyFormat();
      shopify.init(i18next, {});
      const finalKeys = [];
      shopify.addLookupKeys(finalKeys, 'key', 'en', undefined, {
        ordinal: 0,
        count: 1,
      });
      expect(finalKeys).toStrictEqual(['key.other', 'key.one', 'key.1']);
    });
  });

  describe('with i18next', () => {
    beforeEach(() => {
      i18next.use(ShopifyFormat).init({
        lng: 'en',
        resources: {
          en: {
            translation: {
              string: 'Hello world!',
              stringWithSingleMustache: 'Hello {name}!',
              stringWithInterpolation:
                'Hello {{casualName}}! Today is {{date}}.',
              stringWithRepeatedInterpolation:
                'Hello {{casualName}}! Hello {{casualName}}!',
              nonPluralCount: 'The count is {count}.',
              cardinalPluralization: {
                0: 'I have no cars.',
                one: 'I have {{count}} car.',
                other: 'I have {{count}} cars.',
              },
              cardinalPluralizationWithMissingKeys: {
                other: 'I have {{count}} cars.',
              },
              ordinalPluralization: {
                ordinal: {
                  one: 'This is my {{ordinal}}st car',
                  two: 'This is my {{ordinal}}nd car',
                  few: 'This is my {{ordinal}}rd car',
                  other: 'This is my {{ordinal}}th car',
                },
              },
            },
          },
        },
      });
    });

    it('handles basic lookups', () => {
      expect(i18next.t('string')).toBe('Hello world!');
      expect(
        i18next.t('stringWithInterpolation', {
          casualName: 'Joe',
          date: 'Monday',
        }),
      ).toBe('Hello Joe! Today is Monday.');
      expect(
        i18next.t('stringWithRepeatedInterpolation', {
          casualName: 'Joe',
        }),
      ).toBe('Hello Joe! Hello Joe!');
      expect(
        i18next.t('stringWithSingleMustache', {
          name: 'Joe',
        }),
      ).toBe('Hello Joe!');
    });

    it('does not fail when given excess values', () => {
      expect(
        i18next.t('stringWithInterpolation', {
          casualName: 'Joe',
          date: 'Monday',
          unnecessary: 'This value is not mentioned by any interpolation',
        }),
      ).toBe('Hello Joe! Today is Monday.');
    });

    it('handles cardinal pluralization lookups', () => {
      expect(i18next.t('cardinalPluralization', {count: 1})).toBe(
        'I have 1 car.',
      );
      expect(i18next.t('cardinalPluralization', {count: 2})).toBe(
        'I have 2 cars.',
      );
    });

    it('formats cardinal pluralization according to locale format', () => {
      expect(i18next.t('cardinalPluralization', {count: 5000})).toBe(
        'I have 5,000 cars.',
      );
    });

    it('does not format count as plural if passed as string', () => {
      expect(i18next.t('nonPluralCount', {count: '5_000'})).toBe(
        'The count is 5_000.',
      );
    });

    it('falls back to the `other` key if the proper cardinal pluralization key is missing', () => {
      expect(
        // A count of 1 in `en` should use the `one` key, but it's missing.
        // It should fall back to the `other` key.
        i18next.t('cardinalPluralizationWithMissingKeys', {count: 1}),
      ).toBe('I have 1 cars.');
    });

    it('allows explicit lookup of cardinal pluralization subkeys', () => {
      expect(i18next.t('cardinalPluralization.one', {count: 0})).toBe(
        'I have 0 car.',
      );
    });

    it('prefers explicit 0 keys in cardinal pluralization lookups', () => {
      expect(i18next.t('cardinalPluralization', {count: 0})).toBe(
        'I have no cars.',
      );
    });

    it('handles ordinal pluralization lookups (using ordinal: true)', () => {
      expect(i18next.t('ordinalPluralization', {count: 1, ordinal: true})).toBe(
        'This is my 1st car',
      );
      expect(i18next.t('ordinalPluralization', {count: 2, ordinal: true})).toBe(
        'This is my 2nd car',
      );
      expect(i18next.t('ordinalPluralization', {count: 3, ordinal: true})).toBe(
        'This is my 3rd car',
      );
      expect(i18next.t('ordinalPluralization', {count: 4, ordinal: true})).toBe(
        'This is my 4th car',
      );
    });

    it('formats ordinal pluralization according to locale format', () => {
      expect(
        i18next.t('ordinalPluralization', {count: 5000, ordinal: true}),
      ).toBe('This is my 5,000th car');
    });

    it('handles ordinal pluralization lookups (using ordinal: <number>)', () => {
      expect(i18next.t('ordinalPluralization', {ordinal: 1})).toBe(
        'This is my 1st car',
      );
      expect(i18next.t('ordinalPluralization', {ordinal: 2})).toBe(
        'This is my 2nd car',
      );
      expect(i18next.t('ordinalPluralization', {ordinal: 3})).toBe(
        'This is my 3rd car',
      );
      expect(i18next.t('ordinalPluralization', {ordinal: 4})).toBe(
        'This is my 4th car',
      );
    });

    it('allows explicit lookup of ordinal pluralization subkeys', () => {
      expect(
        i18next.t('ordinalPluralization.ordinal.one', {
          count: 2,
          ordinal: true,
        }),
      ).toBe('This is my 2st car');
      expect(
        i18next.t('ordinalPluralization.ordinal.one', {
          ordinal: 2,
        }),
      ).toBe('This is my 2st car');
    });
  });
});
