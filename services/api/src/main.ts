import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Capture raw body for Stripe signature verification
  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl?.startsWith('/webhooks/stripe')) {
          req.rawBody = buf;
        }
      },
    }),
  );
  app.use(bodyParser.urlencoded({ extended: true }));

  // Global validation pipe with sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const allowedOrigins: (string | RegExp)[] = [
    process.env.CUSTOMER_WEB_URL || 'http://localhost:8010',
    process.env.CHEF_DASHBOARD_URL || 'http://localhost:3001',
    process.env.ADMIN_PANEL_URL || 'http://localhost:3002',
    'http://localhost:8081', // Core demo
    'http://localhost:8082', // Mobile dev
  ];

  // Allow mobile app origins (Expo dev)
  if (process.env.NODE_ENV === 'development') {
    // Allow any localhost origin in development
    allowedOrigins.push(/http:\/\/localhost:\d+/);
    allowedOrigins.push(/http:\/\/192\.168\.\d+\.\d+:\d+/); // LAN IPs for mobile
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.enableShutdownHooks();

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('RideNDine API')
    .setDescription(
      'Multi-role delivery platform connecting customers, home chefs, and drivers. ' +
      'This API provides endpoints for authentication, order management, real-time tracking, ' +
      'payment processing, and more.',
    )
    .setVersion('1.0.0')
    .setContact(
      'RideNDine Support',
      'https://ridendine.com',
      'support@ridendine.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:9001', 'Development Server')
    .addServer('https://api.ridendine.com', 'Production Server')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('orders', 'Order management and lifecycle')
    .addTag('chefs', 'Chef profiles and operations')
    .addTag('menus', 'Menu and menu item management')
    .addTag('drivers', 'Driver management and tracking')
    .addTag('dispatch', 'Order assignment and dispatch')
    .addTag('payments', 'Payment processing')
    .addTag('webhooks', 'Webhook handlers')
    .addTag('reviews', 'Reviews and ratings')
    .addTag('notifications', 'Push notifications')
    .addTag('admin', 'Admin operations')
    .addTag('health', 'Health checks and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'RideNDine API Documentation',
    customfavIcon: 'https://ridendine.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // Serve OpenAPI spec as JSON
  const specPath = '/api/spec.json';
  app.getHttpAdapter().get(specPath, (_req, res) => {
    res.json(document);
  });

  const port = process.env.API_PORT || 9001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI Spec available at http://localhost:${port}${specPath}`);
}

bootstrap();
