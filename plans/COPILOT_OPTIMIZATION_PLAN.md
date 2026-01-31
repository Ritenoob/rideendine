# Copilot CLI Optimization Plan for RideNDine

## Overview

This plan outlines a comprehensive system to optimize GitHub Copilot CLI with MCP servers, custom prompts, plugins, and automation scripts for the RideNDine project.

## Architecture Diagram

```mermaid
graph TD
    CLI[Copilot CLI] --> MCP[MCP Servers]
    CLI --> PROMPTS[Custom Prompts]
    CLI --> SCRIPTS[Automation Scripts]
    CLI --> PLUGINS[Plugins]
    
    MCP --> DB[Database Schema Server]
    MCP --> API[API Documentation Server]
    MCP --> ORDER[Order State Machine Server]
    MCP --> STRIPE[Stripe Integration Server]
    MCP --> FRONTEND[Frontend Patterns Server]
    
    DB --> database/migrations
    API --> services/api
    ORDER --> services/api/src/orders
    STRIPE --> services/api/src/stripe
    FRONTEND --> apps
```

---

## Part 1: MCP (Model Context Protocol) Servers

### 1. Database Schema MCP Server

**Location:** `mcp-servers/database-schema-server/`

**Purpose:** Provide context about database structure, migrations, and relationships.

**Capabilities:**
- List all database tables and their columns
- Provide table relationships and foreign keys
- Show migration history and pending migrations
- Generate SQL queries based on natural language
- Validate schema changes

**Tools:**
- `list_tables` - Returns all tables with column definitions
- `get_table_schema` - Returns detailed schema for a specific table
- `get_relationships` - Returns foreign key relationships
- `generate_query` - Converts natural language to SQL
- `validate_migration` - Checks migration against current schema

**Implementation Structure:**
```
mcp-servers/database-schema-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── tools/
│   │   ├── listTables.ts
│   │   ├── getTableSchema.ts
│   │   ├── getRelationships.ts
│   │   ├── generateQuery.ts
│   │   └── validateMigration.ts
│   └── database/
│       └── connection.ts
└── dist/
```

---

### 2. API Documentation MCP Server

**Location:** `mcp-servers/api-docs-server/`

**Purpose:** Provide API endpoint documentation, request/response schemas, and testing capabilities.

**Capabilities:**
- List all API endpoints with methods and paths
- Provide request/response schemas for each endpoint
- Generate curl commands for API testing
- Validate request payloads against schemas
- Show authentication requirements

**Tools:**
- `list_endpoints` - Returns all API endpoints
- `get_endpoint_details` - Returns detailed info for an endpoint
- `generate_curl` - Generates curl command for an endpoint
- `validate_payload` - Validates request payload
- `get_auth_requirements` - Returns auth requirements for endpoint

---

### 3. Order State Machine MCP Server

**Location:** `mcp-servers/order-state-server/`

**Purpose:** Provide context about order state transitions, business rules, and validation logic.

**Capabilities:**
- List all order states and their meanings
- Show valid state transitions
- Validate state transitions
- Provide business rules for each state
- Generate state transition diagrams

**Tools:**
- `list_states` - Returns all order states
- `get_valid_transitions` - Returns valid transitions from a state
- `validate_transition` - Validates a state transition
- `get_state_rules` - Returns business rules for a state
- `generate_diagram` - Generates Mermaid diagram of state machine

---

### 4. Stripe Integration MCP Server

**Location:** `mcp-servers/stripe-server/`

**Purpose:** Provide context about Stripe Connect integration, payment flows, and webhook handling.

**Capabilities:**
- List Stripe webhook events and their handlers
- Provide payment flow documentation
- Show Connect account onboarding steps
- Generate Stripe API code snippets
- Validate webhook signatures

**Tools:**
- `list_webhook_events` - Returns all webhook events
- `get_payment_flow` - Returns payment flow documentation
- `get_onboarding_steps` - Returns Connect onboarding steps
- `generate_stripe_code` - Generates Stripe API code
- `validate_webhook` - Validates webhook signature

---

### 5. Frontend Patterns MCP Server

**Location:** `mcp-servers/frontend-patterns-server/`

**Purpose:** Provide context about frontend component patterns, navigation structure, and UI conventions.

**Capabilities:**
- List available component patterns
- Show navigation structure for each app
- Provide UI/UX conventions
- Generate component boilerplate
- Show state management patterns

**Tools:**
- `list_components` - Returns available component patterns
- `get_navigation_structure` - Returns navigation for an app
- `get_ui_conventions` - Returns UI/UX conventions
- `generate_component` - Generates component boilerplate
- `get_state_pattern` - Returns state management pattern

---

## Part 2: Custom Prompts

### Prompt Templates Location

**Location:** `.github/copilot-prompts/`

### Prompt Categories

#### 1. Backend Development Prompts

**File:** `.github/copilot-prompts/backend.md`

```markdown
# Backend Development Prompts

## Create New API Endpoint

When creating a new API endpoint:

1. Follow NestJS module structure in `services/api/src/`
2. Create DTOs in `dto/` subdirectory with class-validator decorators
3. Implement service logic in `*.service.ts`
4. Add controller in `*.controller.ts` with proper guards
5. Add tests in `*.spec.ts`
6. Update this prompt with new endpoint

Example:
```
Create a POST endpoint for /api/orders/:id/cancel that:
- Validates order exists and belongs to user
- Checks if order can be cancelled using OrderStateMachine
- Processes refund if payment was confirmed
- Updates order status to 'cancelled'
- Logs action in admin_actions table
```

## Database Migration

When creating a new migration:

1. Create file in `database/migrations/` with format `XXX_description.sql`
2. Use transaction blocks for safety
3. Add indexes for frequently queried columns
4. Include rollback comments
5. Test migration on development database first

## Order State Transition

When implementing order state changes:

1. Always validate with `OrderStateMachine.canTransition(from, to)`
2. Check if refund is needed with `requiresRefund(state)`
3. Update `order_status_history` table
4. Emit appropriate WebSocket events
5. Handle Stripe refunds if applicable
```

#### 2. Frontend Development Prompts

**File:** `.github/copilot-prompts/frontend.md`

```markdown
# Frontend Development Prompts

## React Component Creation

When creating React components:

1. Use TypeScript with proper interfaces
2. Follow existing component structure in `apps/`
3. Use Tailwind CSS for styling
4. Implement proper error boundaries
5. Add loading states for async operations
6. Test on both web and mobile platforms

## Navigation Structure

When adding navigation:

1. Update navigation types in `src/navigation/types.ts`
2. Add screen to appropriate navigator
3. Implement deep linking support
4. Update navigation flow documentation

## State Management

When managing state:

1. Use Zustand for global state (see `apps/customer-mobile/src/store/`)
2. Use React Context for component-level state
3. Implement proper TypeScript types
4. Add persistence for critical state
```

#### 3. Testing Prompts

**File:** `.github/copilot-prompts/testing.md`

```markdown
# Testing Prompts

## API Endpoint Testing

When testing API endpoints:

1. Test all success and error cases
2. Mock external dependencies (Stripe, Google Maps)
3. Test authentication and authorization
4. Validate response schemas
5. Test rate limiting

## Frontend Component Testing

When testing React components:

1. Test user interactions
2. Test loading and error states
3. Mock API calls
4. Test responsive behavior
5. Test accessibility
```

---

## Part 3: Automation Scripts

### Script Location

**Location:** `scripts/copilot/`

### Available Scripts

#### 1. Generate API Documentation

**File:** `scripts/copilot/generate-api-docs.js`

Purpose: Scan NestJS controllers and generate API endpoint documentation for MCP server.

Usage:
```bash
node scripts/copilot/generate-api-docs.js
```

#### 2. Validate Database Schema

**File:** `scripts/copilot/validate-schema.js`

Purpose: Validate database schema against migrations and ensure consistency.

Usage:
```bash
node scripts/copilot/validate-schema.js
```

#### 3. Generate Component Boilerplate

**File:** `scripts/copilot/generate-component.js`

Purpose: Interactive script to generate React component boilerplate with TypeScript.

Usage:
```bash
node scripts/copilot/generate-component.js
```

#### 4. Update MCP Server Data

**File:** `scripts/copilot/update-mcp-data.js`

Purpose: Update all MCP server data files from current codebase.

Usage:
```bash
node scripts/copilot/update-mcp-data.js
```

---

## Part 4: Copilot Plugins

### Plugin Configuration

**Location:** `.github/copilot-plugins/`

### Plugin: RideNDine Context Provider

**File:** `.github/copilot-plugins/context-provider.json`

Provides RideNDine-specific context to Copilot based on file patterns.

### Plugin: RideNDine Snippet Generator

**File:** `.github/copilot-plugins/snippet-generator.json`

Provides code snippets for common RideNDine patterns:
- API endpoint creation
- Order state transitions
- React component boilerplate
- Database queries

---

## Part 5: Configuration Files

### MCP Configuration

**File:** `config/copilot/config.json`

```json
{
  "mcpServers": {
    "ridendine-database": {
      "command": "node",
      "args": ["mcp-servers/database-schema-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://ridendine:ridendine_dev_password@localhost:5432/ridendine_dev"
      }
    },
    "ridendine-api": {
      "command": "node",
      "args": ["mcp-servers/api-docs-server/dist/index.js"],
      "env": {
        "API_BASE_URL": "http://localhost:9001"
      }
    },
    "ridendine-orders": {
      "command": "node",
      "args": ["mcp-servers/order-state-server/dist/index.js"]
    },
    "ridendine-stripe": {
      "command": "node",
      "args": ["mcp-servers/stripe-server/dist/index.js"],
      "env": {
        "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}"
      }
    },
    "ridendine-frontend": {
      "command": "node",
      "args": ["mcp-servers/frontend-patterns-server/dist/index.js"]
    }
  }
}
```

---

## Part 6: Enhanced Copilot Instructions

### Add to .github/copilot-instructions.md

Add the following section to the existing file:

```markdown
---

## Copilot Optimization System

This project includes a comprehensive Copilot optimization system with MCP servers, custom prompts, and automation scripts.

### MCP Servers

The following MCP servers provide context-aware assistance:

1. **Database Schema Server** (`mcp-servers/database-schema-server/`)
   - Query database structure and relationships
   - Generate SQL queries from natural language
   - Validate migrations

2. **API Documentation Server** (`mcp-servers/api-docs-server/`)
   - List all API endpoints
   - Generate curl commands
   - Validate request payloads

3. **Order State Machine Server** (`mcp-servers/order-state-server/`)
   - Query order states and transitions
   - Validate state changes
   - Generate state diagrams

4. **Stripe Integration Server** (`mcp-servers/stripe-server/`)
   - Query webhook events
   - Generate Stripe code
   - Validate webhooks

5. **Frontend Patterns Server** (`mcp-servers/frontend-patterns-server/`)
   - List component patterns
   - Generate component boilerplate
   - Show navigation structure

### Custom Prompts

Use custom prompts in `.github/copilot-prompts/` for:
- Backend development patterns
- Frontend component creation
- Testing strategies
- Database migrations

### Automation Scripts

Run the following scripts from `scripts/copilot/`:

```bash
# Generate API documentation
node scripts/copilot/generate-api-docs.js

# Validate database schema
node scripts/copilot/validate-schema.js

# Generate component boilerplate
node scripts/copilot/generate-component.js
```

### Quick Reference

When working with Copilot, you can ask:

- "Show me the schema for the orders table"
- "Generate a curl command for POST /api/orders"
- "What are the valid transitions from 'pending' state?"
- "Create a new API endpoint for chef profile updates"
- "Generate a React component for order tracking"
```

---

## Part 7: Usage Examples

### Example 1: Creating a New API Endpoint

**Prompt to Copilot:**
```
Create a new API endpoint for updating chef operating hours. Use the database schema MCP server to understand the operating_hours column structure and follow the backend development prompts.
```

**Copilot will:**
1. Query database schema for chefs table
2. Use backend development prompts for guidance
3. Generate controller, service, and DTO code
4. Include proper validation and error handling

### Example 2: Adding Order State Transition

**Prompt to Copilot:**
```
Add a new state transition from 'preparing' to 'ready_for_pickup'. Use the order state machine MCP server to validate the transition and generate the necessary code.
```

**Copilot will:**
1. Query order state machine for valid transitions
2. Validate the new transition
3. Generate service method with proper checks
4. Include webhook emission and audit logging

### Example 3: Creating a React Component

**Prompt to Copilot:**
```
Create a React component for displaying order status timeline. Use the frontend patterns MCP server to get the component structure and follow the frontend development prompts.
```

**Copilot will:**
1. Query frontend patterns for similar components
2. Generate component with TypeScript
3. Include proper styling with Tailwind
4. Add loading and error states

---

## Part 8: Testing and Validation

### Test MCP Servers

```bash
# Test database schema server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-servers/database-schema-server/dist/index.js

# Test API docs server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-servers/api-docs-server/dist/index.js
```

### Validate Integration

```bash
# Run all validation scripts
npm run validate:copilot

# Test prompt templates
npm run test:prompts

# Generate documentation
npm run docs:generate
```

---

## Part 9: Maintenance

### Update MCP Servers

When adding new features:

1. Update the relevant MCP server with new tools
2. Regenerate API documentation
3. Update prompt templates
4. Test integration

### Monitor Performance

```bash
# Check MCP server logs
tail -f /tmp/ridendine-mcp-*.log

# Monitor response times
npm run benchmark:mcp
```

---

## Summary

This comprehensive Copilot optimization system provides:

1. **5 MCP Servers** for context-aware assistance
2. **Custom Prompts** for common development tasks
3. **Automation Scripts** for code generation and validation
4. **Plugins** for enhanced Copilot integration
5. **Enhanced Instructions** for better guidance

The system is designed to be modular, extensible, and maintainable, allowing the team to easily add new capabilities as the project grows.

---

## Next Steps

1. Create MCP server directory structure
2. Implement each MCP server with its tools
3. Create custom prompt templates
4. Write automation scripts
5. Configure Copilot plugins
6. Update existing copilot-instructions.md
7. Test and validate the complete system
8. Document usage for the team
