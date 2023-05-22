import React from 'react';

import {replaceValue} from '../src/utils';

describe('Utils', () => {
  describe('replaceValue', () => {
    it('replaces a string with a single level of interpolation', () => {
      expect(replaceValue('Hello, {{name}}!', '{{name}}', 'John')).toBe(
        'Hello, John!',
      );
    });

    it('replaces a string within an array with a single level of interpolation', () => {
      expect(
        replaceValue(['Blah! ', 'Hello, {{name}}!'], '{{name}}', 'John'),
      ).toStrictEqual(['Blah! ', 'Hello, John!']);
    });

    it('replaces a string with React elements', () => {
      expect(
        replaceValue('Hello, {{name}}!', '{{name}}', <span>John</span>),
      ).toMatchSnapshot();
    });

    it('returns the original string when there is no match with given React elements', () => {
      expect(
        replaceValue('Hello, {{name}}!', '{{no_match}}', <span>John</span>),
      ).toBe('Hello, {{name}}!');
    });

    it('replaces a string within nested React elements', () => {
      expect(
        replaceValue(
          <>
            Hello there <span>{'{{name}}'}</span>
          </>,
          '{{name}}',
          'John',
        ),
      ).toMatchSnapshot();
    });

    it('replaces a string with a regular expression', () => {
      expect(replaceValue('Hello, {{name}}!', /{{name}}/, 'John')).toBe(
        'Hello, John!',
      );
    });
  });
});
