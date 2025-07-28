import { pick, omit } from '../../object';

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
    // @ts-expect-error - Testing with non-existent key
    expect(pick(obj, ['a', 'e'])).toEqual({ a: 1 });
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
    // @ts-expect-error - Testing with non-existent key
    expect(omit(obj, ['e'])).toEqual(obj);
  });

  it('should handle empty keys array', () => {
    expect(omit(obj, [])).toEqual(obj);
  });

  it('should return new object', () => {
    const result = omit(obj, ['a']);
    expect(result).not.toBe(obj);
  });
});