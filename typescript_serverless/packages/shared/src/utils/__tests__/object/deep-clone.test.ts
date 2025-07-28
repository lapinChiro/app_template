import { deepClone } from '../../object';

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: 'hello', c: true };
    const cloned = deepClone(obj);
    
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
  });

  it('should clone nested objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    };
    const cloned = deepClone(obj);
    
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
    expect(cloned.b.d).not.toBe(obj.b.d);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, [3, 4, [5, 6]]];
    const cloned = deepClone(arr);
    
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should clone dates', () => {
    const date = new Date('2024-01-15');
    const cloned = deepClone(date);
    
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
    expect(cloned.getTime()).toBe(date.getTime());
  });

  it('should handle mixed structures', () => {
    const obj = {
      num: 42,
      str: 'hello',
      date: new Date('2024-01-15'),
      arr: [1, 2, { nested: true }],
      obj: { deep: { nested: 'value' } },
    };
    const cloned = deepClone(obj);
    
    expect(cloned).toEqual(obj);
    expect(cloned.arr[2]).not.toBe(obj.arr[2]);
    expect(cloned.obj.deep).not.toBe(obj.obj.deep);
  });
});