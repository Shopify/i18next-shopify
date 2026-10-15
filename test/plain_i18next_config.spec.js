import React from 'react';
import i18next from 'i18next';
import {render} from '@testing-library/react';
import {initReactI18next, Trans, useTranslation} from 'react-i18next';
import '@testing-library/jest-dom';

// The recipe documented in the README under "Using plain i18next instead".
// Keep the two in sync.

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

const resources = {
  en: {
    translation: {
      string: 'Hello world!',
      name: 'Joe',
      stringWithSingleMustache: 'Hello {name}!',
      stringWithInterpolation: 'Hello {{casualName}}! Today is {{date}}.',
      stringWithRepeatedInterpolation:
        'Hello {{casualName}}! Hello {{casualName}}!',
      stringWithNesting: '$t(string) Welcome, {{- name}}.',
      onlyPlaceholder: '{{name}}',
      adjacentPlaceholders: '{{first}}{{second}}',
      cardinalPluralization: {
        zero: 'I have no cars.',
        one: 'I have {{count}} car.',
        other: 'I have {{count}} cars.',
      },
      explicitZero: {
        0: 'I have no cars.',
        one: 'I have {{count}} car.',
        other: 'I have {{count}} cars.',
      },
      missingPluralForm: {
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
      nestedWithParams: {
        formalGreeting: 'Greetings {{name}}',
        informalGreeting: 'Sup {{name}}',
        deeper: {
          greeting: 'Hi {{name}}',
        },
      },
      userMessagesUnread: {
        one: 'Hello <1>{{name}}</1>, you have {{count}} unread message. <6>Go to message</6>.',
        other:
          'Hello <1>{{name}}</1>, you have {{count}} unread messages. <6>Go to messages</6>.',
      },
      userMessagesUnreadSimple: {
        one: 'Hello {{name}}, you have {{count}} unread message. {{messageLink}}',
        other:
          'Hello {{name}}, you have {{count}} unread messages. {{messageLink}}',
      },
      messageLinkText: {
        one: 'Go to message.',
        other: 'Go to messages.',
      },
    },
  },
  de: {
    translation: {
      cardinalPluralization: {
        one: 'Ich habe {{count}} Auto.',
        other: 'Ich habe {{count}} Autos.',
      },
    },
  },
};

// eslint-disable-next-line react/prop-types
function Link({to, children}) {
  return <a href={to}>{children}</a>;
}

function setupPlainI18next(lng = 'en') {
  const instance = i18next.createInstance();
  return instance
    .use(initReactI18next)
    .use(reactValues)
    .init({lng, resources, ...options})
    .then(() => instance);
}

describe('plain i18next configured as documented in the README', () => {
  let i18n;

  beforeEach(async () => {
    i18n = await setupPlainI18next();
  });

  describe('strings', () => {
    it('interpolates both mustache formats', () => {
      expect(
        i18n.t('stringWithInterpolation', {casualName: 'Joe', date: 'Monday'}),
      ).toBe('Hello Joe! Today is Monday.');
      expect(
        i18n.t('stringWithRepeatedInterpolation', {casualName: 'Joe'}),
      ).toBe('Hello Joe! Hello Joe!');
      expect(i18n.t('stringWithSingleMustache', {name: 'Joe'})).toBe(
        'Hello Joe!',
      );
    });

    it('renders null and undefined values as empty strings', () => {
      expect(i18n.t('stringWithSingleMustache', {name: null})).toBe('Hello !');
      expect(i18n.t('stringWithSingleMustache', {name: undefined})).toBe(
        'Hello !',
      );
    });

    it('keeps i18next nesting and raw interpolation available', () => {
      expect(i18n.t('stringWithNesting', {name: 'Joe'})).toBe(
        'Hello world! Welcome, Joe.',
      );
    });

    it('interpolates values when returnObjects is true', () => {
      expect(
        i18n.t('nestedWithParams', {name: 'Joe', returnObjects: true}),
      ).toStrictEqual({
        formalGreeting: 'Greetings Joe',
        informalGreeting: 'Sup Joe',
        deeper: {greeting: 'Hi Joe'},
      });
    });
  });

  describe('plurals', () => {
    it('handles nested cardinal pluralization keys', () => {
      expect(i18n.t('cardinalPluralization', {count: 0})).toBe(
        'I have no cars.',
      );
      expect(i18n.t('cardinalPluralization', {count: 1})).toBe('I have 1 car.');
      expect(i18n.t('cardinalPluralization', {count: 2})).toBe(
        'I have 2 cars.',
      );
      expect(i18n.t('cardinalPluralization', {count: 1234567})).toBe(
        'I have 1,234,567 cars.',
      );
      expect(i18n.t('cardinalPluralization.one', {count: 5})).toBe(
        'I have 5 car.',
      );
    });

    it('handles nested ordinal pluralization keys', () => {
      expect(i18n.t('ordinalPluralization', {count: 1, ordinal: true})).toBe(
        'This is my 1st car',
      );
      expect(i18n.t('ordinalPluralization', {count: 2, ordinal: true})).toBe(
        'This is my 2nd car',
      );
      expect(i18n.t('ordinalPluralization', {count: 3, ordinal: true})).toBe(
        'This is my 3rd car',
      );
      expect(
        i18n.t('ordinalPluralization', {count: 1234567, ordinal: true}),
      ).toBe('This is my 1,234,567th car');
    });

    it('formats count for the active language', async () => {
      const german = await setupPlainI18next('de');

      expect(german.t('cardinalPluralization', {count: 1234567})).toBe(
        'Ich habe 1.234.567 Autos.',
      );
    });
  });

  describe('documented differences from the plugin', () => {
    it('does not support the ordinal number shorthand', () => {
      expect(i18n.t('ordinalPluralization', {ordinal: 2})).not.toBe(
        'This is my 2nd car',
      );
    });

    it('does not look up an explicit "0" key', () => {
      expect(i18n.t('explicitZero', {count: 0})).toBe('I have 0 cars.');
    });

    it('does not fall back to "other" when a plural form is missing', () => {
      expect(i18n.t('missingPluralForm', {count: 1})).not.toBe(
        'I have 1 cars.',
      );
    });
  });

  describe('React elements as replacement values', () => {
    it('returns an array with the element keyed by its variable name', () => {
      const result = i18n.t('stringWithSingleMustache', {
        name: <strong>{i18n.t('name')}</strong>,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Hello ');
      expect(result[1].type).toBe('strong');
      expect(result[1].key).toBe('name-0-0');
      expect(result[2]).toBe('!');
    });

    it('gives repeated elements distinct keys', () => {
      const result = i18n.t('stringWithRepeatedInterpolation', {
        casualName: <strong>{i18n.t('name')}</strong>,
      });

      expect(result[1].key).toBe('casualName-0-0');
      expect(result[3].key).toBe('casualName-1-0');
    });

    it('keeps an existing element key', () => {
      const element = <strong key="mine">{i18n.t('name')}</strong>;

      const result = i18n.t('stringWithSingleMustache', {name: element});

      expect(result[1]).toBe(element);
    });

    it('splices arrays into the result', () => {
      expect(
        i18n.t('stringWithSingleMustache', {name: ['Joe', 'Jane']}),
      ).toStrictEqual(['Hello ', 'Joe', 'Jane', '!']);
    });

    it('omits empty strings around placeholders at the edges', () => {
      const name = <strong>{i18n.t('name')}</strong>;
      const first = <em>{i18n.t('name')}</em>;

      expect(i18n.t('onlyPlaceholder', {name})).toHaveLength(1);
      expect(
        i18n.t('adjacentPlaceholders', {first, second: name}),
      ).toHaveLength(2);
    });

    it('reads values from the replace option', () => {
      const result = i18n.t('stringWithSingleMustache', {
        replace: {name: <strong>{i18n.t('name')}</strong>},
      });

      expect(result[1].type).toBe('strong');
    });

    it('restores elements in nested returnObjects results', () => {
      const result = i18n.t('nestedWithParams', {
        name: <strong>{i18n.t('name')}</strong>,
        returnObjects: true,
      });

      expect(result.formalGreeting[1].type).toBe('strong');
      expect(result.deeper.greeting[1].type).toBe('strong');
    });

    it('does not let string values forge a marker', () => {
      expect(
        i18n.t('stringWithSingleMustache', {name: '\u0000lng\u0000'}),
      ).toBe('Hello lng!');
    });
  });

  describe('react-i18next', () => {
    it('renders elements passed to t() from useTranslation', () => {
      const MyComponent = () => {
        const {t} = useTranslation();
        const count = 1;

        return (
          <>
            {t('userMessagesUnreadSimple', {
              count,
              name: <strong title={t('string')}>{t('name')}</strong>,
              messageLink: (
                <Link to="/msgs">{t('messageLinkText', {count})}</Link>
              ),
            })}
          </>
        );
      };

      const {container} = render(<MyComponent />);
      expect(container).toHaveTextContent(
        'Hello Joe, you have 1 unread message. Go to message.',
      );
      expect(container.querySelector('strong')).toHaveTextContent('Joe');
      expect(container.querySelector('strong')).toHaveAttribute(
        'title',
        'Hello world!',
      );
      expect(container.querySelector('a')).toHaveAttribute('href', '/msgs');
    });

    it('keeps working with Trans and values', () => {
      const {container} = render(
        <Trans
          i18nKey="userMessagesUnread"
          count={2}
          values={{name: 'Joe'}}
          components={{1: <strong />, 6: <Link to="/msgs" />}}
        />,
      );

      expect(container).toHaveTextContent(
        'Hello Joe, you have 2 unread messages. Go to messages.',
      );
      expect(container.querySelector('strong')).toHaveTextContent('Joe');
      expect(container.querySelector('a')).toHaveAttribute('href', '/msgs');
    });

    it('keeps working with Trans, count and children', () => {
      const count = 1234567;
      const {container} = render(
        /* eslint-disable @shopify/jsx-no-hardcoded-content */
        <Trans i18nKey="cardinalPluralization" count={count}>
          I have {{count}} cars.
        </Trans>,
        /* eslint-enable @shopify/jsx-no-hardcoded-content */
      );

      expect(container).toHaveTextContent('I have 1,234,567 cars.');
    });
  });
});
