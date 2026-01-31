import { HealthController } from './health.controller';
import { Pool } from 'pg';

describe('HealthController', () => {
  it('reports liveness', () => {
    const db = { query: jest.fn() } as unknown as Pool;
    const controller = new HealthController(db);
    expect(controller.checkLiveness()).toEqual({ status: 'alive' });
  });

  it('reports readiness when database is reachable', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] }) } as unknown as Pool;
    const controller = new HealthController(db);
    await expect(controller.checkReadiness()).resolves.toEqual({ status: 'ready' });
  });

  it('reports degraded when database fails', async () => {
    const db = { query: jest.fn().mockRejectedValue(new Error('boom')) } as unknown as Pool;
    const controller = new HealthController(db);
    const result = await controller.checkHealth();
    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('unhealthy');
  });
});
