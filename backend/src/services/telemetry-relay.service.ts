import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import url from 'url';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

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
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry/agent' });
    this.setupAgentEndpoint();

    const liveWss = new WebSocketServer({ server, path: '/ws/telemetry/live' });
    this.setupLiveEndpoint(liveWss);

    // Cleanup disconnected agents every 30s
    setInterval(() => this.cleanup(), 30000);
  }

  private setupAgentEndpoint(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const query = url.parse(req.url || '', true).query;
      const token = query.token as string;
      const driverId = query.driverId as string;

      if (!token || !driverId) {
        ws.close(4001, 'Missing token or driverId');
        return;
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }

      const agent: AgentInfo = {
        ws,
        driverId,
        username: decoded.username,
        teamId: decoded.teamId || 'default',
        lastPacket: null,
        connectedAt: Date.now(),
      };

      // Remove previous agent with same driverId
      const existing = this.agents.get(driverId);
      if (existing) {
        try { existing.ws.close(4000, 'Replaced by new connection'); } catch { /* ignore */ }
      }

      this.agents.set(driverId, agent);
      console.log(`Telemetry agent connected: ${driverId} (${decoded.username})`);

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
    });
  }

  private setupLiveEndpoint(liveWss: WebSocketServer): void {
    liveWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const query = url.parse(req.url || '', true).query;
      const token = query.token as string;

      if (!token) {
        ws.close(4001, 'Missing token');
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }

      this.liveClients.add(ws);
      console.log(`Telemetry live client connected (total: ${this.liveClients.size})`);

      // Send current snapshot of all agents
      const snapshot: Record<string, TelemetryPacket | null> = {};
      for (const [id, agent] of this.agents) {
        snapshot[id] = agent.lastPacket;
      }
      if (Object.keys(snapshot).length > 0) {
        try { ws.send(JSON.stringify({ type: 'snapshot', agents: snapshot })); } catch { /* ignore */ }
      }

      // Listen for "subscribe" messages from the client
      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'subscribe' && msg.driverId) {
            // Future: per-client driver filtering
          }
        } catch { /* ignore */ }
      });

      ws.on('close', () => {
        this.liveClients.delete(ws);
        console.log(`Telemetry live client disconnected (total: ${this.liveClients.size})`);
      });

      ws.on('error', () => {
        this.liveClients.delete(ws);
      });
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

  getConnectedDrivers(): string[] {
    return Array.from(this.agents.keys());
  }

  getLatestPacket(driverId: string): TelemetryPacket | null {
    return this.agents.get(driverId)?.lastPacket ?? null;
  }
}
