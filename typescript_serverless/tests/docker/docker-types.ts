interface DockerService {
  build?: {
    context: string;
    target?: string;
  };
  image?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  depends_on?: Record<string, { condition: string }>;
  command?: string[] | string;
  profiles?: string[];
  extends?: { service: string };
  healthcheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
  };
}

interface DockerComposeConfig {
  services: Record<string, DockerService>;
  volumes?: Record<string, { driver: string }>;
  networks?: Record<string, { driver: string }>;
}

export type { DockerService, DockerComposeConfig };