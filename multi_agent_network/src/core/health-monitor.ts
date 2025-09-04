// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN', 
  HALF_OPEN = 'HALF_OPEN'
}

// Component health information
export interface ComponentHealth {
  componentId: string;
  isHealthy: boolean;
  failureCount: number;
  lastMessage: string;
  lastError?: Error;
  lastCheckTime: Date;
  circuitBreakerState: CircuitBreakerState;
  threshold: number;
}

// Overall system health report
export interface HealthReport {
  overallHealthy: boolean;
  totalComponents: number;
  healthyComponents: number;
  unhealthyComponents: number;
  componentsWithOpenCircuits: number;
  generatedAt: Date;
  componentDetails: ComponentHealth[];
}

/**
 * Interface for health monitoring system (CLAUDE.md SOLID: Interface Segregation)
 */
export interface IHealthMonitor {
  recordHealth(componentId: string, isHealthy: boolean, message: string): void;
  recordFailure(componentId: string, error: Error): void;
  getComponentHealth(componentId: string): ComponentHealth;
  getHealthReport(): HealthReport;
  setCircuitBreakerThreshold(componentId: string, threshold: number): void;
  attemptRecovery(componentId: string): void;
  removeComponent(componentId: string): void;
}

/**
 * Health monitoring system with circuit breaker functionality
 * Implements CLAUDE.md principles: Single Responsibility, Performance
 */
export class HealthMonitor implements IHealthMonitor {
  private readonly componentHealthMap = new Map<string, ComponentHealth>();
  private readonly circuitBreakerThresholds = new Map<string, number>();
  
  // Default configuration
  private readonly DEFAULT_THRESHOLD = 10;
  private readonly HEALTH_CHECK_TIMEOUT_MS = 1;

  /**
   * Records the health status of a component
   * @param componentId - ID of the component
   * @param isHealthy - Whether the component is healthy
   * @param message - Descriptive message about the health status
   */
  recordHealth(componentId: string, isHealthy: boolean, message: string): void {
    const startTime = process.hrtime.bigint();
    
    const existingHealth = this.componentHealthMap.get(componentId) ?? this.createDefaultHealth(componentId);
    
    const updatedHealth: ComponentHealth = {
      ...existingHealth,
      isHealthy,
      lastMessage: message,
      lastCheckTime: new Date(),
      // Reset failure count on successful health check
      failureCount: isHealthy ? 0 : existingHealth.failureCount,
      // Close circuit breaker on successful health check
      circuitBreakerState: isHealthy ? CircuitBreakerState.CLOSED : existingHealth.circuitBreakerState
    };

    this.componentHealthMap.set(componentId, updatedHealth);
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    if (duration > this.HEALTH_CHECK_TIMEOUT_MS) {
      console.warn(`Health check exceeded timeout: ${duration}ms for component ${componentId}`);
    }
  }

  /**
   * Records a failure for a component and manages circuit breaker state
   * @param componentId - ID of the failing component
   * @param error - The error that occurred
   */
  recordFailure(componentId: string, error: Error): void {
    const existingHealth = this.componentHealthMap.get(componentId) ?? this.createDefaultHealth(componentId);
    const threshold = this.circuitBreakerThresholds.get(componentId) ?? this.DEFAULT_THRESHOLD;
    
    const newFailureCount = existingHealth.failureCount + 1;
    let newCircuitState = existingHealth.circuitBreakerState;
    let newHealthStatus = existingHealth.isHealthy;

    // Check if we should open the circuit breaker
    if (newFailureCount >= threshold && existingHealth.circuitBreakerState === CircuitBreakerState.CLOSED) {
      newCircuitState = CircuitBreakerState.OPEN;
      newHealthStatus = false;
      this.triggerCircuitBreaker(componentId, threshold, newFailureCount);
    } else if (existingHealth.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      // Recovery attempt failed, go back to open
      newCircuitState = CircuitBreakerState.OPEN;
      newHealthStatus = false;
      console.warn(`Circuit breaker recovery failed for ${componentId}, returning to OPEN state`);
    }

    const updatedHealth: ComponentHealth = {
      ...existingHealth,
      failureCount: newFailureCount,
      lastError: error,
      lastMessage: `Failure: ${error.message}`,
      lastCheckTime: new Date(),
      isHealthy: newHealthStatus,
      circuitBreakerState: newCircuitState
    };

    this.componentHealthMap.set(componentId, updatedHealth);
  }

  /**
   * Gets the current health status of a component
   * @param componentId - ID of the component to check
   * @returns ComponentHealth object
   */
  getComponentHealth(componentId: string): ComponentHealth {
    return this.componentHealthMap.get(componentId) ?? this.createDefaultHealth(componentId);
  }

  /**
   * Generates a comprehensive health report for all components
   * @returns HealthReport with system-wide health information
   */
  getHealthReport(): HealthReport {
    const allHealth = Array.from(this.componentHealthMap.values());
    const healthyComponents = allHealth.filter(h => h.isHealthy).length;
    const openCircuits = allHealth.filter(h => h.circuitBreakerState === CircuitBreakerState.OPEN).length;

    return {
      overallHealthy: allHealth.length === 0 || allHealth.every(h => h.isHealthy),
      totalComponents: allHealth.length,
      healthyComponents,
      unhealthyComponents: allHealth.length - healthyComponents,
      componentsWithOpenCircuits: openCircuits,
      generatedAt: new Date(),
      componentDetails: [...allHealth] // Create copy to prevent mutation
    };
  }

  /**
   * Sets the circuit breaker failure threshold for a component
   * @param componentId - ID of the component
   * @param threshold - Number of failures before opening circuit
   */
  setCircuitBreakerThreshold(componentId: string, threshold: number): void {
    if (threshold < 1) {
      throw new Error(`Invalid threshold: ${threshold}. Must be at least 1`);
    }
    
    this.circuitBreakerThresholds.set(componentId, threshold);
    
    // Update existing component health with new threshold
    const existingHealth = this.componentHealthMap.get(componentId);
    if (existingHealth) {
      const updatedHealth: ComponentHealth = {
        ...existingHealth,
        threshold
      };
      this.componentHealthMap.set(componentId, updatedHealth);
    }
  }

  /**
   * Attempts recovery for a component in OPEN circuit breaker state
   * @param componentId - ID of the component to recover
   */
  attemptRecovery(componentId: string): void {
    const health = this.componentHealthMap.get(componentId);
    
    if (!health) {
      console.warn(`Cannot attempt recovery for unknown component: ${componentId}`);
      return;
    }

    if (health.circuitBreakerState !== CircuitBreakerState.OPEN) {
      console.warn(`Cannot attempt recovery for component ${componentId} in state ${health.circuitBreakerState}`);
      return;
    }

    const updatedHealth: ComponentHealth = {
      ...health,
      circuitBreakerState: CircuitBreakerState.HALF_OPEN,
      lastMessage: 'Attempting recovery',
      lastCheckTime: new Date()
    };

    this.componentHealthMap.set(componentId, updatedHealth);
    console.info(`Recovery attempt initiated for component: ${componentId}`);
  }

  /**
   * Removes a component from health tracking
   * @param componentId - ID of the component to remove
   */
  removeComponent(componentId: string): void {
    this.componentHealthMap.delete(componentId);
    this.circuitBreakerThresholds.delete(componentId);
  }

  /**
   * Gets health monitoring statistics
   * @returns Statistics about the health monitoring system
   */
  getStats(): {
    totalComponents: number;
    totalHealthChecks: number;
    totalFailures: number;
    averageFailuresPerComponent: number;
  } {
    const allHealth = Array.from(this.componentHealthMap.values());
    const totalFailures = allHealth.reduce((sum, h) => sum + h.failureCount, 0);
    
    return {
      totalComponents: allHealth.length,
      totalHealthChecks: allHealth.length, // Simplified for this implementation
      totalFailures,
      averageFailuresPerComponent: allHealth.length > 0 ? totalFailures / allHealth.length : 0
    };
  }

  /**
   * Creates a default health object for a new component
   * @param componentId - ID of the component
   * @returns Default ComponentHealth object
   * @private
   */
  private createDefaultHealth(componentId: string): ComponentHealth {
    const threshold = this.circuitBreakerThresholds.get(componentId) ?? this.DEFAULT_THRESHOLD;
    
    return {
      componentId,
      isHealthy: true,
      failureCount: 0,
      lastMessage: 'Component initialized',
      lastCheckTime: new Date(),
      circuitBreakerState: CircuitBreakerState.CLOSED,
      threshold
    };
  }

  /**
   * Handles circuit breaker activation
   * @param componentId - ID of the component
   * @param threshold - The threshold that was exceeded
   * @param failureCount - Current failure count
   * @private
   */
  private triggerCircuitBreaker(componentId: string, threshold: number, failureCount: number): void {
    console.warn(`Circuit breaker triggered for ${componentId}: ${failureCount} failures (threshold: ${threshold})`);
    
    // Emit event for monitoring systems (Phase2 could listen to this)
    // For now, just log the event
    console.info(`Component ${componentId} has been isolated due to excessive failures`);
  }
}