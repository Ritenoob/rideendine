# Runbook: Emergency Procedures

Critical procedures for major incidents, system outages, security breaches, and disaster scenarios.

**Last Updated:** 2026-01-31
**Severity:** Critical
**Estimated Time:** Varies (15 min - 4 hours)
**Required Access:** Full admin access, incident commander role

---

## ⚠️ EMERGENCY CONTACTS

| Role                 | Contact           | Phone           | Slack         |
| -------------------- | ----------------- | --------------- | ------------- |
| **On-Call Engineer** | ops@ridendine.com | +1-555-0001     | @oncall       |
| **CTO**              | John Smith        | +1-555-0100     | @john-cto     |
| **VP Engineering**   | Jane Doe          | +1-555-0101     | @jane-vp      |
| **Security Lead**    | Bob Wilson        | +1-555-0102     | @bob-security |
| **Database Admin**   | Alice Chen        | +1-555-0103     | @alice-dba    |
| **AWS Support**      | N/A               | +1-206-266-4064 | N/A           |
| **PagerDuty**        | N/A               | Via app         | N/A           |

**Emergency Slack Channels:**

- `#ridendine-incidents` - Active incident coordination
- `#ridendine-ops` - Operations team
- `#executives` - Executive notifications

---

## Incident Severity Levels

| Level    | Impact            | Response Time       | Examples                                                |
| -------- | ----------------- | ------------------- | ------------------------------------------------------- |
| **SEV1** | Complete outage   | Immediate (< 5 min) | Site down, data breach, payment processing failure      |
| **SEV2** | Major degradation | < 15 min            | High error rate (>5%), slow performance, partial outage |
| **SEV3** | Minor degradation | < 1 hour            | Slow performance (<500ms), single feature broken        |
| **SEV4** | Low impact        | < 4 hours           | Minor bugs, cosmetic issues                             |

---

## Incident Response Workflow

```
1. DETECT → 2. ASSESS → 3. NOTIFY → 4. MITIGATE → 5. RESOLVE → 6. POST-MORTEM
```

### Step 1: Detect (0-2 min)

```bash
# Automated alerts trigger
# OR Manual detection via monitoring dashboard
# OR Customer reports

# Immediately:
1. Acknowledge alert in PagerDuty
2. Join #ridendine-incidents Slack channel
3. Announce: "SEV1 INCIDENT: [Brief description]"
```

### Step 2: Assess Severity (2-5 min)

```bash
# Quick health check
curl https://api.ridendine.com/health
curl https://ridendine.com/health

# Check metrics
# - Error rate: https://dashboard.ridendine.com/errors
# - Active users: https://dashboard.ridendine.com/users
# - Response time: https://dashboard.ridendine.com/latency

# Determine severity:
SEV1: Site completely down OR data breach OR payment failure
SEV2: >5% error rate OR major feature broken
SEV3: Slow performance OR single feature broken
SEV4: Minor issue OR cosmetic bug
```

### Step 3: Notify Stakeholders (5-10 min)

```bash
# SEV1: Notify ALL stakeholders immediately
# Post in #ridendine-incidents:
"🚨 SEV1 INCIDENT DECLARED
Description: [Site completely down]
Impact: [All customers cannot access platform]
Status: [Investigating]
Incident Commander: [@name]
War Room: [Zoom link]"

# Tag relevant teams
@engineering-team @executives @support-team

# Update status page
# https://status.ridendine.com
curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d '{
    "incident": {
      "name": "Service Outage",
      "status": "investigating",
      "body": "We are investigating connectivity issues",
      "impact_override": "critical"
    }
  }'
```

### Step 4: Mitigate (Immediate)

- See specific scenarios below
- Focus on restoring service first
- Root cause analysis comes later

### Step 5: Resolve

- Verify fix works
- Monitor for 30 minutes
- Update status page
- Close incident

### Step 6: Post-Mortem (Within 48 hours)

- Schedule blameless post-mortem
- Document timeline, root cause, action items
- Share with team

---

## SCENARIO 1: Complete Service Outage

**Symptoms:** Site completely unreachable, all health checks failing

### Emergency Response

```bash
# ⏱️ TIME: 0-2 minutes - Assess

# 1. Check if it's network/DNS
ping api.ridendine.com
nslookup api.ridendine.com

# 2. Check if load balancer is up
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/ridendine-api/xxx

# 3. Check if any pods/containers are running
kubectl get pods -n ridendine
# or
docker-compose ps
```

```bash
# ⏱️ TIME: 2-5 minutes - Quick Fixes

# If no pods running:
kubectl get deployment api -n ridendine
# If deployment has 0 replicas → someone scaled down

# EMERGENCY FIX:
kubectl scale deployment/api --replicas=3 -n ridendine
kubectl rollout status deployment/api -n ridendine

# If pods crash-looping:
kubectl logs -f deployment/api -n ridendine --tail=50
# Look for error, fix immediately if obvious (env var, secret, etc.)

# If load balancer issue:
# Check ALB status in AWS console
# Verify security groups allow traffic

# If DNS issue:
# Check Route53 records
# Flush CloudFlare cache if using
```

```bash
# ⏱️ TIME: 5-10 minutes - Rollback

# If recent deployment caused outage:
kubectl rollout undo deployment/api -n ridendine
kubectl rollout status deployment/api -n ridendine

# Verify:
curl https://api.ridendine.com/health
# Expected: 200 OK
```

---

## SCENARIO 2: Database Outage

**Symptoms:** API returns 500 errors, "Database connection failed"

### Emergency Response

```bash
# ⏱️ TIME: 0-2 minutes

# 1. Check database status
kubectl get pods -n ridendine -l app=postgres
# or
docker-compose ps postgres
# or (RDS)
aws rds describe-db-instances --db-instance-identifier ridendine-production-db

# 2. Try connecting
docker-compose exec postgres pg_isready -U ridendine
# or (RDS via bastion)
psql -h ridendine-prod.xxx.rds.amazonaws.com -U ridendine -c "SELECT 1;"
```

```bash
# ⏱️ TIME: 2-5 minutes - Quick Fixes

# If database is down:
docker-compose restart postgres
# or (RDS)
aws rds reboot-db-instance --db-instance-identifier ridendine-production-db

# If connection pool exhausted:
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE pid <> pg_backend_pid();
"

# If disk full:
docker-compose exec postgres df -h
# If full → Emergency cleanup:
docker-compose exec postgres find /var/lib/postgresql/data/log -name "*.log" -mtime +1 -delete
```

```bash
# ⏱️ TIME: 5-30 minutes - Disaster Recovery

# If database is corrupted or unrecoverable:
# See RUNBOOK_DATABASE_RECOVERY.md
# Quick restore from latest snapshot (RDS):
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ridendine-prod-emergency \
  --db-snapshot-identifier ridendine-prod-$(date +%Y%m%d) \
  --db-instance-class db.r5.xlarge

# Wait 20-30 minutes for restore...
aws rds wait db-instance-available \
  --db-instance-identifier ridendine-prod-emergency

# Update DATABASE_URL to point to restored instance
# Restart API
```

---

## SCENARIO 3: Security Breach / Unauthorized Access

**Symptoms:** Suspicious activity, unauthorized API access, data exfiltration detected

### ⚠️ CRITICAL: Do NOT publicly disclose breach until assessed

```bash
# ⏱️ TIME: 0-5 minutes - CONTAIN

# 1. IMMEDIATELY notify security lead
# Slack: @bob-security in #ridendine-incidents
# Phone: +1-555-0102
# Subject: "SECURITY BREACH SUSPECTED"

# 2. Preserve evidence
# DO NOT delete logs
# Save CloudWatch logs, access logs, database logs

# 3. Revoke potentially compromised credentials
# Rotate ALL API keys, tokens, secrets
aws secretsmanager update-secret \
  --secret-id ridendine/production/jwt-secret \
  --secret-string "$(openssl rand -base64 64)"

# Force logout all users
docker-compose exec redis redis-cli FLUSHDB

# 4. Isolate affected systems
# If specific API compromised:
kubectl scale deployment/api --replicas=0 -n ridendine
# Display maintenance page
```

```bash
# ⏱️ TIME: 5-30 minutes - ASSESS

# 1. Check access logs for suspicious activity
aws logs filter-log-events \
  --log-group-name /ecs/ridendine-production \
  --start-time $(date -d '2 hours ago' +%s)000 \
  --filter-pattern "[ip, timestamp, method, path, status=401 || status=403]"

# 2. Check for unauthorized database access
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT usename, client_addr, query_start, query
  FROM pg_stat_activity
  WHERE usename NOT IN ('ridendine', 'postgres')
  ORDER BY query_start DESC;
"

# 3. Check for data exfiltration
# Large SELECT queries, bulk exports
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT substring(query, 1, 100), calls, total_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%COPY%' OR query LIKE '%pg_dump%'
  ORDER BY total_exec_time DESC;
"

# 4. Identify compromised accounts
# Check for unusual activity, password changes, etc.
```

```bash
# ⏱️ TIME: 30 min - 4 hours - REMEDIATE

# 1. Patch vulnerability (if identified)
# Deploy fix immediately

# 2. Restore from clean backup (if data compromised)
# See RUNBOOK_DATABASE_RECOVERY.md

# 3. Notify affected users (if PII exposed)
# Legal requirement: 72 hours in EU (GDPR), varies by state in US

# 4. Engage external security firm (if needed)
# For forensics and compliance

# 5. File incident reports
# Law enforcement (if criminal activity)
# Regulatory bodies (if required by industry)
```

### Post-Breach Checklist

- [ ] Vulnerability patched
- [ ] All credentials rotated
- [ ] Access logs analyzed
- [ ] Affected users notified
- [ ] Incident reported to authorities (if required)
- [ ] Security audit scheduled
- [ ] Post-mortem completed
- [ ] Preventive measures implemented

---

## SCENARIO 4: Payment Processing Failure

**Symptoms:** Stripe payments failing, refunds not processing, orders stuck in "pending"

### Emergency Response

```bash
# ⏱️ TIME: 0-2 minutes

# 1. Check Stripe status
curl https://status.stripe.com/api/v2/status.json | jq '.status.description'

# If Stripe is down → Wait for Stripe to recover
# Post on status page: "Payment processing temporarily unavailable due to payment provider issues"

# 2. Check API logs
docker-compose logs api | grep -i stripe | tail -50

# 3. Check webhook endpoint
curl -X POST https://api.ridendine.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

```bash
# ⏱️ TIME: 2-10 minutes - Quick Fixes

# If webhook signature verification failing:
# Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
kubectl get secret ridendine-secrets -n ridendine -o jsonpath='{.data.STRIPE_WEBHOOK_SECRET}' | base64 -d

# If secret wrong → Update and restart
kubectl create secret generic ridendine-secrets \
  --from-literal=STRIPE_WEBHOOK_SECRET=whsec_correct_secret \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/api -n ridendine

# If payment intent creation failing:
# Check STRIPE_SECRET_KEY is valid
curl https://api.stripe.com/v1/charges \
  -u sk_live_YOUR_KEY:

# If 401 Unauthorized → Key is invalid
# Rotate key in Stripe dashboard and update secret
```

```bash
# ⏱️ TIME: 10-60 minutes - Manual Processing

# If orders are stuck, manually process pending payments
# Run batch job to retry failed payment intents

# 1. Get stuck orders
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT id, order_number, customer_id, total_cents
  FROM orders
  WHERE status = 'pending'
  AND created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at;
"

# 2. Manually create payment intents (via script or Stripe dashboard)
# 3. Mark orders as payment_confirmed once processed
# 4. Notify affected customers
```

---

## SCENARIO 5: DDoS Attack

**Symptoms:** Massive spike in traffic, high latency, API unresponsive

### Emergency Response

```bash
# ⏱️ TIME: 0-5 minutes

# 1. Verify it's a DDoS (not legitimate traffic spike)
# Check request patterns:
aws logs filter-log-events \
  --log-group-name /ecs/ridendine-production \
  --start-time $(date -d '10 minutes ago' +%s)000 \
  | jq '.events[].message' \
  | cut -d' ' -f1 \
  | sort | uniq -c | sort -rn | head -20

# If many requests from same IPs → DDoS

# 2. Enable rate limiting (if not already enabled)
# Update nginx.conf or API rate limiter

# 3. Block malicious IPs
# Add to CloudFlare firewall rules or WAF
```

```bash
# ⏱️ TIME: 5-15 minutes - Mitigation

# If using CloudFlare:
# Enable "Under Attack Mode" in CloudFlare dashboard
# Or via API:
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/ZONE_ID/settings/security_level" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"under_attack"}'

# If using AWS WAF:
# Create IP set with malicious IPs
aws wafv2 create-ip-set \
  --name ridendine-blocked-ips \
  --scope REGIONAL \
  --ip-address-version IPV4 \
  --addresses 1.2.3.4/32 5.6.7.8/32

# Add WAF rule to block IP set
aws wafv2 create-web-acl \
  --name ridendine-ddos-protection \
  --scope REGIONAL \
  --default-action Block={} \
  --rules file://waf-rules.json
```

```bash
# ⏱️ TIME: 15-60 minutes - Scale & Monitor

# Scale up to handle load
kubectl scale deployment/api --replicas=10 -n ridendine

# Enable CloudWatch metrics
# Monitor:
# - Requests per second
# - Error rate
# - Blocked requests

# Contact AWS Shield Support (if using AWS Shield Advanced)
# Phone: +1-877-234-1134
```

---

## Emergency Maintenance Mode

**Use when:** Need to perform emergency maintenance or prevent further damage

```bash
# 1. Scale API to 0 replicas
kubectl scale deployment/api --replicas=0 -n ridendine

# 2. Deploy maintenance page
# Update nginx to serve static maintenance page
cat > /usr/share/nginx/html/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Maintenance</title></head>
<body>
  <h1>We'll be right back!</h1>
  <p>RideNDine is currently undergoing emergency maintenance.</p>
  <p>Expected completion: [TIME]</p>
</body>
</html>
EOF

# 3. Update status page
curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d '{
    "incident": {
      "name": "Scheduled Emergency Maintenance",
      "status": "investigating",
      "body": "We are performing emergency maintenance. Service will be restored shortly.",
      "impact_override": "critical"
    }
  }'

# 4. Notify customers via email/SMS
# Send bulk notification about maintenance window
```

---

## Emergency Rollback

```bash
# Kubernetes: Rollback to last known good version
kubectl rollout history deployment/api -n ridendine
kubectl rollout undo deployment/api -n ridendine
kubectl rollout status deployment/api -n ridendine

# ECS: Revert to previous task definition
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --task-definition ridendine-api:42

# Database: Restore from snapshot
# See RUNBOOK_DATABASE_RECOVERY.md
```

---

## Post-Incident Procedures

### Immediate (Within 1 hour of resolution)

```bash
# 1. Update status page
curl -X PATCH https://api.statuspage.io/v1/pages/PAGE_ID/incidents/INCIDENT_ID \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d '{"incident":{"status":"resolved","body":"Issue has been resolved. All systems are operational."}}'

# 2. Post resolution message in #ridendine-incidents
"✅ INCIDENT RESOLVED
Duration: [X minutes]
Impact: [Description]
Resolution: [What fixed it]
Next steps: [Post-mortem scheduled for tomorrow]"

# 3. Thank the team
```

### Within 24 hours

- [ ] Schedule blameless post-mortem
- [ ] Compile timeline of events
- [ ] Gather metrics (duration, customers affected, revenue impact)
- [ ] Document root cause

### Within 48 hours

- [ ] Conduct post-mortem meeting
- [ ] Document lessons learned
- [ ] Create action items with owners and due dates
- [ ] Share post-mortem report with team

### Within 1 week

- [ ] Implement preventive measures
- [ ] Update runbooks with learnings
- [ ] Conduct incident response training (if gaps identified)

---

## Emergency Decision Tree

```
Is the site down?
├─ YES → SEV1 → Notify ALL → Rollback or Scale
└─ NO
   └─ Is error rate >5%?
      ├─ YES → SEV2 → Notify Engineering → Investigate & Fix
      └─ NO
         └─ Is performance degraded?
            ├─ YES → SEV3 → Investigate → Scale or Optimize
            └─ NO → SEV4 → Regular process
```

---

## Reference

- [RUNBOOK_SERVICE_RESTART.md](./RUNBOOK_SERVICE_RESTART.md)
- [RUNBOOK_DATABASE_RECOVERY.md](./RUNBOOK_DATABASE_RECOVERY.md)
- [RUNBOOK_PERFORMANCE_DEGRADATION.md](./RUNBOOK_PERFORMANCE_DEGRADATION.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Last Updated:** 2026-01-31
**Maintained By:** Incident Response Team
**Review Frequency:** After each SEV1/SEV2 incident
