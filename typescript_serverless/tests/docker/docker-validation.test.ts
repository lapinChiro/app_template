// execSync imported but not used in this file
import * as fs from 'fs';
import * as path from 'path';

import { describe, it, expect } from '@jest/globals';

describe('Docker Configuration Validation', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const dockerDir = path.join(projectRoot, 'docker');

  describe('Docker Directory Structure', () => {
    it('should have docker directory', () => {
      expect(fs.existsSync(dockerDir)).toBe(true);
    });

    it('should have dev.Dockerfile', () => {
      const devDockerfile = path.join(dockerDir, 'dev.Dockerfile');
      expect(fs.existsSync(devDockerfile)).toBe(true);
    });

    it('should have .dockerignore file', () => {
      const dockerignore = path.join(projectRoot, '.dockerignore');
      expect(fs.existsSync(dockerignore)).toBe(true);
    });
  });

  describe('Docker Build Performance', () => {
    it('should use BuildKit features for caching', () => {
      const dockerfilePath = path.join(projectRoot, 'Dockerfile');
      if (fs.existsSync(dockerfilePath)) {
        const content = fs.readFileSync(dockerfilePath, 'utf-8');
        expect(content).toMatch(/--mount=type=cache/);
      } else {
        expect(fs.existsSync(dockerfilePath)).toBe(true);
      }
    });
  });

  describe('Docker Compose Validation', () => {
    it('should support required profiles', () => {
      const composePath = path.join(projectRoot, 'compose.yml');
      if (fs.existsSync(composePath)) {
        const content = fs.readFileSync(composePath, 'utf-8');
        // Check that profiles contain both admin and full
        expect(content).toMatch(/profiles:[\s\S]*?-\s*admin/);
        expect(content).toMatch(/profiles:[\s\S]*?-\s*full/);
      } else {
        expect(fs.existsSync(composePath)).toBe(true);
      }
    });

    it('should have proper volume configuration for development', () => {
      const composePath = path.join(projectRoot, 'compose.yml');
      if (fs.existsSync(composePath)) {
        const content = fs.readFileSync(composePath, 'utf-8');
        // Check for bind mounts that enable hot reload
        expect(content).toMatch(/\.\/apps.*:\/app\/apps/);
        expect(content).toMatch(/\.\/packages.*:\/app\/packages/);
      } else {
        expect(fs.existsSync(composePath)).toBe(true);
      }
    });
  });

  describe('Container Startup Time', () => {
    it('should configure containers for fast startup', () => {
      // Check for optimizations like:
      // - Minimal base images
      // - Proper layer caching
      // - Efficient dependency installation
      const dockerfilePath = path.join(projectRoot, 'Dockerfile');
      if (fs.existsSync(dockerfilePath)) {
        const content = fs.readFileSync(dockerfilePath, 'utf-8');
        expect(content).toMatch(/node:22-bookworm-slim/);
        expect(content).toMatch(/--frozen-lockfile/);
      } else {
        expect(fs.existsSync(dockerfilePath)).toBe(true);
      }
    });
  });

  describe('Security Scan Readiness', () => {
    it('should have no high/critical vulnerabilities in base image', () => {
      // This would typically run a security scan tool
      // For now, we just check that security best practices are followed
      const dockerfilePath = path.join(projectRoot, 'Dockerfile');
      if (fs.existsSync(dockerfilePath)) {
        const content = fs.readFileSync(dockerfilePath, 'utf-8');
        // Check for security best practices
        expect(content).toMatch(/USER\s+node/); // Non-root user
        expect(content).toMatch(/rm\s+-rf.*apt.*lists/); // Clean apt cache
        expect(content).not.toMatch(/--allow-root/); // No root permissions
      } else {
        expect(fs.existsSync(dockerfilePath)).toBe(true);
      }
    });
  });
});

describe('Docker Development Workflow', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('Development Commands', () => {
    it('should provide npm script for docker development', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
        scripts: Record<string, string>;
      };
      
      expect(packageJson.scripts).toHaveProperty('docker:up');
      expect(packageJson.scripts).toHaveProperty('docker:down');
      expect(packageJson.scripts).toHaveProperty('docker:logs');
    });
  });

  describe('Environment Configuration', () => {
    it('should have .env.example file', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('should configure development environment variables', () => {
      const composePath = path.join(projectRoot, 'compose.yml');
      if (fs.existsSync(composePath)) {
        const content = fs.readFileSync(composePath, 'utf-8');
        expect(content).toMatch(/NODE_ENV.*development/);
      } else {
        expect(fs.existsSync(composePath)).toBe(true);
      }
    });
  });

  describe('DynamoDB Local Integration', () => {
    it('should configure DynamoDB Local with proper health checks', () => {
      const composePath = path.join(projectRoot, 'compose.yml');
      if (fs.existsSync(composePath)) {
        const content = fs.readFileSync(composePath, 'utf-8');
        expect(content).toMatch(/dynamodb.*healthcheck/s);
        expect(content).toMatch(/curl.*localhost:8000/);
      } else {
        expect(fs.existsSync(composePath)).toBe(true);
      }
    });

    it('should persist DynamoDB data between restarts', () => {
      const composePath = path.join(projectRoot, 'compose.yml');
      if (fs.existsSync(composePath)) {
        const content = fs.readFileSync(composePath, 'utf-8');
        expect(content).toMatch(/dynamodb_data:\/data/);
        expect(content).toMatch(/volumes:.*dynamodb_data:/s);
      } else {
        expect(fs.existsSync(composePath)).toBe(true);
      }
    });
  });
});

// Integration test for the complete Docker setup
describe('Docker Environment Integration', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  it('should have all required files for Docker development', () => {
    const requiredFiles = [
      'Dockerfile',
      'compose.yml',
      '.dockerignore',
      '.env.example'
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(projectRoot, file))
    );

    expect(missingFiles).toEqual([]);
  });

  it('should follow Docker best practices', () => {
    const dockerfilePath = path.join(projectRoot, 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      
      // Multi-stage build
      const stages = content.match(/FROM.*AS\s+\w+/g) ?? [];
      expect(stages.length).toBeGreaterThanOrEqual(3);
      
      // Security practices
      expect(content).toMatch(/USER\s+node/);
      expect(content).toMatch(/dumb-init/);
      
      // Build optimization
      expect(content).toMatch(/COPY.*package.*json/);
      expect(content).toMatch(/pnpm.*frozen-lockfile/);
    } else {
      expect(fs.existsSync(dockerfilePath)).toBe(true);
    }
  });

  it('should configure Docker Compose for microservices architecture', () => {
    const composePath = path.join(projectRoot, 'compose.yml');
    if (fs.existsSync(composePath)) {
      const content = fs.readFileSync(composePath, 'utf-8');
      
      // Required services
      expect(content).toMatch(/services:.*dynamodb:/s);
      expect(content).toMatch(/services:.*web-member:/s);
      expect(content).toMatch(/services:.*web-admin:/s);
      
      // Profile support
      expect(content).toMatch(/profiles:/);
      
      // Health checks and dependencies
      expect(content).toMatch(/depends_on:.*condition:\s*service_healthy/s);
    } else {
      expect(fs.existsSync(composePath)).toBe(true);
    }
  });
});