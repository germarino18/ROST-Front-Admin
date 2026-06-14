import { useEffect, useRef, useState, useCallback } from 'react';

interface OrderUpdatedEvent {
  type: 'order_updated';
  data: any;
}

type WSEvent = OrderUpdatedEvent;

interface UseWebSocketOptions {
  onOrderUpdated?: (pedido: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastReconnect, setLastReconnect] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isFirstConnectRef = useRef(true);
  const maxReconnectDelay = 30000;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    // Admin: WS via Vite proxy (mismo origen). Envía cookies de sesión automáticamente.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/pedidos/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      if (!isFirstConnectRef.current) {
        setLastReconnect(new Date());
      }
      isFirstConnectRef.current = false;
    };

    ws.onmessage = (event) => {
      try {
        const message: WSEvent = JSON.parse(event.data);
        if (message.type === 'order_updated' && optionsRef.current.onOrderUpdated) {
          optionsRef.current.onOrderUpdated(message.data);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptRef.current),
        maxReconnectDelay
      );
      reconnectAttemptRef.current++;
      setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptRef.current = 999;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, connect, disconnect, lastReconnect };
}
