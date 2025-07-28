import * as fs from 'fs';
import * as path from 'path';

import type { PackageJson } from '../types/package-json';

// Test helper constants
const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'eslint.config.js');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const TSCONFIG_PATH = path.join(PROJECT_ROOT, 'tsconfig.json');
const TSCONFIG_TEST_PATH = path.join(PROJECT_ROOT, 'tsconfig.test.json');

// Test data builders
class ConfigContentMatcher {
  private readonly content: string;

  constructor(content: string) {
    this.content = content;
  }

  containsAll(patterns: string[]): boolean {
    return patterns.every(pattern => this.content.includes(pattern));
  }

  containsLayer(layerPatterns: string[]): void {
    layerPatterns.forEach(pattern => {
      expect(this.content).toContain(pattern);
    });
  }
}

// Helper functions
const readFileAsString = (filePath: string): string => {
  return fs.readFileSync(filePath, 'utf8');
};

const readFileAsJson = <T = unknown>(filePath: string): T => {
  return JSON.parse(readFileAsString(filePath)) as T;
};

describe('ESLint Configuration', () => {
  it('should have a valid ESLint configuration file', () => {
    expect(fs.existsSync(CONFIG_PATH)).toBe(true);
  });

  describe('Configuration Structure', () => {
    let configContent: string;
    let configMatcher: ConfigContentMatcher;

    beforeEach(() => {
      configContent = readFileAsString(CONFIG_PATH);
      configMatcher = new ConfigContentMatcher(configContent);
    });

    it('should export an array of configurations', () => {
      const expectedPatterns = [
        'module.exports = [',
        '@typescript-eslint/no-explicit-any',
        'files: [\'**/*.ts\', \'**/*.tsx\']'
      ];
      
      expect(configMatcher.containsAll(expectedPatterns)).toBe(true);
    });

    it('should have test file specific rules', () => {
      const testFilePatterns = [
        '**/*.test.ts',
        '**/*.spec.ts',
        'tsconfig.test.json'
      ];
      
      expect(configMatcher.containsAll(testFilePatterns)).toBe(true);
    });

    describe('Type Safety Layers', () => {
      const typeSafetyLayers = {
        'Layer 1: Complete any Elimination': [
          '@typescript-eslint/no-explicit-any',
          '@typescript-eslint/no-unsafe-assignment',
          '@typescript-eslint/no-unsafe-member-access',
          '@typescript-eslint/no-unsafe-call',
          '@typescript-eslint/no-unsafe-return',
          '@typescript-eslint/no-unsafe-argument'
        ],
        'Layer 2: Function Boundary Safety': [
          '@typescript-eslint/explicit-module-boundary-types'
        ],
        'Layer 3: Null/Undefined Complete Safety': [
          '@typescript-eslint/no-non-null-assertion',
          '@typescript-eslint/prefer-nullish-coalescing',
          '@typescript-eslint/prefer-optional-chain'
        ],
        'Layer 4: Promise/Async Complete Safety': [
          '@typescript-eslint/await-thenable',
          '@typescript-eslint/no-floating-promises',
          '@typescript-eslint/no-misused-promises',
          '@typescript-eslint/require-await'
        ],
        'Layer 5: Code Quality Gates': [
          'complexity',
          'max-lines-per-function',
          'max-lines',
          'no-console'
        ],
        'Layer 6: Exhaustiveness': [
          '@typescript-eslint/switch-exhaustiveness-check'
        ],
        'Layer 7: Dependency Management': [
          'import/order',
          'import/no-duplicates',
          'import/no-cycle',
          'import/no-self-import'
        ]
      };

      Object.entries(typeSafetyLayers).forEach(([layerName, patterns]) => {
        it(`should include ${layerName}`, () => {
          configMatcher.containsLayer(patterns);
        });
      });
    });

    it('should have proper ignore patterns', () => {
      const ignorePatterns = [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        'eslint.config.js'
      ];
      
      expect(configMatcher.containsAll(ignorePatterns)).toBe(true);
    });

    it('should have prettier integration', () => {
      const prettierPatterns = [
        'eslint-config-prettier',
        'prettierConfig'
      ];
      
      expect(configMatcher.containsAll(prettierPatterns)).toBe(true);
    });
  });

  describe('ESLint Integration', () => {
    let packageJson: PackageJson;

    beforeEach(() => {
      packageJson = readFileAsJson<PackageJson>(PACKAGE_JSON_PATH);
    });

    it('should be able to run ESLint via npm script', () => {
      const expectedScripts = {
        lint: 'eslint .',
        'lint:fix': 'eslint . --fix'
      };

      Object.entries(expectedScripts).forEach(([scriptName, expectedCommand]) => {
        expect(packageJson.scripts?.[scriptName]).toBe(expectedCommand);
      });
    });

    describe('Required Dependencies', () => {
      const requiredDependencies = {
        'Core ESLint': ['eslint', '@eslint/js'],
        'TypeScript ESLint': ['@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'],
        'Import Plugin': ['eslint-plugin-import', 'eslint-import-resolver-typescript'],
        'Prettier Integration': ['eslint-config-prettier']
      };

      Object.entries(requiredDependencies).forEach(([category, deps]) => {
        it(`should have ${category} dependencies`, () => {
          const devDeps = packageJson.devDependencies ?? {};
          deps.forEach(dep => {
            expect(devDeps).toHaveProperty(dep);
          });
        });
      });
    });
  });

  describe('TypeScript Configuration Integration', () => {
    it('should have tsconfig.json with strict mode', () => {
      const tsconfigContent = readFileAsString(TSCONFIG_PATH);
      const strictModeSettings = [
        '"strict": true',
        '"noImplicitAny": true',
        '"strictNullChecks": true',
        '"strictFunctionTypes": true'
      ];
      
      const tsconfigMatcher = new ConfigContentMatcher(tsconfigContent);
      expect(tsconfigMatcher.containsAll(strictModeSettings)).toBe(true);
    });

    it('should have tsconfig.test.json for test files', () => {
      expect(fs.existsSync(TSCONFIG_TEST_PATH)).toBe(true);
      
      interface TestTsConfig {
        extends: string;
        include: string[];
      }
      
      const testTsconfig = readFileAsJson<TestTsConfig>(TSCONFIG_TEST_PATH);
      expect(testTsconfig.extends).toBe('./tsconfig.json');
      expect(testTsconfig.include).toContain('tests/**/*.ts');
    });
  });
});