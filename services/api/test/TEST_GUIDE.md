# RideNDine Testing Guide

## Table of Contents

- [Overview](#overview)
- [Test-Driven Development (TDD) Workflow](#test-driven-development-tdd-workflow)
- [Test Structure and Organization](#test-structure-and-organization)
- [Writing Unit Tests](#writing-unit-tests)
- [Writing Integration Tests](#writing-integration-tests)
- [Mocking Strategies](#mocking-strategies)
- [Test Fixtures and Data](#test-fixtures-and-data)
- [Coverage Requirements](#coverage-requirements)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

RideNDine uses **Test-Driven Development (TDD)** as the primary development methodology. This guide establishes standards and best practices for writing tests across the codebase.

### Testing Stack

- **Framework**: Jest 29.x with ts-jest
- **Assertion Library**: Jest built-in (expect)
- **Mocking**: Jest mocking utilities
- **HTTP Testing**: Supertest for E2E API tests
- **Coverage Tool**: Jest coverage (Istanbul)

### Test Types

1. **Unit Tests**: Test individual functions/methods in isolation
2. **Integration Tests**: Test module interactions and database operations
3. **E2E Tests**: Test complete API endpoints end-to-end
4. **Contract Tests**: Validate API contracts (future)

## Test-Driven Development (TDD) Workflow

### Red-Green-Refactor Cycle

**1. RED - Write Failing Test First**

```typescript
// auth.service.spec.ts
it('should register a new user with valid credentials', async () => {
  const registerDto = {
    email: 'test@example.com',
    password: 'Test1234!',
    role: UserRole.CUSTOMER,
  };

  const result = await service.register(registerDto);

  expect(result).toHaveProperty('message');
  expect(result).toHaveProperty('user');
  expect(result.user.email).toBe(registerDto.email);
});
```

Run the test - it should **FAIL** (RED) because the implementation doesn't exist yet.

**2. GREEN - Write Minimal Implementation**

```typescript
// auth.service.ts
async register(registerDto: RegisterDto) {
  // Minimal code to make test pass
  return {
    message: 'Registration successful',
    user: {
      email: registerDto.email,
      id: 'generated-id',
      role: registerDto.role,
    },
  };
}
```

Run the test - it should **PASS** (GREEN).

**3. REFACTOR - Improve Code Quality**

```typescript
// auth.service.ts
async register(registerDto: RegisterDto) {
  // Check for existing user
  const existingUser = await this.checkUserExists(registerDto.email);
  if (existingUser) {
    throw new ConflictException('Email already registered');
  }

  // Hash password
  const passwordHash = await this.hashPassword(registerDto.password);

  // Create user in database
  const user = await this.createUser(registerDto, passwordHash);

  // Send verification email
  await this.sendVerificationEmail(user.email);

  return {
    message: 'Registration successful. Please check your email.',
    user: this.mapUserToDto(user),
  };
}
```

Run tests again - they should still **PASS** after refactoring.

**4. REPEAT - Add More Test Cases**

```typescript
it('should throw ConflictException if email already exists', async () => {
  mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

  await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
});

it('should hash password with bcrypt', async () => {
  // Test implementation...
});
```

### TDD Principles

1. **Write test first, implementation second**
2. **Write the simplest code to make test pass**
3. **Refactor only when tests are green**
4. **One test, one assertion (when possible)**
5. **Test behavior, not implementation details**

## Test Structure and Organization

### File Naming Convention

- Unit tests: `<module-name>.service.spec.ts`
- Integration tests: `<feature>.integration.spec.ts`
- E2E tests: `<endpoint>.e2e-spec.ts`

### Directory Structure

```
services/api/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts       # Unit tests alongside source
│   ├── users/
│   │   ├── users.service.ts
│   │   └── users.service.spec.ts
│   └── orders/
│       ├── orders.service.ts
│       └── orders.service.spec.ts
├── test/
│   ├── fixtures/                       # Reusable test data
│   │   ├── users.fixture.ts
│   │   ├── orders.fixture.ts
│   │   └── payments.fixture.ts
│   ├── integration/                    # Integration tests
│   │   ├── database.integration.spec.ts
│   │   └── api.integration.spec.ts
│   ├── e2e/                            # End-to-end tests
│   │   ├── auth.e2e-spec.ts
│   │   └── orders.e2e-spec.ts
│   └── TEST_GUIDE.md                   # This file
└── jest.config.js                      # Jest configuration
```

### Test File Structure (Arrange-Act-Assert)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';
import { validTestFixture } from '../../test/fixtures';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyType>;

  // Setup: Runs before each test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: 'DEPENDENCY',
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    jest.clearAllMocks();
  });

  // Test suite for a specific method
  describe('methodName', () => {
    // Individual test case
    it('should perform expected behavior', async () => {
      // ARRANGE - Set up test data and mocks
      const testData = validTestFixture;
      mockDependency.someMethod.mockResolvedValue({ success: true });

      // ACT - Execute the method being tested
      const result = await service.methodName(testData);

      // ASSERT - Verify expectations
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(mockDependency.someMethod).toHaveBeenCalledWith(testData);
      expect(mockDependency.someMethod).toHaveBeenCalledTimes(1);
    });

    it('should throw error on invalid input', async () => {
      const invalidData = { ...testData, field: null };

      await expect(service.methodName(invalidData)).rejects.toThrow(ValidationError);
    });
  });

  // Cleanup: Runs after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

## Writing Unit Tests

### Unit Test Characteristics

- **Fast**: Execute in milliseconds
- **Isolated**: No database, network, or file I/O
- **Deterministic**: Same input → same output, every time
- **Focused**: Test one behavior per test

### Example: Testing Auth Service

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConflictException } from '@nestjs/common';
import { UserRole } from '../common/interfaces/user.interface';
import { validRegisterDto } from '../../test/fixtures';

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: jest.Mocked<any>;
  let mockJwtService: jest.Mocked<any>;

  beforeEach(async () => {
    mockDb = {
      query: jest.fn(),
      connect: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'DATABASE_POOL', useValue: mockDb },
        { provide: 'JwtService', useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Mock database to return no existing user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock successful user creation
      const mockClient = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: validRegisterDto.email }] }) // INSERT user
          .mockResolvedValueOnce({ rows: [] }) // INSERT profile
          .mockResolvedValueOnce({ rows: [] }), // INSERT customer
        release: jest.fn(),
      };
      mockDb.connect.mockResolvedValue(mockClient);

      const result = await service.register(validRegisterDto);

      expect(result).toHaveProperty('message');
      expect(result.user.email).toBe(validRegisterDto.email);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT id FROM users WHERE email = $1', [
        validRegisterDto.email,
      ]);
    });

    it('should throw ConflictException if email exists', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      await expect(service.register(validRegisterDto)).rejects.toThrow(ConflictException);
    });
  });
});
```

### Testing Async Operations

```typescript
// Testing promises
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// Testing rejections
it('should reject with error', async () => {
  await expect(service.failingMethod()).rejects.toThrow(Error);
  await expect(service.failingMethod()).rejects.toThrow('Expected error message');
});

// Testing with done callback (avoid if possible, use async/await)
it('should handle callback', (done) => {
  service.callbackMethod((error, result) => {
    expect(error).toBeNull();
    expect(result).toBeDefined();
    done();
  });
});
```

## Writing Integration Tests

### Integration Test Characteristics

- **Real Dependencies**: Use actual database, but in test environment
- **Slower**: May take seconds to execute
- **Test Interactions**: Verify modules work together correctly

### Database Integration Test Example

```typescript
import { Pool } from 'pg';
import { databaseConfig } from '../src/config/database.config';

describe('Database Integration', () => {
  let db: Pool;

  beforeAll(async () => {
    // Connect to test database
    db = new Pool({
      ...databaseConfig,
      database: 'ridendine_test',
    });
  });

  afterAll(async () => {
    await db.end();
  });

  it('should connect to database successfully', async () => {
    const result = await db.query('SELECT NOW()');
    expect(result.rows).toHaveLength(1);
  });

  it('should run migrations successfully', async () => {
    // Test that all migrations have been applied
    const result = await db.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `);

    expect(result.rows.some((r) => r.tablename === 'users')).toBe(true);
    expect(result.rows.some((r) => r.tablename === 'orders')).toBe(true);
  });

  it('should enforce unique email constraint', async () => {
    const email = 'test@example.com';

    await db.query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [
      email,
      'hash',
      'customer',
    ]);

    await expect(
      db.query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [
        email,
        'hash',
        'customer',
      ]),
    ).rejects.toThrow();
  });
});
```

### API Integration Test Example (Supertest)

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { validRegisterDto, validLoginDto } from './fixtures';

describe('Auth API (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(validRegisterDto.email);
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validRegisterDto)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already registered');
        });
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login and return tokens', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send(validLoginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          accessToken = res.body.accessToken;
        });
    });
  });

  describe('/api/users/profile (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer()).get('/api/users/profile').expect(401);
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
        });
    });
  });
});
```

## Mocking Strategies

### When to Mock

- **External Services**: Stripe API, Google Maps API, SendGrid
- **Database**: For unit tests (use real DB for integration tests)
- **Time-dependent code**: Date.now(), setTimeout
- **File I/O**: Reading/writing files
- **Network requests**: HTTP calls to third-party APIs

### Mock Types

#### 1. Jest Mock Functions

```typescript
const mockFunction = jest.fn();
mockFunction.mockReturnValue(42);
mockFunction.mockResolvedValue({ success: true });
mockFunction.mockRejectedValue(new Error('Failed'));

// Assertions
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFunction).toHaveBeenCalledTimes(2);
```

#### 2. Mock Objects

```typescript
const mockDatabase = {
  query: jest.fn(),
  connect: jest.fn(),
};

mockDatabase.query.mockResolvedValue({ rows: [{ id: 1 }] });
```

#### 3. Mock Modules

```typescript
// At top of test file
jest.mock('stripe', () => ({
  Stripe: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test' }),
    },
  })),
}));
```

#### 4. Spy on Methods

```typescript
import * as bcrypt from 'bcrypt';

it('should hash password', async () => {
  const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

  await service.hashPassword('password');

  expect(hashSpy).toHaveBeenCalledWith('password', 10);
  hashSpy.mockRestore();
});
```

### Mocking Database (PostgreSQL Pool)

```typescript
const mockDb = {
  query: jest.fn(),
  connect: jest.fn(),
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

beforeEach(() => {
  mockDb.connect.mockResolvedValue(mockClient);
  mockClient.query.mockResolvedValue({ rows: [] });
});

// Mock transaction
mockClient.query
  .mockResolvedValueOnce({ rows: [] }) // BEGIN
  .mockResolvedValueOnce({ rows: [{ id: 'user-id' }] }) // INSERT
  .mockResolvedValueOnce({ rows: [] }); // COMMIT
```

### Mocking Stripe API

```typescript
const mockStripe = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
    confirm: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
};

mockStripe.paymentIntents.create.mockResolvedValue({
  id: 'pi_test123',
  status: 'succeeded',
  amount: 3300,
});
```

## Test Fixtures and Data

### Using Fixtures

```typescript
import { validCustomer, validRegisterDto, mockTokens } from '../../test/fixtures';

it('should use fixture data', async () => {
  mockDb.query.mockResolvedValue({ rows: [validCustomer] });

  const result = await service.getUser(validCustomer.id);

  expect(result.email).toBe(validCustomer.email);
});
```

### Creating Custom Fixtures

```typescript
// test/fixtures/custom.fixture.ts
export const createMockOrder = (overrides = {}) => ({
  id: 'order-uuid-1',
  status: 'pending',
  subtotal: 2500,
  ...overrides,
});

// Usage
const pendingOrder = createMockOrder();
const completedOrder = createMockOrder({ status: 'completed' });
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Global**: 75% (statements, branches, functions, lines)
- **Critical Services**: 90% (auth, payments, orders)
- **DTOs/Interfaces**: Not required (excluded from coverage)

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Best Practices

1. **Focus on critical paths first** (auth, payments)
2. **Don't chase 100% coverage** - test behavior, not lines
3. **Prioritize edge cases** over happy paths
4. **Test error handling** thoroughly

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm run test -- auth.service.spec.ts

# Run tests matching pattern
npm run test -- --testNamePattern="register"

# Run with coverage
npm run test:cov

# Run E2E tests only
npm run test:e2e

# Debug tests
npm run test:debug
```

### CI/CD Integration

Tests run automatically in GitHub Actions on every push and pull request. PRs are blocked if:

- Any test fails
- Coverage drops below 70%
- Linting errors exist

## Best Practices

### DO ✅

- **Write tests first** (TDD red-green-refactor)
- **Test behavior, not implementation**
- **Use descriptive test names**: "should reject login with invalid password"
- **One assertion per test** (when possible)
- **Use fixtures for reusable test data**
- **Mock external dependencies** (APIs, databases for unit tests)
- **Clean up after tests** (clear mocks, close connections)
- **Test edge cases and error paths**
- **Keep tests independent** (no shared state)

### DON'T ❌

- **Don't test library code** (e.g., don't test that bcrypt hashes correctly)
- **Don't use real external APIs** in tests
- **Don't test private methods directly** (test through public interface)
- **Don't share state between tests**
- **Don't write flaky tests** (tests that sometimes pass/fail)
- **Don't ignore test failures** ("it works on my machine")
- **Don't commit commented-out tests**

### Test Naming

```typescript
// Good ✅
it('should return user profile when authenticated', async () => {});
it('should throw UnauthorizedException when token is invalid', async () => {});
it('should update order status to accepted', async () => {});

// Bad ❌
it('test1', async () => {});
it('works', async () => {});
it('should do something', async () => {});
```

### Assertion Best Practices

```typescript
// Specific assertions ✅
expect(result.status).toBe('accepted');
expect(result.total).toBe(3300);
expect(mockService.create).toHaveBeenCalledWith({ id: 'test' });

// Vague assertions ❌
expect(result).toBeTruthy();
expect(mockService.create).toHaveBeenCalled();
```

## Common Patterns

### Testing Guards (AuthGuard)

```typescript
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  it('should allow request with valid token', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
    } as ExecutionContext;

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });
});
```

### Testing Controllers

```typescript
import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should return user profile', async () => {
    const mockUser = { id: 'user-id', email: 'test@example.com' };
    jest.spyOn(service, 'getProfile').mockResolvedValue(mockUser);

    const result = await controller.getProfile({ user: { sub: 'user-id' } });

    expect(result).toEqual(mockUser);
    expect(service.getProfile).toHaveBeenCalledWith('user-id');
  });
});
```

### Testing Validation (DTOs)

```typescript
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should validate correct data', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 'Test1234!';
    dto.role = UserRole.CUSTOMER;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid email', async () => {
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.password = 'Test1234!';
    dto.role = UserRole.CUSTOMER;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
```

## Troubleshooting

### Test Timeout Errors

```typescript
// Increase timeout for specific test
it('should handle long operation', async () => {
  // Test code...
}, 10000); // 10 second timeout

// Or set global timeout in jest.config.js
testTimeout: 30000;
```

### Mock Not Being Called

```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Check if mock is properly set up
expect(mockFunction).toBeDefined();
expect(mockFunction.mock.calls.length).toBe(1);
```

### Async Test Failures

```typescript
// Always use async/await
it('should test async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// Don't forget to await rejections
await expect(service.failingMethod()).rejects.toThrow();
```

### Database Connection Issues

```typescript
// Ensure proper cleanup
afterAll(async () => {
  await db.end();
  await app.close();
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Martin Fowler - Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

## Questions?

If you have questions about testing practices, ask in the team Slack channel #testing or open a GitHub Discussion.

---

**Last Updated**: 2026-01-31
**Maintained by**: Agent 3 (Testing & QA Lead)
