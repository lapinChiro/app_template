import * as fs from 'fs';

import { describe, it, expect, beforeAll } from '@jest/globals';

import { getDockerfilePath, readDockerfile } from './docker-utils';

describe('Dockerfile', () => {
  let dockerfileContent: string;

  beforeAll(() => {
    dockerfileContent = readDockerfile();
  });

  it('should exist', () => {
    expect(fs.existsSync(getDockerfilePath())).toBe(true);
  });

  it('should use node:22-bookworm-slim as base image', () => {
    expect(dockerfileContent).toMatch(/FROM\s+node:22-bookworm-slim\s+AS\s+base/);
  });

  it('should implement multi-stage build pattern', () => {
    expect(dockerfileContent).toMatch(/FROM.*AS\s+base/);
    expect(dockerfileContent).toMatch(/FROM.*AS\s+dependencies/);
    expect(dockerfileContent).toMatch(/FROM.*AS\s+development/);
  });

  it('should install dumb-init for proper signal handling', () => {
    expect(dockerfileContent).toMatch(/apt-get.*install.*dumb-init/);
  });

  it('should use non-root user for security', () => {
    expect(dockerfileContent).toMatch(/USER\s+node/);
  });

  it('should set up proper entrypoint with dumb-init', () => {
    expect(dockerfileContent).toMatch(/ENTRYPOINT\s+\["dumb-init",\s*"--"\]/);
  });

  it('should copy dependency files before source code for layer caching', () => {
    const packageJsonIndex = dockerfileContent.indexOf('COPY package.json');
    const sourceCodeIndex = dockerfileContent.indexOf('COPY . .');
    expect(packageJsonIndex).toBeGreaterThan(0);
    expect(packageJsonIndex).toBeLessThan(sourceCodeIndex);
  });

  it('should enable pnpm with corepack', () => {
    expect(dockerfileContent).toMatch(/corepack enable/);
  });

  it('should expose port 3000', () => {
    expect(dockerfileContent).toMatch(/EXPOSE\s+3000/);
  });

  it('should use pnpm dev as default command', () => {
    expect(dockerfileContent).toMatch(/CMD\s+\["pnpm",\s*"dev"\]/);
  });

  it('should remove apt cache after package installation', () => {
    expect(dockerfileContent).toMatch(/rm -rf \/var\/lib\/apt\/lists\/\*/);
  });
});