/**
 * Tests for OpenClaw Gateway Client
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenClawClient } from '../server/gateway-client.js';

describe('OpenClaw Gateway Client', () => {
  let client: ReturnType<typeof createOpenClawClient>;

  before(() => {
    client = createOpenClawClient({
      endpoint: 'http://localhost:18789',
      timeout: 5000,
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      // Mock fetch for health check
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            status: 'healthy',
            version: '1.0.0',
            uptime: 3600,
          }),
        } as any;
      };

      try {
        const health = await client.healthCheck();
        
        assert.ok(health);
        assert.equal(health.status, 'healthy');
        assert.equal(health.version, '1.0.0');
        assert.equal(health.uptime, 3600);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle unhealthy status', async () => {
      // Mock fetch for unhealthy response
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          ok: false,
          status: 503,
          text: async () => 'Service unavailable',
        } as any;
      };

      try {
        const health = await client.healthCheck();
        
        assert.ok(health);
        assert.equal(health.status, 'unhealthy');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Agent Management', () => {
    it('should list agents', async () => {
      // Mock fetch for agents list
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            agents: [
              {
                id: 'agent-1',
                name: 'Main Agent',
                type: 'main',
                status: 'active',
                sessions: 5,
              },
              {
                id: 'agent-2',
                name: 'Research Agent',
                type: 'researcher',
                status: 'active',
                sessions: 3,
              },
            ],
          }),
        } as any;
      };

      try {
        const agents = await client.listAgents();
        
        assert.ok(Array.isArray(agents));
        assert.equal(agents.length, 2);
        assert.equal(agents[0].id, 'agent-1');
        assert.equal(agents[1].name, 'Research Agent');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should get agent info', async () => {
      // Mock fetch for agent info
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            id: 'agent-1',
            name: 'Main Agent',
            type: 'main',
            status: 'active',
            sessions: 5,
            lastActive: '2026-04-13T10:00:00Z',
          }),
        } as any;
      };

      try {
        const agent = await client.getAgent('agent-1');
        
        assert.ok(agent);
        assert.equal(agent.id, 'agent-1');
        assert.equal(agent.name, 'Main Agent');
        assert.equal(agent.status, 'active');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Session Management', () => {
    it('should create a session', async () => {
      // Mock fetch for session creation
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          ok: true,
          json: async () => ({
            sessionId: 'session-123',
            status: 'active',
          }),
        } as any;
      };

      try {
        const result = await client.createSession({
          agentId: 'agent-1',
          agentType: 'main',
          sessionKey: 'test-session',
          message: 'Hello',
        });
        
        assert.ok(result);
        assert.equal(result.sessionId, 'session-123');
        assert.equal(result.status, 'active');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should poll session until completion', async () => {
      let callCount = 0;
      const originalFetch = global.fetch;
      global.fetch = async () => {
        callCount++;
        
        if (callCount < 3) {
          // First two calls: not done
          return {
            ok: true,
            json: async () => ({
              output: `Partial output ${callCount}`,
              status: 'running',
              done: false,
            }),
          } as any;
        } else {
          // Third call: done
          return {
            ok: true,
            json: async () => ({
              output: 'Final output',
              status: 'completed',
              done: true,
            }),
          } as any;
        }
      };

      try {
        const result = await client.pollSession('session-123', {
          timeoutMs: 10000,
          pollIntervalMs: 100,
          onProgress: (output) => {
            console.log('Progress:', output);
          },
        });
        
        assert.ok(result);
        assert.ok(result.output.includes('Final output'));
        assert.ok(!result.error);
        assert.equal(callCount, 3);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => {
        return {
          ok: false,
          status: 401,
          text: async () => 'Unauthorized',
        } as any;
      };

      try {
        await assert.rejects(
          () => client.listAgents(),
          (error: Error) => {
            assert.ok(error.message.includes('OpenClaw API error'));
            assert.ok(error.message.includes('401'));
            return true;
          }
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle timeout', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => {
        // Simulate timeout by never resolving
        await new Promise(resolve => setTimeout(resolve, 10000));
        return {} as any;
      };

      try {
        const timeoutClient = createOpenClawClient({
          endpoint: 'http://localhost:18789',
          timeout: 100, // Very short timeout
        });

        await assert.rejects(
          () => timeoutClient.listAgents(),
          (error: Error) => {
            assert.ok(error.message.includes('timeout'));
            return true;
          }
        );
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
