import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

const databaseProvider = {
  provide: 'DATABASE_POOL',
  useFactory: () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const sslEnabled = process.env.DATABASE_SSL === 'true' || isProduction;
    return new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USER || 'ridendine',
      password: process.env.DATABASE_PASSWORD || 'ridendine_dev_password',
      database: process.env.DATABASE_NAME || 'ridendine_dev',
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  },
};

@Global()
@Module({
  providers: [databaseProvider],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}
