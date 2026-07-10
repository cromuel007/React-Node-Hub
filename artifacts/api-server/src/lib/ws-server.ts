import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { logger } from "./logger";
import type { AuthPayload } from "../middlewares/auth";
import 'dotenv/config';

const rawSecret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
const JWT_SECRET: string = rawSecret ?? "";

// Map userId -> set of connected sockets
const connections = new Map<number, Set<WebSocket>>();

export interface WsMessage {
  type: "message" | "ping";
  payload?: unknown;
}

export interface WsIncomingMessage {
  type: "ping";
}

function addConnection(userId: number, ws: WebSocket) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(ws);
}

function removeConnection(userId: number, ws: WebSocket) {
  const sockets = connections.get(userId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) connections.delete(userId);
  }
}

export function broadcastToUser(userId: number, data: WsMessage) {
  const sockets = connections.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export function createWsServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Authenticate via ?token= query param
    const url = new URL(req.url ?? "/", "ws://localhost");
    const token = url.searchParams.get("token");

    if (!token || !JWT_SECRET) {
      ws.close(4001, "Unauthorized");
      return;
    }

    let auth: AuthPayload;
    try {
      auth = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    const userId = auth.userId;
    addConnection(userId, ws);
    logger.info({ userId }, "WebSocket client connected");

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as WsIncomingMessage;
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      removeConnection(userId, ws);
      logger.info({ userId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err, userId }, "WebSocket error");
      removeConnection(userId, ws);
    });
  });

  return wss;
}
