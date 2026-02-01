/**
 * WebSocket Service - Real-time communication with Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import type { Order } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:9004';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to order status changes
  onOrderStatusChanged(callback: (order: Order) => void): void {
    if (!this.socket) return;
    this.socket.on('order:status_changed', callback);
  }

  // Subscribe to driver location updates
  onDriverLocationUpdated(
    callback: (location: { orderId: string; lat: number; lng: number }) => void
  ): void {
    if (!this.socket) return;
    this.socket.on('driver:location_updated', callback);
  }

  // Join order room for real-time updates
  joinOrderRoom(orderId: string): void {
    if (!this.socket) return;
    this.socket.emit('join_order', { orderId });
  }

  // Leave order room
  leaveOrderRoom(orderId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave_order', { orderId });
  }

  // Remove all event listeners
  removeAllListeners(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
