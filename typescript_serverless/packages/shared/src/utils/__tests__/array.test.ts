import {
  unique,
  uniqueBy,
  groupBy,
  chunk,
  shuffle,
  last,
  first,
  range,
  at,
  countBy,
} from '../array';

describe('array utilities', () => {
  describe('unique', () => {
    it('should remove duplicate primitives', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should handle array without duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle mixed types', () => {
      expect(unique([1, '1', 1, '1'])).toEqual([1, '1']);
    });
  });

  describe('uniqueBy', () => {
    const users = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 1, name: 'Johnny' },
      { id: 3, name: 'Jack' },
    ];

    it('should remove duplicates by key', () => {
      const result = uniqueBy(users, 'id');
      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 3, name: 'Jack' },
      ]);
    });

    it('should keep first occurrence', () => {
      const result = uniqueBy(users, 'id');
      expect(result[0].name).toBe('John'); // not 'Johnny'
    });

    it('should handle empty array', () => {
      expect(uniqueBy([], 'id')).toEqual([]);
    });

    it('should handle different keys', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const result = uniqueBy(items, 'type');
      expect(result).toHaveLength(2);
    });
  });

  describe('groupBy', () => {
    const users = [
      { id: 1, role: 'admin', name: 'John' },
      { id: 2, role: 'user', name: 'Jane' },
      { id: 3, role: 'admin', name: 'Jack' },
      { id: 4, role: 'user', name: 'Jill' },
    ];

    it('should group items by key', () => {
      const result = groupBy(users, 'role');
      expect(result).toEqual({
        admin: [
          { id: 1, role: 'admin', name: 'John' },
          { id: 3, role: 'admin', name: 'Jack' },
        ],
        user: [
          { id: 2, role: 'user', name: 'Jane' },
          { id: 4, role: 'user', name: 'Jill' },
        ],
      });
    });

    it('should handle empty array', () => {
      expect(groupBy([], 'key')).toEqual({});
    });

    it('should convert non-string keys to strings', () => {
      const items = [
        { id: 1, count: 10 },
        { id: 2, count: 20 },
        { id: 3, count: 10 },
      ];
      const result = groupBy(items, 'count');
      expect(Object.keys(result)).toEqual(['10', '20']);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 2)).toEqual([]);
    });

    it('should handle chunk size larger than array', () => {
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    });

    it('should handle chunk size of 1', () => {
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });
  });

  describe('shuffle', () => {
    it('should return array with same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should not modify original array', () => {
      const original = [1, 2, 3];
      const shuffled = shuffle(original);
      
      expect(original).toEqual([1, 2, 3]);
      expect(shuffled).not.toBe(original);
    });

    it('should handle empty array', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(shuffle([1])).toEqual([1]);
    });
  });

  describe('last', () => {
    it('should return last element', () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last(['a', 'b', 'c'])).toBe('c');
    });

    it('should return undefined for empty array', () => {
      expect(last([])).toBeUndefined();
    });

    it('should handle single element', () => {
      expect(last([1])).toBe(1);
    });
  });

  describe('first', () => {
    it('should return first element', () => {
      expect(first([1, 2, 3])).toBe(1);
      expect(first(['a', 'b', 'c'])).toBe('a');
    });

    it('should return undefined for empty array', () => {
      expect(first([])).toBeUndefined();
    });

    it('should handle single element', () => {
      expect(first([1])).toBe(1);
    });
  });

  describe('range', () => {
    it('should create range of numbers', () => {
      expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(range(0, 3)).toEqual([0, 1, 2, 3]);
    });

    it('should handle single number range', () => {
      expect(range(5, 5)).toEqual([5]);
    });

    it('should handle negative numbers', () => {
      expect(range(-2, 2)).toEqual([-2, -1, 0, 1, 2]);
    });

    it('should handle reverse ranges', () => {
      expect(range(5, 1)).toEqual([]);
    });
  });

  describe('at', () => {
    const arr = ['a', 'b', 'c', 'd'];

    it('should access positive indices', () => {
      expect(at(arr, 0)).toBe('a');
      expect(at(arr, 2)).toBe('c');
    });

    it('should access negative indices', () => {
      expect(at(arr, -1)).toBe('d');
      expect(at(arr, -2)).toBe('c');
    });

    it('should return undefined for out of bounds', () => {
      expect(at(arr, 10)).toBeUndefined();
      expect(at(arr, -10)).toBeUndefined();
    });

    it('should return default value for out of bounds', () => {
      expect(at(arr, 10, 'default')).toBe('default');
      expect(at(arr, -10, 'default')).toBe('default');
    });

    it('should not use default for valid indices', () => {
      expect(at(arr, 0, 'default')).toBe('a');
      expect(at(arr, -1, 'default')).toBe('d');
    });
  });

  describe('countBy', () => {
    const users = [
      { role: 'admin', active: true },
      { role: 'user', active: true },
      { role: 'admin', active: false },
      { role: 'user', active: true },
      { role: 'user', active: false },
    ];

    it('should count by function result', () => {
      const result = countBy(users, (user) => user.role);
      expect(result).toEqual({
        admin: 2,
        user: 3,
      });
    });

    it('should handle complex key generation', () => {
      const result = countBy(users, (user) => `${user.role}-${user.active}`);
      expect(result).toEqual({
        'admin-true': 1,
        'admin-false': 1,
        'user-true': 2,
        'user-false': 1,
      });
    });

    it('should handle empty array', () => {
      expect(countBy([], (item) => item)).toEqual({});
    });

    it('should handle single element', () => {
      const result = countBy([{ type: 'a' }], (item) => item.type);
      expect(result).toEqual({ a: 1 });
    });
  });
});