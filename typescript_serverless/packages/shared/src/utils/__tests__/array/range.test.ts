import { range } from '../../array';

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