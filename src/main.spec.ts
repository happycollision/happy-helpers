import * as hf from './main';

describe('clone', () => {
  const clone = hf.clone;
  it('returns a different object', () => {
    const originalObj = {one: {value:1}, two: {value:2}};
    expect(clone(originalObj)).not.toBe(originalObj);
  });
  it('returns an object whose values are equal to the original', () => {
    const originalObj = {one: {value:1}, two: {value:2}};
    expect(clone(originalObj)).toEqual(originalObj);
  });
  it('returns an array if that is the starting object', () => {
    const originalArr = [{one: {value:1}, two: {value:2}}];
    const newArr = clone(originalArr);
    expect(hf.toType(newArr)).toEqual('array');
  });
});

describe('traverseObject', () => {
  const traverseObject = hf.traverseObject;
  it('clones by default', () => {
    let originalObj = {one: {value:1}, two: {value:2}};
    let returnedObj = traverseObject(originalObj, (key, prop) => {prop.value = 3});
    expect(originalObj).toEqual({one: {value:1}, two: {value:2}});
    expect(returnedObj).not.toBe(originalObj);
  });

  it('returns an empty object by default', () => {
    let originalObj = {one: {value:1}, two: {value:2}};
    let returnedObj = traverseObject(originalObj, (key, prop) => {prop.value = 3});
    expect(returnedObj).toEqual({});
  });

  it('returns a constructed object when callback returns a valid array', () => {
    let originalObj = {one: {value:1}, two: {value:2}};
    let returnedObj = traverseObject(originalObj, (key, prop) => [key+'2', prop.value]);
    expect(returnedObj).toEqual({one2: 1, two2: 2});
  });

  it('will recurse if desired', () => {
    let originalObj = {one: {value:1}, two: {value:2}};
    let returnedObj = traverseObject(originalObj, (key, prop) => [key+'2', prop], true);
    expect(returnedObj).toEqual({one2: {value2:1}, two2: {value2:2}});
  });
});

describe('changePropsInitialCase', () => {
  let changePropsInitialCase = hf.changePropsInitialCase;
  it('changes props to upper', () => {
    let obj = {one: 1, two: 2};
    let returnObj = changePropsInitialCase(obj, 'UpperFirst');
    expect(returnObj).toEqual({'One': 1, 'Two': 2});
  });
  it('changes props to lower', () => {
    let obj =  {'One': 1, 'Two': 2};
    let returnObj = changePropsInitialCase(obj, 'lowerFirst');
    expect(returnObj).toEqual({one: 1, two: 2});
  });
});

describe('nestedPropertyDetails', () => {
  let nestedPropertyDetails = hf.nestedPropertyDetails;
  it('marks an existing property as true', () => {
    let obj = {level1: {level2: 'I am here'}};
    expect(nestedPropertyDetails(obj, 'level1.level2').exists).toEqual(true);
  });
  it('marks a missing property as false', () => {
    let obj = {level1: {level2: 'I am here'}};
    expect(nestedPropertyDetails(obj, 'level1.level2.level3').exists).toEqual(false);
  });
  it('provides the existing path', () => {
    let obj = {level1: {level2: 'I am here'}};
    expect(nestedPropertyDetails(obj, 'level1.level2.level3.level4').existingPath).toEqual('level1.level2');
  });
  it('provides the final found property', () => {
    let obj = {level1: {level2: 'I am here'}};
    expect(nestedPropertyDetails(obj, 'level1.level2.level3.level4').finalValidProperty).toEqual('I am here');
  });
  it('does not alter the original object', () => {
    let obj = {level1: {level2: 'I am here'}};
    const preserved = hf.clone(obj);

    nestedPropertyDetails(obj, 'level1.level2.level3.level4')

    expect(obj).toEqual(preserved);
  });
  it('can traverse circular objects', () => {
    let obj = {level1: {level2: 'I am here'}} as any;
    obj.level1.original = obj;

    expect(nestedPropertyDetails(obj, 'level1.original.level1.original').finalValidProperty).toEqual(obj);
  });
});

describe('nestedPropertyExists', () => {
  let nestedPropertyExists = hf.nestedPropertyExists;
  it('marks an existing property as true', () => {
    let obj = {level1: {level2: 'I am here'}};
    expect(nestedPropertyExists(obj, 'level1.level2')).toEqual(true);
  });
  it('marks a missing property as false', () => {
    let obj = {level1: {level2: 'I am here'}};
    expect(nestedPropertyExists(obj, 'level1.level2.level3')).toEqual(false);
  });
});

describe('nestedPropertyTest', () => {
  let nestedPropertyTest = hf.nestedPropertyTest;
  it('returns false if a prop does not exist at some level', () => {
    let obj = {level1: {level2: 'I am here'}};

    expect(nestedPropertyTest(obj,'level1.level2.level3', () => true )).toEqual(false);
  });
  it('returns true for a successfull callback on an existing prop', () => {
    let obj = {level1: {level2: 'I am here'}};

    expect(nestedPropertyTest(obj,'level1.level2', (val) => val === 'I am here' )).toEqual(true);
  });
  it('returns false for an unsuccessful callback on an existing prop', () => {
    let obj = {level1: {level2: 'I am here'}};

    expect(nestedPropertyTest(obj,'level1.level2', (val) => val === 'I am not here' )).toEqual(false);
  });
});

describe('toType', () => {
  let toType = hf.toType;
  it('returns all expected strings', () => {
    expect(toType({a: 4})).toEqual('object');
    expect(toType([1, 2, 3])).toEqual('array');
    expect( (function() {return toType(arguments)})() ).toEqual('arguments');
    expect(toType(new ReferenceError)).toEqual('error');
    expect(toType(new Date)).toEqual('date');
    expect(toType(/a-z/)).toEqual('regexp');
    expect(toType(Math)).toEqual('math');
    expect(toType(JSON)).toEqual('json');
    expect(toType(new Number(4))).toEqual('number');
    expect(toType(new String('abc'))).toEqual('string');
    expect(toType(new Boolean(true))).toEqual('boolean');
    expect(toType(null)).toEqual('null');
    expect(toType()).toEqual('undefined');
    expect(toType(() => {})).toEqual('function');
  });
});

describe('valuesArrayFromObject', () => {
  let valuesArrayFromObject = hf.valuesArrayFromObject;
  it('returns an array of values from a given object', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(valuesArrayFromObject(obj)).toEqual(['Stanley', 'angry']);
  });
});

describe('objectContainsValue', () => {
  let objectContainsValue = hf.objectContainsValue;
  it('returns true if an object contains the given value', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(objectContainsValue('angry', obj)).toEqual(true);
  });
  it('returns false if an object does not contain the given value', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(objectContainsValue('happy', obj)).toEqual(false);
  });
});

describe('objectKeyForValue', () => {
  let objectKeyForValue = hf.objectKeyForValue;
  it('gives the correct key for a given value', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(objectKeyForValue('Stanley', obj)).toEqual('name');
  });
  it('returns false for a non-existant value', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(objectKeyForValue('Jim', obj)).toEqual(false);
  });
});

describe('stringify', () => {
  let stringify = hf.stringify;
  
  it('returns a pretty string for an object', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(stringify(obj)).toEqual(
      '{'                        + '\n' +
      '  "name": "Stanley",'     + '\n' +
      '  "demeanor": "angry"'    + '\n' +
      '}'
    );
  });

  it('optionally sorts the object', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(stringify(obj, {sort: true})).toEqual(
      '{'                        + '\n' +
      '  "demeanor": "angry",'    + '\n' +
      '  "name": "Stanley"'     + '\n' +
      '}'
    );
  });

  it('returns a pretty string with your desired tab length', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(stringify(obj, {tabLength: 4})).toEqual(
      '{'                        + '\n' +
      '    "name": "Stanley",'     + '\n' +
      '    "demeanor": "angry"'    + '\n' +
      '}'
    );
  });

  it('strips unnecessary quotes', () => {
    const obj = {name: 'Stanley', demeanor: 'angry'}
    expect(stringify(obj, {stripQuotes: true})).toEqual(
      '{'                        + '\n' +
      '  name: "Stanley",'     + '\n' +
      '  demeanor: "angry"'    + '\n' +
      '}'
    );
  });

  it('handles circular references gracefully', () => {
    class Circ {
      me: any;
      constructor() {
        this.me = this
      }
    }
    let circ = new Circ();
    expect(stringify(circ)).toEqual(
      '{'                                                     + '\n' +
      '  "me": "[circular reference of __BASE_OBJECT__]"'     + '\n' +
      '}'
    );
  });
});

describe('isEmpty', () => {
  let isEmpty = hf.isEmpty;
  it('is true for undefined', () => {
    expect(isEmpty(undefined)).toEqual(true);
  });
  it('is true for an empty object', () => {
    expect(isEmpty({})).toEqual(true);
  });
  it('is true for an empty array', () => {
    expect(isEmpty([])).toEqual(true);
  });
  it('is true for null object', () => {
    expect(isEmpty(null)).toEqual(true);
  });
  it('is true for an empty string', () => {
    expect(isEmpty('')).toEqual(true);
  });

  it('is false for an object containing an empty object', () => {
    expect(isEmpty({1: {}})).toEqual(false);
  });
  it('is false for an empty array containing an empty array', () => {
    expect(isEmpty([[]])).toEqual(false);
  });
  it('is false for a number that signifies false', () => {
    expect(isEmpty(-1)).toEqual(false);
  });
  it('is false for a string', () => {
    expect(isEmpty('r')).toEqual(false);
  });
  it('is false for either boolean', () => {
    expect(isEmpty(false)).toEqual(false);
    expect(isEmpty(true)).toEqual(false);
  });
});

describe('forceArray', () => {
  let forceArray = hf.forceArray;
  describe('when given a string', () => {
    it('returns the string wrapped in an array', () => {
      let val = 'string';
      expect(forceArray(val)).toEqual(['string']);
    });
  });
  describe('when given an array', () => {
    it('returns the array', () => {
      let val = ['string'];
      expect(forceArray(val)).toEqual(['string']);
    });
  });
  describe('when given an object', () => {
    it('returns the object wrapped in an array', () => {
      let val = {things: ['one', 'two']};
      expect(forceArray(val)).toEqual([{things: ['one', 'two']}]);
    });
  });
  describe('when given null', () => {
    it('returns an empty array', () => {
      let val = null;
      expect(forceArray(val)).toEqual([]);
    });
  });
  describe('when given undefined', () => {
    it('returns an empty array', () => {
      let val = undefined;
      expect(forceArray(val)).toEqual([]);
    });
  });
});

describe('deepEqual', () => {
  const deepEqual = hf.deepEqual;

  it('returns true for the same object', () => {
    const obj = { one: 1 }
    expect(deepEqual(obj, obj)).toEqual(true);
  })

  it('returns true for objects that look the same', () => {
    const obj1 = { one: 1, two: 2, nesting: { nested: { deep: true } } }
    const obj2 = { one: 1, two: 2, nesting: { nested: { deep: true } } }
    expect(deepEqual(obj1, obj2)).toEqual(true);
  })

  it('returns true for objects that look the same, with keys in a different order', () => {
    const obj1 = { one: 1, two: 2, nesting: { nested: { deep: true } } }
    const obj2 = { two: 2, one: 1, nesting: { nested: { deep: true } } }
    expect(deepEqual(obj1, obj2)).toEqual(true);
  })

  it('returns true for objects that look the same, with circular values', () => {
    class Circ {
      me: any;
      constructor(public value: any) {
        this.me = this
      }
    }
    const obj1 = new Circ('some string');
    const obj2 = new Circ('some string');
    
    expect(deepEqual(obj1, obj2)).toEqual(true);
  })

  it('returns true for objects with different circular values which look the same', () => {
    class Circ {
      circularProp: any;
      constructor(value?: any) {
        this.circularProp = value || this
      }
    }
    const obj1 = new Circ();
    const obj2 = new Circ();
    const obj3 = new Circ(obj1);
    const obj4 = new Circ(obj2);
    
    expect(deepEqual(obj3, obj4)).toEqual(true);
  })

  it('returns true for objects with different circular values which look the same, but where one is self referencing', () => {
    class Circ {
      circularProp: any;
      constructor(value?: any) {
        this.circularProp = value || this
      }
    }
    const obj1 = new Circ();
    const obj2 = new Circ(obj1);

    expect(deepEqual(obj1, obj2)).toEqual(true);
  })

  it('returns false for objects with different 1st level values', () => {
    const obj1 = { one: 1 }
    const obj2 = { one: "1" }
    expect(deepEqual(obj1, obj2)).toEqual(false);
  })

  it('returns false for objects with different nested values', () => {
    const obj1 = { one: 1, two: {nested: true} }
    const obj2 = { one: 1, two: {nested: false} }
    expect(deepEqual(obj1, obj2)).toEqual(false);
  })


})