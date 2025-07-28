/**
 * Test case structure for string transformations
 */
export interface StringTransformTestCase {
  input: string;
  expected: string;
  description?: string;
}

/**
 * Test helper for string transformation functions
 */
export function testStringTransform(
  transformer: (input: string) => string,
  testCases: StringTransformTestCase[]
): void {
  testCases.forEach(({ input, expected, description }) => {
    const testDesc = description ?? `should transform "${input}" to "${expected}"`;
    it(testDesc, () => {
      expect(transformer(input)).toBe(expected);
    });
  });
}

/**
 * Common test cases for case transformations
 */
export const caseTransformTestData = {
  kebabCase: [
    { input: 'camelCase', expected: 'camel-case' },
    { input: 'PascalCase', expected: 'pascal-case' },
    { input: 'hello world', expected: 'hello-world' },
    { input: 'snake_case', expected: 'snake-case' },
    { input: 'already-kebab-case', expected: 'already-kebab-case' },
    { input: 'XMLHttpRequest', expected: 'xml-http-request' },
  ] as StringTransformTestCase[],

  camelCase: [
    { input: 'kebab-case', expected: 'kebabCase' },
    { input: 'snake_case', expected: 'snakeCase' },
    { input: 'hello world', expected: 'helloWorld' },
    { input: 'alreadyCamelCase', expected: 'alreadyCamelCase' },
    { input: 'PascalCase', expected: 'pascalCase' },
  ] as StringTransformTestCase[],

  pascalCase: [
    { input: 'kebab-case', expected: 'KebabCase' },
    { input: 'snake_case', expected: 'SnakeCase' },
    { input: 'hello world', expected: 'HelloWorld' },
    { input: 'AlreadyPascalCase', expected: 'AlreadyPascalCase' },
    { input: 'camelCase', expected: 'CamelCase' },
  ] as StringTransformTestCase[],
};

/**
 * Edge case test data for string utilities
 */
export const stringEdgeCases = {
  empty: '',
  singleChar: 'a',
  whitespaceOnly: '   ',
  mixedWhitespace: '  \t\n  ',
  veryLong: 'a'.repeat(1000),
  specialChars: '!@#$%^&*()',
  unicode: '你好世界 🌍',
};

/**
 * Test data builder for masked strings
 */
export class MaskedStringTestBuilder {
  private input = '';
  private visibleChars = 3;
  private expectedResult = '';

  withInput(input: string): this {
    this.input = input;
    return this;
  }

  withVisibleChars(count: number): this {
    this.visibleChars = count;
    return this;
  }

  expectingResult(result: string): this {
    this.expectedResult = result;
    return this;
  }

  build(): { input: string; visibleChars: number; expected: string } {
    return {
      input: this.input,
      visibleChars: this.visibleChars,
      expected: this.expectedResult,
    };
  }
}

/**
 * Parameterized test runner for string length validations
 */
export function testStringLength(
  fn: (str: string, length: number) => boolean,
  testType: 'min' | 'max'
): void {
  const testCases = [
    { str: 'hello', length: 3, expected: true },
    { str: 'hello', length: 5, expected: true },
    { str: 'hello', length: 7, expected: testType === 'min' ? false : true },
    { str: '', length: 0, expected: true },
    { str: '', length: 1, expected: testType === 'min' ? false : true },
  ];

  testCases.forEach(({ str, length, expected }) => {
    const condition = testType === 'min' ? 'at least' : 'at most';
    it(`"${str}" should ${expected ? 'have' : 'not have'} ${condition} ${length} characters`, () => {
      expect(fn(str, length)).toBe(expected);
    });
  });
}