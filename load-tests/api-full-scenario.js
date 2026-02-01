/**
 * K6 Load Test - Full API Scenario
 *
 * This test simulates realistic user journeys through the RideNDine API:
 * 1. User registration/login
 * 2. Browse chefs
 * 3. View menu items
 * 4. Create order
 * 5. Track order status
 *
 * Run: k6 run load-tests/api-full-scenario.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginDuration = new Trend('login_duration');
const createOrderDuration = new Trend('create_order_duration');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 25 },   // Sustain 25 concurrent users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'],  // 95% of requests under 1s
    'http_req_duration{type:login}': ['p(95)<500'],  // Login under 500ms
    'errors': ['rate<0.05'],  // Error rate under 5%
    'checks': ['rate>0.90'],  // 90% of checks pass
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:9001';

// Test data
const testUsers = [
  { email: 'customer1@test.com', password: 'Password123!' },
  { email: 'customer2@test.com', password: 'Password123!' },
  { email: 'customer3@test.com', password: 'Password123!' },
];

export default function () {
  let authToken = null;

  // Select random test user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // 1. Login
  group('Authentication', function () {
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const loginParams = {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'login' },
    };

    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      loginPayload,
      loginParams
    );

    loginDuration.add(loginRes.timings.duration);

    const loginSuccess = check(loginRes, {
      'login status is 200 or 201': (r) => [200, 201].includes(r.status),
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.accessToken || body.access_token;
        } catch (e) {
          return false;
        }
      },
    });

    if (loginSuccess) {
      try {
        const body = JSON.parse(loginRes.body);
        authToken = body.accessToken || body.access_token;
      } catch (e) {
        console.error('Failed to parse login response');
      }
    }

    errorRate.add(!loginSuccess);
    sleep(1);
  });

  // Only continue if login succeeded
  if (!authToken) {
    console.warn('Login failed, skipping remaining tests');
    return;
  }

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // 2. Browse Chefs
  group('Browse Chefs', function () {
    const chefsRes = http.get(`${BASE_URL}/chefs`, authHeaders);

    check(chefsRes, {
      'chefs list status is 200': (r) => r.status === 200,
      'chefs list has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
    });

    sleep(2);
  });

  // 3. View Menu Items (if chefs endpoint works)
  group('View Menu', function () {
    // In real scenario, we'd get chef ID from previous response
    // For now, test with a known ID or skip if not available
    const menuRes = http.get(`${BASE_URL}/chefs/1/menu`, authHeaders);

    check(menuRes, {
      'menu status is 200 or 404': (r) => [200, 404].includes(r.status),
    });

    sleep(2);
  });

  // 4. Create Order (simplified - may need valid chef/menu IDs)
  group('Create Order', function () {
    const orderPayload = JSON.stringify({
      chefId: 1,
      items: [
        { menuItemId: 1, quantity: 2 },
      ],
      deliveryAddress: {
        street: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        coordinates: { lat: 37.7749, lng: -122.4194 }
      },
    });

    const orderRes = http.post(
      `${BASE_URL}/orders`,
      orderPayload,
      authHeaders
    );

    createOrderDuration.add(orderRes.timings.duration);

    check(orderRes, {
      'order creation attempted': (r) => [200, 201, 400, 404].includes(r.status),
    });

    sleep(1);
  });

  // 5. Check Order History
  group('Order History', function () {
    const ordersRes = http.get(`${BASE_URL}/orders`, authHeaders);

    check(ordersRes, {
      'orders list status is 200': (r) => r.status === 200,
    });

    sleep(1);
  });
}

export function setup() {
  console.log('Starting full scenario load test...');
  console.log(`Target: ${BASE_URL}`);

  // Verify API is reachable
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API health check failed: ${response.status}`);
  }

  return { baseUrl: BASE_URL };
}

export function teardown(data) {
  console.log('Full scenario load test completed');
}
