# Runbook: Database Recovery

Procedures for recovering from database failures, data corruption, or accidental data deletion.

**Last Updated:** 2026-01-31
**Severity:** Critical
**Estimated Time:** 30-120 minutes
**Required Access:** Database admin, AWS console, kubectl

---

## Objective

Restore database functionality and data integrity after a failure or data loss incident.

---

## Scenarios

1. [Database Unavailable / Crashed](#scenario-1-database-unavailable--crashed)
2. [Data Corruption](#scenario-2-data-corruption)
3. [Accidental Data Deletion](#scenario-3-accidental-data-deletion)
4. [Point-in-Time Recovery](#scenario-4-point-in-time-recovery)
5. [Complete Disaster Recovery](#scenario-5-complete-disaster-recovery)

---

## Scenario 1: Database Unavailable / Crashed

### Symptoms

- API returns "Database connection failed"
- `pg_isready` fails
- Container/pod repeatedly restarting

### Recovery Steps

**Step 1: Assess the situation**

```bash
# Check database status
docker-compose ps postgres
# or
kubectl get pods -n ridendine -l app=postgres

# Check logs
docker-compose logs postgres --tail=100
# or
kubectl logs -f deployment/postgres -n ridendine --tail=100
```

**Step 2: Attempt restart**

```bash
# Docker Compose
docker-compose restart postgres

# Kubernetes
kubectl rollout restart deployment/postgres -n ridendine

# RDS (AWS)
aws rds reboot-db-instance --db-instance-identifier ridendine-production-db
```

**Step 3: If restart fails, check disk space**

```bash
# Docker
docker-compose exec postgres df -h

# Expected: /var/lib/postgresql/data has free space

# If full, clean up old logs
docker-compose exec postgres find /var/lib/postgresql/data/log -name "*.log" -mtime +7 -delete
```

**Step 4: If still failing, restore from backup**

- Proceed to [Scenario 5](#scenario-5-complete-disaster-recovery)

---

## Scenario 2: Data Corruption

### Symptoms

- Query errors: "invalid page header"
- Incorrect query results
- Constraint violations

### Recovery Steps

**Step 1: Stop API immediately**

```bash
# Prevent further corruption
docker-compose stop api
# or
kubectl scale deployment/api --replicas=0 -n ridendine
```

**Step 2: Check corruption extent**

```bash
docker-compose exec postgres psql -U ridendine -d ridendine

-- Check for corrupted indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';

-- Reindex all tables
REINDEX DATABASE ridendine;

-- Verify data integrity
SELECT count(*) FROM users;
SELECT count(*) FROM orders;
SELECT count(*) FROM chefs;
```

**Step 3: Run VACUUM**

```bash
docker-compose exec postgres psql -U ridendine -d ridendine -c "VACUUM FULL ANALYZE;"
```

**Step 4: If corruption persists, restore from backup**

- Proceed to [Scenario 5](#scenario-5-complete-disaster-recovery)

---

## Scenario 3: Accidental Data Deletion

### Symptoms

- User reports: "My data is missing"
- `DELETE` or `TRUNCATE` was run accidentally
- Specific records missing

### Recovery Steps

**Step 1: Identify deletion time**

```bash
# Check recent queries in logs
docker-compose logs postgres | grep DELETE | tail -20

# Find when record was last seen
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT * FROM audit_logs
  WHERE entity_type = 'user'
  AND entity_id = 'deleted-user-id'
  ORDER BY created_at DESC
  LIMIT 1;
"
```

**Step 2: Restore from point-in-time**

**RDS Point-in-Time Recovery:**

```bash
# List available restore points
aws rds describe-db-instances \
  --db-instance-identifier ridendine-production-db \
  --query 'DBInstances[0].LatestRestorableTime'

# Restore to 5 minutes before deletion
RESTORE_TIME="2026-01-31T12:00:00Z"  # Set to time before deletion

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ridendine-production-db \
  --target-db-instance-identifier ridendine-prod-restored-$(date +%Y%m%d-%H%M%S) \
  --restore-time $RESTORE_TIME \
  --db-subnet-group-name ridendine-db-subnet \
  --vpc-security-group-ids sg-xxx

# Wait for restore
aws rds wait db-instance-available \
  --db-instance-identifier ridendine-prod-restored-$(date +%Y%m%d-%H%M%S)
```

**Step 3: Extract deleted data**

```bash
# Connect to restored database
ssh -L 5433:ridendine-prod-restored-xxx.rds.amazonaws.com:5432 bastion@bastion.ridendine.com

# In another terminal, export deleted data
pg_dump -h localhost -p 5433 -U ridendine -d ridendine \
  -t users \
  --data-only \
  --column-inserts \
  --where="id IN ('deleted-user-id-1', 'deleted-user-id-2')" \
  > deleted_users.sql
```

**Step 4: Import data to production**

```bash
# Connect to production
psql -h localhost -U ridendine -d ridendine -f deleted_users.sql

# Verify restoration
psql -h localhost -U ridendine -d ridendine -c "
  SELECT id, email, created_at FROM users WHERE id = 'deleted-user-id-1';
"
```

**Step 5: Clean up restored instance**

```bash
aws rds delete-db-instance \
  --db-instance-identifier ridendine-prod-restored-xxx \
  --skip-final-snapshot
```

---

## Scenario 4: Point-in-Time Recovery

### When to Use

- Restore to specific time before incident
- Recover from bad migration
- Undo accidental bulk operations

### Recovery Steps

**Step 1: Determine recovery point**

```bash
# Identify exact time before incident
RECOVERY_TIME="2026-01-31T11:55:00Z"

echo "Will restore to: $RECOVERY_TIME"
echo "Current data after this time will be lost. Continue? (y/n)"
read confirm
```

**Step 2: Create snapshot of current state**

```bash
# Backup current state before recovery
aws rds create-db-snapshot \
  --db-instance-identifier ridendine-production-db \
  --db-snapshot-identifier ridendine-prod-before-recovery-$(date +%Y%m%d-%H%M%S)
```

**Step 3: Perform point-in-time restore**

```bash
# Restore to new instance
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ridendine-production-db \
  --target-db-instance-identifier ridendine-prod-pitr-$(date +%Y%m%d-%H%M%S) \
  --restore-time $RECOVERY_TIME

# Wait for completion (15-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier ridendine-prod-pitr-$(date +%Y%m%d-%H%M%S)
```

**Step 4: Verify restored data**

```bash
# Connect to restored instance
RESTORED_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ridendine-prod-pitr-xxx \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

ssh -L 5433:$RESTORED_ENDPOINT:5432 bastion@bastion.ridendine.com

# Verify data
psql -h localhost -p 5433 -U ridendine -d ridendine -c "
  SELECT count(*) as user_count FROM users;
  SELECT count(*) as order_count FROM orders;
"
```

**Step 5: Switch traffic to restored database**

```bash
# Update DATABASE_URL secret
aws secretsmanager update-secret \
  --secret-id ridendine/production/database-url \
  --secret-string "postgresql://ridendine:PASSWORD@$RESTORED_ENDPOINT:5432/ridendine"

# Restart API to pick up new connection string
kubectl rollout restart deployment/api -n ridendine
```

---

## Scenario 5: Complete Disaster Recovery

### When to Use

- Primary database completely lost
- Catastrophic corruption
- Regional outage
- Ransomware attack

### Recovery Steps

**Step 1: Activate incident response**

```bash
# Notify stakeholders
echo "⚠️  DATABASE DISASTER RECOVERY IN PROGRESS" | slack post #ridendine-incidents

# Put site in maintenance mode
kubectl scale deployment/api --replicas=0 -n ridendine

# Display maintenance page
```

**Step 2: Identify most recent backup**

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier ridendine-production-db \
  --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime) | [-5:]' \
  --output table

# Get latest snapshot
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --db-instance-identifier ridendine-production-db \
  --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
  --output text)

echo "Latest snapshot: $LATEST_SNAPSHOT"
```

**Step 3: Restore from snapshot**

```bash
# Restore to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ridendine-prod-dr-$(date +%Y%m%d-%H%M%S) \
  --db-snapshot-identifier $LATEST_SNAPSHOT \
  --db-instance-class db.t3.large \
  --db-subnet-group-name ridendine-db-subnet \
  --vpc-security-group-ids sg-xxx \
  --multi-az

# Wait for restore (can take 30-60 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier ridendine-prod-dr-$(date +%Y%m%d-%H%M%S)
```

**Step 4: Apply any pending migrations**

```bash
# Connect to restored database
RESTORED_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ridendine-prod-dr-xxx \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

ssh -L 5432:$RESTORED_ENDPOINT:5432 bastion@bastion.ridendine.com

# Check current migration version
psql -h localhost -U ridendine -d ridendine -c "
  SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1;
"

# Apply missing migrations
DATABASE_URL="postgresql://ridendine:PASSWORD@localhost:5432/ridendine" npm run db:migrate
```

**Step 5: Update application to use new database**

```bash
# Update secret
aws secretsmanager update-secret \
  --secret-id ridendine/production/database-url \
  --secret-string "postgresql://ridendine:PASSWORD@$RESTORED_ENDPOINT:5432/ridendine"

# Restart API
kubectl scale deployment/api --replicas=3 -n ridendine
kubectl rollout status deployment/api -n ridendine
```

**Step 6: Verify recovery**

```bash
# Run smoke tests
npm run test:smoke -- --url=https://api.ridendine.com

# Check data counts
psql -h $RESTORED_ENDPOINT -U ridendine -d ridendine -c "
  SELECT 'users' as table, count(*) FROM users
  UNION ALL
  SELECT 'chefs', count(*) FROM chefs
  UNION ALL
  SELECT 'orders', count(*) FROM orders;
"

# Check recent data
psql -h $RESTORED_ENDPOINT -U ridendine -d ridendine -c "
  SELECT created_at, count(*)
  FROM orders
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY date_trunc('hour', created_at)
  ORDER BY created_at DESC;
"
```

**Step 7: Reconcile data loss**

```bash
# Calculate data loss window
SNAPSHOT_TIME=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier $LATEST_SNAPSHOT \
  --query 'DBSnapshots[0].SnapshotCreateTime' \
  --output text)

echo "Data loss window: from $SNAPSHOT_TIME to incident time"
echo "Any transactions in this window are lost"

# Notify affected users
# Generate report of lost orders
psql -h localhost -U ridendine -d ridendine -c "
  COPY (
    SELECT customer_email, order_number, created_at
    FROM orders
    WHERE created_at > '$SNAPSHOT_TIME'
    ORDER BY created_at
  ) TO STDOUT WITH CSV HEADER;
" > lost_orders.csv
```

---

## Prevention Measures

### Automated Backups

**RDS:**

```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier ridendine-production-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

**PostgreSQL (Docker):**

```bash
# Add to crontab
0 3 * * * docker-compose exec postgres pg_dump -U ridendine ridendine | gzip > /backups/ridendine-$(date +\%Y\%m\%d).sql.gz
```

### Replication

**Enable read replica:**

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier ridendine-prod-replica \
  --source-db-instance-identifier ridendine-production-db \
  --db-instance-class db.t3.medium
```

### Monitoring

```bash
# Alert on replication lag
aws cloudwatch put-metric-alarm \
  --alarm-name ridendine-db-replication-lag \
  --alarm-description "Alert when replication lag exceeds 60 seconds" \
  --metric-name ReplicaLag \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 60 \
  --comparison-operator GreaterThanThreshold
```

---

## Recovery Time Objectives

| Scenario          | RTO     | RPO    | Method                |
| ----------------- | ------- | ------ | --------------------- |
| Database crash    | 5 min   | 0      | Restart               |
| Minor corruption  | 15 min  | 0      | REINDEX               |
| Data deletion     | 30 min  | 5 min  | Point-in-time restore |
| Major corruption  | 1 hour  | 15 min | Snapshot restore      |
| Complete disaster | 2 hours | 30 min | Full DR procedure     |

---

## Post-Recovery Checklist

- [ ] Database accessible and responding
- [ ] All tables present and data counts reasonable
- [ ] Migrations applied
- [ ] API connected successfully
- [ ] Smoke tests passing
- [ ] Monitoring dashboards show normal metrics
- [ ] Backup schedule re-enabled
- [ ] Incident report written
- [ ] Post-mortem scheduled
- [ ] Stakeholders notified of resolution

---

## Contact

- **Database Admin:** dba@ridendine.com
- **On-call:** Slack #ridendine-ops
- **Escalation:** CTO

---

**Last Updated:** 2026-01-31
**Maintained By:** Database Team
