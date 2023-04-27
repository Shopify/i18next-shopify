const arr = [];
const each = arr.forEach;

// Copied from https://github.com/i18next/i18next-icu/blob/370027c829e240b36b2f6e5d648be35453c9e6d8/src/utils.js
export function defaults(obj, ...args) {
  each.call(args, (source) => {
    if (source) {
      for (const prop in source) {
        if (obj[prop] === undefined) { obj[prop] = source[prop]; }
      }
    }
  });
  return obj;
}

// Copied from https://github.com/i18next/i18next-icu/blob/370027c829e240b36b2f6e5d648be35453c9e6d8/src/utils.js
export function extend(obj, ...args) {
  each.call(args, (source) => {
    if (source) {
      for (const prop in source) {
        if (Object.hasOwn(obj, prop)) {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
}

// Copied from https://github.com/i18next/i18next/blob/ac4b6701c3ce9596e4eb88f5d774ca66f05d71fb/src/utils.js
function getLastOfPath(obj, path, Empty) {
  let object = obj;
  function cleanKey(key) {
    return key && key.indexOf("###") > -1 ? key.replace(/###/g, ".") : key;
  }

  function canNotTraverseDeeper() {
    return !object || typeof object === "string";
  }

  const stack = typeof path === "string" ? path.split(".") : [].concat(path);
  while (stack.length > 1) {
    if (canNotTraverseDeeper()) { return {}; }

    const key = cleanKey(stack.shift());
    if (!object[key] && Empty) { object[key] = new Empty(); }
    // prevent prototype pollution
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      object = object[key];
    } else {
      object = {};
    }
  }

  if (canNotTraverseDeeper()) { return {}; }
  return {
    obj: object,
    key: cleanKey(stack.shift()),
  };
}

// Copied from https://github.com/i18next/i18next/blob/ac4b6701c3ce9596e4eb88f5d774ca66f05d71fb/src/utils.js
export function getPath(object, path) {
  const { obj, key } = getLastOfPath(object, path);

  if (!obj) { return undefined; }
  return obj[key];
}

// Copied from https://github.com/i18next/i18next/blob/ac4b6701c3ce9596e4eb88f5d774ca66f05d71fb/src/utils.js
export function deepFind(obj, path, keySeparator = ".") {
  if (!obj) { return undefined; }
  if (obj[path]) { return obj[path]; }
  const paths = path.split(keySeparator);
  let current = obj;
  for (let i = 0; i < paths.length; ++i) {
    if (!current) { return undefined; }
    if (typeof current[paths[i]] === "string" && i + 1 < paths.length) {
      return undefined;
    }
    if (current[paths[i]] === undefined) {
      let j = 2;
      // eslint-disable-next-line id-length
      let p = paths.slice(i, i + j).join(keySeparator);
      let mix = current[p];
      while (mix === undefined && paths.length > i + j) {
        j++;
        p = paths.slice(i, i + j).join(keySeparator);
        mix = current[p];
      }
      if (mix === undefined) { return undefined; }
      if (mix === null) { return null; }
      if (path.endsWith(p)) {
        if (typeof mix === "string") { return mix; }
        if (p && typeof mix[p] === "string") { return mix[p]; }
      }
      const joinedPath = paths.slice(i + j).join(keySeparator);
      if (joinedPath) { return deepFind(mix, joinedPath, keySeparator); }
      return undefined;
    }
    current = current[paths[i]];
  }
  return current;
}
