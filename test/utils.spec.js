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
      const span = React.createElement('span', {}, 'John');

      expect(
        replaceValue('Hello, {{name}}!', '{{name}}', span),
      ).toMatchSnapshot(); // eslint-disable-line @shopify/jest-no-snapshots
    });

    it('returns the original string when there is no match with given React elements', () => {
      const span = React.createElement('span', {}, 'John');

      expect(replaceValue('Hello, {{name}}!', '{{no_match}}', span)).toBe(
        'Hello, {{name}}!',
      );
    });

    it('replaces a string within nested React elements', () => {
      const span = React.createElement('span', {key: '1'}, '{{name}}');
      const fragment = React.createElement(React.Fragment, {}, [
        'Hello there ',
        span,
      ]);

      expect(replaceValue(fragment, '{{name}}', 'John')).toMatchSnapshot(); // eslint-disable-line @shopify/jest-no-snapshots
    });

    it('replaces a string with a regular expression', () => {
      expect(replaceValue('Hello, {{name}}!', /{{name}}/, 'John')).toBe(
        'Hello, John!',
      );
    });
  });
});
