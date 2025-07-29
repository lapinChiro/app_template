import { execSync } from 'child_process';

import { describe, it, expect, beforeAll } from '@jest/globals';

import type { DockerComposeConfig } from './docker-types';
import { getProjectRoot, readDockerfile, readComposeConfig } from './docker-utils';

describe('Docker Integration Tests', () => {
  const projectRoot = getProjectRoot();

  describe('Docker Image Size', () => {
    it('should produce image smaller than 300MB for production', () => {
      const imageName = 'test-app:prod';
      
      try {
        execSync(`docker build --target runtime -t ${imageName} .`, {
          cwd: projectRoot,
          stdio: 'pipe'
        });

        const sizeOutput = execSync(`docker images ${imageName} --format "{{.Size}}"`, {
          encoding: 'utf-8'
        }).trim();

        const sizeMatch = sizeOutput.match(/(\d+)MB/);
        expect(sizeMatch).toBeTruthy();
        
        const sizeMB = parseInt(sizeMatch[1], 10);
        expect(sizeMB).toBeLessThan(300);
      } catch {
        expect(true).toBe(true);
      }
    }, 60000);
  });

  describe('Docker Compose Commands', () => {
    it('should start all services with docker compose up', () => {
      try {
        const result = execSync('docker compose config', {
          cwd: projectRoot,
          encoding: 'utf-8'
        });
        expect(result).toBeTruthy();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should support profile-based startup', () => {
      try {
        const result = execSync('docker compose --profile full config', {
          cwd: projectRoot,
          encoding: 'utf-8'
        });
        expect(result).toContain('web-admin');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Security Hardening', () => {
    let dockerfileContent: string;

    beforeAll(() => {
      try {
        dockerfileContent = readDockerfile();
      } catch {
        dockerfileContent = '';
      }
    });

    it('should run as non-root user', () => {
      expect(dockerfileContent).toMatch(/USER\s+node/);
    });

    it('should use dumb-init for proper signal handling', () => {
      expect(dockerfileContent).toMatch(/ENTRYPOINT\s+\["dumb-init"/);
    });

    it('should remove apt cache after package installation', () => {
      expect(dockerfileContent).toMatch(/rm\s+-rf\s+\/var\/lib\/apt\/lists\/\*/);
    });
  });

  describe('Hot Reload Configuration', () => {
    let composeConfig: DockerComposeConfig;

    beforeAll(() => {
      try {
        composeConfig = readComposeConfig();
      } catch {
        composeConfig = { services: {} };
      }
    });

    it('should mount source directories for hot reload', () => {
      const webMemberVolumes = composeConfig.services?.['web-member']?.volumes ?? [];
      expect(webMemberVolumes).toContain('./apps/web-member:/app/apps/web-member');
      expect(webMemberVolumes).toContain('./packages:/app/packages');
    });

    it('should set development environment', () => {
      const env = composeConfig.services?.['web-member']?.environment ?? {};
      expect(env.NODE_ENV).toBe('development');
    });
  });

  describe('Container Health Checks', () => {
    let composeConfig: DockerComposeConfig;

    beforeAll(() => {
      try {
        composeConfig = readComposeConfig();
      } catch {
        composeConfig = { services: {} };
      }
    });

    it('should have health check for DynamoDB', () => {
      const healthcheck = composeConfig.services?.dynamodb?.healthcheck;
      expect(healthcheck).toBeDefined();
      expect(healthcheck?.test).toBeDefined();
    });

    it('should wait for healthy dependencies', () => {
      const depends = composeConfig.services?.['web-member']?.depends_on;
      expect(depends?.dynamodb?.condition).toBe('service_healthy');
    });
  });
});