import {
  deepClone,
  deepMerge,
  isObject,
  pick,
  omit,
  isEmpty,
  get,
  set,
  toQueryString,
  fromQueryString,
} from '../object';

describe('object utilities', () => {
  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: 'hello', c: true };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should clone nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
          },
        },
      };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(cloned.b.d).not.toBe(obj.b.d);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4, [5, 6]]];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone dates', () => {
      const date = new Date('2024-01-15');
      const cloned = deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned.getTime()).toBe(date.getTime());
    });

    it('should handle mixed structures', () => {
      const obj = {
        num: 42,
        str: 'hello',
        date: new Date('2024-01-15'),
        arr: [1, 2, { nested: true }],
        obj: { deep: { nested: 'value' } },
      };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned.arr[2]).not.toBe(obj.arr[2]);
      expect(cloned.obj.deep).not.toBe(obj.obj.deep);
    });
  });

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge nested objects', () => {
      const target = {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
      };
      const source = {
        b: {
          d: 4,
          e: 5,
        },
      };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 4,
          e: 5,
        },
      });
    });

    it('should merge multiple sources', () => {
      const target = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      const result = deepMerge(target, source1, source2);
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should overwrite non-object values', () => {
      const target = { a: { b: 1 } };
      const source = { a: 'string' };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 'string' });
    });

    it('should handle empty sources', () => {
      const target = { a: 1 };
      const result = deepMerge(target);
      
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(42)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(true)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for other object types', () => {
      expect(isObject(new Date())).toBe(false);
      expect(isObject(/regex/)).toBe(false);
      expect(isObject(() => {})).toBe(false);
    });
  });

  describe('pick', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    };

    it('should pick specified keys', () => {
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
      expect(pick(obj, ['b'])).toEqual({ b: 2 });
    });

    it('should ignore non-existent keys', () => {
      expect(pick(obj, ['a', 'e' as any])).toEqual({ a: 1 });
    });

    it('should handle empty keys array', () => {
      expect(pick(obj, [])).toEqual({});
    });

    it('should return new object', () => {
      const result = pick(obj, ['a']);
      expect(result).not.toBe(obj);
    });
  });

  describe('omit', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    };

    it('should omit specified keys', () => {
      expect(omit(obj, ['a', 'c'])).toEqual({ b: 2, d: 4 });
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3, d: 4 });
    });

    it('should ignore non-existent keys', () => {
      expect(omit(obj, ['e' as any])).toEqual(obj);
    });

    it('should handle empty keys array', () => {
      expect(omit(obj, [])).toEqual(obj);
    });

    it('should return new object', () => {
      const result = omit(obj, ['a']);
      expect(result).not.toBe(obj);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty(Object.create(null))).toBe(true);
    });

    it('should return false for non-empty objects', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty({ a: undefined })).toBe(false);
    });
  });

  describe('get', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
      'x.y': 4,
    };

    it('should get nested values', () => {
      expect(get(obj, 'a')).toBe(1);
      expect(get(obj, 'b.c')).toBe(2);
      expect(get(obj, 'b.d.e')).toBe(3);
    });

    it('should return undefined for non-existent paths', () => {
      expect(get(obj, 'x')).toBeUndefined();
      expect(get(obj, 'b.x')).toBeUndefined();
      expect(get(obj, 'b.d.f')).toBeUndefined();
    });

    it('should return default value for non-existent paths', () => {
      expect(get(obj, 'x', 'default')).toBe('default');
      expect(get(obj, 'b.x', 42)).toBe(42);
    });

    it('should treat dots as path separators', () => {
      // The 'x.y' property will be treated as nested path x.y, not as a property name with dots
      expect(get(obj, 'x.y')).toBeUndefined();
    });

    it('should handle null/undefined in path', () => {
      const objWithNull = { a: { b: null } };
      expect(get(objWithNull, 'a.b.c')).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set nested values', () => {
      const obj = { a: 1 };
      set(obj, 'b.c', 2);
      expect(obj).toEqual({ a: 1, b: { c: 2 } });
    });

    it('should overwrite existing values', () => {
      const obj = { a: { b: 1 } };
      set(obj, 'a.b', 2);
      expect(obj).toEqual({ a: { b: 2 } });
    });

    it('should create nested structure', () => {
      const obj = {};
      set(obj, 'a.b.c.d', 'deep');
      expect(obj).toEqual({ a: { b: { c: { d: 'deep' } } } });
    });

    it('should overwrite non-objects in path', () => {
      const obj = { a: 'string' };
      set(obj, 'a.b', 1);
      expect(obj).toEqual({ a: { b: 1 } });
    });

    it('should handle empty path', () => {
      const obj = { a: 1 };
      set(obj, '', 2);
      expect(obj).toEqual({ a: 1 });
    });
  });

  describe('toQueryString', () => {
    it('should convert object to query string', () => {
      const params = { a: 1, b: 'hello', c: true };
      expect(toQueryString(params)).toBe('a=1&b=hello&c=true');
    });

    it('should encode special characters', () => {
      const params = { key: 'hello world', special: 'a&b=c' };
      expect(toQueryString(params)).toBe('key=hello%20world&special=a%26b%3Dc');
    });

    it('should filter out null and undefined', () => {
      const params = { a: 1, b: null, c: undefined, d: 0 };
      expect(toQueryString(params)).toBe('a=1&d=0');
    });

    it('should handle empty object', () => {
      expect(toQueryString({})).toBe('');
    });

    it('should convert non-string values', () => {
      const params = { num: 42, bool: true, obj: { toString: () => 'custom' } };
      expect(toQueryString(params)).toBe('num=42&bool=true&obj=custom');
    });
  });

  describe('fromQueryString', () => {
    it('should parse query string to object', () => {
      const query = 'a=1&b=hello&c=true';
      expect(fromQueryString(query)).toEqual({
        a: '1',
        b: 'hello',
        c: 'true',
      });
    });

    it('should decode special characters', () => {
      const query = 'key=hello%20world&special=a%26b%3Dc';
      expect(fromQueryString(query)).toEqual({
        key: 'hello world',
        special: 'a&b=c',
      });
    });

    it('should handle duplicate keys (last wins)', () => {
      const query = 'a=1&a=2&a=3';
      expect(fromQueryString(query)).toEqual({ a: '3' });
    });

    it('should handle empty string', () => {
      expect(fromQueryString('')).toEqual({});
    });

    it('should handle question mark prefix', () => {
      const query = '?a=1&b=2';
      expect(fromQueryString(query)).toEqual({ a: '1', b: '2' });
    });

    it('should handle keys without values', () => {
      const query = 'a=1&b&c=3';
      expect(fromQueryString(query)).toEqual({
        a: '1',
        b: '',
        c: '3',
      });
    });
  });
});