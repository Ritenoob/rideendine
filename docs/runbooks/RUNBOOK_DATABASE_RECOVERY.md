# Runbook: Database Recovery

**Purpose:** Restore RideNDine database from backup after data loss or corruption

**Severity:** Critical
**Estimated Time:** 15-45 minutes
**Risk Level:** High

## When to Use This Runbook

- Database corruption detected
- Accidental data deletion
- Failed migration rollback needed
- Disaster recovery scenario
- Data integrity issues

## Prerequisites

- [ ] Recent backup available (< 24 hours old preferred)
- [ ] kubectl/docker access to production
- [ ] Database credentials
- [ ] Change window approved (production downtime required)
- [ ] Incident ticket created
- [ ] Team notified (this causes downtime!)

## Pre-Recovery Steps

### 1. Assess the Situation

```bash
# Kubernetes: Check database pod status
kubectl get pods -l app=postgres -n ridendine

# Docker: Check container status
docker-compose ps postgres

# Test database connectivity
kubectl exec -it postgres-0 -n ridendine -- psql -U ridendine -c "SELECT COUNT(*) FROM users;"
```

### 2. Create Emergency Backup (If Possible)

```bash
# Even if database is corrupted, try to backup current state
npm run db:backup -- emergency_backup_before_recovery

# This creates: backups/emergency_backup_before_recovery.sql
```

### 3. Identify Latest Good Backup

```bash
# List available backups
ls -lht /home/nygmaee/Desktop/rideendine/backups/

# Or in Kubernetes
kubectl exec postgres-0 -n ridendine -- ls -lht /backups/

# Verify backup file integrity
gzip -t backups/ridendine_20240115_120000.sql.gz
```

### 4. Stop All Application Services

**IMPORTANT: Prevent writes during recovery!**

```bash
# Kubernetes
kubectl scale deployment/api --replicas=0 -n ridendine
kubectl scale deployment/dispatch --replicas=0 -n ridendine
kubectl scale deployment/routing --replicas=0 -n ridendine
kubectl scale deployment/realtime --replicas=0 -n ridendine

# Verify all stopped
kubectl get pods -n ridendine | grep -v postgres | grep -v redis

# Docker Compose
docker-compose stop api dispatch routing realtime
```

## Recovery Procedures

### Option 1: Automated Recovery Script

```bash
# Use the automated restore script
bash database/scripts/restore.sh backups/ridendine_20240115_120000.sql

# Follow prompts:
# - Confirm restore (type "yes")
# - Wait for completion
# - Verify table count
```

### Option 2: Manual Recovery (Kubernetes)

```bash
# 1. Copy backup file to database pod
kubectl cp backups/ridendine_20240115_120000.sql \
  postgres-0:/tmp/restore.sql \
  -n ridendine

# 2. Terminate active connections
kubectl exec -it postgres-0 -n ridendine -- psql -U ridendine -d postgres << EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'ridendine'
  AND pid <> pg_backend_pid();
EOF

# 3. Drop existing database
kubectl exec -it postgres-0 -n ridendine -- \
  dropdb -U ridendine --if-exists ridendine

# 4. Create fresh database
kubectl exec -it postgres-0 -n ridendine -- \
  createdb -U ridendine ridendine

# 5. Restore from backup
kubectl exec -i postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine < backups/ridendine_20240115_120000.sql

# 6. Verify restore
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

### Option 3: Manual Recovery (Docker Compose)

```bash
# 1. Stop application services (already done in pre-recovery)

# 2. Access postgres container
docker-compose exec postgres bash

# Inside container:
# 3. Terminate active connections
psql -U ridendine -d postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'ridendine'
    AND pid <> pg_backend_pid();
"

# 4. Drop and recreate database
dropdb -U ridendine ridendine
createdb -U ridendine ridendine

# 5. Exit container
exit

# 6. Restore from backup (from host)
cat backups/ridendine_20240115_120000.sql | \
  docker-compose exec -T postgres psql -U ridendine -d ridendine

# 7. Verify
docker-compose exec postgres psql -U ridendine -d ridendine -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

## Post-Recovery Verification

### 1. Data Integrity Checks

```bash
# Check table counts
kubectl exec -it postgres-0 -n ridendine -- psql -U ridendine -d ridendine << EOF
SELECT
  schemaname,
  COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Check for key tables
SELECT
  'users' as table, COUNT(*) as count FROM users
UNION ALL
SELECT 'chefs', COUNT(*) FROM chefs
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
EOF
```

### 2. Check Migrations Status

```bash
# Verify all migrations applied
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c "SELECT * FROM migrations ORDER BY id;"
```

### 3. Test Critical Queries

```bash
# Test user authentication query
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c \
  "SELECT id, email, role FROM users LIMIT 5;"

# Test chef query
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c \
  "SELECT id, name, cuisine_type FROM chefs LIMIT 5;"

# Test orders query
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c \
  "SELECT id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10;"
```

### 4. Check Indexes and Constraints

```bash
# Verify indexes exist
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c \
  "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';"

# Verify foreign key constraints
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine -c \
  "SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f';"
```

## Restart Application Services

### Kubernetes

```bash
# Scale services back up
kubectl scale deployment/api --replicas=3 -n ridendine
kubectl scale deployment/dispatch --replicas=2 -n ridendine
kubectl scale deployment/routing --replicas=2 -n ridendine
kubectl scale deployment/realtime --replicas=2 -n ridendine

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l component=backend -n ridendine --timeout=300s

# Verify all running
kubectl get pods -n ridendine
```

### Docker Compose

```bash
# Start all services
docker-compose start api dispatch routing realtime

# Verify all running
docker-compose ps
```

## Application Verification

### 1. Health Checks

```bash
# Kubernetes
kubectl exec deployment/api -n ridendine -- curl -s localhost:9001/health

# Docker
curl http://localhost:9001/health
curl http://localhost:9002/health
curl http://localhost:9003/health
curl http://localhost:9004/health
```

### 2. End-to-End Tests

```bash
# Test user login
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Should return access token

# Test protected endpoint
TOKEN="<token from login>"
curl http://localhost:9001/chefs \
  -H "Authorization: Bearer $TOKEN"

# Should return list of chefs
```

### 3. Check Application Logs

```bash
# Kubernetes
kubectl logs -l app=api -n ridendine --tail=50 | grep -i error

# Docker
docker-compose logs api --tail=50 | grep -i error
```

### 4. Monitor Dashboard

Check Grafana:
- [ ] All services showing "up"
- [ ] Database connections stable
- [ ] No spike in errors
- [ ] Response times normal

## Data Loss Assessment

### Calculate Data Loss Window

```bash
# Check backup timestamp
ls -l backups/ridendine_20240115_120000.sql
# Backup created: 2024-01-15 12:00:00

# Current time: 2024-01-15 14:30:00
# Data loss window: 2.5 hours

# Query what was lost (if transaction log available)
# This is advanced and may not be available
```

### Notify Stakeholders

```
Subject: [URGENT] Database Recovery Completed - Data Loss Window

Database: ridendine (production)
Incident: [ticket number]
Recovery completed: [timestamp]

Backup restored from: [backup timestamp]
Data loss window: [X hours/minutes]
Affected data: [description]

Actions taken:
1. Database restored from backup
2. All services restarted
3. Verification tests passed

Next steps:
- Monitor for anomalies
- Customer notification [if needed]
- Post-mortem scheduled

Contact: [on-call engineer]
```

## Rollback Plan

If recovery fails or causes more issues:

```bash
# 1. Stop all services again
kubectl scale deployment/api --replicas=0 -n ridendine

# 2. Try different backup
bash database/scripts/restore.sh backups/ridendine_PREVIOUS_BACKUP.sql

# 3. If all backups fail, consider:
#    - Restoring from cloud provider snapshot
#    - Rebuilding database from scratch (last resort)
```

## Common Issues

### Issue: Backup File Corrupted

```bash
# Symptom: gzip/psql errors during restore
# Solution: Try earlier backup

gzip -t backups/ridendine_20240115_120000.sql.gz
# If fails, backup is corrupted

# Try next backup
ls -lht backups/ | head -10
# Use second most recent
```

### Issue: Disk Space Full

```bash
# Check disk space
kubectl exec postgres-0 -n ridendine -- df -h

# Or Docker
docker-compose exec postgres df -h

# If full, clean up old backups
rm backups/ridendine_202401*.sql.gz  # Keep only recent
```

### Issue: Migration Conflicts

```bash
# If migrations fail after restore
# Reset migrations table
kubectl exec -it postgres-0 -n ridendine -- \
  psql -U ridendine -d ridendine << EOF
TRUNCATE migrations;
EOF

# Re-run migrations
kubectl exec -it deployment/api -n ridendine -- npm run db:migrate
```

## Prevention

### Automated Backups

```bash
# Setup cron job for regular backups
# Add to crontab:
0 */6 * * * /path/to/ridendine/database/scripts/backup.sh

# This creates backup every 6 hours
```

### Backup Validation

```bash
# Test restore in staging monthly
# Add to calendar reminder
```

### Multi-Region Backups

```bash
# Copy backups to cloud storage
aws s3 sync backups/ s3://ridendine-backups/database/ --region us-east-1

# Or Google Cloud
gsutil -m rsync -r backups/ gs://ridendine-backups/database/
```

## Success Criteria

- [ ] Database restored successfully
- [ ] All tables present
- [ ] All services running
- [ ] Health checks passing
- [ ] End-to-end tests passing
- [ ] No errors in logs
- [ ] Monitoring showing normal metrics
- [ ] Stakeholders notified
- [ ] Incident documented

## Post-Mortem

After recovery, complete:
1. Document root cause
2. Timeline of events
3. What worked well
4. What needs improvement
5. Action items to prevent recurrence

## Escalation

If recovery fails:
1. Contact Database Administrator
2. Contact Cloud Provider Support
3. Consider point-in-time recovery (if available)
4. Consult backup vendor support

## Related Runbooks

- [Restart Services](./RUNBOOK_RESTART_SERVICES.md)
- [Scaling Services](./RUNBOOK_SCALING.md)
- [Incident Response](./RUNBOOK_INCIDENT_RESPONSE.md)

## Emergency Contacts

- DBA: dba@ridendine.com
- DevOps Lead: devops@ridendine.com
- On-Call: PagerDuty
- AWS Support: [support case]
- GCP Support: [support case]

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2024-01-15 | DevOps | Initial version |
