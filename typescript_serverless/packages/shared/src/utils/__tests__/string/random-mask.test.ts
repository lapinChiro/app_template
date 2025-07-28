import { randomString, mask, getInitials } from '../../string';

describe('randomString', () => {
  it('should generate string of specified length', () => {
    expect(randomString(10)).toHaveLength(10);
    expect(randomString(20)).toHaveLength(20);
    expect(randomString(5)).toHaveLength(5);
  });

  it('should generate different strings', () => {
    const str1 = randomString(10);
    const str2 = randomString(10);
    expect(str1).not.toBe(str2);
  });

  it('should only contain alphanumeric characters', () => {
    const str = randomString(100);
    expect(str).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should handle zero length', () => {
    expect(randomString(0)).toBe('');
  });
});

describe('mask', () => {
  it('should mask middle characters', () => {
    expect(mask('1234567890')).toBe('123****890');
    expect(mask('test@example.com')).toBe('tes**********com');
  });

  it('should handle custom visible characters', () => {
    expect(mask('1234567890', 2)).toBe('12******90');
    expect(mask('1234567890', 4)).toBe('1234**7890');
  });

  it('should mask short strings completely', () => {
    expect(mask('12345', 3)).toBe('*****');
    expect(mask('abc', 2)).toBe('***');
  });

  it('should handle edge cases', () => {
    expect(mask('', 3)).toBe('');
    expect(mask('a', 3)).toBe('*');
  });

  it('should ensure minimum masked characters', () => {
    expect(mask('1234567', 3)).toBe('123*567');
  });
});

describe('getInitials', () => {
  it('should get initials from names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Jane Smith')).toBe('JS');
  });

  it('should handle single names', () => {
    expect(getInitials('John')).toBe('J');
    expect(getInitials('Jane')).toBe('J');
  });

  it('should handle multiple names', () => {
    expect(getInitials('John Michael Doe')).toBe('JMD');
    expect(getInitials('Mary Jane Watson Smith')).toBe('MJWS');
  });

  it('should handle lowercase', () => {
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('jane smith')).toBe('JS');
  });

  it('should handle empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('should handle extra spaces', () => {
    expect(getInitials('  John  Doe  ')).toBe('JD');
    expect(getInitials('John    Doe')).toBe('JD');
  });
});