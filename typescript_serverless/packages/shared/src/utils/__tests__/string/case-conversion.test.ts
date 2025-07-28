import { toKebabCase, toCamelCase, toPascalCase } from '../../string';

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

  it('should handle empty string', () => {
    expect(toCamelCase('')).toBe('');
  });
});

describe('toPascalCase', () => {
  it('should convert kebab-case to PascalCase', () => {
    expect(toPascalCase('kebab-case')).toBe('KebabCase');
    expect(toPascalCase('my-class-name')).toBe('MyClassName');
  });

  it('should convert snake_case to PascalCase', () => {
    expect(toPascalCase('snake_case')).toBe('SnakeCase');
    expect(toPascalCase('my_class_name')).toBe('MyClassName');
  });

  it('should handle spaces', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
    expect(toPascalCase('my test class')).toBe('MyTestClass');
  });

  it('should handle camelCase', () => {
    expect(toPascalCase('camelCase')).toBe('CamelCase');
    expect(toPascalCase('myVariableName')).toBe('MyVariableName');
  });

  it('should handle already PascalCase', () => {
    expect(toPascalCase('AlreadyPascalCase')).toBe('AlreadyPascalCase');
  });

  it('should handle empty string', () => {
    expect(toPascalCase('')).toBe('');
  });
});