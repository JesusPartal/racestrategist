import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import url from 'url';
import { validateAgentToken } from './telemetry.service';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'dev-secret-change-in-production';
  }
  return secret;
})();

interface TelemetryPacket {
  timestamp: number;
  driverId?: string;
  car: Record<string, any>;
  lapDetails: Record<string, any>;
}

interface AgentInfo {
  ws: WebSocket;
  driverId: string;
  username: string;
  teamId: string;
  lastPacket: TelemetryPacket | null;
  connectedAt: number;
}

export class TelemetryRelayService {
  private agents = new Map<string, AgentInfo>();
  private liveClients = new Set<WebSocket>();
  private wss: WebSocketServer;

  constructor(server: any) {
    // Single WebSocketServer in noServer mode; manual routing in upgrade handler
    this.wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

    server.on('upgrade', (req: IncomingMessage, socket: any, head: Buffer) => {
      const pathname = url.parse(req.url || '', true).pathname;

      if (pathname === '/ws/telemetry/agent') {
        this.wss.handleUpgrade(req, socket, head, (ws) => {
          this.handleAgentConnection(ws, req);
        });
      } else if (pathname === '/ws/telemetry/live') {
        this.wss.handleUpgrade(req, socket, head, (ws) => {
          this.handleLiveConnection(ws, req);
        });
      } else {
        socket.destroy();
      }
    });

    setInterval(() => this.cleanup(), 30000);
  }

  private resolveAuth(token: string): { username: string; teamId: string } | null {
    // Try JWT first (user tokens from the web app)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { username: decoded.username, teamId: decoded.teamId || 'default' };
    } catch { /* not a JWT, try agent token */ }

    // Try agent token (long-lived tokens for agent PCs)
    const agentAuth = validateAgentToken(token);
    if (agentAuth) {
      return { username: `agent:${agentAuth.driverId}`, teamId: agentAuth.teamId };
    }

    return null;
  }

  private handleAgentConnection(ws: WebSocket, req: IncomingMessage): void {
    const query = url.parse(req.url || '', true).query;
    const token = query.token as string;
    const driverId = query.driverId as string;

    if (!token || !driverId) {
      ws.close(4001, 'Missing token or driverId');
      return;
    }

    const auth = this.resolveAuth(token);
    if (!auth) {
      ws.close(4001, 'Invalid token');
      return;
    }

    const agent: AgentInfo = {
      ws,
      driverId,
      username: auth.username,
      teamId: auth.teamId,
      lastPacket: null,
      connectedAt: Date.now(),
    };

    const existing = this.agents.get(driverId);
    if (existing) {
      try { existing.ws.close(4000, 'Replaced by new connection'); } catch { /* ignore */ }
    }

    this.agents.set(driverId, agent);
    console.log(`Telemetry agent connected: ${driverId} (${auth.username})`);

    ws.on('message', (data: Buffer) => {
      try {
        const packet: TelemetryPacket = JSON.parse(data.toString());
        packet.driverId = driverId;
        agent.lastPacket = packet;
        this.broadcastToLiveClients(packet);
      } catch { /* ignore malformed */ }
    });

    ws.on('close', () => {
      console.log(`Telemetry agent disconnected: ${driverId}`);
      if (this.agents.get(driverId)?.ws === ws) {
        this.agents.delete(driverId);
      }
    });

    ws.on('error', () => {
      if (this.agents.get(driverId)?.ws === ws) {
        this.agents.delete(driverId);
      }
    });
  }

  private handleLiveConnection(ws: WebSocket, req: IncomingMessage): void {
    const query = url.parse(req.url || '', true).query;
    const token = query.token as string;

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    const auth = this.resolveAuth(token);
    if (!auth) {
      ws.close(4001, 'Invalid token');
      return;
    }

    this.liveClients.add(ws);
    console.log(`Telemetry live client connected (total: ${this.liveClients.size})`);

    // Send current snapshot
    const snapshot: Record<string, TelemetryPacket | null> = {};
    for (const [id, agent] of this.agents) {
      snapshot[id] = agent.lastPacket;
    }
    if (Object.keys(snapshot).length > 0) {
      try { ws.send(JSON.stringify({ type: 'snapshot', agents: snapshot })); } catch { /* ignore */ }
    }

    ws.on('close', () => {
      this.liveClients.delete(ws);
      console.log(`Telemetry live client disconnected (total: ${this.liveClients.size})`);
    });

    ws.on('error', () => {
      this.liveClients.delete(ws);
    });
  }

  private broadcastToLiveClients(packet: TelemetryPacket): void {
    const payload = JSON.stringify({ type: 'telemetry', ...packet });
    for (const client of this.liveClients) {
      if (client.readyState === WebSocket.OPEN) {
        try { client.send(payload); } catch { this.liveClients.delete(client); }
      }
    }
  }

  private cleanup(): void {
    for (const [id, agent] of this.agents) {
      if (agent.ws.readyState === WebSocket.CLOSED || agent.ws.readyState === WebSocket.CLOSING) {
        this.agents.delete(id);
        console.log(`Cleaned up stale agent: ${id}`);
      }
    }
  }

  /** Called by the HTTP ingest endpoint to broadcast agent data to live clients */
  ingestTelemetry(driverId: string, packet: TelemetryPacket): void {
    const existing = this.agents.get(driverId);
    if (existing) {
      existing.lastPacket = packet;
    }
    packet.driverId = driverId;
    this.broadcastToLiveClients(packet);
  }

  getConnectedDrivers(): string[] {
    return Array.from(this.agents.keys());
  }

  getLatestPacket(driverId: string): TelemetryPacket | null {
    return this.agents.get(driverId)?.lastPacket ?? null;
  }
}
