import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('TypeScript Configuration', () => {
  const rootDir = path.join(__dirname, '..', '..');
  const rootTsconfigPath = path.join(rootDir, 'tsconfig.json');

  describe('Root tsconfig.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(rootTsconfigPath)).toBe(true);
    });

    it('should have strict mode enabled', () => {
      const tsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should have strictNullChecks enabled', () => {
      const tsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
    });

    it('should have noImplicitAny enabled', () => {
      const tsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
    });

    it('should have all required compiler options', () => {
      const tsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf-8'));
      const requiredOptions = {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        lib: ['ES2022'],
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: false,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        composite: true,
        incremental: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
      };

      Object.entries(requiredOptions).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          expect(tsconfig.compilerOptions[key]).toEqual(value);
        } else {
          expect(tsconfig.compilerOptions[key]).toBe(value);
        }
      });
    });

    it('should have path aliases configured', () => {
      const tsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.paths).toEqual({
        '@shared/*': ['packages/shared/src/*'],
        '@ui/*': ['packages/ui/src/*'],
      });
    });

    it('should have project references configured', () => {
      const tsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf-8'));
      const expectedReferences = [
        { path: './packages/shared' },
        { path: './packages/ui' },
        { path: './packages/infra' },
        { path: './apps/web-member' },
        { path: './apps/web-admin' },
        { path: './apps/api-member' },
        { path: './apps/api-admin' },
      ];
      expect(tsconfig.references).toEqual(expectedReferences);
    });
  });

  describe('Package tsconfig.json files', () => {
    const packages = [
      'packages/shared',
      'packages/ui',
      'packages/infra',
      'apps/web-member',
      'apps/web-admin',
      'apps/api-member',
      'apps/api-admin',
    ];

    packages.forEach((pkg) => {
      describe(`${pkg}/tsconfig.json`, () => {
        const packageTsconfigPath = path.join(rootDir, pkg, 'tsconfig.json');

        it('should exist', () => {
          expect(fs.existsSync(packageTsconfigPath)).toBe(true);
        });

        it('should extend root tsconfig', () => {
          const tsconfig = JSON.parse(fs.readFileSync(packageTsconfigPath, 'utf-8'));
          expect(tsconfig.extends).toMatch(/^\.\.\/.*tsconfig\.json$/);
        });

        it('should have composite enabled', () => {
          const tsconfig = JSON.parse(fs.readFileSync(packageTsconfigPath, 'utf-8'));
          expect(tsconfig.compilerOptions?.composite).toBe(true);
        });
      });
    });
  });

  describe('TypeScript compilation', () => {
    it('should pass tsc --noEmit without errors', () => {
      try {
        execSync('pnpm tsc --noEmit', { cwd: rootDir, stdio: 'pipe' });
        expect(true).toBe(true);
      } catch (error: any) {
        // If tsc fails, the test should fail with the error output
        throw new Error(`TypeScript compilation failed:\n${error.stdout}\n${error.stderr}`);
      }
    });

    it('should pass tsc --noEmit for each package', () => {
      const packages = [
        'packages/shared',
        'packages/ui',
        'packages/infra',
        'apps/web-member',
        'apps/web-admin',
        'apps/api-member',
        'apps/api-admin',
      ];

      packages.forEach((pkg) => {
        try {
          execSync('pnpm tsc --noEmit', { 
            cwd: path.join(rootDir, pkg), 
            stdio: 'pipe' 
          });
          expect(true).toBe(true);
        } catch (error: any) {
          throw new Error(`TypeScript compilation failed for ${pkg}:\n${error.stdout}\n${error.stderr}`);
        }
      });
    });
  });

  describe('Path aliases', () => {
    it('should resolve @shared imports correctly', () => {
      const testFile = path.join(rootDir, 'test-import-shared.ts');
      const testContent = `import { test } from "@shared/test";\nconsole.log(test);`;
      
      fs.writeFileSync(testFile, testContent);
      
      try {
        execSync('pnpm tsc --noEmit test-import-shared.ts', { 
          cwd: rootDir, 
          stdio: 'pipe' 
        });
        expect(true).toBe(true);
      } catch (error: any) {
        throw new Error(`Path alias @shared resolution failed:\n${error.stdout}\n${error.stderr}`);
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    it('should resolve @ui imports correctly', () => {
      const testFile = path.join(rootDir, 'test-import-ui.ts');
      const testContent = `import { Button } from "@ui/components";\nconsole.log(Button);`;
      
      fs.writeFileSync(testFile, testContent);
      
      try {
        execSync('pnpm tsc --noEmit test-import-ui.ts', { 
          cwd: rootDir, 
          stdio: 'pipe' 
        });
        expect(true).toBe(true);
      } catch (error: any) {
        throw new Error(`Path alias @ui resolution failed:\n${error.stdout}\n${error.stderr}`);
      } finally {
        fs.unlinkSync(testFile);
      }
    });
  });

  describe('Ultimate Type Safety', () => {
    it('should prevent implicit any usage', () => {
      const testFile = path.join(rootDir, 'test-implicit-any.ts');
      const testContent = `function test(value) { return value; }`;
      
      fs.writeFileSync(testFile, testContent);
      
      try {
        execSync('pnpm tsc --noEmit test-implicit-any.ts', { 
          cwd: rootDir, 
          stdio: 'pipe' 
        });
        throw new Error('TypeScript should have failed with implicit any error');
      } catch (error: any) {
        if (error.message === 'TypeScript should have failed with implicit any error') {
          throw error;
        }
        expect(error.stderr?.toString() || '').toContain('Parameter \'value\' implicitly has an \'any\' type');
      } finally {
        fs.unlinkSync(testFile);
      }
    });

    it('should enforce strict null checks', () => {
      const testFile = path.join(rootDir, 'test-strict-null.ts');
      const testContent = `
        let value: string;
        console.log(value.length);
      `;
      
      fs.writeFileSync(testFile, testContent);
      
      try {
        execSync('pnpm tsc --noEmit test-strict-null.ts', { 
          cwd: rootDir, 
          stdio: 'pipe' 
        });
        throw new Error('TypeScript should have failed with strict null check error');
      } catch (error: any) {
        if (error.message === 'TypeScript should have failed with strict null check error') {
          throw error;
        }
        expect(error.stderr?.toString() || '').toContain('Variable \'value\' is used before being assigned');
      } finally {
        fs.unlinkSync(testFile);
      }
    });
  });
});