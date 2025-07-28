export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  engines?: {
    node?: string;
    npm?: string;
  };
  author?: string | {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: string;
  keywords?: string[];
  homepage?: string;
  repository?: string | {
    type?: string;
    url?: string;
  };
  bugs?: string | {
    url?: string;
    email?: string;
  };
  private?: boolean;
  workspaces?: string[] | {
    packages?: string[];
  };
}