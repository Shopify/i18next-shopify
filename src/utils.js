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

// Replace function that supports nested interpolated given React is available.
export function replaceValue(interpolated, find, replace) {
  if (!React || (typeof interpolated === 'string' && typeof replace !== 'object')) {
      // React is unavailable or this is a simple text replacement.
      return interpolated.replace(find, replace);

  } else if (typeof interpolated === 'string' && interpolated.includes(find)) {
    // Replace is an object. Return a React fragment with the replacement.
    const split = interpolated.split(find);

    return (
      <React.Fragment key={split[0]}>
        {split[0]}
        {replace}
        {split[1]}
      </React.Fragment>
    );
  } else if (Array.isArray(interpolated)) {
    // The interpolated element is an array, call replaceValue on each item
    return interpolated.map((item) => replaceValue(item, find, replace)).flat();
  } else if (
    typeof interpolated === 'object' && interpolated?.props
  ) {
    // The interpolated element is an object with props, check its children
    let hasChanged = false;

    const newChildren = replaceValue(interpolated.props.children, find, replace);
    if (newChildren !== interpolated.props.children) {
      hasChanged = true;
    }

    return hasChanged
      ? React.cloneElement(interpolated, {children: newChildren})
      : interpolated;
  } else {
    // The interpolated element is something else, just return it
    return interpolated;
  }
}
