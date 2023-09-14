import React from 'react';
import i18next from 'i18next';
import {render} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';
import {initReactI18next, Trans, useTranslation} from 'react-i18next';
import '@testing-library/jest-dom';

import ShopifyFormat from '../src';

// eslint-disable-next-line react/prop-types
function Link({to, children}) {
  return <a href={to}>{children}</a>;
}

describe('shopify format with react-i18next (t)', () => {
  beforeEach(() => {
    i18next
      .use(initReactI18next)
      .use(ShopifyFormat)
      .init({
        lng: 'en',
        resources: {
          en: {
            translation: {
              string: 'Hello world!',
              string_with_single_mustache: 'Hello {name}!',
              string_with_interpolation:
                'Hello {{casual_name}}! Today is {{date}}.',
              string_with_repeated_interpolation:
                'Hello {{casual_name}}! Hello {{casual_name}}!',
              cardinal_pluralization: {
                0: 'I have no cars.',
                one: 'I have {{count}} car.',
                other: 'I have {{count}} cars.',
              },
              cardinal_pluralization_with_missing_keys: {
                other: 'I have {{count}} cars.',
              },
              ordinal_pluralization: {
                ordinal: {
                  one: 'This is my {{ordinal}}st car',
                  two: 'This is my {{ordinal}}nd car',
                  few: 'This is my {{ordinal}}rd car',
                  other: 'This is my {{ordinal}}th car',
                },
              },
              nested_level_1: {
                nested_level_2: 'Nested content',
              },
              nested_with_params: {
                formal_greeting: 'Greetings {name}',
                informal_greeting: 'Sup {name}',
              },
            },
          },
        },
      });
  });

  it('handles basic lookups', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('string')).toBe('Hello world!');
    expect(
      t('string_with_interpolation', {
        casual_name: 'Joe',
        date: 'Monday',
      }),
    ).toBe('Hello Joe! Today is Monday.');
    expect(
      t('string_with_repeated_interpolation', {
        casual_name: 'Joe',
      }),
    ).toBe('Hello Joe! Hello Joe!');
    expect(
      i18next.t('string_with_single_mustache', {
        name: 'Joe',
      }),
    ).toBe('Hello Joe!');
  });

  it('does not fail when given excess values', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(
      t('string_with_interpolation', {
        casual_name: 'Joe',
        date: 'Monday',
        unnecessary: 'This value is not mentioned by any interpolation',
      }),
    ).toBe('Hello Joe! Today is Monday.');
  });

  it('handles cardinal pluralization lookups', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('cardinal_pluralization', {count: 1})).toBe('I have 1 car.');
    expect(t('cardinal_pluralization', {count: 2})).toBe('I have 2 cars.');
  });

  it('falls back to the `other` key if the proper cardinal pluralization key is missing', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(
      // A count of 1 in `en` should use the `one` key, but it's missing.
      // It should fall back to the `other` key.
      t('cardinal_pluralization_with_missing_keys', {count: 1}),
    ).toBe('I have 1 cars.');
  });

  it('allows explicit lookup of cardinal pluralization subkeys', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('cardinal_pluralization.one', {count: 0})).toBe('I have 0 car.');
  });

  it('prefers explicit 0 keys in cardinal pluralization lookups', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('cardinal_pluralization', {count: 0})).toBe('I have no cars.');
  });

  it('handles ordinal pluralization lookups (using ordinal: true)', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('ordinal_pluralization', {count: 1, ordinal: true})).toBe(
      'This is my 1st car',
    );
    expect(t('ordinal_pluralization', {count: 2, ordinal: true})).toBe(
      'This is my 2nd car',
    );
    expect(t('ordinal_pluralization', {count: 3, ordinal: true})).toBe(
      'This is my 3rd car',
    );
    expect(t('ordinal_pluralization', {count: 4, ordinal: true})).toBe(
      'This is my 4th car',
    );
  });

  it('handles ordinal pluralization lookups (using ordinal: <number>)', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('ordinal_pluralization', {ordinal: 1})).toBe('This is my 1st car');
    expect(t('ordinal_pluralization', {ordinal: 2})).toBe('This is my 2nd car');
    expect(t('ordinal_pluralization', {ordinal: 3})).toBe('This is my 3rd car');
    expect(t('ordinal_pluralization', {ordinal: 4})).toBe('This is my 4th car');
  });

  it('allows explicit lookup of ordinal pluralization subkeys', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(
      t('ordinal_pluralization.ordinal.one', {
        count: 2,
        ordinal: true,
      }),
    ).toBe('This is my 2st car');
    expect(
      t('ordinal_pluralization.ordinal.one', {
        ordinal: 2,
      }),
    ).toBe('This is my 2st car');
  });

  it('handles null and undefined keys', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(
      t('string_with_single_mustache', {
        name: null,
      }),
    ).toBe('Hello !');
    expect(
      t('string_with_single_mustache', {
        name: undefined,
      }),
    ).toBe('Hello !');
  });

  it('handles returnObjects: true', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(t('nested_level_1', {returnObjects: true})).toStrictEqual({
      nested_level_2: 'Nested content',
    });
  });

  it('handles nested interpolation with returnObjects: true', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(
      t('nested_with_params', {name: 'Joe', returnObjects: true}),
    ).toStrictEqual({
      formal_greeting: 'Greetings Joe',
      informal_greeting: 'Sup Joe',
    });
  });

  it('matches expect.anything() in interpolated variables', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    expect(
      t('string_with_single_mustache', {
        name: <strong>Joe</strong>,
      }),
    ).toStrictEqual(
      t('string_with_single_mustache', {name: expect.anything()}),
    );
  });

  it('accepts arrays as interpolated variables', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;
    expect(
      t('string_with_single_mustache', {
        name: ['Joe', 'Jane'],
      }),
    ).toStrictEqual(['Hello ', 'Joe', 'Jane', '!']);
  });
});

describe('with react-i18next (Trans)', () => {
  beforeEach(() => {
    i18next
      .use(initReactI18next)
      .use(ShopifyFormat)
      .init({
        lng: 'en',
        resources: {
          en: {
            translation: {
              string: 'Hello world!',
              string_with_single_mustache: 'Hello {name}!',
              string_with_interpolation:
                'Hello {{casual_name}}! Today is {{date}}.',
              string_with_repeated_interpolation:
                'Hello {{casual_name}}! Hello {{casual_name}}!',
              cardinal_pluralization: {
                0: 'I have no cars.',
                one: 'I have {{count}} car.',
                other: 'I have {{count}} cars.',
              },
              cardinal_pluralization_with_missing_keys: {
                other: 'I have {{count}} cars.',
              },
              ordinal_pluralization: {
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
    const TestComponent = () => (
      <>
        <Trans i18nKey="string" />
        <Trans
          i18nKey="string_with_interpolation"
          values={{casual_name: 'Joe', date: 'Monday'}}
        />
        <Trans
          i18nKey="string_with_repeated_interpolation"
          values={{casual_name: 'Joe'}}
        />
        <Trans i18nKey="string_with_single_mustache" values={{name: 'Joe'}} />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('Hello world!');
    expect(container.childNodes[1]).toHaveTextContent(
      'Hello Joe! Today is Monday.',
    );
    expect(container.childNodes[2]).toHaveTextContent('Hello Joe! Hello Joe!');
    expect(container.childNodes[3]).toHaveTextContent('Hello Joe!');
  });

  it('does not fail when given excess values', () => {
    const TestComponent = () => (
      <>
        <Trans
          i18nKey="string_with_interpolation"
          values={{
            casual_name: 'Joe',
            date: 'Monday',
            unnecessary: 'This value is not mentioned by any interpolation',
          }}
        />
      </>
    );
    const {container} = render(<TestComponent />);

    expect(container.childNodes[0]).toHaveTextContent(
      'Hello Joe! Today is Monday.',
    );
  });

  it('handles cardinal pluralization lookups', () => {
    const TestComponent = () => (
      <>
        <Trans i18nKey="cardinal_pluralization" count={1} />
        <Trans i18nKey="cardinal_pluralization" count={2} />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('I have 1 car.');
    expect(container.childNodes[1]).toHaveTextContent('I have 2 cars.');
  });

  it('falls back to the `other` key if the proper cardinal pluralization key is missing', () => {
    const TestComponent = () => (
      <>
        <Trans i18nKey="cardinal_pluralization_with_missing_keys" count={1} />
      </>
    );
    const {container} = render(<TestComponent />);
    // A count of 1 in `en` should use the `one` key, but it's missing.
    expect(container.childNodes[0]).toHaveTextContent('I have 1 cars.');
  });

  it('allows explicit lookup of cardinal pluralization subkeys', () => {
    const TestComponent = () => (
      <>
        <Trans i18nKey="cardinal_pluralization.one" count={0} />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('I have 0 car.');
  });

  it('prefers explicit 0 keys in cardinal pluralization lookups', () => {
    const TestComponent = () => (
      <>
        <Trans i18nKey="cardinal_pluralization" count={0} />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('I have no cars.');
  });

  it('handles ordinal pluralization lookups (using ordinal: true)', () => {
    const TestComponent = () => (
      <>
        <Trans
          i18nKey="ordinal_pluralization"
          values={{count: 1, ordinal: true}}
        />
        <Trans
          i18nKey="ordinal_pluralization"
          values={{count: 2, ordinal: true}}
        />
        <Trans
          i18nKey="ordinal_pluralization"
          values={{count: 3, ordinal: true}}
        />
        <Trans
          i18nKey="ordinal_pluralization"
          values={{count: 4, ordinal: true}}
        />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('This is my 1st car');
    expect(container.childNodes[1]).toHaveTextContent('This is my 2nd car');
    expect(container.childNodes[2]).toHaveTextContent('This is my 3rd car');
    expect(container.childNodes[3]).toHaveTextContent('This is my 4th car');
  });

  it('handles ordinal pluralization lookups (using ordinal: <number>)', () => {
    const TestComponent = () => (
      <>
        <Trans i18nKey="ordinal_pluralization" values={{ordinal: 1}} />
        <Trans i18nKey="ordinal_pluralization" values={{ordinal: 2}} />
        <Trans i18nKey="ordinal_pluralization" values={{ordinal: 3}} />
        <Trans i18nKey="ordinal_pluralization" values={{ordinal: 4}} />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('This is my 1st car');
    expect(container.childNodes[1]).toHaveTextContent('This is my 2nd car');
    expect(container.childNodes[2]).toHaveTextContent('This is my 3rd car');
    expect(container.childNodes[3]).toHaveTextContent('This is my 4th car');
  });

  it('allows explicit lookup of ordinal pluralization subkeys', () => {
    const TestComponent = () => (
      <>
        <Trans
          i18nKey="ordinal_pluralization.ordinal.one"
          count={2}
          values={{ordinal: true}}
        />
        <Trans
          i18nKey="ordinal_pluralization.ordinal.one"
          values={{ordinal: 2}}
        />
      </>
    );
    const {container} = render(<TestComponent />);
    expect(container.childNodes[0]).toHaveTextContent('This is my 2st car');
    expect(container.childNodes[1]).toHaveTextContent('This is my 2st car');
  });
});

describe('with react-i18next (Trans with interpolation)', () => {
  beforeEach(() => {
    i18next
      .use(ShopifyFormat)
      .use(initReactI18next)
      .init({
        lng: 'en',
        resources: {
          en: {
            translation: {
              nameTitle: 'This is your name',
              // This isn't valid syntax for app extensions, but we include it here to make sure that this plugin
              // doesn't break things when used with react-i18next in embedded apps.
              userMessagesUnread: {
                one: 'Hello <1>{{name}}</1>, you have {{count}} unread message. <6>Go to message</6>.',
                other:
                  'Hello <1>{{name}}</1>, you have {{count}} unread messages. <6>Go to messages</6>.',
              },
              // This isn't valid syntax for app extensions, but we include it here to make sure that this plugin
              // doesn't break things when used with react-i18next in embedded apps.
              userMessagesUnreadExplicit: {
                one: 'Hello <Name>{{name}}</Name>, you have {{count}} unread message. <MessagesLink>Go to message</MessagesLink>.',
                other:
                  'Hello <Name>{{name}}</Name>, you have {{count}} unread messages. <MessagesLink>Go to messages</MessagesLink>.',
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
        },
      });
  });

  it('handles interpolation of React components using Trans component with numbered component tags', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    const MyComponent = () => {
      const name = 'Joe';
      const count = 1;

      return (
        <Trans i18nKey="userMessagesUnread" count={count} values={{name}}>
          Hello <strong title={t('nameTitle')}>{{name}}</strong>, you have{' '}
          {{count}} unread message. <Link to="/msgs">Go to messages</Link>.
        </Trans>
      );
    };

    const {container} = render(<MyComponent />);
    expect(container).toHaveTextContent(
      'Hello Joe, you have 1 unread message. Go to message.',
    );
    expect(container).toMatchSnapshot();
  });

  it('handles interpolation of React components using Trans component with explicit component tags', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    const MyComponent = () => {
      const count = 1;
      const name = 'Joe';

      return (
        <Trans
          i18nKey="userMessagesUnreadExplicit"
          count={count}
          values={{
            name,
          }}
          components={{
            Name: <strong title={t('nameTitle')} />,
            MessagesLink: <Link to="/msgs" />,
          }}
        />
      );
    };

    const {container} = render(<MyComponent />);
    expect(container).toHaveTextContent(
      'Hello Joe, you have 1 unread message. Go to message.',
    );
    expect(container).toMatchSnapshot();
  });

  it('handles interpolation of React components using t() function with React components passed as interpolation variables', () => {
    const {result} = renderHook(() => useTranslation('translation'));
    const {t} = result.current;

    const MyComponent = () => {
      const count = 1;
      const name = 'Joe';

      return (
        <>
          {t('userMessagesUnreadSimple', {
            count,
            name: <strong title={t('nameTitle')}>{name}</strong>,
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
    expect(container).toMatchSnapshot();
  });
});
