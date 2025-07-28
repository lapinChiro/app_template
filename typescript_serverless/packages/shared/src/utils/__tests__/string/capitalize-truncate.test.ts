import { capitalize, truncate } from '../../string';

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });

  it('should handle already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('should handle single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('should handle empty string', () => {
    expect(capitalize('')).toBe('');
  });

  it('should only capitalize first letter', () => {
    expect(capitalize('hello WORLD')).toBe('Hello WORLD');
  });
});

describe('truncate', () => {
  it('should truncate long strings', () => {
    expect(truncate('Hello, World!', 5)).toBe('Hello...');
    expect(truncate('This is a long string', 10)).toBe('This is a ...');
  });

  it('should not truncate short strings', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});