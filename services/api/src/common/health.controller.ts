import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pool } from 'pg';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check overall system health including database connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-01-31T12:00:00.000Z',
        service: 'ridendine-api',
        version: '1.0.0',
        uptime: 12345,
        checks: {
          database: 'healthy',
        },
      },
    },
  })
  async checkHealth() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ridendine-api',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: 'checking',
      },
    };

    try {
      await this.db.query('SELECT 1');
      checks.checks.database = 'healthy';
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.database = 'unhealthy';
    }

    return checks;
  }

  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Check if service is ready to accept traffic (Kubernetes readiness probe)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service readiness status',
    schema: {
      example: {
        status: 'ready',
      },
    },
  })
  async checkReadiness() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ready' };
    } catch (error) {
      return { status: 'not ready', error: 'Database connection failed' };
    }
  }

  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Check if service is alive (Kubernetes liveness probe)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      example: {
        status: 'alive',
      },
    },
  })
  checkLiveness() {
    return { status: 'alive' };
  }
}
