import { Histogram, register } from 'prom-client';
import { createLogger } from './logger';
import { Singleton } from './base/singleton';
import type { Logger } from 'winston';

/**
 * Performance monitoring system for tracking agent lifecycle and message delivery metrics
 * 
 * Provides performance monitoring capabilities:
 * - Tracks agent creation/destruction times
 * - Monitors message delivery latency
 * - Exports metrics in Prometheus format
 * - Warns when operations exceed performance thresholds
 * - Reports memory usage statistics
 * 
 * Performance thresholds:
 * - Agent creation: 50ms warning threshold
 * - Agent destruction: 100ms warning threshold  
 * - Message delivery: 10ms warning threshold
 * 
 * This is a singleton class that should be accessed via getInstance()
 * 
 * @example
 * ```typescript
 * const monitor = PerformanceMonitor.getInstance();
 * monitor.recordCreation('agent1', 45); // No warning
 * monitor.recordCreation('agent2', 75); // Logs warning
 * const metrics = await monitor.getMetrics();
 * ```
 */
export class PerformanceMonitor extends Singleton<PerformanceMonitor> {
  private readonly logger: Logger;
  
  /** Histogram for tracking agent creation times */
  private readonly creationHistogram: Histogram<string>;
  
  /** Histogram for tracking agent destruction times */
  private readonly destructionHistogram: Histogram<string>;
  
  /** Histogram for tracking message delivery times */
  private readonly messageDeliveryHistogram: Histogram<string>;
  
  /** Performance thresholds in milliseconds */
  private static readonly THRESHOLDS = {
    CREATION: 50,
    DESTRUCTION: 100,
    MESSAGE_DELIVERY: 10
  } as const;
  
  protected constructor() {
    super();
    this.logger = createLogger('PerformanceMonitor');
    
    // Initialize Prometheus histograms
    this.creationHistogram = new Histogram({
      name: 'agent_creation_duration_ms',
      help: 'Time taken to create an agent in milliseconds',
      labelNames: ['agent_id']
    });
    
    this.destructionHistogram = new Histogram({
      name: 'agent_destruction_duration_ms',
      help: 'Time taken to destroy an agent in milliseconds',
      labelNames: ['agent_id']
    });
    
    this.messageDeliveryHistogram = new Histogram({
      name: 'message_delivery_duration_ms',
      help: 'Time taken to deliver a message between agents in milliseconds',
      labelNames: ['from_agent', 'to_agent']
    });
  }
  
  /**
   * Record the time taken to create an agent
   * 
   * Logs a warning if the duration exceeds the creation threshold (50ms)
   * 
   * @param agentId - The ID of the created agent
   * @param duration - Time taken in milliseconds
   */
  public recordCreation(agentId: string, duration: number): void {
    this.creationHistogram.labels({ agent_id: agentId }).observe(duration);
    
    if (duration > PerformanceMonitor.THRESHOLDS.CREATION) {
      this.logger.warn('Agent creation exceeded threshold', {
        agentId,
        duration,
        threshold: PerformanceMonitor.THRESHOLDS.CREATION
      });
    }
  }
  
  /**
   * Record the time taken to destroy an agent
   * 
   * Logs a warning if the duration exceeds the destruction threshold (100ms)
   * 
   * @param agentId - The ID of the destroyed agent
   * @param duration - Time taken in milliseconds
   */
  public recordDestruction(agentId: string, duration: number): void {
    this.destructionHistogram.labels({ agent_id: agentId }).observe(duration);
    
    if (duration > PerformanceMonitor.THRESHOLDS.DESTRUCTION) {
      this.logger.warn('Agent destruction exceeded threshold', {
        agentId,
        duration,
        threshold: PerformanceMonitor.THRESHOLDS.DESTRUCTION
      });
    }
  }
  
  /**
   * Record the time taken to deliver a message between agents
   * 
   * Logs a warning if the duration exceeds the delivery threshold (10ms)
   * 
   * @param fromAgent - The sending agent ID
   * @param toAgent - The receiving agent ID
   * @param duration - Time taken in milliseconds
   */
  public recordMessageDelivery(
    fromAgent: string,
    toAgent: string,
    duration: number
  ): void {
    this.messageDeliveryHistogram.labels({
      from_agent: fromAgent,
      to_agent: toAgent
    }).observe(duration);
    
    if (duration > PerformanceMonitor.THRESHOLDS.MESSAGE_DELIVERY) {
      this.logger.warn('Message delivery exceeded threshold', {
        fromAgent,
        toAgent,
        duration,
        threshold: PerformanceMonitor.THRESHOLDS.MESSAGE_DELIVERY
      });
    }
  }
  
  /**
   * Get current memory usage statistics
   * 
   * Returns Node.js process memory usage information
   * 
   * @returns Memory usage statistics from process.memoryUsage()
   */
  public getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }
  
  /**
   * Get all metrics in Prometheus format
   * 
   * Exports all collected metrics as a string suitable for Prometheus scraping
   * 
   * @returns Promise resolving to metrics in Prometheus exposition format
   * 
   * @example
   * ```typescript
   * const monitor = PerformanceMonitor.getInstance();
   * const metrics = await monitor.getMetrics();
   * // Returns something like:
   * // # HELP agent_creation_duration_ms Time taken to create an agent
   * // # TYPE agent_creation_duration_ms histogram
   * // agent_creation_duration_ms_bucket{le="0.005",agent_id="agent1"} 0
   * ```
   */
  public async getMetrics(): Promise<string> {
    return register.metrics();
  }
  
  /**
   * Reset all collected metrics
   * 
   * Clears all histogram data. Useful for testing or starting fresh monitoring sessions.
   */
  public reset(): void {
    this.creationHistogram.reset();
    this.destructionHistogram.reset();
    this.messageDeliveryHistogram.reset();
  }
}