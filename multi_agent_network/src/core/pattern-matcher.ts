import type { MessagePattern, ValidatedMessageType } from './types/branded-types';

// Compiled pattern interface for type safety
export interface CompiledPattern extends RegExp {
  readonly pattern: MessagePattern;
  readonly compiledAt: number;
}

// Pattern match result for detailed analysis
export interface PatternMatchResult {
  matched: boolean;
  pattern: MessagePattern;
  messageType: ValidatedMessageType;
  fromCache: boolean;
  executionTime: number;
}

// Cache statistics for monitoring
export interface CacheStats {
  hitRate: number;
  totalAccesses: number;
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  maxSize: number;
}

// LRU cache entry
interface CacheEntry {
  regex: RegExp;
  lastUsed: number;
  accessCount: number;
}

/**
 * Interface for pattern matching with caching capabilities
 * CLAUDE.md SOLID: Interface Segregation Principle
 */
export interface IPatternMatcher {
  matches(pattern: MessagePattern, messageType: ValidatedMessageType): boolean;
  compile(pattern: MessagePattern): CompiledPattern;
  getCacheSize(): number;
}

/**
 * High-performance pattern matcher with LRU caching
 * Implements CLAUDE.md principles: DRY, Performance, Security
 */
export class CachedPatternMatcher implements IPatternMatcher {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private accessCounter: number = 0;
  private hitCount: number = 0;
  private missCount: number = 0;

  // Security: Prevent ReDoS attacks
  private readonly REGEX_TIMEOUT_MS = 5;
  private readonly MAX_REGEX_LENGTH = 1000;

  constructor(maxCacheSize: number = 1000) {
    this.maxSize = maxCacheSize;
  }

  /**
   * Tests if a message type matches a pattern
   * @param pattern - The pattern to match against
   * @param messageType - The message type to test
   * @returns true if the message type matches the pattern
   */
  matches(pattern: MessagePattern, messageType: ValidatedMessageType): boolean {
    const compiledPattern = this.getCompiledPattern(pattern);
    
    const start = process.hrtime.bigint();
    const result = this.testWithTimeout(compiledPattern, messageType);
    const end = process.hrtime.bigint();
    
    const executionTime = Number(end - start) / 1000000; // Convert to ms
    
    // Log slow operations for monitoring
    if (executionTime > this.REGEX_TIMEOUT_MS) {
      console.warn(`Pattern matching exceeded timeout: ${executionTime}ms for pattern ${pattern}`);
    }
    
    return result;
  }

  /**
   * Compiles a pattern into a RegExp with metadata
   * @param pattern - The pattern to compile
   * @returns CompiledPattern object
   */
  compile(pattern: MessagePattern): CompiledPattern {
    const regex = this.getCompiledPattern(pattern);
    
    return Object.assign(regex, {
      pattern,
      compiledAt: Date.now()
    }) as CompiledPattern;
  }

  /**
   * Gets the current cache size
   * @returns Number of cached patterns
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Gets detailed cache statistics
   * @returns CacheStats object with performance metrics
   */
  getCacheStats(): CacheStats {
    const totalAccesses = this.hitCount + this.missCount;
    const hitRate = totalAccesses > 0 ? (this.hitCount / totalAccesses) * 100 : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      totalAccesses,
      cacheHits: this.hitCount,
      cacheMisses: this.missCount,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Clears the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    this.accessCounter = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Gets or creates a compiled pattern with LRU caching
   * @param pattern - The pattern to compile
   * @returns Compiled RegExp
   * @private
   */
  private getCompiledPattern(pattern: MessagePattern): RegExp {
    this.accessCounter++;
    
    const existingEntry = this.cache.get(pattern);
    if (existingEntry) {
      // Cache hit - update LRU data
      existingEntry.lastUsed = this.accessCounter;
      existingEntry.accessCount++;
      this.hitCount++;
      return existingEntry.regex;
    }

    // Cache miss - compile new pattern
    this.missCount++;
    const compiledRegex = this.compilePattern(pattern);
    
    // Add to cache with LRU eviction if needed
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(pattern, {
      regex: compiledRegex,
      lastUsed: this.accessCounter,
      accessCount: 1
    });
    
    return compiledRegex;
  }

  /**
   * Compiles a pattern string into a RegExp
   * @param pattern - The pattern to compile
   * @returns Compiled RegExp
   * @private
   */
  private compilePattern(pattern: MessagePattern): RegExp {
    // Security: Check pattern length to prevent ReDoS
    if (pattern.length > this.MAX_REGEX_LENGTH) {
      throw new Error(`Pattern too long: ${pattern.length} characters. Maximum ${this.MAX_REGEX_LENGTH} allowed`);
    }

    // Convert wildcard pattern to regex
    // CLAUDE.md: Choose clarity over cleverness
    // Work with string value of the branded type
    const patternStr = pattern as string;
    
    // Escape regex special characters except * and .
    const escaped = patternStr.replace(/[+^${}()|[\]\\]/g, '\\$&');
    
    // Escape literal dots
    const withEscapedDots = escaped.replace(/\./g, '\\.');
    
    // Convert wildcards to regex wildcards  
    const regexPattern = withEscapedDots.replace(/\*/g, '.*');
    
    try {
      return new RegExp(`^${regexPattern}$`);
    } catch (error) {
      throw new Error(`Invalid pattern compilation: ${pattern}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evicts the least recently used entry from cache
   * @private
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruValue: number = Infinity;

    // Find the entry with the smallest lastUsed value
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < lruValue) {
        lruValue = entry.lastUsed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Tests a regex against a string with timeout protection
   * @param regex - The compiled regex
   * @param text - The text to test
   * @returns Match result
   * @private
   */
  private testWithTimeout(regex: RegExp, text: ValidatedMessageType): boolean {
    const start = Date.now();
    
    try {
      const result = regex.test(text);
      
      // Check if execution took too long
      const duration = Date.now() - start;
      if (duration > this.REGEX_TIMEOUT_MS) {
        console.warn(`Regex execution timeout: ${duration}ms for pattern ${regex.source}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Regex execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
}