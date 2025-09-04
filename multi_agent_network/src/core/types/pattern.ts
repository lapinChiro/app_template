// Pattern-related type definitions for Phase2
// CLAUDE.md: DRY Principle - centralize pattern-related types

export interface PatternMatchConfig {
  maxCacheSize: number;
  regexTimeout: number;
  maxPatternLength: number;
}

export interface PatternStats {
  pattern: string;
  accessCount: number;
  lastUsed: number;
  averageExecutionTime: number;
}

export interface PatternMatchMetrics {
  totalMatches: number;
  cacheHitRate: number;
  averageMatchTime: number;
  slowPatterns: PatternStats[];
}

// Default configuration for pattern matching
export const DEFAULT_PATTERN_CONFIG: PatternMatchConfig = {
  maxCacheSize: 1000,
  regexTimeout: 5, // ms
  maxPatternLength: 1000
};

// Pattern validation utilities
export const PATTERN_CONSTRAINTS = {
  MAX_DEPTH: 5,
  ALLOWED_CHARS: /^[a-zA-Z0-9._*-]+$/,
  WILDCARD_CHAR: '*'
} as const;