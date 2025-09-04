import { describe, test, expect, beforeEach } from 'vitest';

// Import types and implementation we'll create
import type {
  IPatternMatcher,
  CompiledPattern,
  PatternMatchResult
} from '../../src/core/pattern-matcher';

import {
  CachedPatternMatcher
} from '../../src/core/pattern-matcher';

import type { MessagePattern, ValidatedMessageType } from '../../src/core/types/branded-types';
import { createMessagePattern, createValidatedMessageType } from '../../src/core/types/branded-types';

describe('CachedPatternMatcher', () => {
  let matcher: CachedPatternMatcher;

  beforeEach(() => {
    matcher = new CachedPatternMatcher();
  });

  describe('Basic Pattern Matching', () => {
    test('should match exact patterns', () => {
      const pattern = createMessagePattern('user.login');
      const messageType = createValidatedMessageType('user.login');
      
      expect(matcher.matches(pattern, messageType)).toBe(true);
      
      const differentType = createValidatedMessageType('user.logout');
      expect(matcher.matches(pattern, differentType)).toBe(false);
    });

    test('should match wildcard patterns', () => {
      const pattern = createMessagePattern('user.*');
      
      expect(matcher.matches(pattern, createValidatedMessageType('user.login'))).toBe(true);
      expect(matcher.matches(pattern, createValidatedMessageType('user.logout'))).toBe(true);
      expect(matcher.matches(pattern, createValidatedMessageType('user.settings.update'))).toBe(true);
      expect(matcher.matches(pattern, createValidatedMessageType('admin.login'))).toBe(false);
    });

    test('should handle complex wildcard patterns', () => {
      const pattern = createMessagePattern('system.*.alert');
      
      expect(matcher.matches(pattern, createValidatedMessageType('system.security.alert'))).toBe(true);
      expect(matcher.matches(pattern, createValidatedMessageType('system.performance.alert'))).toBe(true);
      expect(matcher.matches(pattern, createValidatedMessageType('system.alert'))).toBe(false);
      expect(matcher.matches(pattern, createValidatedMessageType('system.security.warning'))).toBe(false);
    });

    test('should handle edge cases safely', () => {
      const pattern = createMessagePattern('test');
      
      expect(matcher.matches(pattern, createValidatedMessageType('test'))).toBe(true);
      expect(matcher.matches(pattern, createValidatedMessageType('test.sub'))).toBe(false);
      expect(matcher.matches(pattern, createValidatedMessageType('prefix.test'))).toBe(false);
    });
  });

  describe('LRU Cache Functionality', () => {
    test('should cache compiled patterns', () => {
      const pattern = createMessagePattern('test.*');
      const messageType = createValidatedMessageType('test.message');
      
      // First match - should compile and cache
      matcher.matches(pattern, messageType);
      expect(matcher.getCacheSize()).toBe(1);
      
      // Second match - should use cache
      matcher.matches(pattern, messageType);
      expect(matcher.getCacheSize()).toBe(1); // Still 1, not 2
    });

    test('should evict old patterns when cache is full', () => {
      // Fill cache to maximum
      for (let i = 0; i < 1000; i++) {
        const pattern = createMessagePattern(`pattern${i}.*`);
        const messageType = createValidatedMessageType(`pattern${i}.test`);
        matcher.matches(pattern, messageType);
      }
      
      expect(matcher.getCacheSize()).toBe(1000);
      
      // Add one more - should trigger eviction
      const newPattern = createMessagePattern('new.pattern.*');
      const newType = createValidatedMessageType('new.pattern.test');
      matcher.matches(newPattern, newType);
      
      expect(matcher.getCacheSize()).toBe(1000); // Still at max
    });

    test('should implement proper LRU eviction', () => {
      // Create patterns
      const patterns = [];
      for (let i = 0; i < 5; i++) {
        patterns.push(createMessagePattern(`test${i}.*`));
      }
      
      // Access patterns in order
      patterns.forEach((pattern, i) => {
        matcher.matches(pattern, createValidatedMessageType(`test${i}.message`));
      });
      
      // Access first pattern again (make it most recent)
      matcher.matches(patterns[0], createValidatedMessageType('test0.message'));
      
      // Get cache statistics
      const stats = matcher.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.totalAccesses).toBe(6); // 5 initial + 1 repeat
    });
  });

  describe('Performance', () => {
    test('should match patterns within 2ms', () => {
      const pattern = createMessagePattern('performance.test.*');
      const iterations = 1000;
      
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        matcher.matches(pattern, createValidatedMessageType(`performance.test.${i}`));
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(2); // < 2ms per match
    });

    test('should benefit from caching', () => {
      const pattern = createMessagePattern('cache.test.*');
      const messageType = createValidatedMessageType('cache.test.message');
      
      // First match (compile + cache)
      const start1 = process.hrtime.bigint();
      matcher.matches(pattern, messageType);
      const end1 = process.hrtime.bigint();
      const firstTime = Number(end1 - start1) / 1000000;
      
      // Second match (from cache)
      const start2 = process.hrtime.bigint();
      matcher.matches(pattern, messageType);
      const end2 = process.hrtime.bigint();
      const secondTime = Number(end2 - start2) / 1000000;
      
      // Cached access should be faster
      expect(secondTime).toBeLessThan(firstTime);
    });
  });

  describe('Memory Management', () => {
    test('should not exceed memory limits with 1000 patterns', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Fill cache with 1000 patterns
      for (let i = 0; i < 1000; i++) {
        const pattern = createMessagePattern(`memory${i}.*`);
        matcher.matches(pattern, createValidatedMessageType(`memory${i}.test`));
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB
      
      expect(memoryIncrease).toBeLessThan(10); // < 10MB for 1000 patterns
    });

    test('should handle pattern cleanup correctly', () => {
      // Add some patterns
      for (let i = 0; i < 100; i++) {
        matcher.matches(createMessagePattern(`cleanup${i}.*`), createValidatedMessageType(`cleanup${i}.test`));
      }
      
      expect(matcher.getCacheSize()).toBe(100);
      
      // Clear cache
      matcher.clearCache();
      expect(matcher.getCacheSize()).toBe(0);
    });
  });

  describe('Security', () => {
    test('should prevent ReDoS attacks with malicious patterns', () => {
      const maliciousPatterns = [
        'a.*a.*a.*a.*a.*a.*a.*a.*a.*a.*a.*',
        '(a+)+$',
        '([a-zA-Z]+)*$'
      ];
      
      maliciousPatterns.forEach(maliciousPattern => {
        const start = process.hrtime.bigint();
        
        try {
          const pattern = createMessagePattern(maliciousPattern);
          matcher.matches(pattern, createValidatedMessageType('test.message'));
        } catch (error) {
          // Pattern creation might fail, which is fine
        }
        
        const end = process.hrtime.bigint();
        const time = Number(end - start) / 1000000;
        
        expect(time).toBeLessThan(10); // Should not take more than 10ms even for malicious patterns
      });
    });

    test('should handle special regex characters safely', () => {
      const specialChars = ['[', ']', '(', ')', '+', '^', '$', '?'];
      
      specialChars.forEach(char => {
        expect(() => {
          // Should not throw during pattern creation
          createMessagePattern(`test.special.${char}.pattern`);
        }).toThrow(); // Actually, these should be rejected by createMessagePattern
      });
    });
  });

  describe('Interface Implementation', () => {
    test('should implement IPatternMatcher interface correctly', () => {
      const pattern = createMessagePattern('interface.*');
      const messageType = createValidatedMessageType('interface.test');
      
      // Test interface methods
      expect(typeof matcher.matches).toBe('function');
      expect(typeof matcher.compile).toBe('function');
      
      const compiled = matcher.compile(pattern);
      expect(compiled).toBeDefined();
      expect(typeof compiled.test).toBe('function');
    });

    test('should provide cache introspection methods', () => {
      expect(typeof matcher.getCacheSize).toBe('function');
      expect(typeof matcher.getCacheStats).toBe('function');
      expect(typeof matcher.clearCache).toBe('function');
      
      const stats = matcher.getCacheStats();
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalAccesses');
      expect(stats).toHaveProperty('cacheHits');
      expect(stats).toHaveProperty('cacheMisses');
    });
  });
});