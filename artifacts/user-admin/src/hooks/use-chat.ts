import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@workspace/api-client-react";

interface UseChatOptions {
  onMessage?: (msg: Message) => void;
}

export function useChat({ onMessage }: UseChatOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      const isProduction = import.meta.env.MODE === "production";

      const wsBase = isProduction
        ? (import.meta.env.VITE_WEBSOCKET_URL as string)
        : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

      const url = `${wsBase}?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return; }
        setConnected(true);
        attemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as { type: string; payload?: unknown };
          if (data.type === "message" && data.payload) {
            onMessageRef.current?.(data.payload as Message);
          }
        } catch {
          // ignore malformed
        }
      };

      ws.onclose = (ev) => {
        setConnected(false);
        wsRef.current = null;
        // Don't reconnect if unmounted or intentionally closed (code 1000)
        if (unmountedRef.current || ev.code === 1000 || ev.code === 4001) return;
        // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
        const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 15000);
        attemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    }

    // Keepalive ping every 25s
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    connect();

    return () => {
      unmountedRef.current = true;
      clearInterval(ping);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close(1000, "unmount");
    };
  }, []);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
