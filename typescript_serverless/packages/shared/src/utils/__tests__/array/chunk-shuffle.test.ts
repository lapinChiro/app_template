import { chunk, shuffle } from '../../array';

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