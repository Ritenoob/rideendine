/**
 * K6 Load Test - API Health Check Baseline
 *
 * This test establishes baseline performance metrics for the RideNDine API
 * by testing the /health endpoint under various load conditions.
 *
 * Metrics tracked:
 * - Response time (p95, p99)
 * - Throughput (requests/second)
 * - Error rate
 * - Success rate
 *
 * Run: k6 run load-tests/api-health-check.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Warm up: ramp up to 5 users
    { duration: '1m', target: 10 },   // Low load: 10 concurrent users
    { duration: '2m', target: 50 },   // Medium load: 50 concurrent users
    { duration: '2m', target: 100 },  // High load: 100 concurrent users
    { duration: '1m', target: 50 },   // Scale down: back to 50 users
    { duration: '30s', target: 0 },   // Cool down: ramp down to 0
  ],
  thresholds: {
    // 95% of requests should complete within 500ms
    'http_req_duration': ['p(95)<500'],
    // 99% of requests should complete within 1000ms
    'http_req_duration{staticAsset:yes}': ['p(99)<1000'],
    // Error rate should be below 1%
    'errors': ['rate<0.01'],
    // At least 95% of requests should succeed
    'checks': ['rate>0.95'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:9001';

export default function () {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);

  // Record metrics
  healthCheckDuration.add(healthResponse.timings.duration);

  // Check response
  const healthCheck = check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check has valid body': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok' || body.status === 'healthy';
      } catch (e) {
        return false;
      }
    },
  });

  // Track errors
  errorRate.add(!healthCheck);

  // Track successes
  if (healthCheck) {
    successfulRequests.add(1);
  }

  // Small delay between requests (simulate real user behavior)
  sleep(1);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Starting load test...');
  console.log(`Target: ${BASE_URL}`);

  // Verify API is reachable
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API health check failed: ${response.status}`);
  }

  return { baseUrl: BASE_URL };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
}
