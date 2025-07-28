import { groupBy, countBy } from '../../array';

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

describe('countBy', () => {
  const items = [
    { type: 'a', value: 1 },
    { type: 'b', value: 2 },
    { type: 'a', value: 3 },
    { type: 'c', value: 4 },
    { type: 'a', value: 5 },
  ];

  it('should count occurrences by key', () => {
    const result = countBy(items, (item) => item.type);
    expect(result).toEqual({
      a: 3,
      b: 1,
      c: 1,
    });
  });

  it('should handle empty array', () => {
    type EmptyItem = { key: string };
    expect(countBy<EmptyItem>([], (item) => item.key)).toEqual({});
  });

  it('should handle numeric keys', () => {
    const numbers = [
      { value: 1 },
      { value: 1 },
      { value: 2 },
      { value: 1 },
    ];
    const result = countBy(numbers, (item) => String(item.value));
    expect(result).toEqual({
      '1': 3,
      '2': 1,
    });
  });
});