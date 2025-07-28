import { first, last, at } from '../../array';

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