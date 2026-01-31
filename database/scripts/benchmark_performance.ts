#!/usr/bin/env ts-node
/**
 * Database Performance Benchmarking Script
 * Tests Phase 1 optimizations and validates performance improvements
 *
 * Usage: npx ts-node database/scripts/benchmark_performance.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

interface BenchmarkResult {
  operation: string;
  iterations: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  p95TimeMs: number;
}

class PerformanceBenchmark {
  private pool: Pool;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USER || 'ridendine',
      password: process.env.DATABASE_PASSWORD || 'ridendine_dev_password',
      database: process.env.DATABASE_NAME || 'ridendine_dev',
    });
  }

  async runAllBenchmarks() {
    console.log('🚀 Starting Phase 1 Database Performance Benchmarks\n');
    console.log('='.repeat(80));

    try {
      // Check if PostGIS is enabled
      await this.checkPostGIS();

      // Check if spatial indexes exist
      await this.checkIndexes();

      // Benchmark 1: Driver Dispatch Query
      await this.benchmarkDriverDispatch();

      // Benchmark 2: Chef Search Query
      await this.benchmarkChefSearch();

      // Benchmark 3: Order Creation
      await this.benchmarkOrderCreation();

      // Benchmark 4: Order Listing with Pagination
      await this.benchmarkOrderListing();

      // Benchmark 5: Connection Pool Stress Test
      await this.benchmarkConnectionPool();

      // Generate report
      this.generateReport();
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async checkPostGIS() {
    console.log('\n📊 Checking PostGIS Extension...');
    const result = await this.pool.query(
      `SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis'`,
    );

    if (result.rows.length === 0) {
      console.log('⚠️  PostGIS not installed - spatial queries will be slow!');
      console.log('   Run migration 006 to enable PostGIS');
    } else {
      console.log(`✅ PostGIS ${result.rows[0].extversion} installed`);
    }
  }

  private async checkIndexes() {
    console.log('\n📊 Checking Spatial Indexes...');

    const indexes = await this.pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE '%location%'
          OR indexname LIKE '%customer_status%'
          OR indexname LIKE '%chef_created%'
        )
      ORDER BY tablename, indexname
    `);

    console.log(`Found ${indexes.rows.length} optimization indexes:`);
    indexes.rows.forEach((row) => {
      console.log(`  ✓ ${row.tablename}.${row.indexname}`);
    });

    if (indexes.rows.length === 0) {
      console.log('⚠️  No optimization indexes found!');
      console.log('   Run migrations 006 and 007 for performance improvements');
    }
  }

  private async benchmarkDriverDispatch() {
    console.log('\n📊 Benchmark 1: Driver Dispatch Query');
    console.log('-'.repeat(80));

    const testLocation = { lat: 43.2557, lng: -79.8711 }; // Hamilton, ON
    const iterations = 50;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();

      await this.pool.query(
        `SELECT
          d.id,
          ST_Y(d.current_location::geometry) as current_latitude,
          ST_X(d.current_location::geometry) as current_longitude,
          d.average_rating,
          ST_Distance(
            d.current_location,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)
          ) / 1000.0 as distance_km
         FROM drivers d
         WHERE
          d.is_available = TRUE
          AND d.verification_status = 'approved'
          AND d.current_location IS NOT NULL
          AND ST_DWithin(
            d.current_location,
            ST_SetSRID(ST_MakePoint($2, $1), 4326),
            $3 * 1000
          )
         ORDER BY distance_km ASC
         LIMIT 20`,
        [testLocation.lat, testLocation.lng, 10],
      );

      const elapsed = Date.now() - start;
      times.push(elapsed);
    }

    this.recordResult('Driver Dispatch (10km radius)', iterations, times);
  }

  private async benchmarkChefSearch() {
    console.log('\n📊 Benchmark 2: Chef Search Query');
    console.log('-'.repeat(80));

    const iterations = 50;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();

      await this.pool.query(`
        SELECT
          c.id,
          c.business_name,
          c.cuisine_types,
          c.rating,
          c.is_active
        FROM chefs c
        WHERE
          c.is_active = TRUE
          AND c.rating >= 4.0
        ORDER BY c.rating DESC
        LIMIT 20
      `);

      const elapsed = Date.now() - start;
      times.push(elapsed);
    }

    this.recordResult('Chef Search (rating filter)', iterations, times);
  }

  private async benchmarkOrderCreation() {
    console.log('\n📊 Benchmark 3: Order Creation (with batch inserts)');
    console.log('-'.repeat(80));

    const iterations = 20;
    const times: number[] = [];

    // Get test data
    const customerResult = await this.pool.query(
      `SELECT id FROM users WHERE role = 'customer' LIMIT 1`,
    );
    const chefResult = await this.pool.query(`SELECT id FROM chefs WHERE is_active = TRUE LIMIT 1`);
    const menuItemsResult = await this.pool.query(
      `SELECT id, price_cents FROM menu_items WHERE is_available = TRUE LIMIT 3`,
    );

    if (
      customerResult.rows.length === 0 ||
      chefResult.rows.length === 0 ||
      menuItemsResult.rows.length === 0
    ) {
      console.log('⚠️  Skipping order creation benchmark - no test data');
      return;
    }

    const customerId = customerResult.rows[0].id;
    const chefId = chefResult.rows[0].id;
    const menuItems = menuItemsResult.rows;

    for (let i = 0; i < iterations; i++) {
      const client = await this.pool.connect();
      const start = Date.now();

      try {
        await client.query('BEGIN');

        // Create order
        const orderResult = await client.query(
          `INSERT INTO orders (
            customer_id, chef_id, order_number, status,
            delivery_address, delivery_latitude, delivery_longitude,
            subtotal_cents, tax_cents, delivery_fee_cents,
            platform_fee_cents, total_cents
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id`,
          [
            customerId,
            chefId,
            `TEST-${Date.now()}-${i}`,
            'pending',
            '123 Test St, Hamilton, ON',
            43.2557,
            -79.8711,
            3000,
            390,
            500,
            200,
            4090,
          ],
        );

        const orderId = orderResult.rows[0].id;

        // Batch insert order items
        const values: any[] = [];
        const placeholders = menuItems
          .map((item, idx) => {
            const base = idx * 5;
            values.push(orderId, item.id, `Test Item ${idx}`, 1, item.price_cents);
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
          })
          .join(',');

        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, price_cents)
           VALUES ${placeholders}`,
          values,
        );

        // Create status history
        await client.query(
          `INSERT INTO order_status_history (order_id, status, created_by)
           VALUES ($1, $2, $3)`,
          [orderId, 'pending', customerId],
        );

        await client.query('COMMIT');

        const elapsed = Date.now() - start;
        times.push(elapsed);

        // Clean up test order
        await client.query('BEGIN');
        await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        await client.query('DELETE FROM order_status_history WHERE order_id = $1', [orderId]);
        await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    this.recordResult('Order Creation (3 items)', iterations, times);
  }

  private async benchmarkOrderListing() {
    console.log('\n📊 Benchmark 4: Order Listing with Pagination');
    console.log('-'.repeat(80));

    const iterations = 50;
    const times: number[] = [];

    // Get test customer
    const customerResult = await this.pool.query(
      `SELECT id FROM users WHERE role = 'customer' LIMIT 1`,
    );

    if (customerResult.rows.length === 0) {
      console.log('⚠️  Skipping order listing benchmark - no test data');
      return;
    }

    const customerId = customerResult.rows[0].id;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();

      await this.pool.query(
        `SELECT
          o.id,
          o.order_number,
          o.status,
          o.total_cents,
          o.created_at,
          c.business_name as chef_name
         FROM orders o
         JOIN chefs c ON o.chef_id = c.id
         WHERE o.customer_id = $1
         ORDER BY o.created_at DESC
         LIMIT 10 OFFSET 0`,
        [customerId],
      );

      const elapsed = Date.now() - start;
      times.push(elapsed);
    }

    this.recordResult('Order Listing (paginated)', iterations, times);
  }

  private async benchmarkConnectionPool() {
    console.log('\n📊 Benchmark 5: Connection Pool Stress Test');
    console.log('-'.repeat(80));

    const concurrentQueries = 50;
    const times: number[] = [];

    const start = Date.now();

    // Run 50 queries concurrently
    const promises = Array.from({ length: concurrentQueries }, async () => {
      const queryStart = Date.now();
      await this.pool.query('SELECT 1');
      const queryTime = Date.now() - queryStart;
      times.push(queryTime);
    });

    await Promise.all(promises);

    const totalTime = Date.now() - start;

    console.log(`  Total time for ${concurrentQueries} concurrent queries: ${totalTime}ms`);
    console.log(`  Throughput: ${((concurrentQueries / totalTime) * 1000).toFixed(2)} queries/sec`);

    this.recordResult('Connection Pool (50 concurrent)', concurrentQueries, times);
  }

  private recordResult(operation: string, iterations: number, times: number[]) {
    times.sort((a, b) => a - b);

    const avgTimeMs = times.reduce((sum, t) => sum + t, 0) / times.length;
    const minTimeMs = times[0];
    const maxTimeMs = times[times.length - 1];
    const p95TimeMs = times[Math.floor(times.length * 0.95)];

    this.results.push({
      operation,
      iterations,
      avgTimeMs: parseFloat(avgTimeMs.toFixed(2)),
      minTimeMs: parseFloat(minTimeMs.toFixed(2)),
      maxTimeMs: parseFloat(maxTimeMs.toFixed(2)),
      p95TimeMs: parseFloat(p95TimeMs.toFixed(2)),
    });

    console.log(`  Iterations: ${iterations}`);
    console.log(`  Average:    ${avgTimeMs.toFixed(2)}ms`);
    console.log(`  Min:        ${minTimeMs.toFixed(2)}ms`);
    console.log(`  Max:        ${maxTimeMs.toFixed(2)}ms`);
    console.log(`  P95:        ${p95TimeMs.toFixed(2)}ms`);
  }

  private generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📈 PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(80));

    console.log('\nSummary Table:');
    console.log('-'.repeat(80));
    console.log(
      `${'Operation'.padEnd(35)} | ${'Avg'.padStart(8)} | ${'P95'.padStart(8)} | ${'Min'.padStart(8)} | ${'Max'.padStart(8)}`,
    );
    console.log('-'.repeat(80));

    for (const result of this.results) {
      console.log(
        `${result.operation.padEnd(35)} | ${result.avgTimeMs.toFixed(2).padStart(8)}ms | ${result.p95TimeMs.toFixed(2).padStart(8)}ms | ${result.minTimeMs.toFixed(2).padStart(8)}ms | ${result.maxTimeMs.toFixed(2).padStart(8)}ms`,
      );
    }

    console.log('-'.repeat(80));

    // Performance targets comparison
    console.log('\n🎯 Performance Targets:');
    console.log('-'.repeat(80));

    const targets = [
      { operation: 'Driver Dispatch', target: 20, actual: this.getAvg('Driver Dispatch') },
      { operation: 'Chef Search', target: 30, actual: this.getAvg('Chef Search') },
      { operation: 'Order Creation', target: 75, actual: this.getAvg('Order Creation') },
      { operation: 'Order Listing', target: 20, actual: this.getAvg('Order Listing') },
    ];

    for (const { operation, target, actual } of targets) {
      const status = actual <= target ? '✅' : '⚠️';
      const delta = actual - target;
      const deltaStr =
        delta > 0 ? `+${delta.toFixed(0)}ms over` : `${Math.abs(delta).toFixed(0)}ms under`;
      console.log(
        `${status} ${operation}: ${actual.toFixed(2)}ms (target: ${target}ms, ${deltaStr})`,
      );
    }

    console.log('\n✨ Benchmark complete!\n');
  }

  private getAvg(operationPrefix: string): number {
    const result = this.results.find((r) => r.operation.includes(operationPrefix));
    return result?.avgTimeMs || 0;
  }
}

// Run benchmarks
const benchmark = new PerformanceBenchmark();
benchmark.runAllBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
