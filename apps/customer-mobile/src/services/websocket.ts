/**
 * WebSocket Service - Real-time order tracking
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore, useOrderStore } from '@/store';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:9004';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  connect(orderId?: string) {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      this.isConnecting = false;
      return;
    }

    const url = orderId
      ? `${WS_URL}/?token=${token}&orderId=${orderId}`
      : `${WS_URL}/?token=${token}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.attemptReconnect(orderId);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  private attemptReconnect(orderId?: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect(orderId);
    }, delay);
  }

  private handleMessage(message: { type: string; data: any }) {
    const { type, data } = message;

    // Handle built-in order tracking events
    switch (type) {
      case 'init':
        this.handleInit(data);
        break;
      case 'order_update':
        this.handleOrderUpdate(data);
        break;
      case 'driver_location':
        this.handleDriverLocation(data);
        break;
      case 'eta_update':
        this.handleEtaUpdate(data);
        break;
    }

    // Notify custom handlers
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }

    // Also notify 'all' handlers
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  private handleInit(data: any) {
    if (data.orders?.length) {
      const order = data.orders[0];
      useOrderStore.getState().updateOrderStatus(order.status);
    }
    if (data.drivers?.length) {
      const driver = data.drivers[0];
      useOrderStore.getState().setDriverLocation({
        lat: driver.lat,
        lng: driver.lng,
        heading: driver.heading,
      });
    }
  }

  private handleOrderUpdate(data: { orderId: string; status: string }) {
    const activeOrder = useOrderStore.getState().activeOrder;
    if (activeOrder?.id === data.orderId) {
      useOrderStore.getState().updateOrderStatus(data.status);
    }
  }

  private handleDriverLocation(data: {
    orderId: string;
    lat: number;
    lng: number;
    heading?: number;
  }) {
    const activeOrder = useOrderStore.getState().activeOrder;
    if (activeOrder?.id === data.orderId) {
      useOrderStore.getState().setDriverLocation({
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
      });
    }
  }

  private handleEtaUpdate(data: { orderId: string; etaMinutes: number }) {
    const activeOrder = useOrderStore.getState().activeOrder;
    if (activeOrder?.id === data.orderId) {
      useOrderStore.getState().setEta(data.etaMinutes);
    }
  }

  on(eventType: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }
    this.messageHandlers.get(eventType)!.add(handler);

    // Return cleanup function
    return () => {
      this.messageHandlers.get(eventType)?.delete(handler);
    };
  }

  off(eventType: string, handler: MessageHandler) {
    this.messageHandlers.get(eventType)?.delete(handler);
  }

  send(type: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const websocket = new WebSocketService();
