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
 * If React is available, this function supports replacing text with React elements and replacing
 * values within nested React elements and arrays.
 *
 * @param {string|object|Array} interpolated - The value to replace occurrences of the specified text in.
 * @param {string|RegExp} find - The text or regular expression to search for in the interpolated value.
 * @param {string|object|Array} replacement - The value to replace occurrences of the specified text with.
 * @returns {string|object|Array} A new value with the specified text replaced.
 */
export function replaceValue(interpolated, find, replacement) {
  switch (typeof interpolated) {
    case 'string': {
      const split = interpolated.split(find);

      if (split.length !== 1 && typeof replacement === 'object') {
        // Interpolated includes find and replacement is likely a React element. Return array w/ the replacement.

        // React elements within arrays need a key prop.
        if (!replacement.key) {
          // eslint-disable-next-line no-param-reassign
          replacement = {...replacement, key: `${split[0]}`};
        }

        return [split[0], replacement, split[1]].flat();
      }

      // interpolated and find are primitives, Use native replace function.
      return interpolated.replace(find, replacement);
    }

    case 'object':
      if (Array.isArray(interpolated)) {
        return interpolated
          .map((item) => replaceValue(item, find, replacement))
          .flat();
      }

      // Check if the interpolated object may be a React element w/ children.
      if (interpolated?.props?.children) {
        const newChildren = replaceValue(
          interpolated.props.children,
          find,
          replacement,
        );

        if (newChildren !== interpolated.props.children) {
          // The following intends be relatively equivalent to
          // return React.cloneElement(interpolated, {children: newChildren});
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
