import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceMonitor } from '@/core/performance-monitor';
import type { Logger } from 'winston';

// Mock the logger module
vi.mock('@/core/logger', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn()
  }))
}));

// Mock prom-client
vi.mock('prom-client', () => ({
  Histogram: vi.fn().mockImplementation(config => ({
    labels: vi.fn().mockReturnThis(),
    observe: vi.fn(),
    reset: vi.fn(),
    get: vi.fn().mockReturnValue({
      values: []
    })
  })),
  register: {
    metrics: vi.fn().mockReturnValue('# metrics output')
  }
}));

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockLogger: Logger;

  beforeEach(() => {
    // Clear singleton instances between tests
    // @ts-expect-error Accessing private static member for testing
    PerformanceMonitor.instances.clear();
    
    monitor = PerformanceMonitor.getInstance();
    // @ts-expect-error Accessing private member for testing
    mockLogger = monitor.logger as Logger;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('singleton behavior', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should extend Singleton base class', () => {
      expect(PerformanceMonitor.prototype.constructor.name).toBe('PerformanceMonitor');
    });
  });

  describe('recordCreation', () => {
    it('should record agent creation time', () => {
      const agentId = 'agent1';
      const duration = 45;

      // @ts-expect-error Accessing private member for testing
      const histogram = monitor.creationHistogram;
      const labelsSpy = vi.spyOn(histogram, 'labels');
      const observeSpy = vi.spyOn(histogram, 'observe');

      monitor.recordCreation(agentId, duration);

      expect(labelsSpy).toHaveBeenCalledWith({ agent_id: agentId });
      expect(observeSpy).toHaveBeenCalledWith(duration);
    });

    it('should warn when creation exceeds threshold', () => {
      const agentId = 'agent1';
      const duration = 60; // Exceeds 50ms threshold
      const warnSpy = vi.spyOn(mockLogger, 'warn');

      monitor.recordCreation(agentId, duration);

      expect(warnSpy).toHaveBeenCalledWith(
        'Agent creation exceeded threshold',
        expect.objectContaining({
          agentId,
          duration,
          threshold: 50
        })
      );
    });

    it('should not warn when creation is within threshold', () => {
      const agentId = 'agent1';
      const duration = 30; // Within 50ms threshold
      const warnSpy = vi.spyOn(mockLogger, 'warn');

      monitor.recordCreation(agentId, duration);

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('recordDestruction', () => {
    it('should record agent destruction time', () => {
      const agentId = 'agent1';
      const duration = 80;

      // @ts-expect-error Accessing private member for testing
      const histogram = monitor.destructionHistogram;
      const labelsSpy = vi.spyOn(histogram, 'labels');
      const observeSpy = vi.spyOn(histogram, 'observe');

      monitor.recordDestruction(agentId, duration);

      expect(labelsSpy).toHaveBeenCalledWith({ agent_id: agentId });
      expect(observeSpy).toHaveBeenCalledWith(duration);
    });

    it('should warn when destruction exceeds threshold', () => {
      const agentId = 'agent1';
      const duration = 120; // Exceeds 100ms threshold
      const warnSpy = vi.spyOn(mockLogger, 'warn');

      monitor.recordDestruction(agentId, duration);

      expect(warnSpy).toHaveBeenCalledWith(
        'Agent destruction exceeded threshold',
        expect.objectContaining({
          agentId,
          duration,
          threshold: 100
        })
      );
    });
  });

  describe('recordMessageDelivery', () => {
    it('should record message delivery time', () => {
      const fromAgent = 'agent1';
      const toAgent = 'agent2';
      const duration = 8;

      // @ts-expect-error Accessing private member for testing
      const histogram = monitor.messageDeliveryHistogram;
      const labelsSpy = vi.spyOn(histogram, 'labels');
      const observeSpy = vi.spyOn(histogram, 'observe');

      monitor.recordMessageDelivery(fromAgent, toAgent, duration);

      expect(labelsSpy).toHaveBeenCalledWith({
        from_agent: fromAgent,
        to_agent: toAgent
      });
      expect(observeSpy).toHaveBeenCalledWith(duration);
    });

    it('should warn when message delivery exceeds threshold', () => {
      const fromAgent = 'agent1';
      const toAgent = 'agent2';
      const duration = 15; // Exceeds 10ms threshold
      const warnSpy = vi.spyOn(mockLogger, 'warn');

      monitor.recordMessageDelivery(fromAgent, toAgent, duration);

      expect(warnSpy).toHaveBeenCalledWith(
        'Message delivery exceeded threshold',
        expect.objectContaining({
          fromAgent,
          toAgent,
          duration,
          threshold: 10
        })
      );
    });
  });

  describe('getMemoryUsage', () => {
    it('should return NodeJS memory usage', () => {
      const mockMemoryUsage = {
        rss: 100000000,
        heapTotal: 80000000,
        heapUsed: 60000000,
        external: 1000000,
        arrayBuffers: 500000
      };
      
      vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      const memoryUsage = monitor.getMemoryUsage();

      expect(memoryUsage).toEqual(mockMemoryUsage);
    });
  });

  describe('getMetrics', () => {
    it('should return Prometheus formatted metrics', async () => {
      const metrics = await monitor.getMetrics();
      expect(metrics).toBe('# metrics output');
    });
  });

  describe('reset', () => {
    it('should reset all histograms', () => {
      // @ts-expect-error Accessing private members for testing
      const creationResetSpy = vi.spyOn(monitor.creationHistogram, 'reset');
      // @ts-expect-error Accessing private members for testing
      const destructionResetSpy = vi.spyOn(monitor.destructionHistogram, 'reset');
      // @ts-expect-error Accessing private members for testing
      const messageResetSpy = vi.spyOn(monitor.messageDeliveryHistogram, 'reset');

      monitor.reset();

      expect(creationResetSpy).toHaveBeenCalled();
      expect(destructionResetSpy).toHaveBeenCalled();
      expect(messageResetSpy).toHaveBeenCalled();
    });
  });
});