# RideNDine Secrets Management

This document outlines the secrets management strategy for RideNDine across all environments.

## Overview

**Critical Security Rule:** Never commit secrets to version control. All sensitive values must be stored securely and injected at runtime.

## Secret Categories

### 1. Database Credentials

- `DATABASE_USER` - PostgreSQL username
- `DATABASE_PASSWORD` - PostgreSQL password
- `DATABASE_NAME` - Database name
- `DATABASE_HOST` - Database host (environment-specific)
- `DATABASE_PORT` - Database port (usually 5432)

### 2. Authentication Secrets

- `JWT_SECRET` - Secret for signing JWT access tokens (min 32 characters)
- `REFRESH_TOKEN_SECRET` - Secret for signing refresh tokens (min 32 characters)
- `JWT_EXPIRES_IN` - Access token expiration (e.g., "15m")
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiration (e.g., "7d")

### 3. Third-Party API Keys

- `STRIPE_SECRET_KEY` - Stripe payment processing secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (public, but environment-specific)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification secret
- `MAPBOX_TOKEN` - Mapbox API token for routing
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for routing/geocoding

### 4. Cache Credentials (Optional)

- `REDIS_PASSWORD` - Redis authentication password (if enabled)

### 5. Email/SMS (Future)

- `SENDGRID_API_KEY` - SendGrid API key for transactional emails
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS
- `TWILIO_AUTH_TOKEN` - Twilio auth token

## Environment-Specific Strategy

### Development (Local)

**Storage Method:** `.env.local` file (git-ignored)

**Setup:**

```bash
# Copy example file
cp .env.example .env.local

# Edit with development values
nano .env.local
```

**Example `.env.local`:**

```env
# Development secrets - local only
DATABASE_PASSWORD=dev_password_not_for_production
JWT_SECRET=dev-jwt-secret-min-32-chars-change-in-staging
REFRESH_TOKEN_SECRET=dev-refresh-secret-min-32-chars-change-in-staging
STRIPE_SECRET_KEY=sk_test_PLACEHOLDER_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER_REPLACE_ME
MAPBOX_TOKEN=pk.PLACEHOLDER_REPLACE_ME
```

**Security Notes:**

- Use test API keys (Stripe test mode, etc.)
- Simple passwords acceptable for local development
- Never commit `.env.local` to git
- Document setup in `DEVELOPMENT.md`

### Staging (Pre-Production)

**Storage Method:** CI/CD Environment Variables + Cloud Secret Manager

**GitHub Actions Secrets:**

```bash
# In GitHub repository: Settings > Secrets and variables > Actions

DATABASE_PASSWORD_STAGING
JWT_SECRET_STAGING
REFRESH_TOKEN_SECRET_STAGING
STRIPE_SECRET_KEY_STAGING
STRIPE_WEBHOOK_SECRET_STAGING
MAPBOX_TOKEN_STAGING
GOOGLE_MAPS_API_KEY_STAGING
```

**Deployment:**

- Secrets injected as environment variables during deployment
- Use Kubernetes Secrets or cloud provider secret management
- Rotate secrets quarterly

**Example GitHub Actions Workflow:**

```yaml
deploy-staging:
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - name: Deploy with secrets
      env:
        DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD_STAGING }}
        JWT_SECRET: ${{ secrets.JWT_SECRET_STAGING }}
      run: |
        # Deploy commands
```

### Production

**Storage Method:** Cloud Provider Secret Manager

**Recommended Solutions:**

#### AWS Secrets Manager

```bash
# Store secret (replace with actual secret from secure location)
aws secretsmanager create-secret \
  --name ridendine/prod/jwt-secret \
  --secret-string "PLACEHOLDER_REPLACE_WITH_ACTUAL_SECRET"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id ridendine/prod/jwt-secret \
  --query SecretString \
  --output text
```

#### Google Cloud Secret Manager

```bash
# Store secret
echo -n "your-production-jwt-secret" | \
  gcloud secrets create jwt-secret --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:ridendine@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Access in application (Node.js)
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: 'projects/PROJECT_ID/secrets/jwt-secret/versions/latest',
});
const secret = version.payload.data.toString();
```

#### Azure Key Vault

```bash
# Store secret
az keyvault secret set \
  --vault-name ridendine-prod-vault \
  --name jwt-secret \
  --value "your-production-jwt-secret"

# Retrieve in application
az keyvault secret show \
  --vault-name ridendine-prod-vault \
  --name jwt-secret \
  --query value \
  --output tsv
```

**Kubernetes Integration:**

Use **External Secrets Operator** to sync cloud secrets to Kubernetes:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: gcpsm-secret-store
  namespace: ridendine
spec:
  provider:
    gcpsm:
      projectID: 'your-gcp-project'
      auth:
        secretRef:
          secretAccessKeyRef:
            name: gcpsm-secret
            key: secret-access-credentials
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: ridendine
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcpsm-secret-store
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
    - secretKey: jwt-secret
      remoteRef:
        key: jwt-secret
    - secretKey: refresh-token-secret
      remoteRef:
        key: refresh-token-secret
```

## Secret Generation Guidelines

### JWT Secrets

Generate strong random secrets:

```bash
# Generate 64-character random secret
openssl rand -base64 48

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Requirements:**

- Minimum 32 characters
- Use cryptographically secure random generation
- Different secrets for JWT and refresh tokens
- Rotate every 90 days in production

### Database Passwords

```bash
# Generate strong password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25

# Or using pwgen
pwgen -s 32 1
```

**Requirements:**

- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Unique per environment
- Store in secret manager, never in code

### API Keys

**Third-party services (Stripe, Mapbox, etc.):**

- Obtain from respective provider dashboards
- Use test/sandbox keys for development/staging
- Use production keys only in production environment
- Rotate when team members leave or keys are compromised

## Secret Rotation

### Rotation Schedule

| Secret Type        | Rotation Frequency | Priority |
| ------------------ | ------------------ | -------- |
| JWT secrets        | Every 90 days      | High     |
| Database passwords | Every 180 days     | Critical |
| API keys           | When compromised   | High     |
| Webhook secrets    | Every 180 days     | Medium   |

### Rotation Procedure

1. **Generate new secret**

   ```bash
   NEW_SECRET=$(openssl rand -base64 48)
   ```

2. **Update in secret manager**

   ```bash
   # AWS
   aws secretsmanager update-secret \
     --secret-id ridendine/prod/jwt-secret \
     --secret-string "$NEW_SECRET"

   # GCP
   echo -n "$NEW_SECRET" | gcloud secrets versions add jwt-secret --data-file=-
   ```

3. **Deploy with new secret** (rolling update, both old and new valid during transition)

4. **Verify all services using new secret**

5. **Decommission old secret** (after grace period)

### Zero-Downtime JWT Rotation

For JWT secrets, support multiple valid secrets during rotation:

```typescript
// config/jwt.config.ts
export const jwtConfig = {
  secrets: [
    process.env.JWT_SECRET_CURRENT, // New secret
    process.env.JWT_SECRET_PREVIOUS, // Old secret (grace period)
  ],
  // Sign with current, verify with both
};
```

## Access Control

### Development

- All developers have access to development secrets
- Store in shared password manager (1Password, LastPass) or `.env.example`

### Staging

- Only CI/CD system and DevOps team have access
- Secrets stored in GitHub Actions secrets
- Logged access to secret manager

### Production

- Principle of least privilege
- Only production deployment service accounts have access
- All secret access logged and monitored
- Require multi-factor authentication for human access
- Regular access audits

## Incident Response

### If Secret is Compromised

1. **Immediate Actions:**
   - Rotate compromised secret immediately
   - Revoke all tokens signed with old secret (if JWT)
   - Invalidate API keys with provider
   - Check access logs for unauthorized usage

2. **Investigation:**
   - Determine how secret was compromised
   - Assess scope of exposure
   - Document incident

3. **Prevention:**
   - Update procedures to prevent recurrence
   - Additional training if human error
   - Improve technical controls

4. **Notification:**
   - Notify security team
   - Notify affected users if data breach
   - File incident report

## Best Practices

### ✅ DO

- Use different secrets for each environment
- Rotate secrets regularly
- Use secret managers for production
- Encrypt secrets at rest and in transit
- Audit secret access
- Use service accounts with minimal permissions
- Document secret rotation procedures
- Test secret rotation in staging before production

### ❌ DON'T

- Commit secrets to version control (`.env` files, hardcoded values)
- Share secrets via email, Slack, or messaging apps
- Store secrets in application logs
- Use the same secret across environments
- Store secrets in container images
- Expose secrets in URLs or query parameters
- Use weak or predictable secrets

## Monitoring and Alerts

### Secret Expiration Alerts

Set up alerts for:

- Secrets nearing expiration (30 days before)
- Failed secret rotation
- Unauthorized secret access attempts
- Secret access from unexpected locations

### Example CloudWatch/Stackdriver Alert

```yaml
alert: SecretExpirationSoon
expr: secret_age_days > 60
for: 24h
labels:
  severity: warning
annotations:
  summary: 'Secret {{ $labels.secret_name }} expires in {{ $value }} days'
  description: 'Rotate secret before expiration'
```

## Development Quickstart

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Generate secrets
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env.local
echo "REFRESH_TOKEN_SECRET=$(openssl rand -base64 48)" >> .env.local

# 3. Add third-party test keys
# Get from:
# - Stripe: https://dashboard.stripe.com/test/apikeys
# - Mapbox: https://account.mapbox.com/access-tokens/

# 4. Verify secrets loaded
npm run dev
# Should start without "missing environment variable" errors
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Configure secrets
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET_PROD }}
          DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD_PROD }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY_PROD }}
        run: |
          # Secrets available as environment variables
          # Deploy commands here

      - name: Deploy to Kubernetes
        run: |
          # Create Kubernetes secret from GitHub secrets
          kubectl create secret generic app-secrets \
            --from-literal=jwt-secret="${{ secrets.JWT_SECRET_PROD }}" \
            --from-literal=database-password="${{ secrets.DATABASE_PASSWORD_PROD }}" \
            --dry-run=client -o yaml | kubectl apply -f -
```

## Checklist for New Environments

- [ ] Generate unique secrets for all categories
- [ ] Store secrets in appropriate secret manager
- [ ] Configure access controls (IAM, RBAC)
- [ ] Test secret retrieval in deployment pipeline
- [ ] Document secret rotation procedures
- [ ] Setup expiration alerts
- [ ] Verify no secrets in logs or error messages
- [ ] Audit all secret access points
- [ ] Create incident response plan
- [ ] Train team on secret handling

## Support

For questions about secrets management:

- DevOps Lead: devops@ridendine.com
- Security Team: security@ridendine.com
- Emergency: Use PagerDuty incident workflow
