import { get, set } from '../../object';

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