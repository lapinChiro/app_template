import { deepMerge } from '../../object';

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