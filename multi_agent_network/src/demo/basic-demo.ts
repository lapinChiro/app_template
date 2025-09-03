/**
 * Basic demo of the Multi-Agent Network System
 * 
 * This demo showcases:
 * - Agent creation
 * - Memory usage (private agent memory)
 * - Agent destruction
 */

import { AgentManager } from '../core/agent-manager';
import { AgentError, ErrorCode } from '../core/errors';

async function runBasicDemo(): Promise<void> {
  console.log('=== Multi-Agent Network System - Basic Demo ===\n');

  // Get the AgentManager instance (singleton)
  // @ts-expect-error Protected constructor access is safe for singleton pattern
  const manager = AgentManager.getInstance();
  console.log('1. Obtained AgentManager instance');

  // Create agents
  console.log('\n2. Creating agents...');
  const agent1 = manager.createAgent('demo-agent-1');
  console.log(`   - Created agent: ${agent1.id}`);
  
  const agent2 = manager.createAgent('demo-agent-2');
  console.log(`   - Created agent: ${agent2.id}`);
  
  console.log(`   - Total agents: ${manager.getAgentCount()}`);

  // Demonstrate memory usage
  console.log('\n3. Using agent memory...');
  
  // Agent 1 stores some data
  agent1.setMemory('user', { name: 'Alice', role: 'trader' });
  agent1.setMemory('balance', 1000);
  agent1.setMemory('preferences', { riskLevel: 'medium', autoTrade: true });
  console.log('   - Agent 1 stored user data');

  // Agent 2 stores different data
  agent2.setMemory('user', { name: 'Bob', role: 'analyst' });
  agent2.setMemory('watchlist', ['BTC', 'ETH', 'SOL']);
  agent2.setMemory('lastUpdate', new Date());
  console.log('   - Agent 2 stored user data');

  // Read from memory
  console.log('\n4. Reading from agent memory...');
  const agent1User = agent1.getMemory('user') as { name: string; role: string };
  console.log(`   - Agent 1 user: ${agent1User.name} (${agent1User.role})`);
  
  const agent2Watchlist = agent2.getMemory('watchlist') as string[];
  console.log(`   - Agent 2 watchlist: ${agent2Watchlist.join(', ')}`);

  // Demonstrate memory isolation
  console.log('\n5. Demonstrating memory isolation...');
  console.log('   - Agent 1 balance:', agent1.getMemory('balance'));
  console.log('   - Agent 2 balance:', agent2.getMemory('balance') ?? 'undefined (isolated memory)');

  // List all agents
  console.log('\n6. Listing all agents...');
  const allAgents = manager.listAgents();
  allAgents.forEach((agent, index) => {
    console.log(`   ${index + 1}. ${agent.id} - Active: ${agent.isActive()}`);
  });

  // Destroy an agent
  console.log('\n7. Destroying agent 1...');
  await manager.destroyAgent(agent1.id);
  console.log('   - Agent 1 destroyed');
  console.log(`   - Total agents: ${manager.getAgentCount()}`);

  // Try to access destroyed agent (will throw error)
  console.log('\n8. Attempting to access destroyed agent...');
  try {
    agent1.getMemory('user');
  } catch (error) {
    if (error instanceof AgentError) {
      console.log(`   - Error caught: ${error.message} (Code: ${error.code})`);
    }
  }

  // Create agent up to limit
  console.log('\n9. Testing agent creation limit...');
  const startCount = manager.getAgentCount();
  const maxAgents = 10;
  
  try {
    // Create agents until we hit the limit
    for (let i = startCount; i < maxAgents; i++) {
      manager.createAgent(`limit-test-${i}`);
    }
    console.log(`   - Created agents up to limit (${manager.getAgentCount()} total)`);
    
    // Try to create one more (should fail)
    manager.createAgent('over-limit');
  } catch (error) {
    if (error instanceof AgentError && error.code === ErrorCode.AGENT_LIMIT_EXCEEDED) {
      console.log(`   - Limit enforced: ${error.message}`);
    }
  }

  // Clean up
  console.log('\n10. Cleaning up...');
  manager.destroyAll();
  console.log(`   - All agents destroyed`);
  console.log(`   - Final agent count: ${manager.getAgentCount()}`);

  console.log('\n=== Demo completed successfully! ===');
}

// Run the demo
if (require.main === module) {
  runBasicDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}