import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgentManager } from '@/core/agent-manager';
import { Agent } from '@/core/agent';

// Mock the logger module
vi.mock('@/core/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }))
}));

// Mock prom-client to avoid metric registration conflicts
vi.mock('prom-client', () => ({
  Histogram: vi.fn().mockImplementation(() => ({
    labels: vi.fn().mockReturnThis(),
    observe: vi.fn(),
    reset: vi.fn()
  })),
  register: {
    metrics: vi.fn().mockResolvedValue('# metrics')
  }
}));

/**
 * Memory usage tests for the agent system
 * 
 * Requirements:
 * - 10 agents should use less than 100MB total (R6.4)
 * - No memory leaks during agent lifecycle
 */
describe('Memory Usage Tests', () => {
  let manager: AgentManager;

  beforeEach(() => {
    // Clear singleton instances
    // @ts-expect-error Accessing private static member for testing
    AgentManager.instances.clear();
    
    manager = AgentManager.getInstance();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    manager.destroyAll();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  /**
   * Helper to get current memory usage in MB
   */
  const getMemoryUsageMB = (): number => {
    const usage = process.memoryUsage();
    return usage.heapUsed / 1024 / 1024; // Convert bytes to MB
  };

  /**
   * Helper to create agents and measure memory
   */
  const createAgentsWithMemoryTracking = async (count: number): Promise<{
    agents: Agent[];
    memoryBefore: number;
    memoryAfter: number;
    memoryDelta: number;
  }> => {
    // Get baseline memory
    if (global.gc) global.gc();
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow GC to run
    const memoryBefore = getMemoryUsageMB();

    // Create agents
    const agents: Agent[] = [];
    for (let i = 0; i < count; i++) {
      agents.push(manager.createAgent(`memory-test-${i}`));
    }

    // Get memory after creation
    const memoryAfter = getMemoryUsageMB();
    const memoryDelta = memoryAfter - memoryBefore;

    return { agents, memoryBefore, memoryAfter, memoryDelta };
  };

  describe('memory consumption', () => {
    it('should use less than 100MB for 10 agents', async () => {
      console.log('\n=== Memory Usage Test: 10 Agents ===');
      
      const { memoryBefore, memoryAfter, memoryDelta } = 
        await createAgentsWithMemoryTracking(10);

      console.log(`Memory before: ${memoryBefore.toFixed(2)} MB`);
      console.log(`Memory after: ${memoryAfter.toFixed(2)} MB`);
      console.log(`Memory increase: ${memoryDelta.toFixed(2)} MB`);
      console.log(`Memory per agent: ${(memoryDelta / 10).toFixed(2)} MB`);

      // Verify memory usage is under 100MB
      expect(memoryDelta).toBeLessThan(100);
      
      // Additional check: each agent should use reasonable memory
      const memoryPerAgent = memoryDelta / 10;
      expect(memoryPerAgent).toBeLessThan(10); // Each agent should use less than 10MB
    });

    it('should scale linearly with agent count', async () => {
      console.log('\n=== Memory Scaling Test ===');
      
      const measurements: Array<{ count: number; memory: number; perAgent: number }> = [];

      // Test with different agent counts
      const counts = [1, 2, 5, 10];
      
      for (const count of counts) {
        // Clean up previous agents
        manager.destroyAll();
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));

        const { memoryDelta } = await createAgentsWithMemoryTracking(count);
        const perAgent = memoryDelta / count;
        
        measurements.push({ count, memory: memoryDelta, perAgent });
        console.log(`${count} agents: ${memoryDelta.toFixed(2)} MB total, ${perAgent.toFixed(2)} MB per agent`);
      }

      // Verify roughly linear scaling
      // Memory per agent should be consistent (within reasonable variance)
      // Skip the first measurement as it includes initialization overhead
      const perAgentValues = measurements.slice(1).map(m => m.perAgent);
      const avgPerAgent = perAgentValues.reduce((sum, val) => sum + val, 0) / perAgentValues.length;
      
      console.log(`\nAverage memory per agent (excluding first): ${avgPerAgent.toFixed(2)} MB`);
      
      // Check variance only for measurements after the first
      for (let i = 1; i < measurements.length; i++) {
        const measurement = measurements[i];
        const variance = Math.abs(measurement.perAgent - avgPerAgent) / avgPerAgent;
        console.log(`Variance for ${measurement.count} agents: ${(variance * 100).toFixed(1)}%`);
        
        // Allow 100% variance due to GC and memory allocation patterns
        expect(variance).toBeLessThan(1.0); // 100% variance allowed
      }
    });

    it('should efficiently use memory with agent operations', async () => {
      console.log('\n=== Memory Efficiency Test ===');
      
      // Create agents
      const { memoryAfter: memoryAfterCreate } = 
        await createAgentsWithMemoryTracking(5);

      // Perform operations
      const agents = manager.listAgents();
      for (let i = 0; i < 100; i++) {
        // Memory operations
        agents.forEach((agent, idx) => {
          agent.setMemory(`key-${i}`, `value-${i}-${idx}`);
          agent.getMemory(`key-${i}`);
        });
        
        // Message operations
        if (agents.length >= 2) {
          await manager.sendMessage(
            agents[0].id,
            agents[1].id,
            'test',
            { iteration: i }
          );
        }
      }

      const memoryAfterOps = getMemoryUsageMB();
      const memoryIncrease = memoryAfterOps - memoryAfterCreate;

      console.log(`Memory after operations: ${memoryAfterOps.toFixed(2)} MB`);
      console.log(`Memory increase from operations: ${memoryIncrease.toFixed(2)} MB`);

      // Operations should not significantly increase memory
      // Allow up to 25MB increase for 500 operations (100 per agent)
      expect(memoryIncrease).toBeLessThan(25); // Less than 25MB increase
    });
  });

  describe('memory leak detection', () => {
    it('should not leak memory on agent creation and destruction cycles', async () => {
      console.log('\n=== Memory Leak Test: Creation/Destruction Cycles ===');
      
      // Get baseline memory
      if (global.gc) global.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
      const baselineMemory = getMemoryUsageMB();

      const measurements: number[] = [];
      const cycles = 5;

      for (let cycle = 0; cycle < cycles; cycle++) {
        // Create 10 agents
        for (let i = 0; i < 10; i++) {
          manager.createAgent(`cycle-${cycle}-agent-${i}`);
        }

        // Destroy all agents
        manager.destroyAll();
        
        // Force GC and measure
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentMemory = getMemoryUsageMB();
        const memoryDelta = currentMemory - baselineMemory;
        measurements.push(memoryDelta);
        
        console.log(`Cycle ${cycle + 1}: Memory delta = ${memoryDelta.toFixed(2)} MB`);
      }

      // Memory should not continuously increase
      // Check that later measurements are not significantly higher than earlier ones
      const firstHalf = measurements.slice(0, Math.floor(cycles / 2));
      const secondHalf = measurements.slice(Math.floor(cycles / 2));
      
      const avgFirstHalf = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const avgSecondHalf = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      console.log(`Average memory delta - First half: ${avgFirstHalf.toFixed(2)} MB`);
      console.log(`Average memory delta - Second half: ${avgSecondHalf.toFixed(2)} MB`);
      
      // Second half should not be significantly higher (allow 5MB tolerance)
      expect(avgSecondHalf - avgFirstHalf).toBeLessThan(5);
    });

    it('should properly clean up agent memory on destruction', async () => {
      console.log('\n=== Memory Cleanup Test ===');
      
      // Create agents with data
      const agentCount = 5;
      const agents: Agent[] = [];
      
      for (let i = 0; i < agentCount; i++) {
        const agent = manager.createAgent(`cleanup-test-${i}`);
        agents.push(agent);
        
        // Add memory data
        for (let j = 0; j < 100; j++) {
          agent.setMemory(`key-${j}`, {
            data: `value-${j}`,
            array: new Array(100).fill(i),
            nested: { deep: { value: j } }
          });
        }
      }

      const memoryWithAgents = getMemoryUsageMB();
      console.log(`Memory with agents and data: ${memoryWithAgents.toFixed(2)} MB`);

      // Destroy agents individually
      for (const agent of agents) {
        await manager.destroyAgent(agent.id);
      }

      // Get baseline memory before cleanup
      const memoryBeforeCleanup = getMemoryUsageMB();
      
      // Force multiple GC cycles and wait longer
      for (let i = 0; i < 3; i++) {
        if (global.gc) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const memoryAfterCleanup = getMemoryUsageMB();
      const memoryDelta = memoryAfterCleanup - memoryBeforeCleanup;
      
      console.log(`Memory before cleanup: ${memoryBeforeCleanup.toFixed(2)} MB`);
      console.log(`Memory after cleanup: ${memoryAfterCleanup.toFixed(2)} MB`);
      console.log(`Memory delta: ${memoryDelta.toFixed(2)} MB`);
      
      // Memory should not increase significantly after cleanup
      // Allow up to 5MB increase due to GC overhead and test framework
      expect(memoryDelta).toBeLessThan(5);
    });

    it('should not leak memory with message operations', async () => {
      console.log('\n=== Message Memory Leak Test ===');
      
      // Create two agents for messaging
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      receiver.onMessage(() => {}); // Empty handler
      
      // Get baseline after agent creation
      if (global.gc) global.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
      const baselineMemory = getMemoryUsageMB();

      // Send many messages
      const messageCount = 1000;
      const batchSize = 100;
      
      for (let i = 0; i < messageCount / batchSize; i++) {
        // Send batch of messages
        for (let j = 0; j < batchSize; j++) {
          await manager.sendMessage(
            sender.id,
            receiver.id,
            'memory-test',
            { 
              index: i * batchSize + j,
              data: `message-${i}-${j}`,
              timestamp: Date.now()
            }
          );
        }
        
        // Allow processing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Measure memory after messages
      const memoryAfterMessages = getMemoryUsageMB();
      const memoryIncrease = memoryAfterMessages - baselineMemory;
      
      console.log(`Memory increase after ${messageCount} messages: ${memoryIncrease.toFixed(2)} MB`);
      console.log(`Average per message: ${(memoryIncrease / messageCount * 1000).toFixed(2)} KB`);

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB for 1000 messages
    });
  });

  describe('memory usage summary', () => {
    it('should generate memory usage report', async () => {
      console.log('\n=== Memory Usage Summary ===');
      
      // Test single agent memory
      const { memoryDelta: singleAgentMemory } = 
        await createAgentsWithMemoryTracking(1);
      
      console.log(`Single agent memory: ${singleAgentMemory.toFixed(2)} MB`);
      
      // Clean up
      manager.destroyAll();
      if (global.gc) global.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Test 10 agents memory
      const { memoryDelta: tenAgentsMemory } = 
        await createAgentsWithMemoryTracking(10);
      
      console.log(`10 agents memory: ${tenAgentsMemory.toFixed(2)} MB`);
      console.log(`Average per agent: ${(tenAgentsMemory / 10).toFixed(2)} MB`);
      
      // Verify requirements
      console.log(`\nRequirement check:`);
      console.log(`10 agents < 100MB: ${tenAgentsMemory < 100 ? '✓' : '✗'} (${tenAgentsMemory.toFixed(2)} MB)`);
      console.log('===================================\n');
      
      expect(tenAgentsMemory).toBeLessThan(100);
    });
  });
});

// Note: Run with --expose-gc flag to enable manual garbage collection
// e.g., node --expose-gc ./node_modules/.bin/vitest tests/performance/memory-usage.test.ts