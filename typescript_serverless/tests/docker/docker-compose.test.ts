import * as fs from 'fs';

import { describe, it, expect, beforeAll } from '@jest/globals';

import type { DockerComposeConfig } from './docker-types';
import { getComposePath, readComposeConfig } from './docker-utils';

describe('compose.yml', () => {
  let composeConfig: DockerComposeConfig;

  beforeAll(() => {
    composeConfig = readComposeConfig();
  });

  it('should exist', () => {
    expect(fs.existsSync(getComposePath())).toBe(true);
  });

  it('should not have version field (Docker Compose V2)', () => {
    expect(composeConfig.version).toBeUndefined();
  });

  describe('DynamoDB service', () => {
    it('should be configured with amazon/dynamodb-local image', () => {
      expect(composeConfig.services.dynamodb).toBeDefined();
      expect(composeConfig.services.dynamodb.image).toMatch(/amazon\/dynamodb-local/);
    });

    it('should expose port 8000', () => {
      expect(composeConfig.services.dynamodb.ports).toContain('8000:8000');
    });

    it('should have data persistence volume', () => {
      expect(composeConfig.services.dynamodb.volumes).toContain('dynamodb_data:/data');
      expect(composeConfig.volumes?.dynamodb_data).toBeDefined();
    });

    it('should have health check configured', () => {
      const healthcheck = composeConfig.services.dynamodb.healthcheck;
      expect(healthcheck).toBeDefined();
      expect(healthcheck?.test).toBeDefined();
      expect(healthcheck?.interval).toBe('5s');
      expect(healthcheck?.timeout).toBe('2s');
      expect(healthcheck?.retries).toBe(3);
    });

    it('should use sharedDb mode with persistent storage', () => {
      expect(composeConfig.services.dynamodb.command).toContain('-sharedDb');
      expect(composeConfig.services.dynamodb.command).toContain('-dbPath /data');
    });
  });

  describe('web-member service', () => {
    it('should be configured with development build target', () => {
      expect(composeConfig.services['web-member']).toBeDefined();
      expect(composeConfig.services['web-member'].build?.target).toBe('development');
    });

    it('should expose port 3000', () => {
      expect(composeConfig.services['web-member'].ports).toContain('3000:3000');
    });

    it('should have proper volume mounts for hot reload', () => {
      const volumes = composeConfig.services['web-member'].volumes;
      expect(volumes).toContain('./apps/web-member:/app/apps/web-member');
      expect(volumes).toContain('./packages:/app/packages');
    });

    it('should set NODE_ENV to development', () => {
      expect(composeConfig.services['web-member'].environment?.NODE_ENV).toBe('development');
    });

    it('should depend on dynamodb with health check', () => {
      const depends = composeConfig.services['web-member'].depends_on;
      expect(depends?.dynamodb?.condition).toBe('service_healthy');
    });
  });

  describe('web-admin service', () => {
    it('should be configured with admin profile', () => {
      expect(composeConfig.services['web-admin']).toBeDefined();
      expect(composeConfig.services['web-admin'].profiles).toContain('admin');
      expect(composeConfig.services['web-admin'].profiles).toContain('full');
    });

    it('should have similar configuration to web-member service', () => {
      expect(composeConfig.services['web-admin'].build?.target).toBe('development');
      expect(composeConfig.services['web-admin'].environment?.NODE_ENV).toBe('development');
    });

    it('should expose port 3001', () => {
      expect(composeConfig.services['web-admin'].ports).toContain('3001:3000');
    });

    it('should have proper volume mounts', () => {
      const volumes = composeConfig.services['web-admin'].volumes;
      expect(volumes).toContain('./apps/web-admin:/app/apps/web-admin');
      expect(volumes).toContain('./packages:/app/packages');
    });
  });

  describe('Profiles', () => {
    it('should have admin profile for optional services', () => {
      expect(composeConfig.services['web-admin'].profiles).toContain('admin');
    });

    it('should have full profile for all services', () => {
      expect(composeConfig.services['web-admin'].profiles).toContain('full');
    });
  });

  describe('Volumes', () => {
    it('should define dynamodb_data volume', () => {
      expect(composeConfig.volumes?.dynamodb_data).toBeDefined();
    });
  });
});