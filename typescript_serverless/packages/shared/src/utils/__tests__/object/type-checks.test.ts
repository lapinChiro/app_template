import { isObject, isEmpty } from '../../object';

describe('isObject', () => {
  it('should return true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
    expect(isObject(Object.create(null) as Record<string, unknown>)).toBe(true);
  });

  it('should return false for non-objects', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });

  it('should return false for other object types', () => {
    expect(isObject(new Date())).toBe(false);
    expect(isObject(/regex/)).toBe(false);
    expect(isObject(() => {})).toBe(false);
  });
});

describe('isEmpty', () => {
  it('should return true for empty objects', () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(Object.create(null) as Record<string, unknown>)).toBe(true);
  });

  it('should return false for non-empty objects', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty({ a: undefined })).toBe(false);
  });
});