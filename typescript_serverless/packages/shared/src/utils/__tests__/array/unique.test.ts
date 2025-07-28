import { unique, uniqueBy } from '../../array';

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
    expect(result[0]?.name).toBe('John'); // not 'Johnny'
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