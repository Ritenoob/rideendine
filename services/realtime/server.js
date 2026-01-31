const http = require('http');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

// Configuration
const PORT = process.env.PORT || 9004;
const REALTIME_PORT = process.env.REALTIME_PORT || 9004;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'rideNDine-secret-key-change-in-production';

// Logging utility
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [${level}] ${message}`,
    Object.keys(data).length ? JSON.stringify(data) : '',
  );
}

// ============================================
// Client Management
// ============================================

class ClientManager {
  constructor() {
    // Map of ws -> { userId, role, subscriptions: Set<string> }
    this.clients = new Map();
    // Map of userId -> Set of ws (user may have multiple connections)
    this.userConnections = new Map();
  }

  addClient(ws, userData) {
    const clientInfo = {
      userId: userData.userId,
      role: userData.role,
      subscriptions: new Set(),
      connectedAt: Date.now(),
    };

    this.clients.set(ws, clientInfo);

    if (!this.userConnections.has(userData.userId)) {
      this.userConnections.set(userData.userId, new Set());
    }
    this.userConnections.get(userData.userId).add(ws);

    log('INFO', 'Client connected', { userId: userData.userId, role: userData.role });
    return clientInfo;
  }

  removeClient(ws) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    // Remove from user connections
    const userConns = this.userConnections.get(clientInfo.userId);
    if (userConns) {
      userConns.delete(ws);
      if (userConns.size === 0) {
        this.userConnections.delete(clientInfo.userId);
      }
    }

    this.clients.delete(ws);
    log('INFO', 'Client disconnected', { userId: clientInfo.userId });
  }

  getClient(ws) {
    return this.clients.get(ws);
  }

  addSubscription(ws, channel) {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      clientInfo.subscriptions.add(channel);
    }
  }

  removeSubscription(ws, channel) {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      clientInfo.subscriptions.delete(channel);
    }
  }

  getClientsSubscribedTo(channel) {
    const subscribed = [];
    for (const [ws, info] of this.clients) {
      if (info.subscriptions.has(channel)) {
        subscribed.push(ws);
      }
    }
    return subscribed;
  }

  getStats() {
    const roleCounts = {};
    for (const info of this.clients.values()) {
      roleCounts[info.role] = (roleCounts[info.role] || 0) + 1;
    }

    return {
      totalConnections: this.clients.size,
      uniqueUsers: this.userConnections.size,
      byRole: roleCounts,
    };
  }

  broadcastToRole(role, message) {
    let count = 0;
    for (const [ws, info] of this.clients) {
      if (info.role === role && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
        count++;
      }
    }
    return count;
  }
}

// ============================================
// Redis Pub/Sub Manager
// ============================================

class RedisPubSub {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.patternHandlers = new Map();
  }

  async connect() {
    try {
      this.publisher = new Redis(REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      this.subscriber = new Redis(REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      // Set up pattern message handler
      this.subscriber.on('pmessage', (pattern, channel, message) => {
        const handler = this.patternHandlers.get(pattern);
        if (handler) {
          try {
            const data = JSON.parse(message);
            handler(channel, data);
          } catch (err) {
            log('ERROR', 'Failed to parse Redis message', { channel, error: err.message });
          }
        }
      });

      // Subscribe to channels
      const channels = ['order:*', 'driver:*', 'notification:*'];
      for (const channel of channels) {
        await this.subscriber.psubscribe(channel);
        log('INFO', `Subscribed to pattern: ${channel}`);
      }

      log('INFO', 'Redis Pub/Sub connected', { url: REDIS_URL });
    } catch (err) {
      log('ERROR', 'Redis connection failed', { error: err.message });
      throw err;
    }
  }

  onPattern(pattern, handler) {
    this.patternHandlers.set(pattern, handler);
  }

  async publish(channel, data) {
    if (!this.publisher) return 0;
    const message = JSON.stringify(data);
    return await this.publisher.publish(channel, message);
  }

  async disconnect() {
    if (this.publisher) await this.publisher.quit();
    if (this.subscriber) await this.subscriber.quit();
    log('INFO', 'Redis connections closed');
  }
}

// ============================================
// WebSocket Message Handler
// ============================================

class MessageHandler {
  constructor(clientManager, redisPubSub) {
    this.clientManager = clientManager;
    this.redisPubSub = redisPubSub;
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clientManager.getClient(ws);

      if (!client) {
        this.sendError(ws, 'Not authenticated');
        return;
      }

      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(ws, client, data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, client, data);
          break;
        case 'driver:location':
          this.handleDriverLocation(ws, client, data);
          break;
        case 'ping':
          this.sendPong(ws);
          break;
        default:
          log('WARN', 'Unknown message type', { type: data.type, userId: client.userId });
          this.sendError(ws, `Unknown message type: ${data.type}`);
      }
    } catch (err) {
      log('ERROR', 'Message handling error', { error: err.message });
      this.sendError(ws, 'Invalid message format');
    }
  }

  handleSubscribe(ws, client, data) {
    const { channels } = data;
    if (!Array.isArray(channels)) {
      this.sendError(ws, 'channels must be an array');
      return;
    }

    for (const channel of channels) {
      this.clientManager.addSubscription(ws, channel);
      log('INFO', 'Client subscribed', { userId: client.userId, channel });
    }

    ws.send(
      JSON.stringify({
        type: 'subscribed',
        channels,
        timestamp: Date.now(),
      }),
    );
  }

  handleUnsubscribe(ws, client, data) {
    const { channels } = data;
    if (!Array.isArray(channels)) {
      this.sendError(ws, 'channels must be an array');
      return;
    }

    for (const channel of channels) {
      this.clientManager.removeSubscription(ws, channel);
      log('INFO', 'Client unsubscribed', { userId: client.userId, channel });
    }

    ws.send(
      JSON.stringify({
        type: 'unsubscribed',
        channels,
        timestamp: Date.now(),
      }),
    );
  }

  handleDriverLocation(ws, client, data) {
    if (client.role !== 'driver') {
      this.sendError(ws, 'Only drivers can send location updates');
      return;
    }

    const { orderId, latitude, longitude, heading, speed, accuracy } = data;

    if (latitude === undefined || longitude === undefined) {
      this.sendError(ws, 'latitude and longitude are required');
      return;
    }

    // Broadcast to subscribers of this driver's channel
    const channel = `driver:${client.userId}`;
    const locationData = {
      type: 'driver:location',
      driverId: client.userId,
      orderId,
      location: { latitude, longitude, heading, speed, accuracy },
      timestamp: Date.now(),
    };

    // Publish to Redis for other services
    this.redisPubSub.publish(channel, locationData);

    ws.send(
      JSON.stringify({
        type: 'location:ack',
        timestamp: Date.now(),
      }),
    );
  }

  sendPong(ws) {
    ws.send(
      JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
      }),
    );
  }

  sendError(ws, message) {
    ws.send(
      JSON.stringify({
        type: 'error',
        message,
        timestamp: Date.now(),
      }),
    );
  }
}

// ============================================
// JWT Authentication
// ============================================

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    log('WARN', 'JWT verification failed', { error: err.message });
    return null;
  }
}

function extractToken(url) {
  try {
    const parsed = new URL(url, 'ws://localhost');
    return parsed.searchParams.get('token');
  } catch {
    return null;
  }
}

// ============================================
// Main Server
// ============================================

class RealtimeServer {
  constructor() {
    this.clientManager = new ClientManager();
    this.redisPubSub = new RedisPubSub();
    this.messageHandler = null;
    this.server = null;
    this.wss = null;
  }

  async start() {
    // Connect to Redis
    await this.redisPubSub.connect();

    // Set up Redis message forwarding
    this.redisPubSub.onPattern('order:*', (channel, data) => {
      this.broadcastToSubscribers(channel, { type: channel, ...data });
    });

    this.redisPubSub.onPattern('driver:*', (channel, data) => {
      this.broadcastToSubscribers(channel, { type: channel, ...data });
    });

    this.redisPubSub.onPattern('notification:*', (channel, data) => {
      this.broadcastToSubscribers(channel, { type: channel, ...data });
    });

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    this.wss.on('error', (err) => {
      log('ERROR', 'WebSocket server error', { error: err.message });
    });

    // Initialize message handler
    this.messageHandler = new MessageHandler(this.clientManager, this.redisPubSub);

    // Start listening
    this.server.listen(REALTIME_PORT, () => {
      log('INFO', `Realtime service started on port ${REALTIME_PORT}`);
      log('INFO', `Redis URL: ${REDIS_URL}`);
    });

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  handleHttpRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${REALTIME_PORT}`);

    // GET /health - Health check
    if (req.method === 'GET' && url.pathname === '/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          service: 'realtime',
          port: REALTIME_PORT,
          redis: this.redisPubSub.publisher ? 'connected' : 'disconnected',
          connections: this.clientManager.getStats(),
        }),
      );
      return;
    }

    // GET /stats - Connection statistics
    if (req.method === 'GET' && url.pathname === '/stats') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          service: 'realtime',
          stats: this.clientManager.getStats(),
          uptime: process.uptime(),
        }),
      );
      return;
    }

    // POST /broadcast - Send message to a channel
    if (req.method === 'POST' && url.pathname === '/broadcast') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { channel, message } = data;

          if (!channel) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'channel is required' }));
            return;
          }

          const subscribers = await this.redisPubSub.publish(channel, {
            ...message,
            timestamp: Date.now(),
            source: 'http-broadcast',
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              channel,
              subscribers,
            }),
          );
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 404 for other routes
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  handleWebSocketConnection(ws, req) {
    const token = extractToken(req.url);

    if (!token) {
      log('WARN', 'WebSocket connection without token', { url: req.url });
      ws.close(4001, 'Authentication required');
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      log('WARN', 'WebSocket connection with invalid token');
      ws.close(4002, 'Invalid token');
      return;
    }

    const userData = {
      userId: decoded.userId || decoded.sub,
      role: decoded.role || 'customer',
    };

    const clientInfo = this.clientManager.addClient(ws, userData);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        userId: userData.userId,
        role: userData.role,
        timestamp: Date.now(),
      }),
    );

    // Auto-subscribe based on role
    this.autoSubscribe(ws, clientInfo);

    // Handle incoming messages
    ws.on('message', (data) => {
      this.messageHandler.handleMessage(ws, data.toString());
    });

    // Handle disconnection
    ws.on('close', () => {
      this.clientManager.removeClient(ws);
    });

    // Handle errors
    ws.on('error', (err) => {
      log('ERROR', 'WebSocket error', { userId: userData.userId, error: err.message });
      this.clientManager.removeClient(ws);
    });
  }

  autoSubscribe(ws, clientInfo) {
    const subscriptions = [];

    switch (clientInfo.role) {
      case 'driver':
        // Drivers get their own location channel
        subscriptions.push(`driver:${clientInfo.userId}`);
        // Drivers get order updates
        subscriptions.push('order:assigned');
        break;
      case 'customer':
        // Customers get their order updates
        subscriptions.push('order:*');
        // Customers get driver location for their orders
        subscriptions.push('driver:*');
        break;
      case 'dispatcher':
      case 'admin':
        // Dispatchers and admins get all updates
        subscriptions.push('order:*');
        subscriptions.push('driver:*');
        subscriptions.push('notification:*');
        break;
    }

    for (const channel of subscriptions) {
      this.clientManager.addSubscription(ws, channel);
    }

    if (subscriptions.length > 0) {
      ws.send(
        JSON.stringify({
          type: 'auto-subscribed',
          channels: subscriptions,
          timestamp: Date.now(),
        }),
      );
    }
  }

  broadcastToSubscribers(channel, message) {
    // Get subscribers for exact channel match
    const exactSubscribers = this.clientManager.getClientsSubscribedTo(channel);

    // Get subscribers for pattern matches (simplified - broadcasts to all)
    let count = 0;

    for (const ws of exactSubscribers) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(message));
        count++;
      }
    }

    // Also broadcast to role-based subscribers
    if (channel.startsWith('order:')) {
      count += this.clientManager.broadcastToRole('dispatcher', message);
      count += this.clientManager.broadcastToRole('admin', message);
    }

    if (channel.startsWith('driver:')) {
      count += this.clientManager.broadcastToRole('dispatcher', message);
      count += this.clientManager.broadcastToRole('admin', message);
    }

    log('DEBUG', 'Broadcast', { channel, recipients: count });
    return count;
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      log('INFO', `Received ${signal}, shutting down gracefully...`);

      // Close WebSocket connections
      for (const [ws] of this.clientManager.clients) {
        ws.close(1001, 'Server shutting down');
      }

      // Close server
      if (this.server) {
        this.server.close(() => {
          log('INFO', 'HTTP server closed');
        });
      }

      // Close Redis connections
      await this.redisPubSub.disconnect();

      log('INFO', 'Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// ============================================
// Start Server
// ============================================

const realtimeServer = new RealtimeServer();

realtimeServer.start().catch((err) => {
  log('ERROR', 'Failed to start server', { error: err.message });
  process.exit(1);
});
