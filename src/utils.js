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
 * Replaces all occurrences of the specified text. Returns a new value with the replacements made.
 * This function supports replacing text with React elements and replacing values within
 * nested React elements/arrays.
 *
 * @param {string|object|Array} interpolated - The value to replace occurrences of the specified text in.
 * @param {string|RegExp} pattern - The text or regular expression to search for in the interpolated value.
 * @param {string|object|Array} replacement - The value to replace occurrences of the specified text with.
 * @returns {string|object|Array} A new value with the specified text replaced.
 */
export function replaceValue(interpolated, pattern, replacement) {
  switch (typeof interpolated) {
    case 'string': {
      const split = interpolated.split(pattern);
      // Check if interpolated includes pattern
      //  && if String.prototype.replace wouldn't work because replacement is an object like a React element.
      if (split.length !== 1 && typeof replacement === 'object') {
        // Return array w/ the replacement

        // React elements within arrays need a key prop
        if (!replacement.key) {
          // eslint-disable-next-line no-param-reassign
          replacement = {...replacement, key: pattern.toString()};
        }

        return [split[0], replacement, split[1]].flat();
      }

      // interpolated and replacement are primitives
      return interpolated.replace(pattern, replacement);
    }

    case 'object':
      if (Array.isArray(interpolated)) {
        return interpolated
          .map((item) => replaceValue(item, pattern, replacement))
          .flat();
      }

      // Check if the interpolated object may be a React element w/ children.
      if (interpolated?.props?.children) {
        const newChildren = replaceValue(
          interpolated.props.children,
          pattern,
          replacement,
        );

        if (newChildren !== interpolated.props.children) {
          return {
            ...interpolated,
            props: {...interpolated.props, children: newChildren},
          };
        }
      }
  }

  // The interpolated element is something else, just return it
  return interpolated;
}
