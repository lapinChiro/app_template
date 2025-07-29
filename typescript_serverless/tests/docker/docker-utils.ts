import * as fs from 'fs';
import * as path from 'path';

import * as yaml from 'js-yaml';

import type { DockerComposeConfig } from './docker-types';

export const getProjectRoot = (): string => path.resolve(__dirname, '../..');

export const getDockerfilePath = (): string => path.join(getProjectRoot(), 'Dockerfile');

export const getComposePath = (): string => path.join(getProjectRoot(), 'compose.yml');

export const readDockerfile = (): string => {
  return fs.readFileSync(getDockerfilePath(), 'utf-8');
};

export const readComposeConfig = (): DockerComposeConfig => {
  const composeContent = fs.readFileSync(getComposePath(), 'utf-8');
  return yaml.load(composeContent) as DockerComposeConfig;
};