// see https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
// via http://stackoverflow.com/a/7390612/1386201
/*
    toType({a: 4}); //"object"
    toType([1, 2, 3]); //"array"
    (function() {console.log(toType(arguments))})(); //"arguments"
    toType(new ReferenceError); //"error"
    toType(new Date); //"date"
    toType(/a-z/); //"regexp"
    toType(Math); //"math"
    toType(JSON); //"json"
    toType(new Number(4)); //"number"
    toType(new String("abc")); //"string"
    toType(new Boolean(true)); //"boolean"
    toType(null); //"null"
    toType(); //"undefined"
    toType( () => {} ); //"function"
*/
export function toType (val?: any): string {
  return ({}).toString.call(val).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

export function round(value: number, decimals: number = 2): number {
  return Number(Math.round(Number(value+'e'+decimals))+'e-'+decimals);
}

export function clone<T extends object | any[]>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty (val: any): boolean {
  let emptyTypes = ['null', 'undefined'];
  let checkableTypes = ['object', 'array', 'arguments', 'json', 'string'];
  let type = toType(val);
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
  let wrapper = {} as {[P in K]: T};
  let newObj = preserveOriginal ? clone(obj) : obj;
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
  let newObject = preserveOriginal ? clone(obj) : obj;
  let returnedObj = {};
  for (let key in newObject) {
    if (newObject.hasOwnProperty(key) === false) continue;
    if ( isObject(newObject[key]) && recursive ) {
      const args = Array.from(arguments);
      let argsMinusFirst = [...args].slice(1);
      let recursedObject = traverseObject.apply(this, [newObject[key], ...argsMinusFirst]);
      if (!isEmpty(recursedObject)) {
        newObject[key] = recursedObject;
      }
    }
    let keyValArray = callback(key, newObject[key]);
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
  let pathParts = propertyPath.split('.');
  let currentObject = obj;
  let exists = true;
  let existingPath: string[] = [];
  while (exists && pathParts.length > 0) {
    let newPart = pathParts.shift();
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
  callback: (value: any) => boolean
): boolean {
  let details = nestedPropertyDetails(obj, propertyPath);
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

export function changePropsInitialCase (
  obj: object,
  whichCase: 'UpperFirst' | string,
  recursive = false,
  preserveOriginal = true,
): object {
  let makeAspVersion = (whichCase === 'UpperFirst') ? true : false ;
  let newObj = preserveOriginal ? clone(obj) : obj;
  let regex = makeAspVersion ? /[a-z]/ : /[A-z]/;
  return traverseObject(newObj, (key, prop) => {
    let originals: [string, any] = [key, prop];
    if (typeof key !== 'string') return originals;
    if (key.charAt(0).match(regex) === null) return originals;
    let newKey = makeAspVersion ? firstCharToUpper(key) : firstCharToLower(key);
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
    if (obj[currentKey] === val) {a = currentKey;}
    return a;
  }, '' as K);
}

export function forceArray<T> (val: T | T[]): T[] {
  const emptyReturns = ['null', 'undefined'];
  if (emptyReturns.indexOf(toType(val)) != -1) return [];
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

export function stringify (obj, options = {}): string {
  const {tabLength, stripQuotes} = Object.assign({tabLength: 2, stripQuotes: false}, options);
  let string = JSON.stringify(obj, noCircularRefs(), tabLength);
  if (stripQuotes) {
    string = string.replace(/"(.*?)": /g, '$1: ');
  }
  return string;
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
