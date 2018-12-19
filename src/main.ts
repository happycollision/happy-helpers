// see https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
// via http://stackoverflow.com/a/7390612/1386201

/**
 * @example
 * toType({a: 4}); // 'object'
 * toType([1, 2, 3]); // 'array'
 * (function() {console.log(toType(arguments))})(); // 'arguments'
 * toType(new ReferenceError); // 'error'
 * toType(new Date); // 'date'
 * toType(/a-z/); // 'regexp'
 * toType(Math); // 'math'
 * toType(JSON); // 'json'
 * toType(new Number(4)); // 'number'
 * toType(new String('abc')); // 'string'
 * toType(new Boolean(true)); // 'boolean'
 * toType(null); // 'null'
 * toType(); // 'undefined'
 * toType( () => {} ); // 'function'
 */
export function toType (val?: any): string {
  return ({}).toString.call(val).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

export function round(value: number, decimals: number = 2): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

export function clone<T extends object | any[]>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Knuth Fisher Yates shuffle. Operates on the array directly
 */
export function shuffleInPlace<T extends any[]> (arr: T) {
  let temp;
  let j;
  let i = arr.length;
  while (--i) {
    j = ~~(Math.random() * (i + 1)); // tslint:disable-line no-bitwise
    temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr;
}

/**
 * Knuth Fisher Yates shuffle. Preserves original, returns a clone.
 */
export function shuffleClone<T extends any[]> (arr: T) {
  return clone(shuffleInPlace(arr));
}

export function isEmpty (val: any): boolean {
  const emptyTypes = ['null', 'undefined'];
  const checkableTypes = ['object', 'array', 'arguments', 'json', 'string'];
  const type = toType(val);
  if (emptyTypes.indexOf(type) > -1) { return true; }
  if (checkableTypes.indexOf(type) > -1) {
    if (type === 'string') return val.length === 0; // IE fails on the next line if a string.
    if (Object.getOwnPropertyNames(val).length === 0) return true;
    return val.length === 0;
  }
  // other types return false because they are, by nature, filled ()
  return false;
}

export function isNotEmpty (val) {
  return !isEmpty(val);
}

export function wrapObjectWithProperty<T extends object, K extends string> (
  obj: T,
  propName: K,
  preserveOriginal = true,
): {[P in K]: T} {
  const wrapper = {} as {[P in K]: T};
  const newObj = preserveOriginal ? clone(obj) : obj;
  wrapper[propName] = newObj;
  return wrapper;
}

export function isObject(x: any): boolean {
  return ( toType(x) === 'object' );
}

// Traverses an object.
// callback should return an array with a key, then a value if constructing a
// new object is desired. Kind of like Array.map, but for objects
export function traverseObject<T extends object> (
  obj: T,
  callback: (key: string, value: any) => [string, any] | void,
  recursive = false,
  preserveOriginal = true,
): T | any {
  const newObject = preserveOriginal ? clone(obj) : obj;
  const returnedObj = {};
  for (const key in newObject) {
    if (newObject.hasOwnProperty(key) === false) continue;
    if ( isObject(newObject[key]) && recursive ) {
      const args = Array.from(arguments);
      const argsMinusFirst = [...args].slice(1);
      const recursedObject = traverseObject.apply(this, [newObject[key], ...argsMinusFirst]);
      if (!isEmpty(recursedObject)) {
        newObject[key] = recursedObject;
      }
    }
    const keyValArray = callback(key, newObject[key]);
    if (Array.isArray(keyValArray) && keyValArray.length === 2) {
      returnedObj[keyValArray[0]] = keyValArray[1];
    } else if (!isEmpty(keyValArray)) {
      throw new Error(`It looks like you might have been trying to construct a new object, but you returned something other than an array that looks like [key, value]. You returned ${keyValArray}`);
    }
  }
  return returnedObj;
}

export function nestedPropertyDetails (
  obj: object,
  propertyPath: string,
): {
  exists: boolean,
  existingPath: string,
  finalValidProperty: any,
} {
  const pathParts = propertyPath.split('.');
  let currentObject = obj;
  let exists = true;
  const existingPath: string[] = [];
  while (exists && pathParts.length > 0) {
    const newPart = pathParts.shift();
    if (newPart && currentObject[newPart]) {
      existingPath.push(newPart);
      currentObject = currentObject[newPart];
    } else {
      exists = false;
    }
  }
  return {
    exists,
    existingPath: existingPath.join('.'),
    finalValidProperty: currentObject,
  };
}

export function nestedPropertyTest (
  obj: object,
  propertyPath: string,
  callback: (value: any) => boolean,
): boolean {
  const details = nestedPropertyDetails(obj, propertyPath);
  if (details.exists) {
    return !!callback(details.finalValidProperty);
  }
  return false;
}

export function nestedPropertyExists (
  obj: object,
  propertyPath: string,
): boolean {
  return nestedPropertyDetails(obj, propertyPath).exists;
}

/**
 * Return the value of a nested property in an object, or the default value if the path does not exist.
 * @param obj any object
 * @param propertyPath string representing the path to the desired value. Eg. "config.person.name"
 * @param defaultValue the value you'd like returned if the nested property does not exist. Defaults to null.
 */
export function nestedPropertyOrDefault(obj: object, propertyPath: string, defaultValue: any = null): null | any {
  const result = nestedPropertyDetails(obj, propertyPath);
  if (result.exists) return result.finalValidProperty;
  return defaultValue;
}

export function changePropsInitialCase (
  obj: object,
  whichCase: 'UpperFirst' | string,
  recursive = false,
  preserveOriginal = true,
): object {
  const makeAspVersion = (whichCase === 'UpperFirst') ? true : false ;
  const newObj = preserveOriginal ? clone(obj) : obj;
  const regex = makeAspVersion ? /[a-z]/ : /[A-z]/;
  return traverseObject(newObj, (key, prop) => {
    const originals: [string, any] = [key, prop];
    if (typeof key !== 'string') return originals;
    if (key.charAt(0).match(regex) === null) return originals;
    const newKey = makeAspVersion ? firstCharToUpper(key) : firstCharToLower(key);
    return [newKey, prop];
  }, recursive);
}

export function firstCharToUpper (str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function firstCharToLower (str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function convertPropKeysForAsp (obj: object): object {
  return changePropsInitialCase(obj, 'UpperFirst', true);
}

export function convertPropKeysForJs (obj: object): object {
  return changePropsInitialCase(obj, 'lowerFirst', true);
}

export function valuesArrayFromObject (obj: object): any[] {
  if (!isObject(obj)) {
    throw new Error(`'obj' was not an object. Was ${toType(obj)}`);
  }
  return Object.keys(obj).map(key => obj[key]);
}

export function objectContainsValue (val: any, obj: object): boolean {
  return valuesArrayFromObject(obj).indexOf(val) !== -1;
}

export function objectKeyForValue<T extends object, K extends keyof T> (val: any, obj: T): false | K {
  if (!objectContainsValue(val, obj)) return false;
  return (Object.keys(obj) as K[]).reduce((a, currentKey: K) => {
    if (obj[currentKey] === val) { a = currentKey; }
    return a;
  }, '' as K);
}

export function forceArray<T> (val: T | T[]): T[] {
  const emptyReturns = ['null', 'undefined'];
  if (emptyReturns.indexOf(toType(val)) !== -1) return [];
  if (toType(val) !== 'array') {
    return [val] as T[];
  }
  return val as T[];
}

const noCircularRefs = () => {
  const valCache: any[] = [];
  const keyCache: any[] = [];
  let isFirstRun = true;

  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (isFirstRun) {
        key = '__BASE_OBJECT__'; // eslint-disable-line no-param-reassign
        isFirstRun = false;
      }
      const indexOfFoundValue = valCache.indexOf(value);
      if (indexOfFoundValue !== -1) {
        // Circular reference found, discard key
        return `[circular reference of ${keyCache[indexOfFoundValue]}]`;
      }
      // Store value in our collection
      valCache.push(value);
      keyCache.push(key);
    }
    return value; // eslint-disable-line consistent-return
  };
};

export interface IStringifyOptions {
  tabLength: number;
  stripQuotes: boolean;
  sort: boolean;
}
export function stringify (obj, options: Partial<IStringifyOptions> = {}): string {
  const defaults: IStringifyOptions = {
    tabLength: 2,
    stripQuotes: false,
    sort: false,
  };
  const settings: IStringifyOptions = Object.assign({}, defaults, options);
  const {tabLength, stripQuotes, sort} = settings;
  if (sort) {
    if (toType(obj) === 'array') {
      const newObj = (obj as any[]).sort();
      return finalStringification(newObj, tabLength, stripQuotes);
    } else if (toType(obj) === 'object') {
      const newObj = {};
      const keys = Object.keys(obj).sort();
      keys.forEach(key => {
        newObj[key] = obj[key];
      });
      return finalStringification(newObj, tabLength, stripQuotes);
    }
    return finalStringification(obj, tabLength, stripQuotes);
  }
  return finalStringification(obj, tabLength, stripQuotes);
}

function finalStringification(obj, tabLength: number,  stripQuotes: boolean): string {
  let str = JSON.stringify(obj, noCircularRefs(), tabLength);
  if (stripQuotes) {
    str = str.replace(/"(.*?)": /g, '$1: ');
  }
  return str;
}

/**
 * Returns true if the deep values of an object are equal.
 */
export function deepEqual(objA, objB): boolean {
  const stringifyOptions = {sort: true};
  return stringify(objA, stringifyOptions) === stringify(objB, stringifyOptions);
}

/*
  The following are not tested with `npm test` and are unreliable for certain situations.
  see http://stackoverflow.com/a/8876069
*/
export function mediaWidth (): number {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

export function mediaHeight (): number {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}
