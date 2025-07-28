import { toQueryString, fromQueryString } from '../../object';

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