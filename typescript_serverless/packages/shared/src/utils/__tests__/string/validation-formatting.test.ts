import { isBlank, normalizeWhitespace } from '../../string';

describe('isBlank', () => {
  it('should return true for empty strings', () => {
    expect(isBlank('')).toBe(true);
  });

  it('should return true for whitespace only', () => {
    expect(isBlank('   ')).toBe(true);
    expect(isBlank('\t')).toBe(true);
    expect(isBlank('\n')).toBe(true);
    expect(isBlank('  \t\n  ')).toBe(true);
  });

  it('should return false for non-blank strings', () => {
    expect(isBlank('hello')).toBe(false);
    expect(isBlank('  hello  ')).toBe(false);
    expect(isBlank('a')).toBe(false);
  });
});

describe('normalizeWhitespace', () => {
  it('should trim and normalize spaces', () => {
    expect(normalizeWhitespace('  hello  world  ')).toBe('hello world');
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('should handle tabs and newlines', () => {
    expect(normalizeWhitespace('hello\tworld')).toBe('hello world');
    expect(normalizeWhitespace('hello\nworld')).toBe('hello world');
    expect(normalizeWhitespace('hello\r\nworld')).toBe('hello world');
  });

  it('should handle multiple types of whitespace', () => {
    expect(normalizeWhitespace('  hello\t\n  world  ')).toBe('hello world');
  });

  it('should handle strings without extra whitespace', () => {
    expect(normalizeWhitespace('hello world')).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(normalizeWhitespace('')).toBe('');
    expect(normalizeWhitespace('   ')).toBe('');
  });
});