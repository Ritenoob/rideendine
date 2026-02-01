import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Controller()
export class HealthController {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
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
  checkLiveness() {
    return { status: 'alive' };
  }
}
