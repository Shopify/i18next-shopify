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

export function polyfillIntl() {
  try {
    if (global.Intl) {
      if (!Intl.NumberFormat || !Intl.DateTimeFormat) {
        const polyFill = require('intl');
        Intl.NumberFormat = polyFill.NumberFormat;
        Intl.DateTimeFormat = polyFill.DateTimeFormat;
      }
    } else {
      global.Intl = require('intl');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
