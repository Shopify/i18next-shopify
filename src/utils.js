/* eslint-disable prettier/prettier */
// Dynamically & Optionally import React.
let React;
// eslint-disable-next-line promise/catch-or-return
import('react')
  .then((module) => {
    React = module;
  })

const arr = [];
const each = arr.forEach;

// Copied from https://github.com/i18next/i18next-icu/blob/370027c829e240b36b2f6e5d648be35453c9e6d8/src/utils.js
export function defaults(obj, ...args) {
  each.call(args, (source) => {
    if (source) {
      for (const prop in source) {
        if (obj[prop] === undefined) {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
}

/**
 * Given a value that may contain interpolated values, replaces all occurrences of the specified text
 * with the specified replacement value, and returns a new value with the replacements made.
 * If React is available, this function supports nested interpolated values, allowing you to replace
 * text with React elements or arrays of React elements.
 *
 * @param {string|object|Array} interpolated - The value to replace occurrences of the specified text in.
 * @param {string|RegExp} find - The text or regular expression to search for in the interpolated value.
 * @param {string|object|Array} replace - The value to replace occurrences of the specified text with.
 * @returns {string|object|Array} A new value with the specified text replaced.
 */
export function replaceValue(interpolated, find, replace) {
  if (!React) {
    return interpolated.replace(find, replace);
  }

  switch (typeof interpolated) {
    case 'string': {
      const split = interpolated.split(find);

      if (split.length !== 1 && typeof replace === 'object') {
        // Replace is an object. Return a React fragment with the replacement.

        return (
          <React.Fragment key={split[0]}>
            {split[0]}
            {replace}
            {split[1]}
          </React.Fragment>
        );
      }

      // This is a simple text replacement.
      return interpolated.replace(find, replace);
    }

    case 'object':
      if (Array.isArray(interpolated)) {
        // The interpolated element is an array, call replaceValue on each item
        return interpolated.map((item) => replaceValue(item, find, replace)).flat();
      }

      // The interpolated element is an object with props, check its children
      if (interpolated?.props) {
        let hasChanged = false;

        const newChildren = replaceValue(interpolated.props.children, find, replace);
        if (newChildren !== interpolated.props.children) {
          hasChanged = true;
        }

        return hasChanged
          ? React.cloneElement(interpolated, {children: newChildren})
          : interpolated;
      }
  }

  // The interpolated element is something else, just return it
  return interpolated;
}
