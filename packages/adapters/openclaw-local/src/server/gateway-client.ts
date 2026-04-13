/**
 * OpenClaw Gateway API Client
 * 
 * Provides methods to interact with OpenClaw gateway API
 * for health checks, session management, and agent execution.
 */

const DEFAULT_ENDPOINT = "http://localhost:18789";

export interface OpenClawGatewayConfig {
  endpoint: string;
  authToken?: string;
  timeout?: number;
}

export interface OpenClawHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version?: string;
  uptime?: number;
  agents?: number;
  sessions?: number;
  channels?: {
    whatsapp?: boolean;
    telegram?: boolean;
    discord?: boolean;
  };
}

export interface OpenClawAgentInfo {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  sessions: number;
  lastActive?: string;
}

export interface OpenClawSessionInfo {
  id: string;
  agentId: string;
  status: "active" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export class OpenClawGatewayClient {
  private config: OpenClawGatewayConfig;

  constructor(config: Partial<OpenClawGatewayConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || DEFAULT_ENDPOINT,
      authToken: config.authToken,
      timeout: config.timeout || 10000,
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.authToken) {
      const token = this.config.authToken.startsWith("Bearer ")
        ? this.config.authToken
        : `Bearer ${this.config.authToken}`;
      headers["Authorization"] = token;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.endpoint}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.text().catch(() => "Unknown error");
        throw new Error(`OpenClaw API error: ${response.status} ${error}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`OpenClaw API timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Check gateway health
   */
  async healthCheck(): Promise<OpenClawHealthStatus> {
    try {
      const result = await this.request<OpenClawHealthStatus>("GET", "/api/health");
      return result;
    } catch (error) {
      return {
        status: "unhealthy",
        version: undefined,
        uptime: undefined,
      };
    }
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<OpenClawAgentInfo[]> {
    try {
      const result = await this.request<{ agents: OpenClawAgentInfo[] }>("GET", "/api/agents");
      return result.agents || [];
    } catch (error) {
      console.error("Failed to list agents:", error);
      return [];
    }
  }

  /**
   * Get agent info
   */
  async getAgent(agentId: string): Promise<OpenClawAgentInfo | null> {
    try {
      return await this.request<OpenClawAgentInfo>("GET", `/api/agents/${agentId}`);
    } catch (error) {
      console.error(`Failed to get agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * List sessions for an agent
   */
  async listSessions(agentId?: string): Promise<OpenClawSessionInfo[]> {
    try {
      const path = agentId ? `/api/sessions?agentId=${agentId}` : "/api/sessions";
      const result = await this.request<{ sessions: OpenClawSessionInfo[] }>("GET", path);
      return result.sessions || [];
    } catch (error) {
      console.error("Failed to list sessions:", error);
      return [];
    }
  }

  /**
   * Get session info
   */
  async getSession(sessionId: string): Promise<OpenClawSessionInfo | null> {
    try {
      return await this.request<OpenClawSessionInfo>("GET", `/api/sessions/${sessionId}`);
    } catch (error) {
      console.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Create a new session
   */
  async createSession(params: {
    agentId: string;
    agentType?: string;
    sessionKey?: string;
    context?: Record<string, unknown>;
    message?: string;
  }): Promise<{ sessionId: string; status: string }> {
    return await this.request("POST", "/api/sessions", params);
  }

  /**
   * Send message to session
   */
  async sendMessage(
    sessionId: string,
    message: string,
    context?: Record<string, unknown>
  ): Promise<{ output: string; done: boolean }> {
    return await this.request("POST", `/api/sessions/${sessionId}/message`, {
      message,
      context,
    });
  }

  /**
   * Get session result
   */
  async getSessionResult(sessionId: string): Promise<{
    output: string;
    result?: string;
    status: string;
    done: boolean;
    error?: string;
  }> {
    return await this.request("GET", `/api/sessions/${sessionId}/result`);
  }

  /**
   * Poll session until completion
   */
  async pollSession(
    sessionId: string,
    options: {
      timeoutMs?: number;
      pollIntervalMs?: number;
      onProgress?: (output: string) => void;
    } = {}
  ): Promise<{ output: string; error?: string }> {
    const timeoutMs = options.timeoutMs || 120000;
    const pollIntervalMs = options.pollIntervalMs || 1000;
    const deadline = Date.now() + timeoutMs;
    let output = "";

    while (Date.now() < deadline) {
      try {
        const result = await this.getSessionResult(sessionId);
        
        if (result.output) {
          output += result.output;
          if (options.onProgress) {
            options.onProgress(result.output);
          }
        }

        if (result.done || result.status === "completed" || result.status === "failed") {
          if (result.error) {
            return { output, error: result.error };
          }
          return { output };
        }
      } catch (error) {
        // Continue polling on transient errors
        console.error("Poll error:", error);
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    return { output, error: `Polling timed out after ${timeoutMs}ms` };
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.request("DELETE", `/api/sessions/${sessionId}`);
  }

  /**
   * Get gateway statistics
   */
  async getStats(): Promise<{
    agents: number;
    sessions: number;
    messages: number;
    uptime: number;
  }> {
    try {
      return await this.request("GET", "/api/stats");
    } catch (error) {
      return { agents: 0, sessions: 0, messages: 0, uptime: 0 };
    }
  }
}

/**
 * Create OpenClaw gateway client from config
 */
export function createOpenClawClient(
  config: Partial<OpenClawGatewayConfig> = {}
): OpenClawGatewayClient {
  return new OpenClawGatewayClient(config);
}
