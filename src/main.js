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
export function toType (val) {
  return ({}).toString.call(val).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

export function round(value, decimals) {
  decimals = decimals === undefined ? 2 : decimals;
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty (val) {
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

export function wrapObjectWithProperty (obj, propName, preserveOriginal = true) {
  let wrapper = {};
  let newObj = preserveOriginal ? clone(obj) : obj;
  wrapper[propName] = newObj;
  return wrapper;
}

export function isObject(x) {
  return ( toType(x) === 'object' );
}

// Traverses an object.
// callback should return an array with a key, then a value if constructing a
// new object is desired. Kind of like Array.map, but for objects
export function traverseObject (obj, callback, recursive = false, preserveOriginal = true) {
  let newObject = preserveOriginal ? clone(obj) : obj;
  let returnedObj = {};
  for (let key in newObject) {
    if (newObject.hasOwnProperty(key) === false) continue;
    if ( isObject(newObject[key]) && recursive ) {
      let argsMinusFirst = [...arguments].slice(1);
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

export function nestedPropertyDetails (obj, propertyPathString) {
  let pathParts = propertyPathString.split('.');
  let reducedObj = clone(obj);
  let exists = true;
  let existingPath = [];
  while (exists && pathParts.length > 0) {
    let newPart = pathParts.shift();
    if (reducedObj[newPart]) {
      existingPath.push(newPart);
      reducedObj = reducedObj[newPart];
    } else {
      exists = false;
    }
  }
  return {exists: exists, existingPath: existingPath.join('.'), finalValidProperty: reducedObj};
}

export function nestedPropertyTest (obj, propertyPathString, callback) {
  let details = nestedPropertyDetails(obj, propertyPathString);
  if (details.exists) {
    return !!callback(details.finalValidProperty);
  }
  return false;
}

export function nestedPropertyExists (obj, propertyPathString) {
  return nestedPropertyDetails(obj, propertyPathString).exists;
}

export function changePropsInitialCase (obj, whichCase, recursive = false, preserveOriginal = true) {
  let makeAspVersion = (whichCase === 'UpperFirst') ? true : false ;
  let newObj = preserveOriginal ? clone(obj) : obj;
  let regex = makeAspVersion ? /[a-z]/ : /[A-z]/;
  return traverseObject(newObj, (key, prop) => {
    let originals = [key, prop];
    if (typeof key !== 'string') return originals;
    if (key.charAt(0).match(regex) === null) return originals;
    let newKey = makeAspVersion ? firstCharToUpper(key) : firstCharToLower(key);
    return [newKey, prop];
  }, recursive);
}

export function firstCharToUpper (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function firstCharToLower (string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function convertPropKeysForAsp (obj) {
  return changePropsInitialCase(obj, 'UpperFirst', true);
}

export function convertPropKeysForJs (obj) {
  return changePropsInitialCase(obj, 'lowerFirst', true);
}

export function valuesArrayFromObject (obj) {
  if (!isObject(obj)) {
    throw new Error(`'obj' was not an object. Was ${toType(obj)}`);
  }
  return Object.keys(obj).map(key => obj[key]);
}

export function objectContainsValue(val, obj) {
  return valuesArrayFromObject(obj).indexOf(val) !== -1;
}

export function objectKeyForValue (val, obj) {
  if (!objectContainsValue(val, obj)) return false;
  return Object.keys(obj).reduce((a, currentKey) => {
    if (obj[currentKey] === val) {a = currentKey;}
    return a;
  }, '');
}

export function forceArray (val) {
  const emptyReturns = ['null', 'undefined'];
  if (emptyReturns.indexOf(toType(val)) != -1) return [];
  if (toType(val) !== 'array') {
    return [val];
  }
  return val;
}

/*
  The following are not tested with `npm test` and are unreliable for certain situations.
  see http://stackoverflow.com/a/8876069
*/
export function mediaWidth () {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

export function mediaHeight () {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}
