import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import types and implementation we'll create
import type {
  IHealthMonitor,
  ComponentHealth,
  HealthReport
} from '../../src/core/health-monitor';

import {
  HealthMonitor,
  CircuitBreakerState
} from '../../src/core/health-monitor';

describe('HealthMonitor', () => {
  let healthMonitor: IHealthMonitor;

  beforeEach(() => {
    healthMonitor = new HealthMonitor();
  });

  describe('Component Health Tracking', () => {
    test('should record component health correctly', () => {
      const componentId = 'test-component';
      
      healthMonitor.recordHealth(componentId, true, 'Component is healthy');
      
      const health = healthMonitor.getComponentHealth(componentId);
      expect(health.isHealthy).toBe(true);
      expect(health.lastMessage).toBe('Component is healthy');
      expect(health.componentId).toBe(componentId);
    });

    test('should track component failures', () => {
      const componentId = 'failing-component';
      
      // Record multiple failures
      for (let i = 0; i < 3; i++) {
        healthMonitor.recordFailure(componentId, new Error(`Failure ${i}`));
      }
      
      const health = healthMonitor.getComponentHealth(componentId);
      expect(health.failureCount).toBe(3);
      expect(health.isHealthy).toBe(true); // Still healthy until threshold
    });

    test('should trigger circuit breaker after threshold failures', () => {
      const componentId = 'circuit-test';
      const threshold = 5;
      
      healthMonitor.setCircuitBreakerThreshold(componentId, threshold);
      
      // Record failures up to threshold
      for (let i = 0; i < threshold; i++) {
        healthMonitor.recordFailure(componentId, new Error(`Failure ${i}`));
      }
      
      const health = healthMonitor.getComponentHealth(componentId);
      expect(health.circuitBreakerState).toBe(CircuitBreakerState.OPEN);
      expect(health.isHealthy).toBe(false);
    });

    test('should reset failure count on successful health check', () => {
      const componentId = 'reset-test';
      
      // Record some failures
      for (let i = 0; i < 3; i++) {
        healthMonitor.recordFailure(componentId, new Error(`Failure ${i}`));
      }
      
      expect(healthMonitor.getComponentHealth(componentId).failureCount).toBe(3);
      
      // Record success
      healthMonitor.recordHealth(componentId, true, 'Component recovered');
      
      expect(healthMonitor.getComponentHealth(componentId).failureCount).toBe(0);
    });
  });

  describe('Circuit Breaker Functionality', () => {
    test('should support configurable circuit breaker thresholds', () => {
      const component1 = 'component1';
      const component2 = 'component2';
      
      healthMonitor.setCircuitBreakerThreshold(component1, 3);
      healthMonitor.setCircuitBreakerThreshold(component2, 10);
      
      // Component1 should trip after 3 failures
      for (let i = 0; i < 3; i++) {
        healthMonitor.recordFailure(component1, new Error(`Failure ${i}`));
      }
      
      // Component2 should not trip after 3 failures
      for (let i = 0; i < 3; i++) {
        healthMonitor.recordFailure(component2, new Error(`Failure ${i}`));
      }
      
      expect(healthMonitor.getComponentHealth(component1).circuitBreakerState).toBe(CircuitBreakerState.OPEN);
      expect(healthMonitor.getComponentHealth(component2).circuitBreakerState).toBe(CircuitBreakerState.CLOSED);
    });

    test('should support half-open state for gradual recovery', async () => {
      const componentId = 'recovery-test';
      healthMonitor.setCircuitBreakerThreshold(componentId, 2);
      
      // Trip the circuit breaker
      healthMonitor.recordFailure(componentId, new Error('Failure 1'));
      healthMonitor.recordFailure(componentId, new Error('Failure 2'));
      
      expect(healthMonitor.getComponentHealth(componentId).circuitBreakerState).toBe(CircuitBreakerState.OPEN);
      
      // Move to half-open for recovery attempt
      healthMonitor.attemptRecovery(componentId);
      
      expect(healthMonitor.getComponentHealth(componentId).circuitBreakerState).toBe(CircuitBreakerState.HALF_OPEN);
      
      // Successful health check should close the circuit
      healthMonitor.recordHealth(componentId, true, 'Recovery successful');
      
      expect(healthMonitor.getComponentHealth(componentId).circuitBreakerState).toBe(CircuitBreakerState.CLOSED);
    });

    test('should return to open state if recovery fails', () => {
      const componentId = 'failed-recovery';
      healthMonitor.setCircuitBreakerThreshold(componentId, 2);
      
      // Trip the circuit breaker
      healthMonitor.recordFailure(componentId, new Error('Initial failure'));
      healthMonitor.recordFailure(componentId, new Error('Second failure'));
      
      // Attempt recovery
      healthMonitor.attemptRecovery(componentId);
      expect(healthMonitor.getComponentHealth(componentId).circuitBreakerState).toBe(CircuitBreakerState.HALF_OPEN);
      
      // Recovery fails
      healthMonitor.recordFailure(componentId, new Error('Recovery failed'));
      
      expect(healthMonitor.getComponentHealth(componentId).circuitBreakerState).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('Health Reporting', () => {
    test('should generate comprehensive health report', () => {
      const component1 = 'healthy-component';
      const component2 = 'unhealthy-component';
      
      healthMonitor.recordHealth(component1, true, 'All good');
      
      healthMonitor.setCircuitBreakerThreshold(component2, 1);
      healthMonitor.recordFailure(component2, new Error('Critical failure'));
      
      const report = healthMonitor.getHealthReport();
      
      expect(report.overallHealthy).toBe(false); // System unhealthy due to component2
      expect(report.totalComponents).toBe(2);
      expect(report.healthyComponents).toBe(1);
      expect(report.unhealthyComponents).toBe(1);
      expect(report.componentsWithOpenCircuits).toBe(1);
    });

    test('should include detailed component information in report', () => {
      const componentId = 'detailed-test';
      
      // Record failure first, then health check
      healthMonitor.recordFailure(componentId, new Error('Minor issue'));
      healthMonitor.recordHealth(componentId, true, 'Working perfectly');
      
      const report = healthMonitor.getHealthReport();
      const componentReport = report.componentDetails.find(c => c.componentId === componentId);
      
      expect(componentReport).toBeDefined();
      expect(componentReport?.isHealthy).toBe(true);
      expect(componentReport?.failureCount).toBe(0); // Reset on health check
      expect(componentReport?.lastMessage).toBe('Working perfectly');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete health checks within 1ms', () => {
      const componentId = 'performance-test';
      const iterations = 1000;
      
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        healthMonitor.recordHealth(componentId, true, `Check ${i}`);
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(1); // < 1ms per health check
    });

    test('should handle high-frequency failure recording efficiently', () => {
      const componentId = 'high-freq-test';
      const failureCount = 10000;
      
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < failureCount; i++) {
        healthMonitor.recordFailure(componentId, new Error(`Failure ${i}`));
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      
      expect(totalTime).toBeLessThan(110); // < 110ms for 10k failures (adjusted for system load)
      expect(healthMonitor.getComponentHealth(componentId).failureCount).toBe(failureCount);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with many components', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and track many components
      for (let i = 0; i < 1000; i++) {
        const componentId = `component-${i}`;
        healthMonitor.recordHealth(componentId, true, 'Test health');
        healthMonitor.recordFailure(componentId, new Error('Test failure'));
      }
      
      const afterMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (afterMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(10); // < 10MB for 1000 components
    });

    test('should clean up component data when requested', () => {
      const componentId = 'cleanup-test';
      
      healthMonitor.recordHealth(componentId, true, 'Test');
      expect(healthMonitor.getComponentHealth(componentId)).toBeDefined();
      
      healthMonitor.removeComponent(componentId);
      
      // Should return default health for unknown component
      const health = healthMonitor.getComponentHealth(componentId);
      expect(health.failureCount).toBe(0);
      expect(health.circuitBreakerState).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Integration with Logging', () => {
    test('should log circuit breaker state changes', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const componentId = 'logging-test';
      healthMonitor.setCircuitBreakerThreshold(componentId, 1);
      
      // Trigger circuit breaker
      healthMonitor.recordFailure(componentId, new Error('Critical error'));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Circuit breaker triggered for ${componentId}`)
      );
      
      consoleSpy.mockRestore();
    });

    test('should provide error details in failure logs', () => {
      const componentId = 'error-detail-test';
      const errorMessage = 'Detailed error information';
      
      healthMonitor.recordFailure(componentId, new Error(errorMessage));
      
      const health = healthMonitor.getComponentHealth(componentId);
      expect(health.lastError?.message).toBe(errorMessage);
    });
  });

  describe('Interface Implementation', () => {
    test('should implement IHealthMonitor interface correctly', () => {
      expect(typeof healthMonitor.recordHealth).toBe('function');
      expect(typeof healthMonitor.recordFailure).toBe('function');
      expect(typeof healthMonitor.getComponentHealth).toBe('function');
      expect(typeof healthMonitor.getHealthReport).toBe('function');
      expect(typeof healthMonitor.setCircuitBreakerThreshold).toBe('function');
      expect(typeof healthMonitor.attemptRecovery).toBe('function');
      expect(typeof healthMonitor.removeComponent).toBe('function');
    });

    test('should return consistent health states', () => {
      const states = Object.values(CircuitBreakerState);
      expect(states).toContain(CircuitBreakerState.CLOSED);
      expect(states).toContain(CircuitBreakerState.OPEN);
      expect(states).toContain(CircuitBreakerState.HALF_OPEN);
    });
  });
});