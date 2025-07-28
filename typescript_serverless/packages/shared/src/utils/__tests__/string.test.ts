import {
  capitalize,
  truncate,
  toKebabCase,
  toCamelCase,
  toPascalCase,
  isBlank,
  normalizeWhitespace,
  randomString,
  mask,
  getInitials,
} from '../string';

describe('string utilities', () => {
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

  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('camelCase')).toBe('camel-case');
      expect(toKebabCase('myVariableName')).toBe('my-variable-name');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('PascalCase')).toBe('pascal-case');
      expect(toKebabCase('MyClassName')).toBe('my-class-name');
    });

    it('should handle spaces', () => {
      expect(toKebabCase('hello world')).toBe('hello-world');
      expect(toKebabCase('my test string')).toBe('my-test-string');
    });

    it('should handle underscores', () => {
      expect(toKebabCase('snake_case')).toBe('snake-case');
      expect(toKebabCase('my_variable_name')).toBe('my-variable-name');
    });

    it('should handle already kebab-case', () => {
      expect(toKebabCase('already-kebab-case')).toBe('already-kebab-case');
    });

    it('should handle consecutive uppercase letters', () => {
      expect(toKebabCase('XMLHttpRequest')).toBe('xml-http-request');
    });
  });

  describe('toCamelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(toCamelCase('kebab-case')).toBe('kebabCase');
      expect(toCamelCase('my-variable-name')).toBe('myVariableName');
    });

    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('snake_case')).toBe('snakeCase');
      expect(toCamelCase('my_variable_name')).toBe('myVariableName');
    });

    it('should handle spaces', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
      expect(toCamelCase('my test string')).toBe('myTestString');
    });

    it('should handle already camelCase', () => {
      expect(toCamelCase('alreadyCamelCase')).toBe('alreadyCamelCase');
    });

    it('should lowercase first letter', () => {
      expect(toCamelCase('PascalCase')).toBe('pascalCase');
    });
  });

  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('kebab-case')).toBe('KebabCase');
      expect(toPascalCase('my-component-name')).toBe('MyComponentName');
    });

    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('snake_case')).toBe('SnakeCase');
      expect(toPascalCase('my_class_name')).toBe('MyClassName');
    });

    it('should handle spaces', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld');
      expect(toPascalCase('my test class')).toBe('MyTestClass');
    });

    it('should handle already PascalCase', () => {
      expect(toPascalCase('AlreadyPascalCase')).toBe('AlreadyPascalCase');
    });

    it('should capitalize first letter of camelCase', () => {
      expect(toPascalCase('camelCase')).toBe('CamelCase');
    });
  });

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
    it('should extract initials from names', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Jane Smith')).toBe('JS');
    });

    it('should handle single names', () => {
      expect(getInitials('John')).toBe('J');
      expect(getInitials('Madonna')).toBe('M');
    });

    it('should handle multiple names', () => {
      expect(getInitials('John Michael Doe')).toBe('JM');
      expect(getInitials('Mary Jane Watson Parker')).toBe('MJ');
    });

    it('should uppercase initials', () => {
      expect(getInitials('john doe')).toBe('JD');
      expect(getInitials('JOHN DOE')).toBe('JD');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });

    it('should handle extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD');
    });
  });
});